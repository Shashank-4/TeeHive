import { Router } from "express";
import { requireUser } from "../middleware/deserializeUser";
import { requireRole } from "../middleware/requireRole";
import {
    getSpecialOffer,
    updateSpecialOffer,
    getCoupons,
    createCoupon,
    toggleCoupon,
    deleteCoupon,
    validateCoupon
} from "../controllers/promotion.controller";

const router = Router();

// Public routes
router.get("/special-offer", getSpecialOffer);
router.get("/validate-coupon/:code", validateCoupon);

// Admin routes
router.put("/special-offer", requireUser, requireRole("admin"), updateSpecialOffer);
router.get("/coupons", requireUser, requireRole("admin"), getCoupons);
router.post("/coupons", requireUser, requireRole("admin"), createCoupon);
router.patch("/coupons/:id", requireUser, requireRole("admin"), toggleCoupon);
router.delete("/coupons/:id", requireUser, requireRole("admin"), deleteCoupon);

export default router;
