import { Router } from "express";
import { requireUser } from "../middleware/deserializeUser";
import { requireRole, requireVerifiedArtist } from "../middleware/requireRole";
import {
    createProductHandler,
    getMyProductsHandler,
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
} from "../controllers/artistProfile.controller";
import multer from "multer";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

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

// ── Product CRUD (requires verified artist) ──
router.post(
    "/products",
    requireVerifiedArtist,
    upload.fields([
        { name: "mockupImage", maxCount: 1 },
        { name: "backMockupImage", maxCount: 1 },
    ]),
    createProductHandler
);
router.get("/products", requireVerifiedArtist, getMyProductsHandler);
router.patch("/products/:id", requireVerifiedArtist, updateProductHandler);
router.delete("/products/:id", requireVerifiedArtist, deleteProductHandler);
router.patch("/products/:id/publish", requireVerifiedArtist, publishProductHandler);

// ── Dashboard stats & Orders (requires verified artist) ──
router.get("/stats", requireVerifiedArtist, getArtistStatsHandler);
router.get("/orders", requireVerifiedArtist, getArtistOrdersHandler);

export default router;

