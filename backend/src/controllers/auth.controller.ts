import { Request, Response, NextFunction } from "express";
import { OAuth2Client } from "google-auth-library";
import {
    createUserService,
    findUserByEmail,
    signTokens,
    updateUserOtp,
    clearUserOtp,
    createOrUpdateGoogleUser
} from "../services/auth.service";
import bcrypt from "bcryptjs";
import { verifyJwt, KeyType, signJwt } from "../util/jwt";
import { findUserById } from "../services/user.service";
import { sendOtpEmail, sendForgotPasswordEmail } from "../services/email.service";
import crypto from "crypto";
import {
    updateUserResetToken,
    findUserByResetToken,
    resetUserPassword
} from "../services/auth.service";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const isProd = process.env.NODE_ENV === "production";
const COOKIE_DOMAIN = isProd ? ".teehive.co.in" : undefined;

const accessTokenCookieOptions = {
    expires: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
    maxAge: 15 * 60 * 1000,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: isProd,
    domain: COOKIE_DOMAIN,
};

const refreshTokenCookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: isProd,
    domain: COOKIE_DOMAIN,
};

export const signUpHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { firstName, lastName, email, password, isArtist } = req.body;
        let user = await findUserByEmail(email);

        if (user) {
            if (isArtist && !user.isArtist) {
                // Allowed path: Customer upgrading to Artist
            } else if (!isArtist && user.isArtist) {
                return res.status(409).json({ status: "fail", message: "An account with this email already exists. Please sign in." });
            } else {
                return res.status(409).json({ status: "fail", message: "A user with this email already exists." });
            }
        } else {
            user = (await createUserService({
                firstName,
                lastName,
                email,
                password,
                isArtist: isArtist || false,
            })) as any;
        }

        if (!user) throw new Error("User creation failed");

        // Generate OTP
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

        await updateUserOtp(user.id, otpCode, otpExpiresAt);
        await sendOtpEmail({ to: user.email, otpCode });

        res.status(201).json({
            status: "success",
            data: {
                user,
                isUpgrade: !!(user && isArtist && !user.isArtist)
            },
            message: "OTP sent to email",
        });
    } catch (err: any) {
        if (err.message.includes("already exists")) {
            return res
                .status(409)
                .json({ status: "fail", message: err.message });
        }
        next(err);
    }
};

export const signInHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { email, password, loginAsArtist } = req.body;
        const user = await findUserByEmail(email);

        if (!user || !user.password || !(await bcrypt.compare(password, user.password))) {
            return res
                .status(401)
                .json({ status: "fail", message: "Invalid email or password" });
        }

        if (loginAsArtist && !user.isArtist) {
            return res.status(403).json({ status: "fail", message: "You are not registered as an artist. Please sign up to start selling." });
        }

        // Generate OTP instead of logging in directly
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

        await updateUserOtp(user.id, otpCode, otpExpiresAt);
        await sendOtpEmail({ to: user.email, otpCode });

        res.status(200).json({
            status: "success",
            message: "OTP sent to email",
        });
    } catch (err) {
        next(err);
    }
};

export const verifyOtpHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { email, otpCode, isUpgradingToArtist } = req.body;
        let user = await findUserByEmail(email);

        if (!user || user.otpCode !== otpCode || !user.otpExpiresAt || user.otpExpiresAt < new Date()) {
            return res.status(401).json({ status: "fail", message: "Invalid or expired OTP" });
        }

        await clearUserOtp(user.id);

        if (isUpgradingToArtist && !user.isArtist) {
            // Import dynamically or explicitly run the update. We'll use the service below.
            const { upgradeUserToArtist } = await import("../services/auth.service");
            user = await upgradeUserToArtist(user.id);
        }

        const { accessToken, refreshToken } = await signTokens(user as any);

        res.cookie("access_token", accessToken, accessTokenCookieOptions);
        res.cookie("refresh_token", refreshToken, refreshTokenCookieOptions);
        res.cookie("logged_in", true, {
            ...accessTokenCookieOptions,
            httpOnly: false,
        });

        res.status(200).json({
            status: "success",
            accessToken,
        });
    } catch (err) {
        next(err);
    }
};

export const googleAuthHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { token, isArtist } = req.body;
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();

        if (!payload || !payload.email) {
            return res.status(401).json({ status: "fail", message: "Invalid Google token" });
        }

        const user = await createOrUpdateGoogleUser(
            payload.sub,
            payload.email,
            payload.name || "Google User",
            isArtist || false
        );

        const { accessToken, refreshToken } = await signTokens(user);

        res.cookie("access_token", accessToken, accessTokenCookieOptions);
        res.cookie("refresh_token", refreshToken, refreshTokenCookieOptions);
        res.cookie("logged_in", true, {
            ...accessTokenCookieOptions,
            httpOnly: false,
        });

        res.status(200).json({
            status: "success",
            accessToken,
        });
    } catch (err) {
        next(err);
    }
};

export const refreshAccessTokenHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const refreshToken = req.cookies.refresh_token;

        if (!refreshToken) {
            return res.status(401).json({
                status: "fail",
                message: "Could not refresh access token",
            });
        }

        // Verify the refresh token
        const decoded = verifyJwt<{ sub: string; tokenVersion: number }>(
            refreshToken,
            KeyType.REFRESH_TOKEN
        );

        if (!decoded) {
            return res
                .status(401)
                .json({ status: "fail", message: "Invalid refresh token" });
        }

        const user = await findUserById(decoded.sub);

        // If the user doesn't exist or their tokenVersion doesn't match, the token is invalid.
        if (!user || user.tokenVersion !== decoded.tokenVersion) {
            return res
                .status(401)
                .json({ status: "fail", message: "Invalid refresh token" });
        }

        // Issue a new access token
        const accessTokenPayload = {
            sub: user.id,
            isArtist: user.isArtist,
            isAdmin: user.isAdmin,
        };
        const newAccessToken = signJwt(
            accessTokenPayload,
            KeyType.ACCESS_TOKEN,
            {
                expiresIn: (process.env.ACCESS_TOKEN_TTL as any) || "15m",
            }
        );

        // Set the new access token in the cookie
        res.cookie("access_token", newAccessToken, accessTokenCookieOptions);
        res.cookie("logged_in", true, {
            ...accessTokenCookieOptions,
            httpOnly: false,
        });

        res.status(200).json({
            status: "success",
            accessToken: newAccessToken,
        });
    } catch (err) {
        next(err);
    }
};

export const signOutHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        // Clear cookies by setting them to an empty value with an immediate expiration date.
        const clearOpts = { maxAge: -1, sameSite: "lax" as const, secure: isProd, httpOnly: true, domain: COOKIE_DOMAIN };
        res.cookie("access_token", "", clearOpts);
        res.cookie("refresh_token", "", clearOpts);
        res.cookie("logged_in", "", { ...clearOpts, httpOnly: false });

        res.status(200).json({ status: "success" });
    } catch (err) {
        next(err);
    }
};

export const forgotPasswordHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { email, isArtist } = req.body;
        const user = await findUserByEmail(email);

        if (!user || user.authProvider === "GOOGLE") {
            // We return success even if user not found for security reasons
            // to prevent email enumeration, OR we could return a generic message.
            return res.status(200).json({ status: "success", message: "If an account with that email exists, we have sent a reset link." });
        }

        const resetToken = crypto.randomBytes(32).toString("hex");
        const resetExpires = new Date(Date.now() + 3600000); // 1 hour

        await updateUserResetToken(user.id, resetToken, resetExpires);

        const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
        await sendForgotPasswordEmail(user.email, user.name || "User", resetLink, user.isArtist);


        res.status(200).json({
            status: "success",
            message: "Reset link sent to email",
        });
    } catch (err) {
        next(err);
    }
};

export const resetPasswordHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { token, password } = req.body;
        const user = await findUserByResetToken(token);

        if (!user) {
            return res.status(401).json({ status: "fail", message: "Invalid or expired reset token" });
        }

        await resetUserPassword(user.id, password);

        res.status(200).json({
            status: "success",
            message: "Password reset successful. Please sign in with your new password.",
        });
    } catch (err) {
        next(err);
    }
};

