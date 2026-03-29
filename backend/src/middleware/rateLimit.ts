import { Request, Response, NextFunction } from "express";

const rateLimitCache = new Map<string, { count: number; resetTime: number }>();

export const memoryRateLimit = (limit: number, windowMs: number) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const ip = req.ip || req.connection.remoteAddress || "unknown";
        const now = Date.now();
        
        const record = rateLimitCache.get(ip);
        if (record && record.resetTime > now) {
            if (record.count >= limit) {
                return res.status(429).json({
                    status: "fail",
                    message: "Too many requests, please try again later."
                });
            }
            record.count += 1;
            rateLimitCache.set(ip, record);
        } else {
            rateLimitCache.set(ip, { count: 1, resetTime: now + windowMs });
        }
        
        next();
    };
};
