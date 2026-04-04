import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

// Public: List all verified artists with their product count
router.get("/", async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const search = (req.query.search as string) || "";

        const where: any = {
            isArtist: true,
            verificationStatus: "VERIFIED",
        };

        if (search) {
            where.OR = [
                { name: { contains: search, mode: "insensitive" } },
                { displayName: { contains: search, mode: "insensitive" } },
            ];
        }

        const [artists, total] = await Promise.all([
            prisma.user.findMany({
                where,
                select: {
                    id: true,
                    name: true,
                    displayName: true,
                    displayPhotoUrl: true,
                    coverPhotoUrl: true,
                    bio: true,
                    instagramUrl: true,
                    portfolioUrl: true,
                    artistRating: true,
                    reviewCount: true,
                    _count: {
                        select: {
                            products: {
                                where: { status: "PUBLISHED" },
                            },
                        },
                    },
                },
                orderBy: { createdAt: "desc" },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.user.count({ where }),
        ]);

        res.json({
            status: "success",
            data: {
                artists: artists.map((a) => ({
                    ...a,
                    productCount: a._count.products,
                    _count: undefined,
                })),
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            },
        });
    } catch (error) {
        console.error("Error fetching artists:", error);
        res.status(500).json({ error: "Failed to fetch artists" });
    }
});

// Public: Get a single artist's public profile with their products
router.get("/:artistId", async (req: Request, res: Response) => {
    try {
        const { artistId } = req.params;

        const artist = await prisma.user.findFirst({
            where: {
                id: artistId,
                isArtist: true,
                verificationStatus: "VERIFIED",
            },
            select: {
                id: true,
                name: true,
                displayName: true,
                displayPhotoUrl: true,
                coverPhotoUrl: true,
                bio: true,
                portfolioUrl: true,
                instagramUrl: true,
                twitterUrl: true,
                behanceUrl: true,
                dribbbleUrl: true,
                artistRating: true,
                reviewCount: true,
                products: {
                    where: { status: "PUBLISHED" },
                    select: {
                        id: true,
                        name: true,
                        price: true,
                        compareAtPrice: true,
                        mockupImageUrl: true,
                        backMockupImageUrl: true,
                        primaryView: true,
                        primaryColor: true,
                        tshirtColor: true,
                        categories: true,
                    },
                    orderBy: { createdAt: "desc" },
                },
            },
        });

        if (!artist) {
            return res.status(404).json({ error: "Artist not found" });
        }

        res.json({
            status: "success",
            data: { artist },
        });
    } catch (error) {
        console.error("Error fetching artist:", error);
        res.status(500).json({ error: "Failed to fetch artist" });
    }
});

export default router;
