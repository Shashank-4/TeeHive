import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";
import {
    sendAdminOrderNotification,
    sendArtistSaleNotificationEmail,
    sendOrderConfirmationEmail,
    frontendBaseUrl,
    productPublicUrl,
    artistStorefrontUrl,
    type OrderEmailLineItem,
    type ArtistSaleLineItem,
} from "../services/email.service";
import { markOrderPaidAfterInventoryCheck } from "../services/orderInventory.service";

const router = Router();
const prisma = new PrismaClient();
const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;
const SUCCESS_EVENTS = ["payment.captured", "order.paid"] as const;

type RazorpayWebhookEvent = {
    event: string;
    created_at?: number;
    payload?: {
        payment?: {
            entity?: {
                id?: string;
                order_id?: string;
                method?: string;
                status?: string;
                error_code?: string;
                error_description?: string;
            };
        };
        order?: {
            entity?: {
                id?: string;
                amount_paid?: number;
                status?: string;
            };
        };
        refund?: {
            entity?: {
                id?: string;
                amount?: number;
            };
        };
    };
};

function sha256Hex(buffer: Buffer) {
    return crypto.createHash("sha256").update(buffer).digest("hex");
}

function buildProviderEventId(event: RazorpayWebhookEvent) {
    const paymentId = event.payload?.payment?.entity?.id || "no-payment";
    const orderId =
        event.payload?.payment?.entity?.order_id ||
        event.payload?.order?.entity?.id ||
        "no-order";
    const createdAt = String(event.created_at ?? "no-created-at");
    return `${event.event}:${paymentId}:${orderId}:${createdAt}`;
}

function verifySignature(rawBody: Buffer, signature: string) {
    if (!RAZORPAY_WEBHOOK_SECRET) return false;
    const digest = crypto
        .createHmac("sha256", RAZORPAY_WEBHOOK_SECRET)
        .update(rawBody)
        .digest("hex");

    const digestBuffer = Buffer.from(digest, "hex");
    const signatureBuffer = Buffer.from(signature, "hex");

    return (
        digestBuffer.length === signatureBuffer.length &&
        crypto.timingSafeEqual(digestBuffer, signatureBuffer)
    );
}

function formatInr(n: number): string {
    return n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

async function notifyOrderStakeholders(orderId: string) {
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

    const artistMap = new Map<
        string,
        { email: string; name: string; items: ArtistSaleLineItem[] }
    >();

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

router.post("/razorpay", async (req: Request, res: Response): Promise<any> => {
    const signature = req.headers["x-razorpay-signature"] as string | undefined;
    if (!signature) {
        return res.status(400).json({ error: "Missing signature" });
    }

    if (!RAZORPAY_WEBHOOK_SECRET) {
        console.error("RAZORPAY_WEBHOOK_SECRET is missing");
        return res.status(500).json({ error: "Webhook secret is not configured" });
    }

    const rawBody = Buffer.isBuffer(req.body)
        ? req.body
        : Buffer.from(JSON.stringify(req.body || {}), "utf8");

    if (!verifySignature(rawBody, signature)) {
        console.error("Invalid webhook signature");
        return res.status(400).json({ error: "Invalid signature" });
    }

    let event: RazorpayWebhookEvent;
    try {
        event = JSON.parse(rawBody.toString("utf8")) as RazorpayWebhookEvent;
    } catch (error) {
        console.error("Failed to parse Razorpay webhook body:", error);
        return res.status(400).json({ error: "Invalid JSON payload" });
    }

    const providerEventId = buildProviderEventId(event);
    const payloadHash = sha256Hex(rawBody);
    const paymentEntity = event.payload?.payment?.entity;
    const refundEntity = event.payload?.refund?.entity;
    const gatewayOrderId = paymentEntity?.order_id || event.payload?.order?.entity?.id || null;
    const gatewayPaymentId = paymentEntity?.id || null;

    let eventRecord;
    try {
        eventRecord = await prisma.paymentWebhookEvent.create({
            data: {
                provider: "RAZORPAY",
                providerEventId,
                eventType: event.event,
                signature,
                payload: event,
                payloadHash,
            },
        });
    } catch (error: any) {
        if (error?.code === "P2002") {
            return res.json({ status: "duplicate_ignored" });
        }
        console.error("Failed to persist webhook receipt:", error);
        return res.status(500).json({ error: "Webhook receipt failed" });
    }

    try {
        const payment = gatewayOrderId
            ? await prisma.payment.findFirst({
                  where: {
                      OR: [
                          { gatewayOrderId },
                          { paymentIntentId: gatewayOrderId },
                      ],
                  },
              })
            : null;

        const order = gatewayOrderId
            ? await prisma.order.findFirst({
                  where: {
                      OR: [
                          { paymentIntentId: gatewayOrderId },
                          payment?.orderId ? { id: payment.orderId } : undefined,
                      ].filter(Boolean) as Array<{ paymentIntentId?: string; id?: string }>,
                  },
              })
            : null;

        await prisma.paymentWebhookEvent.update({
            where: { id: eventRecord.id },
            data: {
                orderId: order?.id,
                paymentId: payment?.id,
            },
        });

        if (!payment || !order) {
            await prisma.paymentWebhookEvent.update({
                where: { id: eventRecord.id },
                data: {
                    status: "IGNORED",
                    errorMessage: "No matching order/payment found for webhook payload.",
                    processedAt: new Date(),
                },
            });
            return res.json({ status: "ignored" });
        }

        if (SUCCESS_EVENTS.includes(event.event as (typeof SUCCESS_EVENTS)[number])) {
            const priorProcessedSuccessCount = await prisma.paymentWebhookEvent.count({
                where: {
                    orderId: order.id,
                    status: "PROCESSED",
                    eventType: { in: [...SUCCESS_EVENTS] },
                    id: { not: eventRecord.id },
                },
            });

            const transition = await prisma.$transaction(async (tx) => {
                const result = await markOrderPaidAfterInventoryCheck(tx, {
                    orderId: order.id,
                    gatewayOrderId,
                    gatewayPaymentId,
                    gatewaySignature: signature,
                    paymentMethod: paymentEntity?.method || payment.paymentMethod,
                    gatewayPayload: event,
                    verifiedAt: order.paymentVerifiedAt || new Date(),
                    capturedAt: payment.capturedAt || new Date(),
                });
                await tx.paymentWebhookEvent.update({
                    where: { id: eventRecord.id },
                    data: {
                        status: "PROCESSED",
                        processedAt: new Date(),
                    },
                });
                return result;
            });

            if (priorProcessedSuccessCount === 0 && !transition.alreadyProcessed) {
                await notifyOrderStakeholders(order.id);
            }

            return res.json({ status: "ok" });
        }

        if (event.event === "payment.failed") {
            if (payment.status === "SUCCEEDED") {
                await prisma.paymentWebhookEvent.update({
                    where: { id: eventRecord.id },
                    data: {
                        status: "IGNORED",
                        errorMessage: "Ignored failed payment because payment was already marked successful.",
                        processedAt: new Date(),
                    },
                });
                return res.json({ status: "ignored" });
            }

            await prisma.$transaction(async (tx) => {
                await tx.payment.update({
                    where: { id: payment.id },
                    data: {
                        status: "FAILED",
                        gatewayOrderId,
                        gatewayPaymentId,
                        failureCode: paymentEntity?.error_code || null,
                        failureDescription: paymentEntity?.error_description || null,
                        gatewayPayload: event,
                    },
                });

                await tx.order.update({
                    where: { id: order.id },
                    data: {
                        paymentStatusSnapshot: "FAILED",
                    },
                });

                await tx.paymentWebhookEvent.update({
                    where: { id: eventRecord.id },
                    data: {
                        status: "PROCESSED",
                        processedAt: new Date(),
                    },
                });
            });

            return res.json({ status: "ok" });
        }

        if (event.event === "refund.processed") {
            await prisma.$transaction(async (tx) => {
                await tx.payment.update({
                    where: { id: payment.id },
                    data: {
                        status: "REFUNDED",
                        refundedAmount: refundEntity?.amount
                            ? Number((refundEntity.amount / 100).toFixed(2))
                            : payment.refundedAmount,
                        refundReference: refundEntity?.id || payment.refundReference,
                        gatewayPayload: event,
                    },
                });

                await tx.order.update({
                    where: { id: order.id },
                    data: {
                        paymentStatusSnapshot: "REFUNDED",
                    },
                });

                await tx.paymentWebhookEvent.update({
                    where: { id: eventRecord.id },
                    data: {
                        status: "PROCESSED",
                        processedAt: new Date(),
                    },
                });
            });

            return res.json({ status: "ok" });
        }

        await prisma.paymentWebhookEvent.update({
            where: { id: eventRecord.id },
            data: {
                status: "IGNORED",
                errorMessage: `Event type ${event.event} is not handled.`,
                processedAt: new Date(),
            },
        });

        return res.json({ status: "ignored" });
    } catch (error: any) {
        console.error("Error processing webhook:", error);
        await prisma.paymentWebhookEvent.update({
            where: { id: eventRecord.id },
            data: {
                status: "FAILED",
                errorMessage: error?.message || "Webhook processing failed",
                processedAt: new Date(),
            },
        });
        return res.status(500).json({ error: "Webhook processing failed" });
    }
});

export default router;
