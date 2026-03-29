import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { uploadSiteAssetToR2 } from "../services/product.service";

const prisma = new PrismaClient();

// Get config by key (Public router, can access config values)
export const getConfigHandler = async (req: Request, res: Response) => {
    try {
        const { key } = req.params;

        const config = await prisma.siteConfig.findUnique({
            where: { key },
        });

        if (!config) {
            return res.status(404).json({
                status: "fail",
                message: `Config for key '${key}' not found`,
            });
        }

        res.status(200).json({
            status: "success",
            data: { config: config.value },
        });
    } catch (error: any) {
        console.error("Error fetching config:", error);
        res.status(500).json({ status: "error", message: "Failed to fetch configuration" });
    }
};

// Set config by key (Admin only)
export const setConfigHandler = async (req: Request, res: Response) => {
    try {
        const { key } = req.params;
        const configValue = req.body.value;

        if (!configValue) {
            return res.status(400).json({
                status: "fail",
                message: "A values object is required to set configuration",
            });
        }

        const config = await prisma.siteConfig.upsert({
            where: { key },
            update: { value: configValue },
            create: { key, value: configValue },
        });

        res.status(200).json({
            status: "success",
            data: { config: config.value },
        });
    } catch (error: any) {
        console.error("Error setting config:", error);
        res.status(500).json({ status: "error", message: "Failed to set configuration" });
    }
};

export const uploadConfigAssetHandler = async (req: Request, res: Response) => {
    try {
        const file = req.file;
        if (!file) {
            return res.status(400).json({ status: "fail", message: "No file provided" });
        }

        const { assetUrl } = await uploadSiteAssetToR2(file);

        res.status(200).json({
            status: "success",
            data: { url: assetUrl },
        });
    } catch (error: any) {
        console.error("Error uploading config asset:", error);
        res.status(500).json({ status: "error", message: "Failed to upload asset" });
    }
};
