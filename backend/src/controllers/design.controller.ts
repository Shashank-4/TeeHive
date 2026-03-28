// backend/controllers/design.controller.ts (FIXED)

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

        // Check Design Limits
        const existingDesignsCount = await getDesignsByArtistService(user.id).then(designs => designs.length);
        const isVerified = user.verificationStatus === "VERIFIED";

        if (!isVerified && existingDesignsCount >= 3) {
            return res.status(403).json({
                status: "fail",
                message: "Unverified artists can only upload a maximum of 3 designs. Please submit your profile for verification."
            });
        }

        if (isVerified && existingDesignsCount >= 10) {
            return res.status(403).json({
                status: "fail",
                message: "You have reached the maximum limit of 10 designs allowed per artist."
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
            status: isVerified ? "APPROVED" : "PENDING",
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
