import { Router } from "express";
import {
    getProductsHandler,
    getProductByIdHandler,
} from "../controllers/product.controller";

const router = Router();

// Public endpoints — no auth required
router.get("/", getProductsHandler);
router.get("/:productId", getProductByIdHandler);

export default router;
