import { Router } from "express";
import { getMeHandler, updateProfileHandler } from "../controllers/user.controller";
import { requireUser } from "../middleware/deserializeUser";

const router = Router();

router.get("/me", requireUser, getMeHandler);
router.put("/profile", requireUser, updateProfileHandler);

export default router;
