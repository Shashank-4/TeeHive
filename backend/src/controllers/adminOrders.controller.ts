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
                    items: true,
                }
            }),
            prisma.order.count({ where }),
        ]);

        const formattedOrders = orders.map((order) => ({
            id: order.id,
            customer: order.user.name || order.user.email,
            date: order.createdAt,
            total: order.totalAmount,
            status: order.status,
            items: order.items.reduce((sum, item) => sum + item.quantity, 0),
        }));

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
