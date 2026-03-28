import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getDashboardStatsHandler = async (req: Request, res: Response) => {
    try {
        const [
            totalUsers,
            totalOrders,
            totalActiveArtists,
            totalRevenueAgg,
        ] = await Promise.all([
            prisma.user.count(),
            prisma.order.count(),
            prisma.user.count({ where: { isArtist: true, verificationStatus: "VERIFIED" } }),
            prisma.order.aggregate({
                _sum: { totalAmount: true },
                where: { status: { in: ["DELIVERED", "PAID", "SHIPPED"] } }
            }),
        ]);

        const totalRevenue = totalRevenueAgg._sum.totalAmount || 0;

        // Recent Orders
        const recentOrders = await prisma.order.findMany({
            take: 5,
            orderBy: { createdAt: "desc" },
            include: { user: { select: { name: true, email: true } } },
        });

        // Top Artists - Approximated by latest verified artists for now
        const topArtists = await prisma.user.findMany({
            where: { isArtist: true, verificationStatus: "VERIFIED" },
            take: 5,
            select: { id: true, displayName: true, name: true, displayPhotoUrl: true }
        });

        // Pending Approvals
        const pendingArtistsCount = await prisma.user.count({
            where: { isArtist: true, verificationStatus: "PENDING_VERIFICATION" },
        });

        res.status(200).json({
            status: "success",
            data: {
                stats: {
                    totalUsers,
                    totalOrders,
                    totalActiveArtists,
                    totalRevenue,
                },
                recentOrders: recentOrders.map((o) => ({
                    id: o.id,
                    customer: o.user.name || o.user.email,
                    amount: o.totalAmount,
                    status: o.status,
                    createdAt: o.createdAt,
                })),
                pendingArtistsCount,
                topArtists: topArtists.map((a) => ({
                    id: a.id,
                    name: a.displayName || a.name,
                    image: a.displayPhotoUrl,
                    rating: 4.8, // placeholder
                })),
            },
        });
    } catch (error: any) {
        console.error("Dashboard Stats Error:", error);
        res.status(500).json({
            status: "error",
            message: "Failed to fetch dashboard stats",
        });
    }
};
