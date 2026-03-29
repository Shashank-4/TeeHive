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

const BUCKET = process.env.CLOUDFLARE_BUCKET_NAME!;
const PUBLIC_URL = process.env.CLOUDFLARE_PUBLIC_URL!;

// Helper: upload a single buffer to R2, returns { url, key }
const uploadToR2 = async (file: Express.Multer.File, prefix: string) => {
    const fileKey = `${prefix}/${crypto.randomBytes(16).toString("hex")}-${file.originalname.replace(/\s+/g, "-")}`;

    await r2.send(
        new PutObjectCommand({
            Bucket: BUCKET,
            Key: fileKey,
            Body: file.buffer,
            ContentType: file.mimetype,
        })
    );

    return { url: `${PUBLIC_URL}/${fileKey}`, key: fileKey };
};

// Helper: delete a key from R2
const deleteFromR2 = async (fileKey: string) => {
    try {
        await r2.send(
            new DeleteObjectCommand({
                Bucket: BUCKET,
                Key: fileKey,
            })
        );
    } catch (err) {
        console.error(`[R2] Failed to delete ${fileKey}:`, err);
    }
};

// ── GET /api/colors ──
export const getColorsHandler = async (req: Request, res: Response) => {
    try {
        const colors = await prisma.globalColor.findMany({
            orderBy: { name: "asc" },
        });

        res.status(200).json({
            status: "success",
            data: { colors },
        });
    } catch (err) {
        console.error("Fetch Colors Error:", err);
        res.status(500).json({ status: "error", message: "Failed to fetch colors" });
    }
};

// ── POST /api/colors ──
// Expects multipart with fields: name, hex
// File fields: mockup (required), shadowMap (optional), displacementMap (optional)
export const createColorHandler = async (req: Request, res: Response) => {
    try {
        const { name, hex } = req.body;

        if (!name || !hex) {
            return res.status(400).json({ status: "error", message: "Name and Hex are required" });
        }

        const files = req.files as { [fieldname: string]: Express.Multer.File[] };
        const mockupFile = files?.["mockup"]?.[0];

        if (!mockupFile) {
            return res.status(400).json({ status: "error", message: "A base mockup file is required" });
        }

        // Upload base mockup (required)
        const base = await uploadToR2(mockupFile, "colors");

        // Upload shadow map (optional)
        let shadowMapUrl: string | undefined;
        let shadowMapKey: string | undefined;
        const shadowFile = files?.["shadowMap"]?.[0];
        if (shadowFile) {
            const shadow = await uploadToR2(shadowFile, "colors/shadows");
            shadowMapUrl = shadow.url;
            shadowMapKey = shadow.key;
        }

        // Upload displacement map (optional)
        let displacementMapUrl: string | undefined;
        let displacementMapKey: string | undefined;
        const displacementFile = files?.["displacementMap"]?.[0];
        if (displacementFile) {
            const displacement = await uploadToR2(displacementFile, "colors/displacement");
            displacementMapUrl = displacement.url;
            displacementMapKey = displacement.key;
        }

        const color = await prisma.globalColor.create({
            data: {
                name,
                hex,
                mockupUrl: base.url,
                fileKey: base.key,
                shadowMapUrl,
                shadowMapKey,
                displacementMapUrl,
                displacementMapKey,
            },
        });

        res.status(201).json({
            status: "success",
            data: { color },
        });
    } catch (err: any) {
        console.error("Create Color Error:", err);
        if (err?.code === "P2002") {
            return res.status(400).json({ status: "error", message: "A color with that name already exists" });
        }
        res.status(500).json({ status: "error", message: "Failed to create color" });
    }
};

// ── DELETE /api/colors/:id ──
export const deleteColorHandler = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const color = await prisma.globalColor.findUnique({ where: { id } });
        if (!color) return res.status(404).json({ status: "error", message: "Color not found" });

        // Delete all R2 assets
        await deleteFromR2(color.fileKey);
        if (color.shadowMapKey) await deleteFromR2(color.shadowMapKey);
        if (color.displacementMapKey) await deleteFromR2(color.displacementMapKey);

        await prisma.globalColor.delete({ where: { id } });

        res.status(200).json({
            status: "success",
            message: "Color and all associated assets deleted",
        });
    } catch (err) {
        console.error("Delete Color Error:", err);
        res.status(500).json({ status: "error", message: "Failed to delete color" });
    }
};
