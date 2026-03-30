import { Router } from "express";
import {
    signUpHandler,
    signInHandler,
    refreshAccessTokenHandler,
    signOutHandler,
    verifyOtpHandler,
    googleAuthHandler,
    forgotPasswordHandler,
    resetPasswordHandler,
    resendOtpHandler
} from "../controllers/auth.controller";

const router = Router();

router.post("/signup", signUpHandler);
router.post("/signin", signInHandler);
router.post("/verify-otp", verifyOtpHandler);
router.post("/resend-otp", resendOtpHandler);
router.post("/google", googleAuthHandler);
router.get("/refresh", refreshAccessTokenHandler);
router.get("/signout", signOutHandler);
router.post("/forgot-password", forgotPasswordHandler);
router.post("/reset-password", resetPasswordHandler);

export default router;
