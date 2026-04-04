import { Request, Response, NextFunction } from "express";
import { PrismaClient, Prisma } from "@prisma/client";
import {
    createProductService,
    getArtistDraftProductByIdService,
    getProductByIdService,
    getPublishedProductsService,
    getProductsByArtistService,
    updateProductService,
    deleteProductService,
    publishProductService,
    getArtistStatsService,
    getArtistOrdersService,
    uploadMockupToR2,
    getDefaultProductStock,
} from "../services/product.service";
import { renderProductionMockup } from "../services/mockup.service";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import crypto from "crypto";

const prisma = new PrismaClient();

function hexKeyFromUploadSlug(slug: string): string {
    const s = String(slug || "")
        .trim()
        .replace(/^#/, "")
        .toLowerCase()
        .replace(/[^0-9a-f]/g, "");
    return s ? `#${s}` : "#";
}

function parseStringArrayField(value: unknown, fallback: string[] = []): string[] {
    if (!value) return fallback;
    try {
        const parsed = typeof value === "string" ? JSON.parse(value) : value;
        return Array.isArray(parsed) ? parsed.map((item) => String(item || "").trim()).filter(Boolean) : fallback;
    } catch {
        return fallback;
    }
}

function parseTagsField(value: unknown): string[] {
    return Array.from(
        new Set(
            parseStringArrayField(value, [])
                .map((tag) => tag.toLowerCase())
                .filter(Boolean)
        )
    );
}

function parseDraftEditorState(value: unknown): Prisma.InputJsonValue | undefined {
    if (!value) return undefined;
    try {
        const parsed = typeof value === "string" ? JSON.parse(value) : value;
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
            return undefined;
        }
        return JSON.parse(JSON.stringify(parsed)) as Prisma.InputJsonValue;
    } catch {
        return undefined;
    }
}

async function buildCreatorProductInput(
    body: Record<string, any>,
    fileList: Express.Multer.File[],
    existingStock?: number
) {
    const pick = (field: string) => fileList.find((file) => file.fieldname === field);
    const mockupFile = pick("mockupImage");
    const backMockupFile = pick("backMockupImage");

    if (!mockupFile) {
        throw new Error("Front mockup image is required");
    }

    const {
        name,
        description,
        price,
        compareAtPrice,
        categories,
        tshirtColor,
        availableColors,
        primaryColor,
        primaryView,
        stock,
        status,
        designId,
        tags,
        draftEditorState,
    } = body;

    if (!name || !price || !tshirtColor || !designId) {
        throw new Error("name, price, tshirtColor, and designId are required");
    }

    const parsedTags = parseTagsField(tags);
    if (parsedTags.length > 5) {
        throw new Error("A maximum of 5 tags is allowed per product");
    }

    const parsedCategories = parseStringArrayField(categories, []);
    const parsedAvailableColors = parseStringArrayField(availableColors, [tshirtColor]);
    const finalStatus = status === "PUBLISHED" ? "PUBLISHED" : "DRAFT";

    const { mockupImageUrl, mockupFileKey } = await uploadMockupToR2(mockupFile);

    let backMockupImageUrl: string | undefined;
    let backMockupFileKey: string | undefined;
    if (backMockupFile) {
        const uploadedBack = await uploadMockupToR2(backMockupFile);
        backMockupImageUrl = uploadedBack.mockupImageUrl;
        backMockupFileKey = uploadedBack.mockupFileKey;
    }

    const hadPerColorUploads = fileList.some((file) => /^c(front|back)_/.test(file.fieldname));
    const colorMockups: Record<string, { front?: string; back?: string }> = {};
    const allowedHex = new Set(parsedAvailableColors.map((hex) => hexKeyFromUploadSlug(String(hex))));

    for (const file of fileList) {
        const frontMatch = /^cfront_(.+)$/.exec(file.fieldname);
        const backMatch = /^cback_(.+)$/.exec(file.fieldname);
        if (frontMatch) {
            const key = hexKeyFromUploadSlug(frontMatch[1]);
            if (!allowedHex.has(key)) continue;
            const { mockupImageUrl: url } = await uploadMockupToR2(file);
            colorMockups[key] = { ...colorMockups[key], front: url };
        } else if (backMatch) {
            const key = hexKeyFromUploadSlug(backMatch[1]);
            if (!allowedHex.has(key)) continue;
            const { mockupImageUrl: url } = await uploadMockupToR2(file);
            colorMockups[key] = { ...colorMockups[key], back: url };
        }
    }

    const primaryHex = hexKeyFromUploadSlug(String(primaryColor || tshirtColor));
    if (!colorMockups[primaryHex]?.front) {
        colorMockups[primaryHex] = {
            ...colorMockups[primaryHex],
            front: mockupImageUrl,
            ...(backMockupImageUrl ? { back: backMockupImageUrl } : {}),
        };
    }

    const colorMockupsFinal: Record<string, { front: string; back?: string }> = {};
    for (const hex of allowedHex) {
        const entry = colorMockups[hex];
        if (entry?.front) {
            colorMockupsFinal[hex] = {
                front: entry.front,
                ...(entry.back ? { back: entry.back } : {}),
            };
        }
    }

    let stockNum =
        stock !== undefined && String(stock).trim() !== ""
            ? parseInt(String(stock), 10)
            : NaN;
    if (!Number.isFinite(stockNum) || stockNum < 0) {
        stockNum = typeof existingStock === "number" ? existingStock : await getDefaultProductStock();
    }

    return {
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
        stock: stockNum,
        status: finalStatus as any,
        mockupImageUrl,
        mockupFileKey,
        backMockupImageUrl,
        backMockupFileKey,
        colorMockups:
            hadPerColorUploads && Object.keys(colorMockupsFinal).length > 0
                ? colorMockupsFinal
                : undefined,
        draftEditorState: parseDraftEditorState(draftEditorState),
        designId,
    };
}

const r2 = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID!,
        secretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY!,
    },
});

// ---------- Artist: Create product ----------
export const createProductHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const user = res.locals.user;
        const fileList: Express.Multer.File[] = Array.isArray(req.files)
            ? (req.files as Express.Multer.File[])
            : [];
        const creatorInput = await buildCreatorProductInput(req.body || {}, fileList);

        const product = await createProductService({
            ...creatorInput,
            artistId: user.id,
        });

        res.status(201).json({ status: "success", data: { product } });

        // ── Background: Render production-quality mockup using Sharp engine ──
        // Disabled by default because it re-composites the design using a fixed
        // print-area (ignoring the artist's exact placement on the editor),
        // which causes the "design moves after reload" issue.
        const ENABLE_PRODUCTION_RENDER =
            process.env.ENABLE_PRODUCTION_RENDER === "true";

        if (ENABLE_PRODUCTION_RENDER) {
        (async () => {
            try {
                // Find the global color matching the primary color
                const globalColor = await prisma.globalColor.findFirst({
                    where: { hex: { equals: creatorInput.primaryColor || creatorInput.tshirtColor, mode: "insensitive" } },
                });

                if (!globalColor) {
                    console.log("[ProductionRender] No matching global color found, skipping production render");
                    return;
                }

                // Find the design image URL
                const design = await prisma.design.findUnique({ where: { id: creatorInput.designId } });
                if (!design) return;

                // Determine if shirt is dark for shadow blend mode
                const hex = globalColor.hex.replace("#", "");
                const r = parseInt(hex.substring(0, 2), 16);
                const g = parseInt(hex.substring(2, 4), 16);
                const b = parseInt(hex.substring(4, 6), 16);
                const isDark = (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.5;

                // High-res print area (scaled for production base images ~1024px)
                const productionPrintArea = { x: 330, y: 400, width: 346, height: 440 };

                const productionBuffer = await renderProductionMockup({
                    baseImageUrl: globalColor.mockupUrl,
                    designImageUrl: design.imageUrl,
                    shadowMapUrl: globalColor.shadowMapUrl || undefined,
                    displacementMapUrl: globalColor.displacementMapUrl || undefined,
                    displacementStrength: 8,
                    printArea: productionPrintArea,
                    isDark,
                });

                // Upload production mockup to R2
                const prodKey = `mockups/prod-${crypto.randomUUID()}.png`;
                await r2.send(
                    new PutObjectCommand({
                        Bucket: process.env.CLOUDFLARE_BUCKET_NAME!,
                        Key: prodKey,
                        Body: productionBuffer,
                        ContentType: "image/png",
                    })
                );

                const prodUrl = `${process.env.CLOUDFLARE_PUBLIC_URL}/${prodKey}`;

                // Update the product with the production mockup
                await prisma.product.update({
                    where: { id: product.id },
                    data: { mockupImageUrl: prodUrl },
                });

                console.log(`[ProductionRender] ✓ Product ${product.id} updated with production mockup`);
            } catch (err) {
                console.error(`[ProductionRender] Background render failed for product ${product.id}:`, err);
                // Non-fatal — the canvas screenshot is still saved as fallback
            }
        })();
        }
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
        const { category, sort, page, limit, search, latestDrops: latestDropsQ } = req.query;
        const latestDropsRaw = Array.isArray(latestDropsQ) ? latestDropsQ[0] : latestDropsQ;
        const latestDrops =
            latestDropsRaw === "true" || latestDropsRaw === "1" || latestDropsRaw === "yes";

        const result = await getPublishedProductsService({
            category: category as string,
            sort: sort as string,
            page: page ? parseInt(page as string, 10) : undefined,
            limit: limit ? parseInt(limit as string, 10) : undefined,
            search: search as string,
            latestDrops,
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

export const getArtistDraftProductHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const user = res.locals.user;
        const { id } = req.params;
        const product = await getArtistDraftProductByIdService(id, user.id);

        if (product.status !== "DRAFT") {
            return res.status(400).json({
                status: "fail",
                message: "Only draft products can be reopened in the mockup editor.",
            });
        }

        res.status(200).json({ status: "success", data: { product } });
    } catch (error: any) {
        if (error.message?.includes("not found") || error.message?.includes("does not belong")) {
            return res.status(404).json({ status: "fail", message: error.message });
        }
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
        const existingProduct = await getArtistDraftProductByIdService(id, user.id);

        let product;
        const fileList: Express.Multer.File[] = Array.isArray(req.files)
            ? (req.files as Express.Multer.File[])
            : [];

        if (fileList.length > 0 || req.body?.draftEditorState) {
            const creatorInput = await buildCreatorProductInput(
                req.body || {},
                fileList,
                existingProduct.stock
            );
            product = await updateProductService(id, user.id, creatorInput);
        } else {
            const { name, description, price, compareAtPrice, category, tshirtColor, stock } = req.body;
            product = await updateProductService(id, user.id, {
                name,
                description,
                price: price !== undefined ? parseFloat(price) : undefined,
                compareAtPrice: compareAtPrice !== undefined ? parseFloat(compareAtPrice) : undefined,
                category,
                tshirtColor,
                stock: stock !== undefined ? parseInt(stock, 10) : undefined,
            });
        }

        res.status(200).json({ status: "success", data: { product } });
    } catch (error: any) {
        if (error.message?.includes("not found") || error.message?.includes("does not belong")) {
            return res.status(404).json({ status: "fail", message: error.message });
        }
        if (error.message?.includes("required") || error.message?.includes("maximum")) {
            return res.status(400).json({ status: "fail", message: error.message });
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
