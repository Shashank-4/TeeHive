import { Request, Response, NextFunction } from "express";
import { PrismaClient, ProductStatus, StockStatus } from "@prisma/client";
import { calculateProductPrice, getActiveSpecialOffer } from "../utils/productUtils";

const prisma = new PrismaClient();

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

        const [productsRaw, total, activeOffer] = await Promise.all([
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
            getActiveSpecialOffer()
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
            };
        });

        res.status(200).json({
            status: "success",
            data: {
                products: formattedProducts,
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

export const updateProductStatusHandler = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!Object.values(ProductStatus).includes(status as ProductStatus)) {
            return res.status(400).json({ status: "error", message: "Invalid product status" });
        }

        const product = await prisma.product.update({
            where: { id },
            data: { status: status as ProductStatus },
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

export const updateProductStockHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { stock } = req.body;

        const isStockStatus = Object.values(StockStatus).includes(stock as StockStatus);
        
        if (!isStockStatus && (stock === undefined || typeof stock !== 'number' || stock < 0)) {
            return res.status(400).json({ status: "error", message: "Valid status or stock value is required" });
        }

        const updateData: any = {};
        if (isStockStatus) {
            updateData.stockStatus = stock as StockStatus;
            // map status to some default numeric values for compatibility
            updateData.stock = stock === 'OUT_OF_STOCK' ? 0 : (stock === 'LOW_STOCK' ? 5 : 100);
        } else {
            updateData.stock = stock;
            updateData.stockStatus = stock > 10 ? 'IN_STOCK' : (stock > 0 ? 'LOW_STOCK' : 'OUT_OF_STOCK');
        }

        const product = await prisma.product.update({
            where: { id },
            data: updateData,
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

        // Upsert variants sequentially or via Promise.all
        // Using upsert in a loop or Promise.all avoids missing variants
        await Promise.all(variants.map(v => 
            prisma.productVariant.upsert({
                where: { productId_color_size: { productId: id, color: String(v.color), size: String(v.size) } },
                create: { productId: id, color: String(v.color), size: String(v.size), stock: parseInt(v.stock) || 0 },
                update: { stock: parseInt(v.stock) || 0 }
            })
        ));
        
        // Update global product stock
        const totalStock = await prisma.productVariant.aggregate({
            where: { productId: id },
            _sum: { stock: true }
        });
        const finalStock = totalStock._sum.stock || 0;
        await prisma.product.update({ 
            where: { id }, 
            data: { stock: finalStock } 
        });

        res.status(200).json({ status: "success", message: "Variants updated globally", data: { totalStock: finalStock } });
    } catch(err) { next(err); }
};
