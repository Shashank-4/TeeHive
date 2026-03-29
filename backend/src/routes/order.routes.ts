import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { requireUser } from "../middleware/deserializeUser";
import { calculateProductPrice, getActiveSpecialOffer } from "../utils/productUtils";


// import { razorpay } from "../utils/razorpay";

const router = Router();
const prisma = new PrismaClient();

// Get recent orders for an artist (orders containing their products)
router.get("/artist/recent", requireUser, async (req: Request, res: Response) => {
    try {
        const user = res.locals.user;
        const limit = parseInt(req.query.limit as string) || 5;

        // Query to find unique orders that contain at least one product
        // belonging to the authenticated artist
        const recentOrders = await prisma.order.findMany({
            where: {
                items: {
                    some: {
                        product: {
                            artistId: user.id
                        }
                    }
                }
            },
            include: {
                user: {
                    select: {
                        name: true,
                        displayName: true
                    }
                },
                items: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                name: true,
                                price: true,
                                artistId: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: limit
        });

        // Format for frontend
        const formattedOrders = recentOrders.map(order => {
            // Find the specific item belonging to this artist to feature
            const artistItem = order.items.find(item => item.product.artistId === user.id);

            return {
                id: `#${order.id.slice(0, 8).toUpperCase()}`, // Shortened ID
                rawId: order.id,
                product: artistItem ? artistItem.product.name : "Multiple Products",
                customer: order.user?.displayName || order.user?.name || "Guest",
                date: order.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                amount: `₹${artistItem ? (artistItem.price * artistItem.quantity).toFixed(2) : order.totalAmount.toFixed(2)}`,
                status: order.status
            };
        });

        res.json({
            status: "success",
            data: { orders: formattedOrders }
        });
    } catch (error) {
        console.error("Error fetching artist recent orders:", error);
        res.status(500).json({ error: "Failed to fetch recent orders" });
    }
});

// Get authenticated user's orders
router.get("/my-orders", requireUser, async (req: Request, res: Response) => {
    try {
        const user = res.locals.user;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;

        const [orders, total] = await Promise.all([
            prisma.order.findMany({
                where: { userId: user.id },
                include: {
                    items: {
                        include: {
                            product: {
                                select: {
                                    id: true,
                                    name: true,
                                    mockupImageUrl: true,
                                    artist: { select: { id: true, name: true } },
                                },
                            },
                        },
                    },
                    shippingAddress: true,
                },
                orderBy: { createdAt: "desc" },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.order.count({ where: { userId: user.id } }),
        ]);

        res.json({
            status: "success",
            data: {
                orders,
                pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
            },
        });
    } catch (error) {
        console.error("Error fetching orders:", error);
        res.status(500).json({ error: "Failed to fetch orders" });
    }
});


// Create a new order and initialize Razorpay payment
router.post("/checkout", async (req, res) => {
    const { items, shippingAddress, userId, couponCode } = req.body;

    try {
        // 0. Fetch active special offer
        const activeOffer = await getActiveSpecialOffer();

        // 1. Fetch product details and calculate total amount
        let subtotal = 0;
        const validatedItems = [];

        for (const item of items) {
            const product = await prisma.product.findUnique({
                where: { id: item.id },
            });

            if (!product || product.status !== "PUBLISHED") {
                return res.status(400).json({ error: `Product ${item.id} not found or unavailable` });
            }

            // Calculate price based on special offer
            const { price: finalUnitPrice } = calculateProductPrice(product, activeOffer);

            subtotal += finalUnitPrice * item.quantity;
            validatedItems.push({
                productId: product.id,
                quantity: item.quantity,
                price: finalUnitPrice,
                size: item.size,
                color: item.color,
            });
        }

        let discountAmount = 0;
        let appliedCouponCode = null;

        if (couponCode) {
            const coupon = await prisma.coupon.findUnique({
                where: { code: couponCode.toUpperCase() }
            });

            if (coupon && coupon.isActive) {
                discountAmount = Math.round(subtotal * (coupon.discountPercent / 100));
                appliedCouponCode = coupon.code;
            }
        }

        const discountedSubtotal = subtotal - discountAmount;
        const shipping = discountedSubtotal > 3000 ? 0 : 100; // Free shipping over ₹3000
        const tax = discountedSubtotal * 0.18; // 18% GST estimate
        const total = discountedSubtotal + shipping + tax;

        // 2. Create Order in Database (PENDING)
        const order = await prisma.order.create({
            data: {
                userId: userId,
                totalAmount: total,
                discountAmount: discountAmount,
                couponCode: appliedCouponCode,
                status: "PENDING",
                shippingAddress: {
                    create: {
                        name: `${shippingAddress.firstName} ${shippingAddress.lastName}`,
                        line1: shippingAddress.address,
                        city: shippingAddress.city,
                        state: shippingAddress.state,
                        postalCode: shippingAddress.zipCode,
                        country: shippingAddress.country,
                    },
                },
                items: {
                    create: validatedItems,
                },
            },
        });

        // 3. Create Razorpay Order (commented out until API keys are configured)
        // const razorpayOrder = await razorpay.orders.create({
        //     amount: Math.round(total * 100), // Amount in paise
        //     currency: "INR",
        //     receipt: order.id,
        //     notes: {
        //         orderId: order.id,
        //         userId: userId,
        //     },
        // });

        // // 4. Update Order with Razorpay Order ID for tracking
        // await prisma.order.update({
        //     where: { id: order.id },
        //     data: {
        //         paymentIntentId: razorpayOrder.id,
        //     },
        // });

        // // 5. Create Metadata for Payment Record
        // await prisma.payment.create({
        //     data: {
        //         orderId: order.id,
        //         amount: total,
        //         currency: "inr",
        //         provider: "RAZORPAY",
        //         status: "PENDING",
        //         paymentIntentId: razorpayOrder.id,
        //     },
        // });

        // Temporary response until Razorpay keys are configured
        res.json({
            message: "Order created (Razorpay disabled)",
            dbOrderId: order.id,
            total,
        });

    } catch (error) {
        console.error("Error creating order:", error);
        res.status(500).json({ error: "Failed to create order" });
    }
});

export default router;

