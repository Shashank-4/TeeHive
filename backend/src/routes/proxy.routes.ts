import { Router, Request, Response } from "express";
import axios from "axios";

const router = Router();

router.get("/image", async (req: Request, res: Response) => {
    try {
        const { url } = req.query;

        if (!url || typeof url !== "string") {
            return res.status(400).json({ status: "fail", message: "Image URL is required" });
        }

        const response = await axios({
            url,
            method: "GET",
            responseType: "stream",
        });

        // Copy content type
        res.setHeader("Content-Type", response.headers["content-type"]);
        // Explicitly set CORS headers to allow Fabric.js to read the image data
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
        res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");

        response.data.pipe(res);
    } catch (error: any) {
        console.error("Proxy error:", error.message);
        res.status(500).json({ status: "fail", message: "Failed to proxy image" });
    }
});

export default router;
