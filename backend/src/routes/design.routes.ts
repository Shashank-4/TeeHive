// backend/routes/design.routes.ts (FIXED)

import { Router } from "express";
import multer from "multer";
import {
    uploadDesignHandler,
    getMyDesignsHandler,
    getDesignByIdHandler,
    deleteDesignHandler,
} from "../controllers/design.controller";
import { requireUser } from "../middleware/deserializeUser";

const router = Router();

// Configure multer for file uploads
const upload = multer({
    storage: multer.memoryStorage(), // Store files in memory
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max
    },
    fileFilter: (req: any, file: any, cb: any) => {
        // Accept images only
        if (file.mimetype.startsWith("image/")) {
            cb(null, true);
        } else {
            cb(new Error("Only image files are allowed"));
        }
    },
});

// Only logged-in users can upload designs
router.use(requireUser);

// Get all designs for the logged-in artist
router.get("/", getMyDesignsHandler);

router.get("/:designId", getDesignByIdHandler);

// Soft delete a design
router.delete("/:designId", deleteDesignHandler);

// Upload new design (file + title)
router.post("/upload", upload.single("file"), uploadDesignHandler);

export default router;
