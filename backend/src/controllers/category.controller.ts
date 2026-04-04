import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { nanoid } from "nanoid";
import { r2 } from "../util/s3";

const prisma = new PrismaClient();

const CATEGORY_SORT_CONFIG_KEY = "category_sort_mode";

type CategorySortMode = "alphabetical" | "custom";

async function getCategorySortMode(): Promise<CategorySortMode> {
    const row = await prisma.siteConfig.findUnique({ where: { key: CATEGORY_SORT_CONFIG_KEY } });
    const v = row?.value as { mode?: string } | null;
    return v?.mode === "custom" ? "custom" : "alphabetical";
}

async function setCategorySortMode(mode: CategorySortMode) {
    await prisma.siteConfig.upsert({
        where: { key: CATEGORY_SORT_CONFIG_KEY },
        create: { key: CATEGORY_SORT_CONFIG_KEY, value: { mode } },
        update: { value: { mode } },
    });
}

const BUCKET_NAME = process.env.CLOUDFLARE_BUCKET_NAME!;
const PUBLIC_URL = process.env.CLOUDFLARE_PUBLIC_URL!;

const uploadImageToR2 = async (file: Express.Multer.File) => {
    if (!file.mimetype.startsWith("image/")) {
        throw new Error("Invalid file type. Only images are allowed.");
    }
    if (file.size > 5 * 1024 * 1024) {
        throw new Error("File too large. Maximum size is 5MB.");
    }

    const fileExtension = file.mimetype.split("/")[1] || "jpg";
    const timestamp = Date.now();
    const randomId = nanoid(10);
    const fileKey = `categories/${timestamp}-${randomId}.${fileExtension}`;

    const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: fileKey,
        Body: file.buffer,
        ContentType: file.mimetype,
    });

    await r2.send(command);

    return `${PUBLIC_URL}/${fileKey}`;
};

export const createCategoryHandler = async (req: Request, res: Response) => {
    try {
        const { name } = req.body;

        if (!name || typeof name !== "string") {
            return res.status(400).json({ status: "fail", message: "Category name is required" });
        }

        let imageUrl = null;
        if (req.file) {
            imageUrl = await uploadImageToR2(req.file);
        }

        const maxRow = await prisma.category.aggregate({ _max: { sortOrder: true } });
        const nextOrder = (maxRow._max.sortOrder ?? -1) + 1;

        const category = await prisma.category.create({
            data: {
                name: name.toLowerCase().trim(),
                imageUrl,
                sortOrder: nextOrder,
            },
        });

        res.status(201).json({ status: "success", data: { category } });
    } catch (error: any) {
        if (error.code === "P2002") {
            return res.status(409).json({ status: "fail", message: "Category already exists" });
        }
        console.error("Error creating category:", error);
        res.status(500).json({ status: "error", message: "Failed to create category" });
    }
};

export const updateCategoryHandler = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name } = req.body;

        const existingCategory = await prisma.category.findUnique({ where: { id } });
        if (!existingCategory) {
            return res.status(404).json({ status: "fail", message: "Category not found" });
        }

        let imageUrl = existingCategory.imageUrl;
        if (req.file) {
            // We could optionally delete the old image here if we stored the fileKey
            imageUrl = await uploadImageToR2(req.file);
        }

        const updateData: any = {};
        if (name && typeof name === "string") {
            updateData.name = name.toLowerCase().trim();
        }
        if (imageUrl !== existingCategory.imageUrl) {
            updateData.imageUrl = imageUrl;
        }

        const category = await prisma.category.update({
            where: { id },
            data: updateData,
        });

        res.status(200).json({ status: "success", data: { category } });
    } catch (error: any) {
        if (error.code === "P2002") {
            return res.status(409).json({ status: "fail", message: "Category name already exists" });
        }
        console.error("Error updating category:", error);
        res.status(500).json({ status: "error", message: error.message || "Failed to update category" });
    }
};

export const deleteCategoryHandler = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        await prisma.category.delete({
            where: { id },
        });

        res.status(200).json({ status: "success", message: "Category deleted successfully" });
    } catch (error: any) {
        console.error("Error deleting category:", error);
        res.status(500).json({ status: "error", message: "Failed to delete category" });
    }
};

export const getCategoriesHandler = async (req: Request, res: Response) => {
    try {
        const mode = await getCategorySortMode();
        const categories = await prisma.category.findMany({
            orderBy:
                mode === "custom"
                    ? [{ sortOrder: "asc" }, { name: "asc" }]
                    : { name: "asc" },
        });

        res.status(200).json({
            status: "success",
            data: { categories, categorySortMode: mode },
        });
    } catch (error: any) {
        console.error("Error fetching categories:", error);
        res.status(500).json({ status: "error", message: "Failed to fetch categories" });
    }
};

export const updateCategorySortModeHandler = async (req: Request, res: Response) => {
    try {
        const { mode } = req.body as { mode?: string };
        if (mode !== "alphabetical" && mode !== "custom") {
            return res.status(400).json({ status: "fail", message: "mode must be alphabetical or custom" });
        }

        const previous = await getCategorySortMode();

        if (mode === "custom" && previous === "alphabetical") {
            const all = await prisma.category.findMany({ orderBy: { name: "asc" } });
            await prisma.$transaction(
                all.map((c, i) =>
                    prisma.category.update({ where: { id: c.id }, data: { sortOrder: i } })
                )
            );
        }

        await setCategorySortMode(mode);

        const categories = await prisma.category.findMany({
            orderBy:
                mode === "custom"
                    ? [{ sortOrder: "asc" }, { name: "asc" }]
                    : { name: "asc" },
        });

        res.status(200).json({
            status: "success",
            data: { categorySortMode: mode, categories },
        });
    } catch (error: any) {
        console.error("Error updating category sort mode:", error);
        res.status(500).json({ status: "error", message: "Failed to update category sort mode" });
    }
};

export const reorderCategoriesHandler = async (req: Request, res: Response) => {
    try {
        const { orderedIds } = req.body as { orderedIds?: string[] };
        if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
            return res.status(400).json({ status: "fail", message: "orderedIds (non-empty string[]) is required" });
        }

        const all = await prisma.category.findMany({ select: { id: true } });
        if (orderedIds.length !== all.length) {
            return res.status(400).json({
                status: "fail",
                message: "orderedIds must include every category exactly once",
            });
        }
        const idSet = new Set(all.map((a) => a.id));
        if (new Set(orderedIds).size !== orderedIds.length) {
            return res.status(400).json({ status: "fail", message: "orderedIds must not contain duplicates" });
        }
        for (const id of orderedIds) {
            if (!idSet.has(id)) {
                return res.status(400).json({ status: "fail", message: "Invalid category id in orderedIds" });
            }
        }

        await prisma.$transaction(
            orderedIds.map((id, i) =>
                prisma.category.update({ where: { id }, data: { sortOrder: i } })
            )
        );
        await setCategorySortMode("custom");

        const categories = await prisma.category.findMany({
            orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        });

        res.status(200).json({
            status: "success",
            data: { categories, categorySortMode: "custom" as const },
        });
    } catch (error: any) {
        console.error("Error reordering categories:", error);
        res.status(500).json({ status: "error", message: "Failed to reorder categories" });
    }
};
