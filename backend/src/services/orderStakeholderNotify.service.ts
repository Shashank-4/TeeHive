import { PrismaClient, Prisma } from "@prisma/client";
import {
    sendAdminOrderNotification,
    sendArtistSaleNotificationEmail,
    sendOrderConfirmationEmail,
    frontendBaseUrl,
    productPublicUrl,
    artistStorefrontUrl,
    type OrderEmailLineItem,
    type ArtistSaleLineItem,
} from "./email.service";

const prisma = new PrismaClient();

function formatInr(n: number): string {
    return n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Sends customer order confirmation, admin notification, and per-artist sale emails.
 * Call once when an order first transitions to paid (webhook and/or client verify).
 */
export async function notifyOrderStakeholders(orderId: string): Promise<void> {
    // Hard idempotency lock across webhook + client callback paths.
    // We re-use PaymentWebhookEvent unique(provider, providerEventId) as a durable dedupe key.
    const notifyEventId = `order-notify:${orderId}`;
    try {
        await prisma.paymentWebhookEvent.create({
            data: {
                provider: "RAZORPAY",
                providerEventId: notifyEventId,
                eventType: "order.notifications.sent",
                payload: { source: "internal_notify", orderId },
                status: "PROCESSED",
                processedAt: new Date(),
                orderId,
            },
        });
    } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
            // Notification already sent (or currently being sent) for this order.
            return;
        }
        throw err;
    }

    const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
            user: true,
            shippingAddress: true,
            items: {
                include: {
                    product: {
                        include: {
                            artist: {
                                select: {
                                    id: true,
                                    email: true,
                                    name: true,
                                    displayName: true,
                                    artistSlug: true,
                                },
                            },
                        },
                    },
                },
            },
        },
    });

    if (!order?.user) return;

    const base = frontendBaseUrl();
    const orderRef = order.id.slice(0, 8).toUpperCase();
    const adminOrdersLink = `${base}/admin/orders?search=${encodeURIComponent(order.id)}`;

    const lineItems: OrderEmailLineItem[] = order.items.map((item) => {
        const artist = item.product.artist;
        const artistName = artist?.displayName || artist?.name || "Creator";
        const artistUrl = artist ? artistStorefrontUrl(artist) : `${base}/artists`;
        return {
            Name: item.product.name,
            ProductUrl: productPublicUrl(item.product.id),
            Quantity: item.quantity,
            Size: item.size,
            Color: item.color,
            LineTotal: formatInr(item.price * item.quantity),
            ArtistName: artistName,
            ArtistUrl: artistUrl,
        };
    });

    const ship = order.shippingAddress;
    const discountAmt = order.discountAmount || 0;
    const hasDiscount = discountAmt > 0.009;

    const shippingBlock = ship
        ? {
              ShippingName: ship.name,
              ShippingLine1: ship.line1,
              ShippingLine2: ship.line2 || "",
              ShippingCity: ship.city,
              ShippingState: ship.state,
              ShippingPostal: ship.postalCode,
              ShippingCountry: ship.country,
              ShippingPhone: ship.phone || "",
          }
        : {};

    sendOrderConfirmationEmail(order.user.email, order.user.name || order.user.displayName || "Customer", {
        OrderRef: orderRef,
        OrderIdFull: order.id,
        Amount: formatInr(order.totalAmount),
        Subtotal: formatInr(order.subtotalAmount),
        Shipping: formatInr(order.shippingAmount),
        HasDiscount: hasDiscount,
        Discount: formatInr(discountAmt),
        LineItems: lineItems,
        ...shippingBlock,
        OrdersUrl: `${base}/orders`,
        ShopUrl: `${base}/products`,
    }).catch((err) => console.error("Error sending order confirmation:", err));

    sendAdminOrderNotification({
        OrderRef: orderRef,
        OrderIdFull: order.id,
        CustomerName: order.user.name || order.user.displayName || "Customer",
        CustomerEmail: order.user.email,
        Amount: formatInr(order.totalAmount),
        Subtotal: formatInr(order.subtotalAmount),
        Shipping: formatInr(order.shippingAmount),
        HasDiscount: hasDiscount,
        Discount: formatInr(discountAmt),
        LineItems: lineItems,
        ...shippingBlock,
        AdminPanelLink: adminOrdersLink,
    }).catch((err) => console.error("Error sending admin notification:", err));

    const artistMap = new Map<string, { email: string; name: string; items: ArtistSaleLineItem[] }>();

    for (const item of order.items) {
        const artist = item.product?.artist;
        if (!artist?.email) continue;
        const row: ArtistSaleLineItem = {
            Name: item.product.name,
            ProductUrl: productPublicUrl(item.product.id),
            Quantity: item.quantity,
            Size: item.size,
            Color: item.color,
            LineTotal: formatInr(item.price * item.quantity),
        };
        const label = artist.displayName || artist.name || "Creator";
        const existing = artistMap.get(artist.id);
        if (existing) {
            existing.items.push(row);
        } else {
            artistMap.set(artist.id, { email: artist.email, name: label, items: [row] });
        }
    }

    artistMap.forEach((artistData) => {
        sendArtistSaleNotificationEmail(artistData.email, artistData.name, {
            OrderRef: orderRef,
            OrderIdFull: order.id,
            LineItems: artistData.items,
            ArtistOrdersUrl: `${base}/artist/orders`,
            ArtistDashboardUrl: `${base}/artist/dashboard`,
        }).catch((err) =>
            console.error(`[Email] Failed to send sale notification to ${artistData.email}:`, err)
        );
    });
}
