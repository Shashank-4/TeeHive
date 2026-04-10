import { PrismaClient, type Prisma } from "@prisma/client";
import {
    findVariantForLine,
    isGlobalMatrixOutOfStock,
    parseGlobalInventoryMatrix,
} from "./cartAvailability.service";

type DbClient = PrismaClient | Prisma.TransactionClient;

const PENDING_ORDER_TTL_MINUTES = 30;

export async function cleanupExpiredPendingOrders(db: DbClient) {
    const cutoff = new Date(Date.now() - PENDING_ORDER_TTL_MINUTES * 60 * 1000);
    const expired = await db.order.findMany({
        where: {
            status: "PENDING",
            createdAt: { lt: cutoff },
            OR: [
                { payment: { is: null } },
                { payment: { is: { status: "PENDING" } } },
            ],
        },
        select: { id: true },
    });

    if (expired.length === 0) return 0;
    const ids = expired.map((order) => order.id);

    await db.order.updateMany({
        where: { id: { in: ids }, status: "PENDING" },
        data: {
            status: "CANCELLED",
            cancelReason: "Payment session expired before confirmation",
            cancelledAt: new Date(),
            paymentStatusSnapshot: "CANCELLED",
        },
    });

    await db.payment.updateMany({
        where: { orderId: { in: ids }, status: "PENDING" },
        data: { status: "CANCELLED" },
    });

    return ids.length;
}

type SuccessfulPaymentInput = {
    orderId: string;
    gatewayOrderId?: string | null;
    gatewayPaymentId?: string | null;
    gatewaySignature?: string | null;
    paymentMethod?: string | null;
    gatewayPayload?: Prisma.InputJsonValue;
    verifiedAt?: Date;
    capturedAt?: Date;
};

export async function markOrderPaidAfterInventoryCheck(
    db: DbClient,
    input: SuccessfulPaymentInput
) {
    const now = new Date();
    const order = await db.order.findUnique({
        where: { id: input.orderId },
        include: {
            payment: true,
            items: {
                include: {
                    product: {
                        include: {
                            artist: true,
                            variants: true,
                        },
                    },
                },
            },
            shippingAddress: true,
            user: true,
        },
    });

    if (!order || !order.payment) {
        throw new Error("Order or payment record not found for paid transition.");
    }

    if (order.status === "PAID" && order.payment.status === "SUCCEEDED") {
        return { updatedOrder: order, alreadyProcessed: true };
    }

    const matrixRow = await db.siteConfig.findUnique({ where: { key: "global_inventory" } });
    const globalMatrix = parseGlobalInventoryMatrix(matrixRow?.value);

    for (const item of order.items) {
        const productHasVariants = item.product.variants.length > 0;

        if (
            isGlobalMatrixOutOfStock(globalMatrix, item.color, item.size)
        ) {
            throw new Error(
                `Inventory no longer available for ${item.color} / ${item.size} (global inventory) during payment confirmation.`
            );
        }

        if (productHasVariants) {
            const variant = findVariantForLine(item.product.variants, item.color, item.size);
            if (!variant || variant.stockStatus === "OUT_OF_STOCK") {
                throw new Error(
                    `Inventory no longer available for variant ${item.color} / ${item.size} during payment confirmation.`
                );
            }
        } else if (item.product.stockStatus === "OUT_OF_STOCK") {
            throw new Error(`Inventory no longer available for product ${item.productId} during payment confirmation.`);
        }
    }

    await db.payment.update({
        where: { id: order.payment.id },
        data: {
            status: "SUCCEEDED",
            gatewayOrderId: input.gatewayOrderId ?? order.payment.gatewayOrderId,
            gatewayPaymentId: input.gatewayPaymentId ?? order.payment.gatewayPaymentId,
            gatewaySignature: input.gatewaySignature ?? order.payment.gatewaySignature,
            paymentMethod: input.paymentMethod ?? order.payment.paymentMethod,
            verifiedAt: order.payment.verifiedAt ?? input.verifiedAt ?? now,
            capturedAt: order.payment.capturedAt ?? input.capturedAt ?? now,
            gatewayPayload: input.gatewayPayload ?? order.payment.gatewayPayload ?? undefined,
        },
    });

    await db.order.update({
        where: { id: order.id },
        data: {
            status: "PAID",
            paymentStatusSnapshot: "SUCCEEDED",
            paymentVerifiedAt: order.paymentVerifiedAt ?? input.verifiedAt ?? now,
            paidAt: order.paidAt ?? input.capturedAt ?? now,
        },
    });

    const updatedOrder = await db.order.findUniqueOrThrow({
        where: { id: order.id },
        include: {
            payment: true,
            items: {
                include: {
                    product: {
                        select: {
                            id: true,
                            name: true,
                            mockupImageUrl: true,
                            artist: { select: { id: true, name: true, email: true, displayName: true } },
                        },
                    },
                },
            },
            shippingAddress: true,
            user: true,
        },
    });

    return { updatedOrder, alreadyProcessed: false };
}
