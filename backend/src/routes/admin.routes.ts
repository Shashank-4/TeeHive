import { Router } from "express";
import { requireUser } from "../middleware/deserializeUser";
import { requireRole } from "../middleware/requireRole";
import {
    listArtistsHandler,
    getArtistDetailHandler,
    verifyArtistHandler,
    toggleResubmissionHandler,
    rejectDesignHandler,
} from "../controllers/adminArtist.controller";
import {
    getAdminArtistPayoutMethodsHandler,
    reviewArtistPayoutMethodHandler,
} from "../controllers/artistPayout.controller";
import { getDashboardStatsHandler } from "../controllers/adminStats.controller";
import { listUsersHandler, updateUserRoleHandler } from "../controllers/adminUsers.controller";
import { 
    listProductsHandler, 
    patchProductLatestDropHandler,
    updateProductStatusHandler, 
    updateProductStockHandler,
    getProductVariantsHandler,
    updateProductVariantsHandler
} from "../controllers/adminProducts.controller";
import { 
    listOrdersHandler, 
    updateOrderStatusHandler,
    updatePaymentStatusHandler,
    getOrderByIdHandler,
    updateReturnClaimStatusHandler,
} from "../controllers/adminOrders.controller";
import { listDesignsHandler, bulkFlagDesignsHandler, bulkDownloadDesignsHandler } from "../controllers/adminDesigns.controller";
import { memoryRateLimit } from "../middleware/rateLimit";

const router = Router();

// All admin routes require authenticated admin
router.use(requireUser, requireRole("admin"));

// ── Dashboard Stats ──
router.get("/dashboard/stats", getDashboardStatsHandler);

// ── Artist Management ──
router.get("/artists", listArtistsHandler);
router.get("/artists/:id", getArtistDetailHandler);
router.get("/artists/:id/payout-methods", getAdminArtistPayoutMethodsHandler);
router.patch("/artists/:id/verify", verifyArtistHandler);
router.patch("/artists/:id/resubmit", toggleResubmissionHandler);
router.patch("/artists/:id/payout-methods/:payoutMethodId/review", reviewArtistPayoutMethodHandler);
router.patch("/designs/:id/reject", rejectDesignHandler);

// ── User Management ──
router.get("/users", listUsersHandler);
router.patch("/users/:id/role", updateUserRoleHandler);

// ── Product Management ──
router.get("/products", listProductsHandler);
router.patch("/products/:id/latest-drop", patchProductLatestDropHandler);
router.patch("/products/:id/status", updateProductStatusHandler);
router.patch("/products/:id/stock", updateProductStockHandler);
router.get("/products/:id/variants", getProductVariantsHandler);
router.patch("/products/:id/variants", updateProductVariantsHandler);

// ── Order Management ──
router.get("/orders", listOrdersHandler);
router.get("/orders/:id", getOrderByIdHandler);
router.patch("/orders/:id/status", updateOrderStatusHandler);
router.patch("/orders/:id/payment", updatePaymentStatusHandler);
router.patch("/orders/:id/return-claim", updateReturnClaimStatusHandler);

// ── Design Management ──
router.get("/designs", listDesignsHandler);
router.patch("/designs/bulk-flag", bulkFlagDesignsHandler);
router.post("/designs/bulk-download", memoryRateLimit(20, 60 * 1000), bulkDownloadDesignsHandler);

export default router;
