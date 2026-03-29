import { Router } from "express";
import multer from "multer";
import { getColorsHandler, createColorHandler, deleteColorHandler } from "../controllers/color.controller";
import { requireUser } from "../middleware/deserializeUser";
import { requireRole } from "../middleware/requireRole";

const router = Router();

// Store files in memory for R2 upload
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB per file
});

// 3-asset upload: base mockup (required), shadow map, displacement map
const colorAssetUpload = upload.fields([
    { name: "mockup", maxCount: 1 },
    { name: "shadowMap", maxCount: 1 },
    { name: "displacementMap", maxCount: 1 },
]);

// Public / Artists can get colors
router.get("/", getColorsHandler);

// Only admins can create or delete
router.post("/", requireUser, requireRole("admin"), colorAssetUpload, createColorHandler);
router.delete("/:id", requireUser, requireRole("admin"), deleteColorHandler);

export default router;
