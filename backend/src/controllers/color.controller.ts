import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
const prisma = new PrismaClient();

const r2 = new S3Client({
    region: "auto",
    endpoint: process.env.CLOUDFLARE_ENDPOINT!,
    credentials: {
        accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID!,
        secretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY!,
    },
});

export const getColorsHandler = async (req: Request, res: Response) => {
    try {
        const colors = await prisma.globalColor.findMany({
            orderBy: { name: "asc" }
        });
        
        res.status(200).json({
            status: "success",
            data: { colors }
        });
    } catch (err) {
        console.error("Fetch Colors Error:", err);
        res.status(500).json({ status: "error", message: "Failed to fetch colors" });
    }
};

export const createColorHandler = async (req: Request, res: Response) => {
    try {
        const { name, hex } = req.body;

        if (!name || !hex) {
            return res.status(400).json({ status: "error", message: "Name and Hex are required" });
        }

        if (!req.file) {
            return res.status(400).json({ status: "error", message: "A mockup file is required" });
        }

        const fileKey = `colors/${crypto.randomBytes(16).toString("hex")}-${req.file.originalname.replace(/\s+/g, '-')}`;

        await r2.send(
            new PutObjectCommand({
                Bucket: process.env.CLOUDFLARE_BUCKET_NAME,
                Key: fileKey,
                Body: req.file.buffer,
                ContentType: req.file.mimetype,
            })
        );

        const mockupUrl = `${process.env.CLOUDFLARE_PUBLIC_URL}/${fileKey}`;

        const color = await prisma.globalColor.create({
            data: {
                name,
                hex,
                mockupUrl,
                fileKey
            }
        });

        res.status(201).json({
            status: "success",
            data: { color }
        });
    } catch (err: any) {
        console.error("Create Color Error:", err);
        // Clean up R2 file if upload succeeded but DB failed? (Optional precision step)
        if (err?.code === 'P2002') {
            return res.status(400).json({ status: "error", message: "A color with that name already exists" });
        }
        res.status(500).json({ status: "error", message: "Failed to create color" });
    }
};

export const deleteColorHandler = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const color = await prisma.globalColor.findUnique({ where: { id } });
        if (!color) return res.status(404).json({ status: "error", message: "Color not found" });

        // Warning: This physically deletes the asset. In real applications global assets are rarely deleted, but for management it's good to have.
        // It's allowed for Admin configurations, but be careful if products depend on it.
        await r2.send(
            new DeleteObjectCommand({
                Bucket: process.env.CLOUDFLARE_BUCKET_NAME,
                Key: color.fileKey,
            })
        );

        await prisma.globalColor.delete({ where: { id } });

        res.status(200).json({
            status: "success",
            message: "Color successfully deleted",
        });
    } catch (err) {
        console.error("Delete Color Error:", err);
        res.status(500).json({ status: "error", message: "Failed to delete color" });
    }
};
