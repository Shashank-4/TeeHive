import { Request, Response, NextFunction } from "express";
import {
    listAdminArtistPayoutMethodsService,
    listAdminArtistSettlementsService,
    listAdminAllSettlementsService,
    listArtistPayoutMethodsService,
    listArtistSettlementsService,
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

export const getArtistSettlementsHandler = async (
    _req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const artistId = res.locals.user.id;
        const settlements = await listArtistSettlementsService(artistId);
        res.status(200).json({ status: "success", data: { settlements } });
    } catch (error) {
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

export const getAdminArtistSettlementsHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const settlements = await listAdminArtistSettlementsService(req.params.id);
        res.status(200).json({ status: "success", data: { settlements } });
    } catch (error: any) {
        if (error?.message === "Artist not found") {
            return res.status(404).json({ status: "fail", message: error.message });
        }
        next(error);
    }
};

export const getAdminSettlementsHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const q = req.query;
        const limitRaw = q.limit ? Number(q.limit) : undefined;
        const settlements = await listAdminAllSettlementsService({
            artistId: typeof q.artistId === "string" ? q.artistId : undefined,
            status: typeof q.status === "string" ? q.status : undefined,
            from: typeof q.from === "string" ? q.from : undefined,
            to: typeof q.to === "string" ? q.to : undefined,
            limit: Number.isFinite(limitRaw) ? limitRaw : undefined,
        });
        res.status(200).json({ status: "success", data: { settlements } });
    } catch (error: any) {
        if (error?.message === "Invalid from date" || error?.message === "Invalid to date") {
            return res.status(400).json({ status: "fail", message: error.message });
        }
        next(error);
    }
};

