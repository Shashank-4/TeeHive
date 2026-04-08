import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";
import multer from "multer";
import { requireUser } from "../middleware/deserializeUser";
import { calculateProductPrice, getActiveSpecialOffer } from "../utils/productUtils";
import { razorpay } from "../utils/razorpay";
import { sendAdminReturnClaimNotification } from "../services/email.service";
import {
    cleanupExpiredPendingOrders,
    markOrderPaidAfterInventoryCheck,
} from "../services/orderInventory.service";
import {
    buildReturnClaimView,
    getReturnClaimEligibility,
    isReturnClaimReason,
    sanitizeClaimDescription,
    uploadReturnClaimEvidence,
} from "../services/orderReturnClaim.service";

const router = Router();
const prisma = new PrismaClient();
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 8 * 1024 * 1024, files: 3 },
});
/** Delivery charge is always zero (free shipping on all orders). */
const SHIPPING_AMOUNT = 0;
const ARTIST_COMMISSION_RATE = 0.25;

type CheckoutItemInput = {
    id: string;
    quantity: number;
    size: string;
    color: string;
};

type ShippingAddressInput = {
    firstName: string;
    lastName: string;
    email: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    phone: string;
};

function badRequest(res: Response, message: string) {
    return res.status(400).json({ status: "fail", message });
}

function formatCustomerOrder(order: any) {
    const deliveredAt = order.status === "DELIVERED" ? order.updatedAt : null;
    const returnClaimEligibility = deliveredAt
        ? getReturnClaimEligibility({
              status: order.status,
              deliveredAt,
              hasExistingClaim: Boolean(order.returnClaim),
          })
        : {
              eligible: false,
              message: "Return claims become available only after delivery.",
          };

    return {
        ...order,
        returnClaim: buildReturnClaimView(order.returnClaim),
        returnClaimEligibility: {
            eligible: returnClaimEligibility.eligible,
            message: returnClaimEligibility.message,
            deadline: returnClaimEligibility.eligible ? returnClaimEligibility.deadline : null,
            policyWindowDays: 5,
        },
    };
}

function validateShippingAddress(address: ShippingAddressInput): string | null {
    if (!address?.firstName?.trim() || !address?.lastName?.trim()) {
        return "Please enter your first and last name.";
    }
    if (!address.email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address.email.trim())) {
        return "Please enter a valid email address.";
    }
    if (!address.address?.trim()) return "Street address is required.";
    if (!address.city?.trim() || !address.state?.trim()) return "City and state are required.";
    if (!address.zipCode?.trim()) return "Postal code is required.";
    if (!address.country?.trim()) return "Country is required.";
    const phoneDigits = String(address.phone || "").replace(/\D/g, "");
    if (phoneDigits.length < 10) return "Please enter a valid phone number.";
    if (address.country.trim().toLowerCase() === "india" && !/^\d{6}$/.test(address.zipCode.trim())) {
        return "Indian pincode must be exactly 6 digits.";
    }
    return null;
}

async function buildCheckoutDraft(items: CheckoutItemInput[], couponCode?: string) {
    if (!Array.isArray(items) || items.length === 0) {
        throw new Error("Your cart is empty.");
    }

    const productIds = [...new Set(items.map((item) => item.id))];
    const [products, activeOffer, variants] = await Promise.all([
        prisma.product.findMany({
            where: { id: { in: productIds } },
            select: {
                id: true,
                name: true,
                price: true,
                compareAtPrice: true,
                stockStatus: true,
                tshirtColor: true,
                availableColors: true,
                status: true,
                artistId: true,
            },
        }),
        getActiveSpecialOffer(),
        prisma.productVariant.findMany({
            where: { productId: { in: productIds } },
            select: {
                productId: true,
                color: true,
                size: true,
                stockStatus: true,
            },
        }),
    ]);

    const productsById = new Map(products.map((product) => [product.id, product]));
    const variantsByProductId = new Map<string, typeof variants>();
    variants.forEach((variant) => {
        const bucket = variantsByProductId.get(variant.productId) || [];
        bucket.push(variant);
        variantsByProductId.set(variant.productId, bucket);
    });
    const validatedItems = [];
    let subtotal = 0;

    for (const item of items) {
        if (!item?.id) throw new Error("A cart item is missing its product id.");
        if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
            throw new Error("Each cart item must have a quantity of at least 1.");
        }
        if (!String(item.size || "").trim()) throw new Error("Each cart item must include a size.");
        if (!String(item.color || "").trim()) throw new Error("Each cart item must include a color.");

        const product = productsById.get(item.id);
        if (!product || product.status !== "PUBLISHED") {
            throw new Error(`Product ${item.id} is no longer available.`);
        }

        const allowedColors = product.availableColors?.length ? product.availableColors : [product.tshirtColor];
        if (!allowedColors.includes(item.color)) {
            throw new Error(`${product.name} is no longer available in the selected color.`);
        }

        const productVariants = variantsByProductId.get(product.id) || [];
        if (productVariants.length > 0) {
            const variant = productVariants.find(
                (entry) => entry.color === item.color && entry.size === item.size
            );
            if (!variant) {
                throw new Error(`${product.name} is not available in ${item.color} / ${item.size}.`);
            }
            if (variant.stockStatus === "OUT_OF_STOCK") {
                throw new Error(
                    `${product.name} is currently out of stock in ${item.color} / ${item.size}.`
                );
            }
        } else {
            if (product.stockStatus === "OUT_OF_STOCK") {
                throw new Error(`${product.name} is currently out of stock.`);
            }
        }

        const { price: finalUnitPrice } = calculateProductPrice(product, activeOffer);
        const lineTotal = finalUnitPrice * item.quantity;
        const artistShareAmount = Number((lineTotal * ARTIST_COMMISSION_RATE).toFixed(2));
        const platformFeeAmount = Number((lineTotal - artistShareAmount).toFixed(2));

        subtotal += lineTotal;
        validatedItems.push({
            productId: product.id,
            artistId: product.artistId,
            quantity: item.quantity,
            price: finalUnitPrice,
            size: item.size,
            color: item.color,
            artistShareAmount,
            platformFeeAmount,
            pricingSnapshot: {
                productName: product.name,
                basePrice: product.price,
                compareAtPrice: product.compareAtPrice,
                finalUnitPrice,
                quantity: item.quantity,
                size: item.size,
                color: item.color,
                activeOfferDiscountPercent: activeOffer?.discountPercent ?? null,
                activeOfferCategoryName: activeOffer?.categoryName ?? null,
                inventorySource: productVariants.length > 0 ? "variant" : "product",
                stockStatus:
                    productVariants.length > 0
                        ? productVariants.find(
                              (entry) => entry.color === item.color && entry.size === item.size
                          )?.stockStatus || null
                        : product.stockStatus,
            },
        });
    }

    let discountAmount = 0;
    let appliedCouponCode: string | null = null;

    if (couponCode?.trim()) {
        const coupon = await prisma.coupon.findUnique({
            where: { code: couponCode.trim().toUpperCase() },
        });

        if (!coupon || !coupon.isActive) {
            throw new Error("This coupon is invalid or inactive.");
        }

        discountAmount = Math.round(subtotal * (coupon.discountPercent / 100));
        appliedCouponCode = coupon.code;
    }

    const discountedSubtotal = subtotal - discountAmount;
    const shippingAmount = SHIPPING_AMOUNT;
    const totalAmount = discountedSubtotal + shippingAmount;

    return {
        subtotalAmount: Number(subtotal.toFixed(2)),
        discountAmount,
        shippingAmount,
        totalAmount: Number(totalAmount.toFixed(2)),
        couponCode: appliedCouponCode,
        pricingSnapshot: {
            subtotalAmount: Number(subtotal.toFixed(2)),
            discountAmount,
            shippingAmount,
            totalAmount: Number(totalAmount.toFixed(2)),
            couponCode: appliedCouponCode,
            specialOffer: activeOffer
                ? {
                      id: activeOffer.id,
                      title: activeOffer.title,
                      categoryName: activeOffer.categoryName,
                      discountPercent: activeOffer.discountPercent,
                  }
                : null,
        },
        validatedItems,
    };
}

router.get("/artist/recent", requireUser, async (req: Request, res: Response) => {
    try {
        const user = res.locals.user;
        const limit = parseInt(req.query.limit as string) || 5;

        const recentOrders = await prisma.order.findMany({
            where: {
                items: {
                    some: {
                        product: {
                            artistId: user.id,
                        },
                    },
                },
            },
            include: {
                user: {
                    select: {
                        name: true,
                        displayName: true,
                    },
                },
                items: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                name: true,
                                price: true,
                                artistId: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
            take: limit,
        });

        const formattedOrders = recentOrders.map((order) => {
            const artistItem = order.items.find((item) => item.product.artistId === user.id);

            return {
                id: `#${order.id.slice(0, 8).toUpperCase()}`,
                rawId: order.id,
                product: artistItem ? artistItem.product.name : "Multiple Products",
                customer: order.user?.displayName || order.user?.name || "Guest",
                date: order.createdAt.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                }),
                amount: `₹${artistItem ? (artistItem.price * artistItem.quantity).toFixed(2) : order.totalAmount.toFixed(2)}`,
                status: order.status,
            };
        });

        res.json({
            status: "success",
            data: { orders: formattedOrders },
        });
    } catch (error) {
        console.error("Error fetching artist recent orders:", error);
        res.status(500).json({ error: "Failed to fetch recent orders" });
    }
});

router.get("/my-orders", requireUser, async (req: Request, res: Response) => {
    try {
        const user = res.locals.user;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        await cleanupExpiredPendingOrders(prisma);

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
                    payment: true,
                    shippingAddress: true,
                    returnClaim: {
                        include: {
                            reviewedByAdmin: {
                                select: { id: true, name: true, email: true },
                            },
                        },
                    },
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
                orders: orders.map(formatCustomerOrder),
                pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
            },
        });
    } catch (error) {
        console.error("Error fetching orders:", error);
        res.status(500).json({ error: "Failed to fetch orders" });
    }
});

router.post(
    "/:id/return-claim",
    requireUser,
    upload.array("evidence", 3),
    async (req: Request, res: Response): Promise<any> => {
        const user = res.locals.user;
        const { id } = req.params;
        const reason = String(req.body.reason || "").trim().toUpperCase();
        const description = sanitizeClaimDescription(String(req.body.description || ""));
        const files = (req.files as Express.Multer.File[] | undefined) || [];

        try {
            if (!isReturnClaimReason(reason)) {
                return badRequest(res, "Please choose a valid return claim reason.");
            }

            if (description.length < 20) {
                return badRequest(
                    res,
                    "Please add at least 20 characters describing the delivery issue."
                );
            }

            const order = await prisma.order.findFirst({
                where: { id, userId: user.id },
                include: { returnClaim: true },
            });

            if (!order) {
                return res.status(404).json({
                    status: "fail",
                    message: "Order not found for the authenticated user.",
                });
            }

            const eligibility = getReturnClaimEligibility({
                status: order.status,
                deliveredAt: order.updatedAt,
                hasExistingClaim: Boolean(order.returnClaim),
            });

            if (!eligibility.eligible) {
                return badRequest(res, eligibility.message);
            }

            const uploadedEvidence = await uploadReturnClaimEvidence(files);

            const claim = await prisma.orderReturnClaim.create({
                data: {
                    orderId: order.id,
                    customerId: user.id,
                    reason,
                    status: "OPEN",
                    description,
                    evidenceUrls: uploadedEvidence.evidenceUrls,
                    evidenceKeys: uploadedEvidence.evidenceKeys,
                },
                include: {
                    reviewedByAdmin: {
                        select: { id: true, name: true, email: true },
                    },
                    order: {
                        select: { status: true, updatedAt: true },
                    },
                },
            });

            sendAdminReturnClaimNotification({
                orderIdFull: order.id,
                orderRef: order.id.slice(0, 8).toUpperCase(),
                customerName: user.name || user.displayName || "Customer",
                customerEmail: user.email,
                reason: reason.replaceAll("_", " "),
                description,
            }).catch((emailError) => {
                console.error("Error sending admin return claim notification:", emailError);
            });

            return res.status(201).json({
                status: "success",
                message: "Return claim submitted. Our team will review it shortly.",
                data: { claim: buildReturnClaimView(claim) },
            });
        } catch (error: any) {
            console.error("Error creating return claim:", error);
            return res.status(500).json({
                status: "error",
                message: "Failed to submit the return claim.",
            });
        }
    }
);

router.post("/checkout", requireUser, async (req: Request, res: Response): Promise<any> => {
    const user = res.locals.user;
    const { items, shippingAddress, couponCode } = req.body as {
        items: CheckoutItemInput[];
        shippingAddress: ShippingAddressInput;
        couponCode?: string;
    };

    try {
        const shippingError = validateShippingAddress(shippingAddress);
        if (shippingError) {
            return badRequest(res, shippingError);
        }
        await cleanupExpiredPendingOrders(prisma);

        if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
            return res.status(500).json({
                status: "error",
                message: "Razorpay is not configured on the server.",
            });
        }

        const checkoutDraft = await buildCheckoutDraft(items, couponCode);
        const orderId = crypto.randomUUID();
        const razorpayOrder = await razorpay.orders.create({
            amount: Math.round(checkoutDraft.totalAmount * 100),
            currency: "INR",
            receipt: orderId,
            notes: {
                internalOrderId: orderId,
                userId: user.id,
                couponCode: checkoutDraft.couponCode || "",
            },
        });

        await prisma.$transaction(async (tx) => {
            await tx.order.create({
                data: {
                    id: orderId,
                    userId: user.id,
                    subtotalAmount: checkoutDraft.subtotalAmount,
                    shippingAmount: checkoutDraft.shippingAmount,
                    totalAmount: checkoutDraft.totalAmount,
                    currency: "inr",
                    status: "PENDING",
                    paymentStatusSnapshot: "PENDING",
                    paymentIntentId: razorpayOrder.id,
                    couponCode: checkoutDraft.couponCode,
                    discountAmount: checkoutDraft.discountAmount,
                    pricingSnapshot: checkoutDraft.pricingSnapshot,
                    shippingAddress: {
                        create: {
                            name: `${shippingAddress.firstName.trim()} ${shippingAddress.lastName.trim()}`,
                            line1: shippingAddress.address.trim(),
                            city: shippingAddress.city.trim(),
                            state: shippingAddress.state.trim(),
                            postalCode: shippingAddress.zipCode.trim(),
                            country: shippingAddress.country.trim(),
                            phone: shippingAddress.phone?.trim() || null,
                        },
                    },
                    items: {
                        create: checkoutDraft.validatedItems,
                    },
                },
            });

            await tx.payment.create({
                data: {
                    orderId,
                    amount: checkoutDraft.totalAmount,
                    currency: "inr",
                    provider: "RAZORPAY",
                    status: "PENDING",
                    paymentIntentId: razorpayOrder.id,
                    gatewayOrderId: razorpayOrder.id,
                    gatewayPayload: JSON.parse(JSON.stringify(razorpayOrder)),
                },
            });
        });

        res.json({
            status: "success",
            data: {
                orderId,
                razorpayOrderId: razorpayOrder.id,
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency,
                keyId: process.env.RAZORPAY_KEY_ID,
                orderSummary: {
                    subtotal: checkoutDraft.subtotalAmount,
                    discount: checkoutDraft.discountAmount,
                    shipping: checkoutDraft.shippingAmount,
                    total: checkoutDraft.totalAmount,
                    couponCode: checkoutDraft.couponCode,
                },
                customer: {
                    name: `${shippingAddress.firstName.trim()} ${shippingAddress.lastName.trim()}`,
                    email: shippingAddress.email.trim(),
                    contact: shippingAddress.phone.replace(/\D/g, ""),
                },
            },
        });
    } catch (error: any) {
        console.error("Error creating checkout session:", error);
        res.status(400).json({
            status: "fail",
            message: error?.message || "Failed to create payment session.",
        });
    }
});

router.post("/checkout/verify", requireUser, async (req: Request, res: Response): Promise<any> => {
    const user = res.locals.user;
    const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body as {
        orderId?: string;
        razorpayOrderId?: string;
        razorpayPaymentId?: string;
        razorpaySignature?: string;
    };

    if (!orderId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
        return badRequest(res, "Missing Razorpay payment verification fields.");
    }

    if (!process.env.RAZORPAY_KEY_SECRET) {
        return res.status(500).json({
            status: "error",
            message: "Razorpay verification is not configured on the server.",
        });
    }

    try {
        const order = await prisma.order.findFirst({
            where: { id: orderId, userId: user.id },
            include: {
                payment: true,
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
        });

        if (!order || !order.payment) {
            return res.status(404).json({
                status: "fail",
                message: "Order not found for the authenticated user.",
            });
        }

        if (order.paymentIntentId !== razorpayOrderId || order.payment.paymentIntentId !== razorpayOrderId) {
            return badRequest(res, "Razorpay order id does not match the stored payment session.");
        }

        if (order.payment.status === "SUCCEEDED" && order.payment.gatewayPaymentId === razorpayPaymentId) {
            return res.json({
                status: "success",
                data: {
                    order: {
                        id: order.id,
                        status: order.status,
                        totalAmount: order.totalAmount,
                        items: order.items,
                        shippingAddress: order.shippingAddress,
                    },
                },
            });
        }

        if (
            order.payment.gatewayPaymentId &&
            order.payment.gatewayPaymentId !== razorpayPaymentId &&
            order.payment.status === "SUCCEEDED"
        ) {
            return res.status(409).json({
                status: "fail",
                message: "This order has already been verified with a different payment id.",
            });
        }

        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(`${razorpayOrderId}|${razorpayPaymentId}`)
            .digest("hex");

        if (expectedSignature !== razorpaySignature) {
            return badRequest(res, "Payment signature verification failed.");
        }

        const transition = await prisma.$transaction(async (tx) => {
            return markOrderPaidAfterInventoryCheck(tx, {
                orderId: order.id,
                gatewayOrderId: razorpayOrderId,
                gatewayPaymentId: razorpayPaymentId,
                gatewaySignature: razorpaySignature,
                gatewayPayload: {
                    verificationSource: "client_callback",
                    razorpayOrderId,
                    razorpayPaymentId,
                },
                verifiedAt: new Date(),
                capturedAt: new Date(),
            });
        });
        const updatedOrder = transition.updatedOrder;

        res.json({
            status: "success",
            data: {
                order: {
                    id: updatedOrder.id,
                    status: updatedOrder.status,
                    totalAmount: updatedOrder.totalAmount,
                    items: updatedOrder.items,
                    shippingAddress: updatedOrder.shippingAddress,
                },
                payment: {
                    id: updatedOrder.payment?.id,
                    status: updatedOrder.payment?.status,
                    razorpayOrderId,
                    razorpayPaymentId,
                },
            },
        });
    } catch (error: any) {
        console.error("Error verifying payment:", error);
        if (error?.message?.includes("Inventory no longer available")) {
            return res.status(409).json({
                status: "fail",
                message:
                    "This product went out of stock while your payment was being confirmed. Please contact support if you were charged.",
            });
        }
        res.status(500).json({ status: "error", message: "Failed to verify payment." });
    }
});

export default router;

