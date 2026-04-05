import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import {
    isUuidParam,
    isReservedArtistSlug,
    isValidArtistSlugFormat,
    normalizeArtistSlug,
} from "../utils/artistSlug";

const router = Router();
const prisma = new PrismaClient();

function artistPublicWhere(param: string) {
    const trimmed = param.trim();
    const base = {
        isArtist: true,
        verificationStatus: "VERIFIED" as const,
    };
    if (isUuidParam(trimmed)) {
        return { ...base, id: trimmed };
    }
    const slug = normalizeArtistSlug(trimmed);
    return {
        ...base,
        artistSlug: { equals: slug, mode: "insensitive" as const },
    };
}

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
                { artistSlug: { contains: search.toLowerCase(), mode: "insensitive" } },
            ];
        }

        const [artists, total] = await Promise.all([
            prisma.user.findMany({
                where,
                select: {
                    id: true,
                    name: true,
                    displayName: true,
                    artistSlug: true,
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

/** Public: check if storefront slug is available (optional excludeUserId for edit flow) */
router.get("/check-slug", async (req: Request, res: Response) => {
    try {
        const raw = (req.query.slug as string) || "";
        const slug = normalizeArtistSlug(raw);
        const excludeUserId = (req.query.excludeUserId as string) || undefined;

        if (!slug || slug.length < 2) {
            return res.status(200).json({
                status: "success",
                data: { available: false, reason: "invalid" },
            });
        }

        if (!isValidArtistSlugFormat(slug)) {
            return res.status(200).json({
                status: "success",
                data: { available: false, reason: "invalid" },
            });
        }

        if (isReservedArtistSlug(slug)) {
            return res.status(200).json({
                status: "success",
                data: { available: false, reason: "reserved" },
            });
        }

        const taken = await prisma.user.findFirst({
            where: {
                artistSlug: { equals: slug, mode: "insensitive" },
                ...(excludeUserId ? { id: { not: excludeUserId } } : {}),
            },
            select: { id: true },
        });

        res.json({
            status: "success",
            data: { available: !taken },
        });
    } catch (error) {
        console.error("Error checking slug:", error);
        res.status(500).json({ error: "Failed to check slug" });
    }
});

/** Public: check if display name is unique (case-insensitive; optional excludeUserId for edit) */
router.get("/check-display-name", async (req: Request, res: Response) => {
    try {
        const raw = (req.query.name as string) || "";
        const name = raw.trim();
        const excludeUserId = (req.query.excludeUserId as string) || undefined;

        if (!name || name.length < 2) {
            return res.status(200).json({
                status: "success",
                data: { available: false, reason: "invalid" },
            });
        }

        if (name.length > 80) {
            return res.status(200).json({
                status: "success",
                data: { available: false, reason: "too_long" },
            });
        }

        const taken = await prisma.user.findFirst({
            where: {
                displayName: { equals: name, mode: "insensitive" },
                ...(excludeUserId ? { id: { not: excludeUserId } } : {}),
            },
            select: { id: true },
        });

        res.json({
            status: "success",
            data: { available: !taken },
        });
    } catch (error) {
        console.error("Error checking display name:", error);
        res.status(500).json({ error: "Failed to check display name" });
    }
});

// Public: Get a single artist's public profile with their products (by UUID or artistSlug)
router.get("/:artistParam", async (req: Request, res: Response) => {
    try {
        const { artistParam } = req.params;

        const artist = await prisma.user.findFirst({
            where: artistPublicWhere(artistParam),
            select: {
                id: true,
                name: true,
                displayName: true,
                artistSlug: true,
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
                        availableColors: true,
                        categories: true,
                        colorMockups: true,
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
