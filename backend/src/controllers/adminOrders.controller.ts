import { Request, Response } from "express";
import { PrismaClient, OrderStatus } from "@prisma/client";

const prisma = new PrismaClient();

export const listOrdersHandler = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const status = req.query.status as string;
        const search = req.query.search as string; // could search by order ID or user name
        const skip = (page - 1) * limit;

        const where: any = {};
        if (status && status !== "all") {
            where.status = status as OrderStatus;
        }
        if (search) {
            where.OR = [
                { id: { contains: search, mode: "insensitive" } },
                { user: { name: { contains: search, mode: "insensitive" } } },
                { user: { email: { contains: search, mode: "insensitive" } } },
            ];
        }

        const [orders, total] = await Promise.all([
            prisma.order.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
                include: {
                    user: { select: { name: true, email: true } },
                    items: {
                        include: {
                            product: {
                                include: {
                                    artist: {
                                        select: { name: true, displayName: true }
                                    }
                                }
                            }
                        }
                    },
                    payment: true,
                }
            }),
            prisma.order.count({ where }),
        ]);

        const formattedOrders = orders.map((order) => {
            const artists = new Set<string>();
            order.items.forEach((item) => {
                if (item.product?.artist) {
                    artists.add(item.product.artist.displayName || item.product.artist.name);
                }
            });

            return {
                id: order.id,
                customer: order.user?.name || order.user?.email || "Unknown",
                customerEmail: order.user?.email,
                date: order.createdAt,
                total: order.totalAmount,
                fulfillmentStatus: order.status,
                paymentStatus: order.payment?.status || "PENDING",
                items: order.items.reduce((sum, item) => sum + item.quantity, 0),
                artistsInvolved: Array.from(artists).join(", ") || "N/A",
            };
        });

        res.status(200).json({
            status: "success",
            data: {
                orders: formattedOrders,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                }
            },
        });
    } catch (error: any) {
        console.error("List Orders Error:", error);
        res.status(500).json({
            status: "error",
            message: "Failed to fetch orders",
        });
    }
};

export const updateOrderStatusHandler = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!Object.values(OrderStatus).includes(status)) {
            return res.status(400).json({ status: "error", message: "Invalid status" });
        }

        const order = await prisma.order.update({
            where: { id },
            data: { status: status as OrderStatus },
        });

        res.status(200).json({
            status: "success",
            data: { order }
        });
    } catch (error: any) {
        console.error("Update Order Status Error:", error);
        res.status(500).json({
            status: "error",
            message: "Failed to update order status",
        });
    }
};

export const updatePaymentStatusHandler = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // should be from PaymentStatus enum

        const order = await prisma.order.findUnique({ where: { id }, include: { payment: true } });
        if (!order) return res.status(404).json({ status: "error", message: "Order not found" });

        if (order.payment) {
            await prisma.payment.update({
                where: { id: order.payment.id },
                data: { status: status as any },
            });
        } else {
            await prisma.payment.create({
                data: {
                    orderId: id,
                    amount: order.totalAmount,
                    status: status as any,
                    paymentIntentId: `manual_${Date.now()}`,
                }
            });
        }

        res.status(200).json({ status: "success", message: "Payment status updated" });
    } catch (err) {
        console.error("Update Payment Status Error:", err);
        res.status(500).json({ status: "error", message: "Failed to update payment status" });
    }
};

export const getOrderByIdHandler = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const order = await prisma.order.findUnique({
            where: { id },
            include: {
                user: { select: { name: true, email: true, id: true } },
                shippingAddress: true,
                payment: true,
                items: {
                    include: {
                        product: {
                            include: {
                                artist: { select: { id: true, name: true, displayName: true } }
                            }
                        }
                    }
                }
            }
        });

        if (!order) {
            return res.status(404).json({ status: "error", message: "Order not found" });
        }

        // Commission math: 25% of the item's unit price * quantity
        const COMMISSION_RATE = 0.25;
        let subtotal = 0;
        const artistPayoutsMap = new Map<string, { artistId: string, artistName: string, amount: number, itemCount: number }>();

        const formattedItems = order.items.map(item => {
            const itemSubtotal = item.price * item.quantity;
            subtotal += itemSubtotal;
            
            const commission = itemSubtotal * COMMISSION_RATE;
            const artist = item.product?.artist;

            if (artist) {
                const artistId = artist.id;
                const existing = artistPayoutsMap.get(artistId) || { artistId, artistName: artist.displayName || artist.name, amount: 0, itemCount: 0 };
                existing.amount += commission;
                existing.itemCount += item.quantity;
                artistPayoutsMap.set(artistId, existing);
            }

            return {
                id: item.id,
                productId: item.productId,
                productName: item.product?.name || "Unknown Product",
                mockupImageUrl: item.product?.mockupImageUrl,
                variant: `${item.size} / ${item.color}`,
                quantity: item.quantity,
                unitPrice: item.price,
                totalPrice: itemSubtotal,
                artistName: artist?.displayName || artist?.name || "N/A",
                artistId: artist?.id,
                commission,
            };
        });

        // Financial Breakdown
        const tax = 0; // Or whatever tax logic
        const shippingFee = 0; // free shipping 
        const totalArtistPayout = Array.from(artistPayoutsMap.values()).reduce((sum, p) => sum + p.amount, 0);
        const platformMargin = subtotal + shippingFee + tax - totalArtistPayout - order.discountAmount;

        const breakdown = {
            subtotal,
            shippingFee,
            tax,
            discount: order.discountAmount,
            customerTotal: order.totalAmount, // from DB
            artistPayouts: Array.from(artistPayoutsMap.values()),
            platformMargin,
        };

        res.status(200).json({
            status: "success",
            data: {
                id: order.id,
                paymentIntentId: order.paymentIntentId,
                date: order.createdAt,
                customerName: order.user?.name,
                customerEmail: order.user?.email,
                fulfillmentStatus: order.status,
                paymentStatus: order.payment?.status || "PENDING",
                shippingAddress: order.shippingAddress,
                items: formattedItems,
                breakdown,
            }
        });
    } catch (err) {
        console.error("Fetch Order Details Error:", err);
        res.status(500).json({ status: "error", message: "Failed to fetch order details" });
    }
};
