import { Router } from "express";
import {
    getReviewableItems,
    createReviews,
    getArtistReviews,
    getAdminReviews
} from "../controllers/review.controller";
import { requireUser } from "../middleware/deserializeUser";
import { requireRole } from "../middleware/requireRole";

const router = Router();

// Customer: Rate Purchase
router.get("/order/:orderId/reviewable", requireUser, getReviewableItems);
router.post("/order/:orderId", requireUser, createReviews);

// Artist: View Own Reviews
router.get("/artist", requireUser, requireRole("artist"), getArtistReviews);

// Admin: View All Reviews
router.get("/admin", requireUser, requireRole("admin"), getAdminReviews);

export default router;
