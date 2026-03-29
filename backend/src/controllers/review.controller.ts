import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ── Rate Your Purchase (Customer) ──

export const getReviewableItems = async (req: Request, res: Response) => {
    try {
        const userId = res.locals.user.id;
        const { orderId } = req.params;

        // Fetch order to verify ownership and DELIVERED status
        const order = await prisma.order.findFirst({
            where: {
                id: orderId,
                userId: userId,
            },
            include: {
                items: {
                    include: {
                        product: {
                            include: {
                                artist: {
                                    select: { id: true, displayName: true }
                                }
                            }
                        }
                    }
                },
                reviews: true
            }
        });

        if (!order) {
            return res.status(404).json({ status: "error", message: "Order not found" });
        }

        if (order.status !== "DELIVERED") {
            return res.status(400).json({ status: "error", message: "Reviews can only be submitted for delivered orders." });
        }

        // Filter out items that have already been reviewed (one review per product per order)
        const reviewedProductIds = new Set(order.reviews.map(r => r.productId));
        const reviewableItems = order.items.filter(item => !reviewedProductIds.has(item.productId));

        // Deduplicate products (since an order might have multiple variants of the same product)
        const distinctProducts = new Map();
        for (const item of reviewableItems) {
            if (!distinctProducts.has(item.productId)) {
                distinctProducts.set(item.productId, item.product);
            }
        }

        res.status(200).json({
            status: "success",
            data: { products: Array.from(distinctProducts.values()) },
        });

    } catch (err: any) {
        console.error("Fetch Reviewable Items Error:", err);
        res.status(500).json({ status: "error", message: "Failed to fetch reviewable items" });
    }
};

export const createReviews = async (req: Request, res: Response) => {
    try {
        const userId = res.locals.user.id;
        const { orderId } = req.params;
        const { reviews } = req.body; // Array of { productId, artistId, productRating, artistRating, feedback }

        if (!reviews || !Array.isArray(reviews)) {
            return res.status(400).json({ status: "error", message: "Invalid reviews format" });
        }

        // Verify order
        const order = await prisma.order.findFirst({
            where: { id: orderId, userId },
            include: { reviews: true }
        });

        if (!order || order.status !== "DELIVERED") {
            return res.status(400).json({ status: "error", message: "Order not eligible for review" });
        }

        const reviewedProductIds = new Set(order.reviews.map(r => r.productId));

        for (const review of reviews) {
            // Check if already reviewed
            if (reviewedProductIds.has(review.productId)) continue;

            // Create review
            await prisma.review.create({
                data: {
                    orderId,
                    productId: review.productId,
                    customerId: userId,
                    artistId: review.artistId,
                    productRating: review.productRating,
                    artistRating: review.artistRating,
                    feedback: review.feedback || null
                }
            });

            // Update Artist Rating Aggregate
            const artistReviews = await prisma.review.aggregate({
                where: { artistId: review.artistId },
                _avg: { artistRating: true },
                _count: { artistRating: true }
            });

            await prisma.user.update({
                where: { id: review.artistId },
                data: {
                    artistRating: artistReviews._avg.artistRating || 0,
                    reviewCount: artistReviews._count.artistRating || 0
                }
            });
        }

        res.status(201).json({ status: "success", message: "Reviews submitted successfully" });

    } catch (err: any) {
        console.error("Create Reviews Error:", err);
        res.status(500).json({ status: "error", message: "Failed to submit reviews" });
    }
};

// ── Artist Dashboard ──

export const getArtistReviews = async (req: Request, res: Response) => {
    try {
        const artistId = res.locals.user.id;
        const reviews = await prisma.review.findMany({
            where: { artistId },
            include: {
                product: { select: { id: true, name: true, mockupImageUrl: true } },
                customer: { select: { name: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.status(200).json({
            status: "success",
            data: { reviews }
        });

    } catch (err: any) {
        console.error("Fetch Artist Reviews Error:", err);
        res.status(500).json({ status: "error", message: "Failed to fetch artist reviews" });
    }
};

// ── Admin Dashboard ──

export const getAdminReviews = async (req: Request, res: Response) => {
    try {
        const reviews = await prisma.review.findMany({
            include: {
                product: { select: { id: true, name: true, mockupImageUrl: true } },
                artist: { select: { id: true, name: true, displayName: true } },
                customer: { select: { id: true, name: true, email: true } },
                order: { select: { id: true, createdAt: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.status(200).json({
            status: "success",
            data: { reviews }
        });
    } catch (err: any) {
        console.error("Fetch Admin Reviews Error:", err);
        res.status(500).json({ status: "error", message: "Failed to fetch admin reviews" });
    }
};
