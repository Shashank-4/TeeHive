import { PrismaClient, User } from "@prisma/client";
import bcrypt from "bcryptjs";
import { signJwt, KeyType } from "../util/jwt";

interface CreateUserInput {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    isArtist?: boolean;
}

const prisma = new PrismaClient();

export const normalizeEmail = (email: string) => email.trim().toLowerCase();

const getNextArtistNumber = async () => {
    const lastArtist = await prisma.user.findFirst({
        where: { artistNumber: { not: null } },
        orderBy: { artistNumber: 'desc' }
    });
    return (lastArtist?.artistNumber || 0) + 1;
};

// we omit the password from the user object we return
export const excludedFields = ["password"];

export const createUserService = async (input: CreateUserInput) => {
    const name: string = `${input.firstName} ${input.lastName}`;

    const existingUser = await prisma.user.findUnique({
        where: { email: normalizeEmail(input.email) },
    });
    if (existingUser) {
        throw new Error("A user with this email already exists.");
    }

    const hashedPassword = await bcrypt.hash(input.password, 12);

    let artistNumber = null;
    if (input.isArtist) {
        artistNumber = await getNextArtistNumber();
    }

    const user = await prisma.user.create({
        data: {
            email: normalizeEmail(input.email),
            password: hashedPassword,
            name,
            isArtist: input.isArtist || false,
            artistNumber,
            // Set verification status for artists
            verificationStatus: input.isArtist ? "UNVERIFIED" : "UNVERIFIED",
        },
    });

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
};

export const findUserByEmail = async (email: string) => {
    return await prisma.user.findUnique({ where: { email: normalizeEmail(email) } });
};

export const signTokens = async (user: User) => {
    // 1. Define the token payloads
    const accessTokenPayload = {
        sub: user.id,
        isArtist: user.isArtist,
        isAdmin: user.isAdmin,
    };
    const refreshTokenPayload = {
        sub: user.id,
        tokenVersion: user.tokenVersion,
    };

    const accessToken = signJwt(accessTokenPayload, KeyType.ACCESS_TOKEN, {
        expiresIn: (process.env.ACCESS_TOKEN_TTL as any) || "15m",
    });

    const refreshToken = signJwt(refreshTokenPayload, KeyType.REFRESH_TOKEN, {
        expiresIn: (process.env.REFRESH_TOKEN_TTL as any) || "7d",
    });

    return { accessToken, refreshToken };
};

export const updateUserOtp = async (userId: string, otpCode: string, otpExpiresAt: Date) => {
    return await prisma.user.update({
        where: { id: userId },
        data: { otpCode, otpExpiresAt }
    });
};

export const clearUserOtp = async (userId: string) => {
    return await prisma.user.update({
        where: { id: userId },
        data: { otpCode: null, otpExpiresAt: null, isEmailVerified: true },
    });
};

export const upgradeUserToArtist = async (userId: string) => {
    const artistNumber = await getNextArtistNumber();
    return await prisma.user.update({
        where: { id: userId },
        data: { isArtist: true, verificationStatus: "UNVERIFIED", artistNumber },
    });
};

export const createOrUpdateGoogleUser = async (googleId: string, email: string, name: string, isArtist: boolean) => {
    const normalizedEmail = normalizeEmail(email);
    let user = await prisma.user.findFirst({
        where: {
            OR: [
                { googleId },
                { email: normalizedEmail }
            ]
        }
    });

    if (user) {
        let isUpgrade = false;
        /** First time this account becomes verified (e.g. email signup abandoned, then Google links). */
        let verifiedByGoogleLink = false;
        const updateData: any = {};
        const wasEmailVerified = user.isEmailVerified;

        if (!user.googleId) {
            updateData.googleId = googleId;
            updateData.authProvider = "GOOGLE";
            updateData.isEmailVerified = true;
            if (!wasEmailVerified) {
                verifiedByGoogleLink = true;
            }
        }

        if (isArtist && !user.isArtist) {
            const artistNumber = await getNextArtistNumber();
            updateData.isArtist = true;
            updateData.artistNumber = artistNumber;
            updateData.verificationStatus = "UNVERIFIED";
            isUpgrade = true;
        }

        if (Object.keys(updateData).length > 0) {
            user = await prisma.user.update({
                where: { id: user.id },
                data: updateData
            });
        }

        return { user, isNew: false, isUpgrade, verifiedByGoogleLink };
    }

    let artistNumber = null;
    if (isArtist) {
        artistNumber = await getNextArtistNumber();
    }

    const newUser = await prisma.user.create({
        data: {
            email: normalizedEmail,
            name,
            googleId,
            authProvider: "GOOGLE",
            isEmailVerified: true,
            isArtist,
            artistNumber,
            verificationStatus: "UNVERIFIED",
        }
    });
    return { user: newUser, isNew: true, isUpgrade: false, verifiedByGoogleLink: false };
};

export const updateUserResetToken = async (userId: string, resetPasswordToken: string, resetPasswordExpires: Date) => {
    return await prisma.user.update({
        where: { id: userId },
        data: { resetPasswordToken, resetPasswordExpires }
    });
};

export const resetUserPassword = async (userId: string, password: string) => {
    const hashedPassword = await bcrypt.hash(password, 12);
    return await prisma.user.update({
        where: { id: userId },
        data: {
            password: hashedPassword,
            resetPasswordToken: null,
            resetPasswordExpires: null,
            tokenVersion: { increment: 1 } // Invalidate existing sessions
        }
    });
};

export const findUserByResetToken = async (token: string) => {
    return await prisma.user.findFirst({
        where: {
            resetPasswordToken: token,
            resetPasswordExpires: { gt: new Date() }
        }
    });
};
