import { Request, Response, NextFunction } from "express";
import {
    listAdminArtistPayoutMethodsService,
    listArtistPayoutMethodsService,
    saveArtistPayoutMethodsService,
} from "../services/artistPayout.service";

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
            message: "Payout methods saved successfully.",
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

