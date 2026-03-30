import { Request, Response, NextFunction } from "express";
import {
    createDesignService,
    getDesignsByArtistService,
    uploadDesignToR2Service,
    getDesignByIdService,
} from "../services/design.service";

export const uploadDesignHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const user = res.locals.user;
        const file = req.file;

        console.log("[Upload] Request received:", {
            hasFile: !!file,
            hasUser: !!user,
            body: req.body,
        });

        if (!file) {
            return res.status(400).json({
                status: "fail",
                message: "No file provided",
            });
        }

        const { title } = req.body;

        if (!title) {
            return res.status(400).json({
                status: "fail",
                message: "Design title is required",
            });
        }

        // Check Design Limits (Max 10 active designs)
        // Only count PENDING and APPROVED designs towards the limit
        const activeDesignsCount = await getDesignsByArtistService(user.id).then(
            designs => designs.filter(d => d.status !== "REJECTED").length
        );

        if (activeDesignsCount >= 10) {
            return res.status(403).json({
                status: "fail",
                message: "You have reached the maximum limit of 10 active designs allowed per artist."
            });
        }

        console.log("[Upload] Uploading to R2:", {
            fileName: file.originalname,
            fileSize: file.size,
            mimeType: file.mimetype,
            userId: user.id,
        });

        // Upload file to R2
        const { imageUrl, fileKey } = await uploadDesignToR2Service(
            file,
            user.id
        );

        console.log("[Upload] R2 upload successful:", { imageUrl, fileKey });

        // Save to database
        const newDesign = await createDesignService({
            title,
            imageUrl,
            fileKey,
            artistId: user.id,
            status: "PENDING", // All designs are now manually reviewed (Design Verification Model)
        });

        console.log("[Upload] Design saved to DB:", newDesign.id);

        res.status(201).json({
            status: "success",
            data: { design: newDesign },
        });
    } catch (err: any) {
        console.error("[Upload] Error:", err);

        res.status(500).json({
            status: "error",
            message: err.message || "Upload failed",
        });
    }
};

export const getMyDesignsHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const user = res.locals.user;
        const designs = await getDesignsByArtistService(user.id);
        res.status(200).json({
            status: "success",
            data: { designs },
        });
    } catch (err) {
        next(err);
    }
};

export const getDesignByIdHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { designId } = req.params;
        const user = res.locals.user;
        const design = await getDesignByIdService(designId, user.id);
        if (!design) {
            return res.status(404).json({
                status: "fail",
                message:
                    "Design not found or you do not have permission to view it.",
            });
        }

        res.status(200).json({
            status: "success",
            data: {
                design,
            },
        });
    } catch (err) {
        next(err);
    }
};

export const deleteDesignHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { designId } = req.params;
        const user = res.locals.user;
        const { PrismaClient } = await import("@prisma/client");
        const prisma = new PrismaClient();

        const design = await prisma.design.findUnique({
            where: { id: designId },
        });

        if (!design || design.artistId !== user.id) {
            return res.status(404).json({
                status: "fail",
                message: "Design not found or you do not have permission to delete it.",
            });
        }

        await prisma.design.update({
            where: { id: designId },
            data: { isDeleted: true },
        });

        res.status(200).json({
            status: "success",
            message: "Design deleted successfully.",
        });
    } catch (err) {
        next(err);
    }
};
