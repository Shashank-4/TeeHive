import { Router, Request, Response } from "express";
import { PrismaClient, VerificationStatus } from "@prisma/client";
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
        isAdmin: false,
        /** Match public directory: pending / unverified creators appear; rejected do not. */
        verificationStatus: { not: VerificationStatus.REJECTED },
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

// Public: List artists (non-admin, not rejected) with product counts — same cohort as storefront links.
router.get("/", async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const search = (req.query.search as string) || "";
        const sortRaw = String(req.query.sort || "").toLowerCase();

        const baseWhere: any = {
            isArtist: true,
            isAdmin: false,
            verificationStatus: { not: VerificationStatus.REJECTED },
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

        const orderItemArtistScope = {
            artistId: { not: null },
            order: { status: { in: [...PAID_ORDER_STATUSES] } },
            artist: {
                isArtist: true,
                isAdmin: false,
                verificationStatus: { not: VerificationStatus.REJECTED },
            },
        };

        /** All matching artists, highest lifetime paid qty first; zero-sales artists included and ordered after. */
        if (sortRaw === "sales") {
            const [allUsers, sumGroups] = await Promise.all([
                prisma.user.findMany({ where, select: artistSelect }),
                prisma.orderItem.groupBy({
                    by: ["artistId"],
                    where: orderItemArtistScope,
                    _sum: { quantity: true },
                }),
            ]);
            const sumMap = new Map<string, number>();
            for (const g of sumGroups) {
                if (g.artistId) sumMap.set(g.artistId, g._sum.quantity ?? 0);
            }
            const labelCompare = (a: (typeof allUsers)[0], b: (typeof allUsers)[0]) => {
                const la = (a.displayName?.trim() || a.name || "").toLowerCase();
                const lb = (b.displayName?.trim() || b.name || "").toLowerCase();
                return la.localeCompare(lb, undefined, { sensitivity: "base" }) || a.id.localeCompare(b.id);
            };
            allUsers.sort((a, b) => {
                const sa = sumMap.get(a.id) ?? 0;
                const sb = sumMap.get(b.id) ?? 0;
                if (sb !== sa) return sb - sa;
                const pc = (b._count.products ?? 0) - (a._count.products ?? 0);
                if (pc !== 0) return pc;
                return labelCompare(a, b);
            });
            const total = allUsers.length;
            const pageRows = allUsers.slice(
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

        /** A–Z by `displayName` when set; otherwise account `name` (same label as storefront cards). */
        if (sortRaw === "alpha" || sortRaw === "name") {
            const allUsers = await prisma.user.findMany({ where, select: artistSelect });
            const listKey = (u: (typeof allUsers)[0]) =>
                (u.displayName?.trim() || u.name || "").toLowerCase();
            allUsers.sort((a, b) => {
                const c = listKey(a).localeCompare(listKey(b), undefined, { sensitivity: "base" });
                if (c !== 0) return c;
                return a.id.localeCompare(b.id);
            });
            const total = allUsers.length;
            const pageRows = allUsers.slice(
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

        const orderByForList = (): any => {
            switch (sortRaw) {
                case "newest":
                    return { createdAt: "desc" };
                case "ratings":
                default:
                    return [{ artistRating: "desc" }, { reviewCount: "desc" }, { createdAt: "desc" }];
            }
        };

        const [artists, total] = await Promise.all([
            prisma.user.findMany({
                where,
                select: artistSelect,
                orderBy: orderByForList(),
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
                        createdAt: true,
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

        const productIds = products.map((p) => p.id);
        const salesByProduct = new Map<string, number>();
        const avgRatingByProduct = new Map<string, number>();
        if (productIds.length > 0) {
            const [salesGroups, ratingGroups] = await Promise.all([
                prisma.orderItem.groupBy({
                    by: ["productId"],
                    where: {
                        productId: { in: productIds },
                        order: { status: { in: [...PAID_ORDER_STATUSES] } },
                    },
                    _sum: { quantity: true },
                }),
                prisma.review.groupBy({
                    by: ["productId"],
                    where: { productId: { in: productIds } },
                    _avg: { productRating: true },
                }),
            ]);
            for (const g of salesGroups) {
                if (g.productId) salesByProduct.set(g.productId, g._sum.quantity ?? 0);
            }
            for (const g of ratingGroups) {
                if (g.productId) avgRatingByProduct.set(g.productId, g._avg.productRating ?? 0);
            }
        }

        const pricedProducts = products.map((p) => {
            const { price, isDiscounted, discountPercent, originalPrice } = calculateProductPrice(
                p,
                activeOffer
            );
            return {
                ...p,
                price,
                isDiscounted,
                discountPercent,
                originalPrice,
                salesCount: salesByProduct.get(p.id) ?? 0,
                avgProductRating: avgRatingByProduct.get(p.id) ?? 0,
            };
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
