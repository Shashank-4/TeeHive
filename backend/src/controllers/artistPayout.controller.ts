import { Request, Response, NextFunction } from "express";
import {
    listAdminArtistPayoutMethodsService,
    listArtistPayoutMethodsService,
    reviewArtistPayoutMethodService,
    saveArtistPayoutMethodsService,
} from "../services/artistPayout.service";
import { PayoutReviewAction } from "@prisma/client";

export const getArtistPayoutMethodsHandler = async (
    _req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const artistId = res.locals.user.id;
        const payload = await listArtistPayoutMethodsService(artistId);
        res.status(200).json({ status: "success", data: payload });
    } catch (error) {
        next(error);
    }
};

export const saveArtistPayoutMethodsHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const artistId = res.locals.user.id;
        const payload = await saveArtistPayoutMethodsService(artistId, req.body || {});
        res.status(200).json({
            status: "success",
            message: "Payout methods saved and submitted for review.",
            data: payload,
        });
    } catch (error: any) {
        if (
            error?.message?.includes("valid") ||
            error?.message?.includes("required") ||
            error?.message?.includes("configured") ||
            error?.message?.includes("Add at least one") ||
            error?.message?.includes("Razorpay")
        ) {
            return res.status(400).json({ status: "fail", message: error.message });
        }
        next(error);
    }
};

export const getAdminArtistPayoutMethodsHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const payload = await listAdminArtistPayoutMethodsService(req.params.id);
        res.status(200).json({ status: "success", data: payload });
    } catch (error: any) {
        if (error?.message === "Artist not found") {
            return res.status(404).json({ status: "fail", message: error.message });
        }
        next(error);
    }
};

export const reviewArtistPayoutMethodHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { id, payoutMethodId } = req.params;
        const { action, note } = req.body as {
            action?: PayoutReviewAction;
            note?: string;
        };

        if (!action || !["APPROVED", "REJECTED", "REQUIRES_RESUBMISSION"].includes(action)) {
            return res.status(400).json({
                status: "fail",
                message: "A valid review action is required.",
            });
        }

        const method = await reviewArtistPayoutMethodService({
            artistId: id,
            payoutMethodId,
            reviewerAdminId: res.locals.user.id,
            action,
            note,
        });

        res.status(200).json({
            status: "success",
            message: "Payout method review recorded.",
            data: { method },
        });
    } catch (error: any) {
        if (
            error?.message === "Payout method not found" ||
            error?.message?.includes("review note is required")
        ) {
            return res.status(400).json({ status: "fail", message: error.message });
        }
        next(error);
    }
};
