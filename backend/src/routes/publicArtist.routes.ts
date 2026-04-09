import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import {
    isUuidParam,
    isReservedArtistSlug,
    isValidArtistSlugFormat,
    normalizeArtistSlug,
} from "../utils/artistSlug";
import { calculateProductPrice, getActiveSpecialOffer } from "../utils/productUtils";

const router = Router();
const prisma = new PrismaClient();

const PAID_ORDER_STATUSES = ["PAID", "SHIPPED", "DELIVERED"] as const;

/**
 * Many verified artists sell before setting a profile photo; use their newest published
 * product mockup so listings (e.g. home “top by sales”) still show a visual.
 */
async function withDisplayPhotoFallback<
    T extends { id: string; displayPhotoUrl: string | null },
>(rows: T[]): Promise<T[]> {
    if (rows.length === 0) return rows;
    const ids = rows.map((r) => r.id);
    const products = await prisma.product.findMany({
        where: { artistId: { in: ids }, status: "PUBLISHED" },
        select: { artistId: true, mockupImageUrl: true, createdAt: true },
        orderBy: { createdAt: "desc" },
    });
    const mockupByArtist = new Map<string, string>();
    for (const p of products) {
        if (p.mockupImageUrl && !mockupByArtist.has(p.artistId)) {
            mockupByArtist.set(p.artistId, p.mockupImageUrl);
        }
    }
    return rows.map((r) => ({
        ...r,
        displayPhotoUrl: r.displayPhotoUrl || mockupByArtist.get(r.id) || null,
    }));
}

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
        const sortRaw = String(req.query.sort || "").toLowerCase();

        const baseWhere: any = {
            isArtist: true,
            verificationStatus: "VERIFIED",
        };

        const where: any = { ...baseWhere };

        if (search) {
            where.OR = [
                { name: { contains: search, mode: "insensitive" } },
                { displayName: { contains: search, mode: "insensitive" } },
                { artistSlug: { contains: search.toLowerCase(), mode: "insensitive" } },
            ];
        }

        const artistSelect = {
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
                        where: { status: "PUBLISHED" as const },
                    },
                },
            },
        } as const;

        if (sortRaw === "sales" && !search) {
            const sold = await prisma.orderItem.groupBy({
                by: ["artistId"],
                where: {
                    artistId: { not: null },
                    order: { status: { in: [...PAID_ORDER_STATUSES] } },
                },
                _sum: { quantity: true },
                orderBy: { _sum: { quantity: "desc" } },
                skip: Math.max(0, (page - 1) * limit),
                take: limit,
            });

            const ids = sold.map((s) => s.artistId).filter((id): id is string => Boolean(id));

            /** No paid orders yet — show verified artists who have published products (catalog depth first). */
            if (ids.length === 0) {
                const withCatalog = await prisma.user.findMany({
                    where: {
                        ...baseWhere,
                        products: { some: { status: "PUBLISHED" } },
                    },
                    select: artistSelect,
                });
                withCatalog.sort(
                    (a, b) => (b._count.products ?? 0) - (a._count.products ?? 0)
                );
                const total = withCatalog.length;
                const pageRows = withCatalog.slice(
                    Math.max(0, (page - 1) * limit),
                    Math.max(0, (page - 1) * limit) + limit
                );
                const rowsWithPhotos = await withDisplayPhotoFallback(pageRows);
                return res.json({
                    status: "success",
                    data: {
                        artists: rowsWithPhotos.map((a) => ({
                            ...a,
                            productCount: a._count.products,
                            _count: undefined,
                        })),
                        pagination: {
                            page,
                            limit,
                            total,
                            totalPages: Math.ceil(total / limit) || 1,
                        },
                    },
                });
            }

            const rows = await prisma.user.findMany({
                where: { ...baseWhere, id: { in: ids } },
                select: artistSelect,
            });

            const orderMap = new Map(ids.map((id, i) => [id, i]));
            rows.sort((a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0));

            const rowsWithPhotos = await withDisplayPhotoFallback(rows);

            const totalSoldGroups = await prisma.orderItem.groupBy({
                by: ["artistId"],
                where: {
                    artistId: { not: null },
                    order: { status: { in: [...PAID_ORDER_STATUSES] } },
                },
                _sum: { quantity: true },
            });
            const total = totalSoldGroups.filter((g) => g.artistId).length;

            return res.json({
                status: "success",
                data: {
                    artists: rowsWithPhotos.map((a) => ({
                        ...a,
                        productCount: a._count.products,
                        _count: undefined,
                    })),
                    pagination: {
                        page,
                        limit,
                        total,
                        totalPages: Math.ceil(total / limit) || 1,
                    },
                },
            });
        }

        const [artists, total] = await Promise.all([
            prisma.user.findMany({
                where,
                select: artistSelect,
                orderBy: { createdAt: "desc" },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.user.count({ where }),
        ]);

        const artistsWithPhotos = await withDisplayPhotoFallback(artists);

        res.json({
            status: "success",
            data: {
                artists: artistsWithPhotos.map((a) => ({
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

        const activeOffer = await getActiveSpecialOffer();
        const { products, ...artistRest } = artist;
        const pricedProducts = products.map((p) => {
            const { price, isDiscounted, discountPercent, originalPrice } = calculateProductPrice(
                p,
                activeOffer
            );
            return { ...p, price, isDiscounted, discountPercent, originalPrice };
        });

        res.json({
            status: "success",
            data: { artist: { ...artistRest, products: pricedProducts } },
        });
    } catch (error) {
        console.error("Error fetching artist:", error);
        res.status(500).json({ error: "Failed to fetch artist" });
    }
});

export default router;
