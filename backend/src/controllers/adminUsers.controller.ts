import { Request, Response } from "express";
import { PrismaClient, OrderStatus } from "@prisma/client";

const prisma = new PrismaClient();
const CREDITABLE_ORDER_STATUSES: OrderStatus[] = [
    "PAID",
    "PROCESSING",
    "SHIPPED",
    "DELIVERED",
    "RECEIVED",
];

export const listUsersHandler = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const roleFilter = req.query.role as string;
        const search = req.query.search as string;
        const skip = (page - 1) * limit;

        const where: any = {};
        if (roleFilter && roleFilter !== "all") {
            if (roleFilter === "admin") where.isAdmin = true;
            else if (roleFilter === "artist") where.isArtist = true;
            else if (roleFilter === "user") { where.isAdmin = false; where.isArtist = false; }
        }
        if (search) {
            where.OR = [
                { name: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
            ];
        }

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    isArtist: true,
                    isAdmin: true,
                    createdAt: true,
                },
            }),
            prisma.user.count({ where }),
        ]);

        const userIds = users.map((u) => u.id);
        const orderAgg = userIds.length
            ? await prisma.order.groupBy({
                  by: ["userId"],
                  where: {
                      userId: { in: userIds },
                      status: { in: CREDITABLE_ORDER_STATUSES },
                  },
                  _sum: { totalAmount: true },
                  _count: { id: true },
              })
            : [];
        const aggByUser = new Map(
            orderAgg.map((row) => [
                row.userId,
                { totalSpent: row._sum.totalAmount ?? 0, orderCount: row._count.id ?? 0 },
            ])
        );

        const formattedUsers = users.map(user => {
            const agg = aggByUser.get(user.id);
            const totalSpent = agg?.totalSpent ?? 0;
            const orderCount = agg?.orderCount ?? 0;
            let roleName = "user";
            if (user.isAdmin) roleName = "admin";
            else if (user.isArtist) roleName = "artist";

            return {
                id: user.id,
                name: user.name,
                email: user.email,
                role: roleName,
                joinedAt: user.createdAt,
                orderCount,
                totalSpent,
            };
        });

        res.status(200).json({
            status: "success",
            data: {
                users: formattedUsers,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                }
            },
        });
    } catch (error: any) {
        console.error("List Users Error:", error);
        res.status(500).json({
            status: "error",
            message: "Failed to fetch users",
        });
    }
};

export const updateUserRoleHandler = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        if (!["user", "artist", "admin"].includes(role)) {
            return res.status(400).json({ status: "error", message: "Invalid role" });
        }

        let updateData = { isAdmin: false, isArtist: false };
        if (role === "admin") updateData.isAdmin = true;
        if (role === "artist") updateData.isArtist = true;

        const user = await prisma.user.update({
            where: { id },
            data: updateData,
            select: { id: true, name: true, email: true, isArtist: true, isAdmin: true }
        });

        res.status(200).json({
            status: "success",
            data: { user }
        });
    } catch (error: any) {
        console.error("Update User Role Error:", error);
        res.status(500).json({
            status: "error",
            message: "Failed to update user role",
        });
    }
};
