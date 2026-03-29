import { Router } from "express";
import multer from "multer";
import { getColorsHandler, createColorHandler, deleteColorHandler } from "../controllers/color.controller";
import { requireUser } from "../middleware/deserializeUser";
import { requireRole } from "../middleware/requireRole";

const router = Router();

// Store files in memory for R2
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// Public / Artists can get colors
router.get("/", getColorsHandler);

// Only admins can create or delete
router.post("/", requireUser, requireRole("admin"), upload.single("mockup"), createColorHandler);
router.delete("/:id", requireUser, requireRole("admin"), deleteColorHandler);

export default router;
