import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";
import { sendOrderConfirmationEmail, sendAdminOrderNotification } from "../services/email.service";

const router = Router();
const prisma = new PrismaClient();

const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET!;

router.post("/razorpay", async (req: Request, res: Response): Promise<any> => {
    // 1. Validate Signature
    const signature = req.headers["x-razorpay-signature"] as string;

    if (!signature) {
        return res.status(400).json({ error: "Missing signature" });
    }

    const shasum = crypto.createHmac("sha256", RAZORPAY_WEBHOOK_SECRET);
    shasum.update(JSON.stringify(req.body));
    const digest = shasum.digest("hex");

    if (digest !== signature) {
        console.error("Invalid webhook signature");
        return res.status(400).json({ error: "Invalid signature" });
    }

    const event = req.body;
    console.log(`Received Razorpay webhook event: ${event.event}`);

    try {
        if (event.event === "payment.captured" || event.event === "order.paid") {
            const paymentEntity = event.payload.payment.entity;
            const orderEntity = event.payload.order.entity;

            // Razorpay "order_id" corresponds to our "paymentIntentId" in Order/Payment models
            const razorpayOrderId = paymentEntity.order_id;

            console.log(`Processing successful payment for order: ${razorpayOrderId}`);

            // Update Order Status
            const updatedOrder = await prisma.order.update({
                where: { paymentIntentId: razorpayOrderId },
                data: { status: "PAID" },
                include: {
                    user: true,
                    items: {
                        include: { product: true }
                    }
                }
            });

            // Send Confirmation Emails
            if (updatedOrder && updatedOrder.user) {
                const productSummary = updatedOrder.items.map(item => `${item.quantity}x ${item.product.name}`).join(", ");
                
                // Email to Customer
                sendOrderConfirmationEmail(
                    updatedOrder.user.email,
                    updatedOrder.user.name || "Customer",
                    {
                        orderId: updatedOrder.id.slice(0, 8).toUpperCase(),
                        items: productSummary,
                        total: updatedOrder.totalAmount.toFixed(2)
                    }
                ).catch(err => console.error("Error sending order confirmation:", err));

                // Email to Admin
                sendAdminOrderNotification({
                    orderId: updatedOrder.id.slice(0, 8).toUpperCase(),
                    customerName: updatedOrder.user.name || updatedOrder.user.displayName || "Customer",
                    total: updatedOrder.totalAmount.toFixed(2)
                }).catch(err => console.error("Error sending admin notification:", err));
            }

            // Update Payment Status
            await prisma.payment.update({
                where: { paymentIntentId: razorpayOrderId },
                data: { status: "SUCCEEDED" },
            });
        } else if (event.event === "payment.failed") {
            const paymentEntity = event.payload.payment.entity;
            const razorpayOrderId = paymentEntity.order_id;

            console.log(`Processing failed payment for order: ${razorpayOrderId}`);

            await prisma.payment.update({
                where: { paymentIntentId: razorpayOrderId },
                data: { status: "FAILED" },
            });
        }

        res.json({ status: "ok" });
    } catch (error) {
        console.error("Error processing webhook:", error);
        res.status(500).json({ error: "Webhook processing failed" });
    }
});

export default router;
