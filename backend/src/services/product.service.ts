import { PrismaClient, ProductStatus, Prisma } from "@prisma/client";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import crypto from "crypto";
import { calculateProductPrice, getActiveSpecialOffer } from "../utils/productUtils";

const prisma = new PrismaClient();

const PAID_ORDER_STATUSES = ["PAID", "SHIPPED", "DELIVERED"] as const;

/** Units assigned to new products when the artist does not send a stock value. Configured in admin (inventory_defaults). */
export async function getDefaultProductStock(): Promise<number> {
    const row = await prisma.siteConfig.findUnique({ where: { key: "inventory_defaults" } });
    const v = row?.value as { defaultProductStock?: number } | null;
    const n = v?.defaultProductStock;
    if (typeof n === "number" && Number.isFinite(n) && n >= 0) return Math.floor(n);
    return 100;
}

const s3 = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID!,
        secretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY!,
    },
});

const BUCKET = process.env.CLOUDFLARE_BUCKET_NAME!;
const PUBLIC_URL = process.env.CLOUDFLARE_PUBLIC_URL!;

function mockupPublicUrlToKey(url: string | null | undefined): string | null {
    if (!url || typeof url !== "string") return null;
    const base = PUBLIC_URL.replace(/\/$/, "");
    const u = url.trim();
    if (!u.startsWith(base)) return null;
    const path = u.slice(base.length).replace(/^\//, "");
    const noQuery = path.split("?")[0] || "";
    try {
        return decodeURIComponent(noQuery) || null;
    } catch {
        return noQuery || null;
    }
}

function collectProductMockupKeys(product: {
    mockupFileKey?: string | null;
    backMockupFileKey?: string | null;
    mockupImageUrl: string;
    backMockupImageUrl?: string | null;
    colorMockups?: unknown;
}): string[] {
    const keys = new Set<string>();
    const add = (k: string | null | undefined) => {
        if (k && typeof k === "string" && k.length > 0) keys.add(k);
    };
    add(product.mockupFileKey);
    add(product.backMockupFileKey);
    add(mockupPublicUrlToKey(product.mockupImageUrl));
    add(mockupPublicUrlToKey(product.backMockupImageUrl ?? null));
    const cm = product.colorMockups;
    if (cm && typeof cm === "object" && !Array.isArray(cm)) {
        for (const v of Object.values(cm as Record<string, { front?: string; back?: string }>)) {
            if (v && typeof v === "object") {
                add(mockupPublicUrlToKey(v.front));
                add(mockupPublicUrlToKey(v.back));
            }
        }
    }
    return [...keys];
}

// ---------- Upload mockup image to R2 ----------
export const uploadMockupToR2 = async (
    file: Express.Multer.File
): Promise<{ mockupImageUrl: string; mockupFileKey: string }> => {
    const fileKey = `mockups/${crypto.randomUUID()}-${file.originalname}`;

    await s3.send(
        new PutObjectCommand({
            Bucket: BUCKET,
            Key: fileKey,
            Body: file.buffer,
            ContentType: file.mimetype,
        })
    );

    return {
        mockupImageUrl: `${PUBLIC_URL}/${fileKey}`,
        mockupFileKey: fileKey,
    };
};

// ---------- Upload generic asset to R2 ----------
export const uploadAssetToR2 = async (
    file: Express.Multer.File,
    prefix = "assets"
): Promise<{ assetUrl: string; assetKey: string }> => {
    const fileKey = `${prefix}/${crypto.randomUUID()}-${file.originalname}`;

    await s3.send(
        new PutObjectCommand({
            Bucket: BUCKET,
            Key: fileKey,
            Body: file.buffer,
            ContentType: file.mimetype,
        })
    );

    return {
        assetUrl: `${PUBLIC_URL}/${fileKey}`,
        assetKey: fileKey,
    };
};

// ---------- Upload site asset to R2 ----------
export const uploadSiteAssetToR2 = async (
    file: Express.Multer.File
): Promise<{ assetUrl: string; assetKey: string }> => {
    return uploadAssetToR2(file, "assets");
};

// ---------- Delete file from R2 ----------
export const deleteFileFromR2 = async (fileKey: string): Promise<void> => {
    try {
        await s3.send(
            new DeleteObjectCommand({
                Bucket: BUCKET,
                Key: fileKey,
            })
        );
    } catch (error) {
        console.error(`Failed to delete file from R2: ${fileKey}`, error);
    }
};

// ---------- Create product ----------
interface CreateProductInput {
    name: string;
    description?: string;
    price: number;
    compareAtPrice?: number;
    categories?: string[];
    tshirtColor: string;
    availableColors: string[];
    primaryColor?: string;
    primaryView?: string;
    tags?: string[];
    stock?: number;
    status?: ProductStatus;
    mockupImageUrl: string;
    mockupFileKey?: string;
    backMockupImageUrl?: string;
    backMockupFileKey?: string;
    colorMockups?: Record<string, { front: string; back?: string }>;
    draftEditorState?: Prisma.InputJsonValue;
    designId: string;
    artistId: string;
}

export const createProductService = async (data: CreateProductInput) => {
    // Verify the design exists and belongs to the artist
    const design = await prisma.design.findFirst({
        where: { id: data.designId, artistId: data.artistId, isDeleted: false },
    });

    if (!design) {
        throw new Error("Design not found or does not belong to you");
    }

    // Enforce: only APPROVED designs can be used to create products.
    if (design.status !== "APPROVED") {
        throw new Error("Only approved designs can be used to create products.");
    }

    // --- NEW: Block Design Reuse ---
    const existingProductNode = await prisma.product.findFirst({
        where: {
            designId: data.designId,
            artistId: data.artistId,
            status: { in: ["DRAFT", "PUBLISHED"] },
        },
    });
    if (existingProductNode) {
        throw new Error("This design is already manifested in another active product. Each design belongs to a unique product identity.");
    }
    // ---------------------------------

    // Enforce 10-product limit per artist
    const productCount = await prisma.product.count({
        where: { artistId: data.artistId, status: { in: ["DRAFT", "PUBLISHED"] } },
    });
    if (productCount >= 10) {
        throw new Error("Product limit reached. You can have a maximum of 10 active products.");
    }

    return prisma.product.create({
        data: {
            name: data.name,
            description: data.description,
            price: data.price,
            compareAtPrice: data.compareAtPrice,
            categories: data.categories || [],
            tshirtColor: data.tshirtColor,
            availableColors: data.availableColors?.length ? data.availableColors : [data.tshirtColor],
            primaryColor: data.primaryColor || data.tshirtColor,
            primaryView: data.primaryView || "front",
            tags: data.tags || [],
            stock: data.stock || 0,
            status: data.status || "DRAFT",
            mockupImageUrl: data.mockupImageUrl,
            mockupFileKey: data.mockupFileKey,
            backMockupImageUrl: data.backMockupImageUrl,
            backMockupFileKey: data.backMockupFileKey,
            colorMockups: data.colorMockups && Object.keys(data.colorMockups).length > 0 ? data.colorMockups : undefined,
            draftEditorState: data.draftEditorState,
            design: { connect: { id: data.designId } },
            artist: { connect: { id: data.artistId } },
        },
        include: {
            design: { select: { id: true, title: true, imageUrl: true } },
        },
    });
};

// ---------- Get single product ----------
export const getProductByIdService = async (id: string) => {
    const [product, activeOffer] = await Promise.all([
        prisma.product.findUnique({
            where: { id },
            include: {
                design: { select: { id: true, title: true, imageUrl: true } },
                artist: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        artistRating: true,
                        reviewCount: true,
                        displayName: true,
                        artistSlug: true,
                    },
                },
                variants: {
                    select: {
                        id: true,
                        color: true,
                        size: true,
                        stock: true,
                        stockStatus: true,
                    },
                },
            },
        }),
        getActiveSpecialOffer()
    ]);

    if (!product) {
        throw new Error("Product not found");
    }

    const { price, isDiscounted, discountPercent, originalPrice } = calculateProductPrice(product, activeOffer);

    return {
        ...product,
        price,
        isDiscounted,
        discountPercent,
        originalPrice
    };
};

// ---------- Get published products (public, with filters) ----------
interface ProductFilters {
    category?: string;
    sort?: string;
    page?: number;
    limit?: number;
    search?: string;
    /** When true, only products marked as latest drops (admin); still PUBLISHED only. */
    latestDrops?: boolean;
}

export const getPublishedProductsService = async (filters: ProductFilters) => {
    const page = filters.page || 1;
    const limit = filters.limit || 12;
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {
        status: "PUBLISHED",
    };

    if (filters.latestDrops) {
        where.isLatestDrop = true;
    }

    if (filters.category && filters.category !== "all") {
        where.categories = { has: filters.category };
    }

    if (filters.search) {
        const normalizedSearch = filters.search.trim().toLowerCase();
        where.OR = [
            { name: { contains: normalizedSearch, mode: "insensitive" } },
            { artist: { name: { contains: normalizedSearch, mode: "insensitive" } } },
            { tags: { has: normalizedSearch } },
        ];
    }

    let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: "desc" };
    const sortBySales =
        filters.sort === "popular" || filters.sort === "sales";
    switch (filters.sort) {
        case "price-low":
            orderBy = { price: "asc" };
            break;
        case "price-high":
            orderBy = { price: "desc" };
            break;
        case "newest":
            orderBy = { createdAt: "desc" };
            break;
        case "popular":
        case "sales":
            break;
        default:
            orderBy = { createdAt: "desc" };
            break;
    }

    const [productsRaw, total, activeOffer] = await Promise.all([
        (async () => {
            if (sortBySales) {
                const idRows = await prisma.product.findMany({
                    where,
                    select: { id: true, createdAt: true },
                });
                if (idRows.length === 0) return [];
                const ids = idRows.map((r) => r.id);
                const createdAtById = new Map(idRows.map((r) => [r.id, r.createdAt.getTime()]));
                const grouped = await prisma.orderItem.groupBy({
                    by: ["productId"],
                    where: {
                        productId: { in: ids },
                        order: { status: { in: [...PAID_ORDER_STATUSES] } },
                    },
                    _sum: { quantity: true },
                });
                const qtyByProduct = new Map(
                    grouped.map((g) => [g.productId, g._sum.quantity ?? 0])
                );
                const sortedIds = [...ids].sort((a, b) => {
                    const qa = qtyByProduct.get(a) ?? 0;
                    const qb = qtyByProduct.get(b) ?? 0;
                    if (qb !== qa) return qb - qa;
                    return (createdAtById.get(b) ?? 0) - (createdAtById.get(a) ?? 0);
                });
                const pageIds = sortedIds.slice(skip, skip + limit);
                if (pageIds.length === 0) return [];
                const rows = await prisma.product.findMany({
                    where: { id: { in: pageIds } },
                    include: {
                        design: { select: { id: true, title: true, imageUrl: true } },
                        artist: {
                            select: {
                                id: true,
                                name: true,
                                displayName: true,
                                artistSlug: true,
                                artistRating: true,
                                reviewCount: true,
                            },
                        },
                    },
                });
                const rank = new Map(pageIds.map((id, i) => [id, i]));
                return [...rows].sort((a, b) => (rank.get(a.id) ?? 0) - (rank.get(b.id) ?? 0));
            }
            return prisma.product.findMany({
                where,
                include: {
                    design: { select: { id: true, title: true, imageUrl: true } },
                    artist: {
                        select: {
                            id: true,
                            name: true,
                            displayName: true,
                            artistSlug: true,
                            artistRating: true,
                            reviewCount: true,
                        },
                    },
                },
                orderBy,
                skip,
                take: limit,
            });
        })(),
        prisma.product.count({ where }),
        getActiveSpecialOffer()
    ]);

    const products = productsRaw.map(product => {
        const { price, isDiscounted, discountPercent, originalPrice } = calculateProductPrice(product, activeOffer);
        return {
            ...product,
            price,
            isDiscounted,
            discountPercent,
            originalPrice
        };
    });

    return {
        products,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
};

// ---------- Get products by artist ----------
export const getProductsByArtistService = async (
    artistId: string,
    statusFilter?: string
) => {
    const where: Prisma.ProductWhereInput = { artistId };

    if (statusFilter && statusFilter !== "all") {
        where.status = statusFilter as ProductStatus;
    }

    const [productsRaw, activeOffer] = await Promise.all([
        prisma.product.findMany({
            where,
            include: {
                design: { select: { id: true, title: true, imageUrl: true } },
            },
            orderBy: { createdAt: "desc" },
        }),
        getActiveSpecialOffer()
    ]);

    return productsRaw.map(product => {
        const { price, isDiscounted, discountPercent, originalPrice } = calculateProductPrice(product, activeOffer);
        return {
            ...product,
            price,
            isDiscounted,
            discountPercent,
            originalPrice
        };
    });
};

export const getArtistDraftProductByIdService = async (id: string, artistId: string) => {
    const product = await prisma.product.findFirst({
        where: { id, artistId },
        include: {
            design: { select: { id: true, title: true, imageUrl: true } },
        },
    });

    if (!product) {
        throw new Error("Product not found or does not belong to you");
    }

    return product;
};

// ---------- Update product ----------
interface UpdateProductInput {
    name?: string;
    description?: string;
    price?: number;
    compareAtPrice?: number;
    category?: string;
    tshirtColor?: string;
    stock?: number;
    categories?: string[];
    availableColors?: string[];
    primaryColor?: string;
    primaryView?: string;
    tags?: string[];
    status?: ProductStatus;
    mockupImageUrl?: string;
    mockupFileKey?: string;
    backMockupImageUrl?: string | null;
    backMockupFileKey?: string | null;
    colorMockups?: Record<string, { front: string; back?: string }>;
    draftEditorState?: Prisma.InputJsonValue;
    designId?: string;
}

export const updateProductService = async (
    id: string,
    artistId: string,
    data: UpdateProductInput
) => {
    const product = await prisma.product.findFirst({
        where: { id, artistId },
    });

    if (!product) {
        throw new Error("Product not found or does not belong to you");
    }

    if (product.status === "PUBLISHED") {
        throw new Error(
            "Published products cannot be edited. Create a new product if you need changes, or delete a draft first."
        );
    }

    const { designId, ...rest } = data;

    return prisma.product.update({
        where: { id },
        data: {
            ...rest,
            ...(designId ? { design: { connect: { id: designId } } } : {}),
        },
        include: {
            design: { select: { id: true, title: true, imageUrl: true } },
        },
    });
};

// ---------- Delete product (hard delete + R2 mockup cleanup) ----------
export const deleteProductService = async (id: string, artistId: string) => {
    const product = await prisma.product.findFirst({
        where: { id, artistId },
    });

    if (!product) {
        throw new Error("Product not found or does not belong to you");
    }

    const orderCount = await prisma.orderItem.count({ where: { productId: id } });
    if (orderCount > 0) {
        throw new Error(
            "This product cannot be deleted because it has been ordered. It stays in your catalog for buyer and order history."
        );
    }

    const keysToDelete = collectProductMockupKeys(product);

    await prisma.$transaction(async (tx) => {
        await tx.review.deleteMany({ where: { productId: id } });
        await tx.product.delete({ where: { id } });
    });

    await Promise.all(keysToDelete.map((k) => deleteFileFromR2(k)));

    return { deleted: true as const };
};

// ---------- Publish a draft product ----------
export const publishProductService = async (id: string, artistId: string) => {
    const product = await prisma.product.findFirst({
        where: { id, artistId },
    });

    if (!product) {
        throw new Error("Product not found or does not belong to you");
    }

    if (product.status === "PUBLISHED") {
        throw new Error("Product is already published");
    }

    return prisma.product.update({
        where: { id },
        data: { status: "PUBLISHED" },
        include: {
            design: { select: { id: true, title: true, imageUrl: true } },
        },
    });
};

// ---------- Artist stats ----------
export const getArtistStatsService = async (artistId: string) => {
    const [totalProducts, publishedProducts, draftProducts, designs] =
        await Promise.all([
            prisma.product.count({ where: { artistId } }),
            prisma.product.count({
                where: { artistId, status: "PUBLISHED" },
            }),
            prisma.product.count({ where: { artistId, status: "DRAFT" } }),
            prisma.design.count({
                where: { artistId, isDeleted: false },
            }),
        ]);

    // Revenue & sales from order items linked to this artist's products
    const orderStats = await prisma.orderItem.aggregate({
        where: {
            product: { artistId },
            order: { status: { in: ["PAID", "SHIPPED", "DELIVERED"] } },
        },
        _sum: { price: true, quantity: true },
        _count: true,
    });

    return {
        totalProducts,
        publishedProducts,
        draftProducts,
        totalDesigns: designs,
        totalRevenue: orderStats._sum?.price || 0,
        totalEarnings: (orderStats._sum?.price || 0) * 0.25,
        totalSales: orderStats._sum?.quantity || 0,
        totalOrders: orderStats._count,
    };
};

export const getArtistOrdersService = async (artistId: string) => {
    const orders = await prisma.orderItem.findMany({
        where: {
            product: { artistId },
            order: { status: { in: ["PAID", "SHIPPED", "DELIVERED"] } }
        },
        include: {
            product: {
                select: {
                    id: true,
                    name: true,
                    mockupImageUrl: true,
                    price: true
                }
            },
            order: {
                select: {
                    id: true,
                    createdAt: true,
                    status: true
                }
            }
        },
        orderBy: {
            order: { createdAt: "desc" }
        }
    });

    return orders.map(item => ({
        id: item.id,
        orderId: item.order.id,
        productName: item.product.name,
        productImage: item.product.mockupImageUrl,
        quantity: item.quantity,
        totalPrice: item.price * item.quantity,
        artistEarning: (item.price * item.quantity) * 0.25,
        status: item.order.status,
        date: item.order.createdAt
    }));
};

function startOfUtcDay(d: Date) {
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function addUtcDays(d: Date, n: number) {
    const x = new Date(d);
    x.setUTCDate(x.getUTCDate() + n);
    return x;
}

function formatUtcYmd(d: Date) {
    return d.toISOString().slice(0, 10);
}

function formatUtcYm(d: Date) {
    return d.toISOString().slice(0, 7);
}

/** Daily or monthly artist share (₹) for dashboard chart. */
export const getArtistRevenueSeriesService = async (
    artistId: string,
    range: "7d" | "30d" | "365d"
) => {
    const now = new Date();
    const end = startOfUtcDay(now);
    const days = range === "7d" ? 7 : range === "30d" ? 30 : 365;
    const startDay = addUtcDays(end, -(days - 1));
    const monthStart =
        range === "365d"
            ? new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() - 11, 1))
            : startDay;

    const items = await prisma.orderItem.findMany({
        where: {
            artistId,
            order: {
                status: { in: [...PAID_ORDER_STATUSES] },
                createdAt: {
                    gte: range === "365d" ? monthStart : startDay,
                    lte: addUtcDays(now, 1),
                },
            },
        },
        select: {
            artistShareAmount: true,
            price: true,
            quantity: true,
            order: { select: { createdAt: true } },
        },
    });

    const share = (row: (typeof items)[number]) =>
        row.artistShareAmount > 0
            ? row.artistShareAmount
            : Number((row.price * row.quantity * 0.25).toFixed(2));

    if (range === "365d") {
        const buckets = new Map<string, number>();
        for (let i = 11; i >= 0; i--) {
            const t = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() - i, 1));
            buckets.set(formatUtcYm(t), 0);
        }
        for (const row of items) {
            const key = formatUtcYm(row.order.createdAt);
            if (buckets.has(key)) {
                buckets.set(key, (buckets.get(key) || 0) + share(row));
            }
        }
        const points = Array.from(buckets.entries()).map(([key, earnings]) => ({
            key,
            label: new Date(key + "-01T12:00:00.000Z").toLocaleDateString("en-IN", {
                month: "short",
                year: "2-digit",
            }),
            earnings: Math.round(earnings * 100) / 100,
        }));
        return { granularity: "month" as const, points };
    }

    const buckets = new Map<string, number>();
    for (let i = 0; i < days; i++) {
        const t = addUtcDays(startDay, i);
        buckets.set(formatUtcYmd(t), 0);
    }
    for (const row of items) {
        const key = formatUtcYmd(startOfUtcDay(row.order.createdAt));
        if (buckets.has(key)) {
            buckets.set(key, (buckets.get(key) || 0) + share(row));
        }
    }
    const points = Array.from(buckets.entries()).map(([key, earnings]) => ({
        key,
        label:
            range === "7d"
                ? new Date(key + "T12:00:00.000Z").toLocaleDateString("en-IN", {
                      weekday: "short",
                      day: "numeric",
                  })
                : new Date(key + "T12:00:00.000Z").toLocaleDateString("en-IN", {
                      month: "short",
                      day: "numeric",
                  }),
        earnings: Math.round(earnings * 100) / 100,
    }));

    return { granularity: "day" as const, points };
};

function csvEscape(value: string | number) {
    const s = String(value);
    if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
}

/** Line-level earnings export for the authenticated artist. */
export const buildArtistEarningsCsv = async (artistId: string) => {
    const rows = await prisma.orderItem.findMany({
        where: {
            artistId,
            order: { status: { in: [...PAID_ORDER_STATUSES] } },
        },
        orderBy: { order: { createdAt: "desc" } },
        include: {
            product: { select: { name: true } },
            order: { select: { id: true, createdAt: true, status: true } },
        },
    });

    const header = [
        "Order ID",
        "Order date (UTC)",
        "Order status",
        "Product",
        "Size",
        "Color",
        "Quantity",
        "Unit price (INR)",
        "Line total (INR)",
        "Artist share (INR)",
    ];

    const lines = [header.map(csvEscape).join(",")];

    for (const r of rows) {
        const lineTotal = r.price * r.quantity;
        const artistShare =
            r.artistShareAmount > 0
                ? r.artistShareAmount
                : Number((lineTotal * 0.25).toFixed(2));
        lines.push(
            [
                r.order.id,
                r.order.createdAt.toISOString(),
                r.order.status,
                r.product.name,
                r.size,
                r.color,
                r.quantity,
                r.price,
                lineTotal,
                artistShare,
            ]
                .map(csvEscape)
                .join(",")
        );
    }

    return lines.join("\r\n");
};
