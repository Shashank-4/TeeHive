import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { nanoid } from "nanoid";
import { r2 } from "../util/s3";

const prisma = new PrismaClient();

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

        const category = await prisma.category.create({
            data: {
                name: name.toLowerCase().trim(),
                imageUrl
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
        const categories = await prisma.category.findMany({
            orderBy: { name: "asc" },
        });

        res.status(200).json({ status: "success", data: { categories } });
    } catch (error: any) {
        console.error("Error fetching categories:", error);
        res.status(500).json({ status: "error", message: "Failed to fetch categories" });
    }
};
