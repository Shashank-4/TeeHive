import { Router } from "express";
import { requireUser } from "../middleware/deserializeUser";
import { requireRole } from "../middleware/requireRole";
import { getConfigHandler, setConfigHandler, uploadConfigAssetHandler } from "../controllers/config.controller";
import multer from "multer";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Public route to get config
router.get("/:key", getConfigHandler);

// Admin-only route to update/create config
router.put("/:key", requireUser, requireRole("admin"), setConfigHandler);

// Admin-only route to upload asset
router.post("/upload", requireUser, requireRole("admin"), upload.single("file"), uploadConfigAssetHandler);

export default router;
