import { Request, Response, NextFunction } from "express";
import { verifyJwt, KeyType } from "../util/jwt";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const deserializeUser = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    let accessToken;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")
    ) {
        accessToken = req.headers.authorization.split(" ")[1];
    } else if (req.cookies.access_token) {
        accessToken = req.cookies.access_token;
    }

    if (!accessToken) {
        return next(); // No token, proceed without a user
    }

    const decoded = verifyJwt<{ sub: string }>(
        accessToken,
        KeyType.ACCESS_TOKEN
    );

    if (!decoded) {
        return next(); // Invalid token
    }

    const user = await prisma.user.findUnique({ where: { id: decoded.sub } });

    if (!user) {
        return next(); // User not found
    }

    // Attach user to the response locals. This is safer than attaching to req.
    res.locals.user = user;

    next();
};

export const requireUser = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (!res.locals.user) {
        return res
            .status(401)
            .json({ status: "fail", message: "You are not logged in" });
    }

    next();
};
