import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Get Special Offer (Public)
export const getSpecialOffer = async (req: Request, res: Response) => {
    try {
        let offer = await prisma.specialOffer.findFirst();
        if (!offer) {
            // Provide a default empty offer if none exists
            offer = {
                id: "",
                title: "Flash Sale!",
                subtitle: "Limited time offer on select items.",
                categoryName: "",
                discountPercent: 0,
                isVisible: false,
                ctaText: "SHOP NOW",
                updatedAt: new Date(),
            };
        }
        return res.json({ status: "success", data: offer });
    } catch (error) {
        console.error("Fetch special offer error:", error);
        return res.status(500).json({ error: "Failed to fetch special offer" });
    }
};

// Update Special Offer (Admin)
export const updateSpecialOffer = async (req: Request, res: Response) => {
    try {
        const data = req.body;
        
        let offer = await prisma.specialOffer.findFirst();
        if (offer) {
            offer = await prisma.specialOffer.update({
                where: { id: offer.id },
                data: {
                    title: data.title || "Special Offer",
                    subtitle: data.subtitle || "",
                    categoryName: data.categoryName || "",
                    discountPercent: parseFloat(data.discountPercent) || 0,
                    isVisible: data.isVisible ?? false,
                    ctaText: data.ctaText || "SHOP COLLECTION"
                }
            });
        } else {
            offer = await prisma.specialOffer.create({
                data: {
                    title: data.title || "Special Offer",
                    subtitle: data.subtitle || "",
                    categoryName: data.categoryName || "",
                    discountPercent: parseFloat(data.discountPercent) || 0,
                    isVisible: data.isVisible ?? false,
                    ctaText: data.ctaText || "SHOP COLLECTION"
                }
            });
        }
        return res.json({ status: "success", data: offer });
    } catch (error) {
        console.error("Update special offer error:", error);
        return res.status(500).json({ error: "Failed to update special offer" });
    }
};

// Get all coupons (Admin)
export const getCoupons = async (req: Request, res: Response) => {
    try {
        const coupons = await prisma.coupon.findMany({
            orderBy: { createdAt: "desc" }
        });
        return res.json({ status: "success", data: coupons });
    } catch (error) {
        console.error("Fetch coupons error:", error);
        return res.status(500).json({ error: "Failed to fetch coupons" });
    }
};

// Create a coupon (Admin)
export const createCoupon = async (req: Request, res: Response) => {
    try {
        const { code, discountPercent, isActive } = req.body;
        
        if (!code || !discountPercent) {
            return res.status(400).json({ error: "Code and discount percent are required" });
        }

        const coupon = await prisma.coupon.create({
            data: {
                code: code.toUpperCase(),
                discountPercent: parseFloat(discountPercent),
                isActive: isActive ?? true
            }
        });
        return res.json({ status: "success", data: coupon });
    } catch (error: any) {
        console.error("Create coupon error:", error);
        if (error.code === 'P2002') return res.status(400).json({ error: "Coupon code already exists" });
        return res.status(500).json({ error: "Failed to create coupon" });
    }
};

// Toggle coupon status (Admin)
export const toggleCoupon = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;
        const coupon = await prisma.coupon.update({
            where: { id },
            data: { isActive }
        });
        return res.json({ status: "success", data: coupon });
    } catch (error) {
        console.error("Toggle coupon error:", error);
        return res.status(500).json({ error: "Failed to update coupon" });
    }
};

// Validate a coupon via code (Public)
export const validateCoupon = async (req: Request, res: Response) => {
    try {
        const { code } = req.params;
        const coupon = await prisma.coupon.findUnique({
            where: { code: code.toUpperCase() }
        });

        if (!coupon || !coupon.isActive) {
            return res.status(404).json({ error: "Invalid or inactive coupon code" });
        }

        return res.json({ status: "success", data: coupon });
    } catch (error) {
        console.error("Validate coupon error:", error);
        return res.status(500).json({ error: "Failed to validate coupon" });
    }
};

// Delete a coupon (Admin)
export const deleteCoupon = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.coupon.delete({ where: { id } });
        return res.json({ status: "success", message: "Coupon deleted" });
    } catch (error) {
        console.error("Delete coupon error:", error);
        return res.status(500).json({ error: "Failed to delete coupon" });
    }
};
