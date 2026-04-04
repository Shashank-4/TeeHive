import { Request, Response, NextFunction } from "express";
import {
    getArtistProfileService,
    updateArtistProfileService,
    submitForVerificationService,
} from "../services/artistProfile.service";
import { sendArtistApprovalEmail } from "../services/email.service";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const DEFAULT_ARTIST_DASHBOARD_CONFIG = {
    showAnnouncement: true,
    announcementText:
        "Welcome to TeeHive! Upload at least 3 designs to submit your profile for verification and start selling.",
};

/**
 * GET /api/artist/profile — Get the current artist's profile
 */
export const getArtistProfileHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = res.locals.user.id;
        const profile = await getArtistProfileService(userId);

        res.status(200).json({
            status: "success",
            data: { profile },
        });
    } catch (err: any) {
        next(err);
    }
};

/**
 * PUT /api/artist/profile — Update the artist's profile
 * Accepts multipart form with optional displayPhoto and coverPhoto files.
 */
export const updateArtistProfileHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = res.locals.user.id;
        const {
            displayName,
            bio,
            portfolioUrl,
            instagramUrl,
            twitterUrl,
            behanceUrl,
            dribbbleUrl,
        } = req.body;

        const files = req.files as {
            [fieldname: string]: Express.Multer.File[];
        };
        const displayPhoto = files?.displayPhoto?.[0];
        const coverPhoto = files?.coverPhoto?.[0];

        const profile = await updateArtistProfileService(
            userId,
            {
                displayName,
                bio,
                portfolioUrl,
                instagramUrl,
                twitterUrl,
                behanceUrl,
                dribbbleUrl,
            },
            displayPhoto,
            coverPhoto
        );

        res.status(200).json({
            status: "success",
            data: { profile },
        });
    } catch (err: any) {
        if (err.message.includes("Invalid file type") || err.message.includes("File too large")) {
            return res.status(400).json({ status: "fail", message: err.message });
        }
        next(err);
    }
};

/**
 * POST /api/artist/submit-verification — Submit profile for admin review
 */
export const submitVerificationHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = res.locals.user.id;
        const profile = await submitForVerificationService(userId);

        res.status(200).json({
            status: "success",
            message: "Your profile has been submitted for verification",
            data: { profile },
        });
    } catch (err: any) {
        if (
            err.message.includes("at least 3 designs") ||
            err.message.includes("complete your profile") ||
            err.message.includes("already verified") ||
            err.message.includes("already under review")
        ) {
            return res.status(400).json({ status: "fail", message: err.message });
        }
        next(err);
    }
};

/**
 * PATCH /api/artist/profile — Partially update profile (JSON body, no file uploads)
 * Used for saving lightweight non-file profile fields
 */
export const patchArtistProfileHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = res.locals.user.id;
        const { payoutDetails, ...rest } = req.body;

        const updateData: any = { ...rest };
        if (payoutDetails !== undefined) {
            updateData.payoutDetails = payoutDetails;
        }

        const { PrismaClient } = await import("@prisma/client");
        const prisma = new PrismaClient();
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: updateData,
        });

        const { password, ...profile } = updatedUser;
        res.status(200).json({ status: "success", data: { profile } });
    } catch (err: any) {
        next(err);
    }
};

/**
 * GET /api/artist/dashboard — Fetch artist dashboard config
 * Falls back to sane defaults when config key is not seeded.
 */
export const getArtistDashboardConfigHandler = async (
    _req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const config = await prisma.siteConfig.findUnique({
            where: { key: "artist_dashboard" },
        });

        res.status(200).json({
            status: "success",
            data: {
                config: {
                    ...DEFAULT_ARTIST_DASHBOARD_CONFIG,
                    ...(config?.value as Record<string, unknown> | null),
                },
            },
        });
    } catch (err) {
        next(err);
    }
};
