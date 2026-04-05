import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import authRouter from "./routes/auth.routes";
import userRouter from "./routes/user.routes";
import cookieParser from "cookie-parser";
import { deserializeUser } from "./middleware/deserializeUser";
import designRouter from "./routes/design.routes";
import orderRouter from "./routes/order.routes";
import webhookRouter from "./routes/webhook.routes";
import artistRouter from "./routes/artist.routes";
import productRouter from "./routes/product.routes";
import adminRouter from "./routes/admin.routes";
import publicArtistRouter from "./routes/publicArtist.routes";
import categoryRouter from "./routes/category.routes";
import configRouter from "./routes/config.routes";
import proxyRouter from "./routes/proxy.routes";
import promotionRouter from "./routes/promotion.routes";
import colorRouter from "./routes/color.routes";
import reviewRouter from "./routes/review.routes";

const PORT = process.env.PORT || 3000;
const app = express();

// Trust proxy for secure cookies behind reverse proxies (Railway, Render, etc.)
app.set("trust proxy", 1);


// ── Production Security & Performance ──
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(compression());

// Rate limiter for auth routes (brute-force protection on sensitive POSTs only).
// Refresh + signout must be excluded: they run often during normal browsing and must not share the same cap as login/OTP.
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === "production" ? 120 : 400,
    standardHeaders: true,
    legacyHeaders: false,
    message: { status: "fail", message: "Too many requests, please try again later." },
    skip: (req) => {
        if (req.method !== "GET") return false;
        const p = req.path || "";
        return p === "/refresh" || p === "/signout" || p.endsWith("/refresh") || p.endsWith("/signout");
    },
});

app.use("/api/webhook", express.raw({ type: "application/json" }), webhookRouter);
app.use(express.json());
app.use(cookieParser());
app.use(
    cors({
        origin: process.env.NODE_ENV === "production"
            ? [process.env.FRONTEND_URL!]
            : [
                  process.env.FRONTEND_URL || "http://localhost:5173",
                  "http://localhost:5173",
                  "http://127.0.0.1:5173",
                  "http://localhost:3000",
                  "http://127.0.0.1:3000",
              ],
        credentials: true,
    })
);

app.use(deserializeUser);

app.use("/api/auth", authLimiter, authRouter);
app.use("/api/users", userRouter);
app.use("/api/designs", designRouter);
app.use("/api/orders", orderRouter);
app.use("/api/artist", artistRouter);
app.use("/api/products", productRouter);
app.use("/api/admin", adminRouter);
app.use("/api/artists", publicArtistRouter);
app.use("/api/categories", categoryRouter);
app.use("/api/config", configRouter);
app.use("/api/proxy", proxyRouter);
app.use("/api/promotions", promotionRouter);
app.use("/api/colors", colorRouter);
app.use("/api/reviews", reviewRouter);

app.get("/health", (_req, res) => res.status(200).json({ status: "ok" }));

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});

