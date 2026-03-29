import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getMeHandler = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const user = res.locals.user;

        const { password, ...userWithoutPassword } = user;

        res.status(200).json({
            status: "success",
            data: {
                user: userWithoutPassword,
            },
        });
    } catch (err) {
        next(err);
    }
};

export const updateProfileHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const user = res.locals.user;
        const { name, email } = req.body;

        const updated = await prisma.user.update({
            where: { id: user.id },
            data: {
                ...(name && { name }),
                ...(email && { email }),
            },
            select: {
                id: true,
                name: true,
                email: true,
                isArtist: true,
                isAdmin: true,
                verificationStatus: true,
                displayName: true,
                displayPhotoUrl: true,
                createdAt: true,
            },
        });

        res.status(200).json({
            status: "success",
            data: { user: updated },
        });
    } catch (err: any) {
        if (err.code === "P2002") {
            return res.status(409).json({ error: "Email already in use" });
        }
        next(err);
    }
};
