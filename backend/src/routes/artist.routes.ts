import { Router } from "express";
import { requireUser } from "../middleware/deserializeUser";
import { requireRole, requireVerifiedArtist } from "../middleware/requireRole";
import {
    createProductHandler,
    getMyProductsHandler,
    getArtistDraftProductHandler,
    updateProductHandler,
    deleteProductHandler,
    publishProductHandler,
    getArtistStatsHandler,
    getArtistOrdersHandler,
} from "../controllers/product.controller";
import {
    getArtistProfileHandler,
    updateArtistProfileHandler,
    patchArtistProfileHandler,
    submitVerificationHandler,
    getArtistDashboardConfigHandler,
} from "../controllers/artistProfile.controller";
import {
    getArtistPayoutMethodsHandler,
    saveArtistPayoutMethodsHandler,
} from "../controllers/artistPayout.controller";
import multer from "multer";

const router = Router();
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 15 * 1024 * 1024, files: 48 },
});

// All routes require authenticated artist
router.use(requireUser, requireRole("artist"));

// ── Profile (no verification required — new artists need these) ──
router.get("/profile", getArtistProfileHandler);
router.put(
    "/profile",
    upload.fields([
        { name: "displayPhoto", maxCount: 1 },
        { name: "coverPhoto", maxCount: 1 },
    ]),
    updateArtistProfileHandler
);
router.post("/submit-verification", submitVerificationHandler);
router.patch("/profile", patchArtistProfileHandler);
router.get("/payout-methods", getArtistPayoutMethodsHandler);
router.put("/payout-methods", saveArtistPayoutMethodsHandler);

// ── Product CRUD (requires verified artist) ──
router.post(
    "/products",
    requireVerifiedArtist,
    upload.any(),
    createProductHandler
);
router.get("/products", requireVerifiedArtist, getMyProductsHandler);
router.get("/products/:id", requireVerifiedArtist, getArtistDraftProductHandler);
router.patch("/products/:id", requireVerifiedArtist, upload.any(), updateProductHandler);
router.delete("/products/:id", requireVerifiedArtist, deleteProductHandler);
router.patch("/products/:id/publish", requireVerifiedArtist, publishProductHandler);

// ── Dashboard stats & Orders (requires verified artist) ──
router.get("/dashboard", requireVerifiedArtist, getArtistDashboardConfigHandler);
router.get("/stats", requireVerifiedArtist, getArtistStatsHandler);
router.get("/orders", requireVerifiedArtist, getArtistOrdersHandler);

export default router;

