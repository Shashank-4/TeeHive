import { Request, Response, NextFunction } from "express";

/**
 * Middleware to check role-based access using boolean flags.
 * Usage:
 *   requireRole("artist")  → checks user.isArtist === true
 *   requireRole("admin")   → checks user.isAdmin === true
 *   requireRole("artist", "admin") → allows either
 */
export const requireRole = (...roles: ("artist" | "admin")[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const user = res.locals.user;

        if (!user) {
            return res
                .status(401)
                .json({ status: "fail", message: "You are not logged in" });
        }

        const hasRole = roles.some((role) => {
            if (role === "artist") return user.isArtist === true;
            if (role === "admin") return user.isAdmin === true;
            return false;
        });

        if (!hasRole) {
            return res.status(403).json({
                status: "fail",
                message: "You do not have permission to perform this action",
            });
        }

        next();
    };
};

/**
 * Middleware to check that an artist has been verified.
 * Must be used AFTER requireRole("artist").
 */
export const requireVerifiedArtist = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const user = res.locals.user;

    if (!user) {
        return res
            .status(401)
            .json({ status: "fail", message: "You are not logged in" });
    }

    if (user.verificationStatus !== "VERIFIED") {
        return res.status(403).json({
            status: "fail",
            message: "Your artist account has not been verified yet",
            verificationStatus: user.verificationStatus,
        });
    }

    next();
};
