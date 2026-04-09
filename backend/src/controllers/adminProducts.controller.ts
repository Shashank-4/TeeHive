import { Request, Response, NextFunction } from "express";
import { PrismaClient, ProductStatus, StockStatus } from "@prisma/client";
import { calculateProductPrice, getActiveSpecialOffer } from "../utils/productUtils";

const prisma = new PrismaClient();

const MAX_LATEST_DROP_PRODUCTS = 10;

function aggregateStatuses(statuses: StockStatus[]): StockStatus {
    if (statuses.includes("IN_STOCK")) return "IN_STOCK";
    if (statuses.includes("LOW_STOCK")) return "LOW_STOCK";
    return "OUT_OF_STOCK";
}

export const listProductsHandler = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const status = req.query.status as string;
        const search = req.query.search as string;
        const skip = (page - 1) * limit;

        const where: any = {};
        if (status && status !== "all") {
            where.status = status;
        }
        if (search) {
            where.name = { contains: search, mode: "insensitive" };
        }

        const [productsRaw, total, activeOffer, latestDropCount] = await Promise.all([
            prisma.product.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
                include: {
                    artist: {
                        select: { name: true, email: true }
                    },
                    _count: {
                        select: { orderItems: true }
                    }
                }
            }),
            prisma.product.count({ where }),
            getActiveSpecialOffer(),
            prisma.product.count({ where: { isLatestDrop: true } }),
        ]);

        const formattedProducts = productsRaw.map((product) => {
            const { price, isDiscounted, discountPercent } = calculateProductPrice(product, activeOffer);
            return {
                id: product.id,
                title: product.name,
                artist: product.artist.name || product.artist.email,
                categories: product.categories,
                price: price,
                isDiscounted,
                discountPercent,
                originalPrice: product.price,
                stock: product.stock,
                stockStatus: product.stockStatus,
                sales: product._count.orderItems,
                rating: 4.8, // Placeholder
                status: product.status,
                image: product.mockupImageUrl,
                isLatestDrop: product.isLatestDrop,
            };
        });

        res.status(200).json({
            status: "success",
            data: {
                products: formattedProducts,
                latestDropCount,
                latestDropMax: MAX_LATEST_DROP_PRODUCTS,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                }
            },
        });
    } catch (error: any) {
        console.error("List Products Error:", error);
        res.status(500).json({
            status: "error",
            message: "Failed to fetch products",
        });
    }
};

export const patchProductLatestDropHandler = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { isLatestDrop } = req.body as { isLatestDrop?: boolean };

        if (typeof isLatestDrop !== "boolean") {
            return res.status(400).json({ status: "error", message: "isLatestDrop (boolean) is required" });
        }

        const existing = await prisma.product.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({ status: "error", message: "Product not found" });
        }

        if (isLatestDrop && existing.status !== "PUBLISHED") {
            return res.status(400).json({
                status: "error",
                message: "Only published products can be marked as latest drops",
            });
        }

        if (isLatestDrop && !existing.isLatestDrop) {
            const count = await prisma.product.count({ where: { isLatestDrop: true } });
            if (count >= MAX_LATEST_DROP_PRODUCTS) {
                return res.status(400).json({
                    status: "error",
                    message: `You can mark at most ${MAX_LATEST_DROP_PRODUCTS} products as latest drops`,
                });
            }
        }

        await prisma.product.update({
            where: { id },
            data: { isLatestDrop },
        });

        const latestDropCount = await prisma.product.count({ where: { isLatestDrop: true } });

        res.status(200).json({
            status: "success",
            data: { isLatestDrop, latestDropCount, latestDropMax: MAX_LATEST_DROP_PRODUCTS },
        });
    } catch (error: any) {
        console.error("Patch latest drop Error:", error);
        res.status(500).json({ status: "error", message: "Failed to update latest drop flag" });
    }
};

export const updateProductStatusHandler = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!Object.values(ProductStatus).includes(status as ProductStatus)) {
            return res.status(400).json({ status: "error", message: "Invalid product status" });
        }

        const product = await prisma.product.update({
            where: { id },
            data: {
                status: status as ProductStatus,
                ...(status !== "PUBLISHED" ? { isLatestDrop: false } : {}),
            },
        });

        res.status(200).json({
            status: "success",
            data: { product }
        });
    } catch (error: any) {
        console.error("Update Product Status Error:", error);
        res.status(500).json({
            status: "error",
            message: "Failed to update product status",
        });
    }
};

/** Update catalog base price (and optional compare-at); used by admin inventory and drives storefront/artist APIs. */
export const updateProductPriceHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const rawPrice = req.body.price;
        const price = typeof rawPrice === "string" ? parseFloat(rawPrice) : Number(rawPrice);
        if (!Number.isFinite(price) || price < 0) {
            return res.status(400).json({ status: "error", message: "A valid non-negative price is required" });
        }

        const existing = await prisma.product.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({ status: "error", message: "Product not found" });
        }

        const data: { price: number; compareAtPrice?: number | null } = { price };
        if (Object.prototype.hasOwnProperty.call(req.body, "compareAtPrice")) {
            const cap = req.body.compareAtPrice;
            if (cap === null || cap === "") {
                data.compareAtPrice = null;
            } else {
                const n = typeof cap === "string" ? parseFloat(cap) : Number(cap);
                if (!Number.isFinite(n) || n < 0) {
                    return res.status(400).json({ status: "error", message: "Invalid compareAtPrice" });
                }
                data.compareAtPrice = n;
            }
        }

        const product = await prisma.product.update({
            where: { id },
            data,
        });

        res.status(200).json({
            status: "success",
            data: { product },
        });
    } catch (error: any) {
        console.error("Update Product Price Error:", error);
        res.status(500).json({
            status: "error",
            message: "Failed to update product price",
        });
    }
};

export const updateProductStockHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const stockStatus = req.body.stockStatus ?? req.body.stock;

        if (!Object.values(StockStatus).includes(stockStatus as StockStatus)) {
            return res.status(400).json({ status: "error", message: "A valid stockStatus is required" });
        }

        const product = await prisma.product.update({
            where: { id },
            data: {
                stockStatus: stockStatus as StockStatus,
            },
        });

        res.status(200).json({
            status: "success",
            data: { product }
        });
    } catch (error: any) {
        console.error("Update Product Stock Error:", error);
        res.status(500).json({
            status: "error",
            message: "Failed to update product stock",
        });
    }
};

export const getProductVariantsHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const product = await prisma.product.findUnique({
            where: { id },
            include: { variants: true }
        });
        
        if (!product) return res.status(404).json({status: "fail", message: "Product not found"});

        res.status(200).json({ status: "success", data: { variants: product.variants, availableColors: product.availableColors } });
    } catch(err) { next(err); }
};

export const updateProductVariantsHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { variants } = req.body; 
        
        if (!Array.isArray(variants)) {
            return res.status(400).json({ message: "Invalid variants format" });
        }

        await Promise.all(variants.map(v => {
            const stockStatus = String(v.stockStatus || "").toUpperCase();
            if (!Object.values(StockStatus).includes(stockStatus as StockStatus)) {
                throw new Error("Invalid variant stock status");
            }

            return prisma.productVariant.upsert({
                where: { productId_color_size: { productId: id, color: String(v.color), size: String(v.size) } },
                create: {
                    productId: id,
                    color: String(v.color),
                    size: String(v.size),
                    stockStatus: stockStatus as StockStatus,
                },
                update: { stockStatus: stockStatus as StockStatus }
            });
        }));
        
        const allVariants = await prisma.productVariant.findMany({
            where: { productId: id },
            select: { stockStatus: true },
        });
        const productStockStatus = allVariants.length
            ? aggregateStatuses(allVariants.map((variant) => variant.stockStatus))
            : "OUT_OF_STOCK";

        await prisma.product.update({ 
            where: { id }, 
            data: { stockStatus: productStockStatus } 
        });

        res.status(200).json({
            status: "success",
            message: "Variants updated globally",
            data: { stockStatus: productStockStatus },
        });
    } catch(err) { next(err); }
};
