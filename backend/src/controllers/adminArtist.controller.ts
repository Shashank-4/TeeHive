import { Request, Response, NextFunction } from "express";
import {
    listArtistsService,
    getArtistDetailService,
    verifyArtistService,
    rejectDesignService,
} from "../services/adminArtist.service";
import { sendArtistRejectionEmail } from "../services/email.service";

/**
 * GET /api/admin/artists — List artists with optional status filter
 */
export const listArtistsHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { status, page, limit, search } = req.query;
        const result = await listArtistsService({
            status: status as any,
            page: page ? parseInt(page as string, 10) : undefined,
            limit: limit ? parseInt(limit as string, 10) : undefined,
            search: search as string,
        });

        res.status(200).json({
            status: "success",
            data: result,
        });
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/admin/artists/:id — Get detailed artist profile + designs
 */
export const getArtistDetailHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { id } = req.params;
        const artist = await getArtistDetailService(id);

        res.status(200).json({
            status: "success",
            data: { artist },
        });
    } catch (err: any) {
        if (err.message === "Artist not found") {
            return res.status(404).json({ status: "fail", message: err.message });
        }
        next(err);
    }
};

/**
 * PATCH /api/admin/artists/:id/verify — Approve or reject an artist
 */
export const verifyArtistHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { id } = req.params;
        const { action, reason, canResubmitVerification } = req.body;

        if (!action || !["APPROVE", "REJECT"].includes(action)) {
            return res.status(400).json({
                status: "fail",
                message: "Invalid action. Must be APPROVE or REJECT",
            });
        }

        const profile = await verifyArtistService(id, action, reason, canResubmitVerification);

        // Artist welcome is sent on signup (OTP / Google), not on admin profile actions.
        if (action === "REJECT" && reason) {
            await sendArtistRejectionEmail(profile.email, profile.name, reason);
        }

        res.status(200).json({
            status: "success",
            message: action === "APPROVE"
                ? "Artist has been verified"
                : "Artist has been rejected",
            data: { profile },
        });
    } catch (err: any) {
        if (err.message.includes("not found") || err.message.includes("required")) {
            return res.status(400).json({ status: "fail", message: err.message });
        }
        next(err);
    }
};

/**
 * PATCH /api/admin/artists/:id/resubmit — Toggle ability to resubmit verification
 */
export const toggleResubmissionHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { id } = req.params;
        const { canResubmit } = req.body;

        if (typeof canResubmit !== "boolean") {
            return res.status(400).json({
                status: "fail",
                message: "canResubmit must be a boolean",
            });
        }

        const profile = await import("../services/adminArtist.service").then(m => m.toggleResubmissionService(id, canResubmit));

        res.status(200).json({
            status: "success",
            message: `Artist resubmission ${canResubmit ? 'enabled' : 'disabled'}`,
            data: { profile },
        });
    } catch (err: any) {
        if (err.message === "Artist not found") {
            return res.status(404).json({ status: "fail", message: err.message });
        }
        next(err);
    }
};

/**
 * PATCH /api/admin/designs/:id/reject — Manually reject a design
 */
export const rejectDesignHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        if (!reason) {
            return res.status(400).json({
                status: "fail",
                message: "A rejection reason is required",
            });
        }

        const design = await rejectDesignService(id, reason);

        if (design.artist && design.artist.email) {
            await sendArtistRejectionEmail(
                design.artist.email, 
                design.artist.displayName || design.artist.name, 
                reason
            ).catch(err => console.error("Error sending design rejection email:", err));
        }

        res.status(200).json({
            status: "success",
            message: "Design has been rejected",
            data: { design },
        });
    } catch (err: any) {
        if (err.message === "Design not found") {
            return res.status(404).json({ status: "fail", message: err.message });
        }
        next(err);
    }
};
