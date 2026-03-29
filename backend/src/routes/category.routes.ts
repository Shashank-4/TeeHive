import { Router } from "express";
import { requireUser } from "../middleware/deserializeUser";
import { requireRole } from "../middleware/requireRole";
import multer from "multer";
import {
    createCategoryHandler,
    updateCategoryHandler,
    deleteCategoryHandler,
    getCategoriesHandler,
} from "../controllers/category.controller";

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
});

const router = Router();

// Public route to fetch all categories
router.get("/", getCategoriesHandler);

// Admin routes to manage categories
router.post("/", requireUser, requireRole("admin"), upload.single("image"), createCategoryHandler);
router.patch("/:id", requireUser, requireRole("admin"), upload.single("image"), updateCategoryHandler);
router.delete("/:id", requireUser, requireRole("admin"), deleteCategoryHandler);

export default router;
