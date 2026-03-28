import { Request, Response, NextFunction } from "express";
import {
    createProductService,
    getProductByIdService,
    getPublishedProductsService,
    getProductsByArtistService,
    updateProductService,
    deleteProductService,
    publishProductService,
    getArtistStatsService,
    getArtistOrdersService,
    uploadMockupToR2,
} from "../services/product.service";

// ---------- Artist: Create product ----------
export const createProductHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const user = res.locals.user;
        const files = req.files as { [fieldname: string]: Express.Multer.File[] };
        const mockupFile = files?.['mockupImage']?.[0];
        const backMockupFile = files?.['backMockupImage']?.[0];

        if (!mockupFile) {
            return res
                .status(400)
                .json({ status: "fail", message: "Front mockup image is required" });
        }
        console.log('user, mockupFile', user, mockupFile)
        const { name, description, price, compareAtPrice, categories, tshirtColor, availableColors, primaryColor, primaryView, stock, status, designId, tags } = req.body;
        console.log('mockupFile', mockupFile, name, description, price, compareAtPrice, categories, tshirtColor, availableColors, primaryColor, primaryView, stock, status, designId, tags);
        if (!name || !price || !tshirtColor || !designId) {
            return res.status(400).json({
                status: "fail",
                message: "name, price, tshirtColor, and designId are required",
            });
        }

        // Parse tags from JSON string (FormData sends it as string)
        let parsedTags: string[] = [];
        if (tags) {
            try {
                parsedTags = typeof tags === "string" ? JSON.parse(tags) : tags;
            } catch {
                parsedTags = [];
            }
        }

        let parsedCategories: string[] = [];
        if (categories) {
            try {
                parsedCategories = typeof categories === "string" ? JSON.parse(categories) : categories;
            } catch {
                parsedCategories = [];
            }
        }

        let parsedAvailableColors: string[] = [];
        if (availableColors) {
            try {
                parsedAvailableColors = typeof availableColors === "string" ? JSON.parse(availableColors) : availableColors;
            } catch {
                parsedAvailableColors = [tshirtColor];
            }
        } else {
            parsedAvailableColors = [tshirtColor];
        }

        const isVerified = user.verificationStatus === "VERIFIED";
        const finalStatus = isVerified ? "PUBLISHED" : (status || "DRAFT");

        // Upload front mockup image to R2
        const { mockupImageUrl, mockupFileKey } = await uploadMockupToR2(mockupFile);

        // Upload back mockup image to R2 if exists
        let backMockupImageUrl: string | undefined;
        let backMockupFileKey: string | undefined;
        if (backMockupFile) {
            const uploadedBack = await uploadMockupToR2(backMockupFile);
            backMockupImageUrl = uploadedBack.mockupImageUrl;
            backMockupFileKey = uploadedBack.mockupFileKey;
        }
        const product = await createProductService({
            name,
            description,
            price: parseFloat(price),
            compareAtPrice: compareAtPrice ? parseFloat(compareAtPrice) : undefined,
            categories: parsedCategories,
            tshirtColor,
            availableColors: parsedAvailableColors,
            primaryColor: primaryColor || tshirtColor,
            primaryView: primaryView || "front",
            tags: parsedTags,
            stock: stock ? parseInt(stock, 10) : 0,
            status: finalStatus as any,
            mockupImageUrl,
            mockupFileKey,
            backMockupImageUrl,
            backMockupFileKey,
            designId,
            artistId: user.id,
        });

        res.status(201).json({ status: "success", data: { product } });
    } catch (error: any) {
        console.error("Create product error:", error);
        if (error.message?.includes("not found") || error.message?.includes("does not belong")) {
            return res.status(404).json({ status: "fail", message: error.message });
        }
        res.status(500).json({ status: "fail", message: error.message || "Failed to create product" });
    }
};

// ---------- Public: Get all published products ----------
export const getProductsHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { category, sort, page, limit, search } = req.query;

        const result = await getPublishedProductsService({
            category: category as string,
            sort: sort as string,
            page: page ? parseInt(page as string, 10) : undefined,
            limit: limit ? parseInt(limit as string, 10) : undefined,
            search: search as string,
        });

        res.status(200).json({ status: "success", data: result });
    } catch (error) {
        next(error);
    }
};

// ---------- Public: Get product by ID ----------
export const getProductByIdHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { productId } = req.params;
        const product = await getProductByIdService(productId);

        res.status(200).json({ status: "success", data: { product } });
    } catch (error: any) {
        if (error.message === "Product not found") {
            return res.status(404).json({ status: "fail", message: error.message });
        }
        next(error);
    }
};

// ---------- Artist: Get my products ----------
export const getMyProductsHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const user = res.locals.user;
        const { status } = req.query;

        const products = await getProductsByArtistService(
            user.id,
            status as string
        );

        res.status(200).json({ status: "success", data: { products } });
    } catch (error) {
        next(error);
    }
};

// ---------- Artist: Update product ----------
export const updateProductHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const user = res.locals.user;
        const { id } = req.params;
        const { name, description, price, compareAtPrice, category, tshirtColor, stock } = req.body;

        const product = await updateProductService(id, user.id, {
            name,
            description,
            price: price !== undefined ? parseFloat(price) : undefined,
            compareAtPrice: compareAtPrice !== undefined ? parseFloat(compareAtPrice) : undefined,
            category,
            tshirtColor,
            stock: stock !== undefined ? parseInt(stock, 10) : undefined,
        });

        res.status(200).json({ status: "success", data: { product } });
    } catch (error: any) {
        if (error.message?.includes("not found") || error.message?.includes("does not belong")) {
            return res.status(404).json({ status: "fail", message: error.message });
        }
        next(error);
    }
};

// ---------- Artist: Delete/archive product ----------
export const deleteProductHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const user = res.locals.user;
        const { id } = req.params;

        await deleteProductService(id, user.id);

        res.status(200).json({ status: "success", message: "Product archived" });
    } catch (error: any) {
        if (error.message?.includes("not found") || error.message?.includes("does not belong")) {
            return res.status(404).json({ status: "fail", message: error.message });
        }
        next(error);
    }
};

// ---------- Artist: Publish a draft ----------
export const publishProductHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const user = res.locals.user;
        const { id } = req.params;

        const product = await publishProductService(id, user.id);

        res.status(200).json({ status: "success", data: { product } });
    } catch (error: any) {
        if (error.message?.includes("not found") || error.message?.includes("does not belong")) {
            return res.status(404).json({ status: "fail", message: error.message });
        }
        if (error.message?.includes("already published")) {
            return res.status(400).json({ status: "fail", message: error.message });
        }
        next(error);
    }
};

// ---------- Artist: Get dashboard stats ----------
export const getArtistStatsHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const user = res.locals.user;
        const stats = await getArtistStatsService(user.id);

        res.status(200).json({ status: "success", data: { stats } });
    } catch (error) {
        next(error);
    }
};

export const getArtistOrdersHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const user = res.locals.user;
        const orders = await getArtistOrdersService(user.id);
        res.status(200).json({ status: "success", data: { orders } });
    } catch (error) {
        next(error);
    }
};
