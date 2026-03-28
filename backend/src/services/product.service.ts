import { PrismaClient, ProductStatus, Prisma } from "@prisma/client";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import crypto from "crypto";
import { calculateProductPrice, getActiveSpecialOffer } from "../utils/productUtils";

const prisma = new PrismaClient();

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

// ---------- Upload site asset to R2 ----------
export const uploadSiteAssetToR2 = async (
    file: Express.Multer.File
): Promise<{ assetUrl: string; assetKey: string }> => {
    const fileKey = `assets/${crypto.randomUUID()}-${file.originalname}`;

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

    // --- NEW: Block Design Reuse ---
    const existingProductNode = await prisma.product.findFirst({
        where: { designId: data.designId, artistId: data.artistId, status: { not: "ARCHIVED" } }
    });
    if (existingProductNode) {
        throw new Error("This design is already manifested in another active product. Each design belongs to a unique product identity.");
    }
    // ---------------------------------

    // Enforce 10-product limit per artist
    const productCount = await prisma.product.count({
        where: { artistId: data.artistId, status: { not: "ARCHIVED" } },
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
                artist: { select: { id: true, name: true, email: true } },
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
}

export const getPublishedProductsService = async (filters: ProductFilters) => {
    const page = filters.page || 1;
    const limit = filters.limit || 12;
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {
        status: "PUBLISHED",
    };

    if (filters.category && filters.category !== "all") {
        where.categories = { has: filters.category };
    }

    if (filters.search) {
        where.OR = [
            { name: { contains: filters.search, mode: "insensitive" } },
            { artist: { name: { contains: filters.search, mode: "insensitive" } } },
        ];
    }

    let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: "desc" };
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
        default:
            orderBy = { createdAt: "desc" }; // TODO: sort by sales count when reviews/sales tracking is added
            break;
    }

    const [productsRaw, total, activeOffer] = await Promise.all([
        prisma.product.findMany({
            where,
            include: {
                design: { select: { id: true, title: true, imageUrl: true } },
                artist: { select: { id: true, name: true } },
            },
            orderBy,
            skip,
            take: limit,
        }),
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

// ---------- Update product ----------
interface UpdateProductInput {
    name?: string;
    description?: string;
    price?: number;
    compareAtPrice?: number;
    category?: string;
    tshirtColor?: string;
    stock?: number;
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
        throw new Error("Published products cannot be edited. Please archive and create a new one if needed.");
    }

    return prisma.product.update({
        where: { id },
        data,
        include: {
            design: { select: { id: true, title: true, imageUrl: true } },
        },
    });
};

// ---------- Delete / archive product ----------
export const deleteProductService = async (id: string, artistId: string) => {
    const product = await prisma.product.findFirst({
        where: { id, artistId },
    });

    if (!product) {
        throw new Error("Product not found or does not belong to you");
    }

    // Archive instead of hard delete so order history is preserved
    return prisma.product.update({
        where: { id },
        data: { status: "ARCHIVED" },
    });
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
