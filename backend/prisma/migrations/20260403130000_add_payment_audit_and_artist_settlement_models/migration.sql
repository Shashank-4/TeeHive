-- CreateEnum
CREATE TYPE "WebhookProcessingStatus" AS ENUM ('RECEIVED', 'PROCESSED', 'IGNORED', 'FAILED');

-- CreateEnum
CREATE TYPE "PayoutMethodType" AS ENUM ('UPI', 'BANK_ACCOUNT');

-- CreateEnum
CREATE TYPE "PayoutVerificationStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'VERIFIED', 'REJECTED', 'REQUIRES_RESUBMISSION', 'DISABLED');

-- CreateEnum
CREATE TYPE "PayoutReviewAction" AS ENUM ('APPROVED', 'REJECTED', 'REQUIRES_RESUBMISSION');

-- CreateEnum
CREATE TYPE "ArtistSettlementStatus" AS ENUM ('PENDING', 'APPROVED', 'PROCESSING', 'PAID', 'FAILED', 'CANCELLED');

-- AlterTable
ALTER TABLE "Order"
ADD COLUMN "subtotalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN "shippingAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'inr',
ADD COLUMN "paymentStatusSnapshot" "PaymentStatus",
ADD COLUMN "pricingVersion" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN "pricingSnapshot" JSONB,
ADD COLUMN "paymentVerifiedAt" TIMESTAMP(3),
ADD COLUMN "paidAt" TIMESTAMP(3),
ADD COLUMN "cancelledAt" TIMESTAMP(3),
ADD COLUMN "cancelReason" TEXT;

-- AlterTable
ALTER TABLE "OrderItem"
ADD COLUMN "artistId" TEXT,
ADD COLUMN "artistShareAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN "platformFeeAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN "pricingSnapshot" JSONB;

-- AlterTable
ALTER TABLE "Payment"
ADD COLUMN "gatewayOrderId" TEXT,
ADD COLUMN "gatewayPaymentId" TEXT,
ADD COLUMN "gatewaySignature" TEXT,
ADD COLUMN "paymentMethod" TEXT,
ADD COLUMN "failureCode" TEXT,
ADD COLUMN "failureDescription" TEXT,
ADD COLUMN "verifiedAt" TIMESTAMP(3),
ADD COLUMN "capturedAt" TIMESTAMP(3),
ADD COLUMN "refundedAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN "refundReference" TEXT,
ADD COLUMN "gatewayPayload" JSONB;

-- CreateTable
CREATE TABLE "PaymentWebhookEvent" (
    "id" TEXT NOT NULL,
    "provider" "PaymentProvider" NOT NULL DEFAULT 'RAZORPAY',
    "providerEventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "signature" TEXT,
    "payload" JSONB NOT NULL,
    "payloadHash" TEXT,
    "status" "WebhookProcessingStatus" NOT NULL DEFAULT 'RECEIVED',
    "errorMessage" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "orderId" TEXT,
    "paymentId" TEXT,

    CONSTRAINT "PaymentWebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArtistPayoutMethod" (
    "id" TEXT NOT NULL,
    "artistId" TEXT NOT NULL,
    "methodType" "PayoutMethodType" NOT NULL,
    "verificationStatus" "PayoutVerificationStatus" NOT NULL DEFAULT 'DRAFT',
    "upiId" TEXT,
    "upiName" TEXT,
    "bankAccountName" TEXT,
    "bankAccountNumberEncrypted" TEXT,
    "bankAccountNumberLast4" TEXT,
    "bankIfsc" TEXT,
    "bankName" TEXT,
    "methodFingerprint" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "submittedAt" TIMESTAMP(3),
    "verifiedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "verificationNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArtistPayoutMethod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArtistPayoutReview" (
    "id" TEXT NOT NULL,
    "payoutMethodId" TEXT NOT NULL,
    "artistId" TEXT NOT NULL,
    "reviewerAdminId" TEXT NOT NULL,
    "action" "PayoutReviewAction" NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArtistPayoutReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArtistSettlement" (
    "id" TEXT NOT NULL,
    "artistId" TEXT NOT NULL,
    "payoutMethodId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'inr',
    "status" "ArtistSettlementStatus" NOT NULL DEFAULT 'PENDING',
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "bankReference" TEXT,
    "notes" TEXT,
    "processedByAdminId" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArtistSettlement_pkey" PRIMARY KEY ("id")
);

-- Backfill
UPDATE "Order"
SET "subtotalAmount" = "totalAmount"
WHERE "subtotalAmount" = 0;

UPDATE "Payment"
SET "gatewayOrderId" = "paymentIntentId"
WHERE "gatewayOrderId" IS NULL;

UPDATE "Order"
SET "paymentStatusSnapshot" = p."status"
FROM "Payment" p
WHERE p."orderId" = "Order"."id"
  AND "Order"."paymentStatusSnapshot" IS NULL;

UPDATE "OrderItem" oi
SET "artistId" = p."artistId"
FROM "Product" p
WHERE oi."productId" = p."id"
  AND oi."artistId" IS NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Payment_gatewayOrderId_key" ON "Payment"("gatewayOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_gatewayPaymentId_key" ON "Payment"("gatewayPaymentId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentWebhookEvent_provider_providerEventId_key" ON "PaymentWebhookEvent"("provider", "providerEventId");

-- CreateIndex
CREATE INDEX "PaymentWebhookEvent_orderId_idx" ON "PaymentWebhookEvent"("orderId");

-- CreateIndex
CREATE INDEX "PaymentWebhookEvent_paymentId_idx" ON "PaymentWebhookEvent"("paymentId");

-- CreateIndex
CREATE INDEX "PaymentWebhookEvent_eventType_status_idx" ON "PaymentWebhookEvent"("eventType", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ArtistPayoutMethod_artistId_methodFingerprint_key" ON "ArtistPayoutMethod"("artistId", "methodFingerprint");

-- CreateIndex
CREATE INDEX "ArtistPayoutMethod_artistId_verificationStatus_idx" ON "ArtistPayoutMethod"("artistId", "verificationStatus");

-- CreateIndex
CREATE INDEX "ArtistPayoutReview_payoutMethodId_idx" ON "ArtistPayoutReview"("payoutMethodId");

-- CreateIndex
CREATE INDEX "ArtistPayoutReview_artistId_createdAt_idx" ON "ArtistPayoutReview"("artistId", "createdAt");

-- CreateIndex
CREATE INDEX "ArtistSettlement_artistId_status_idx" ON "ArtistSettlement"("artistId", "status");

-- CreateIndex
CREATE INDEX "ArtistSettlement_payoutMethodId_idx" ON "ArtistSettlement"("payoutMethodId");

-- AddForeignKey
ALTER TABLE "OrderItem"
ADD CONSTRAINT "OrderItem_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentWebhookEvent"
ADD CONSTRAINT "PaymentWebhookEvent_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentWebhookEvent"
ADD CONSTRAINT "PaymentWebhookEvent_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArtistPayoutMethod"
ADD CONSTRAINT "ArtistPayoutMethod_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArtistPayoutReview"
ADD CONSTRAINT "ArtistPayoutReview_payoutMethodId_fkey" FOREIGN KEY ("payoutMethodId") REFERENCES "ArtistPayoutMethod"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArtistPayoutReview"
ADD CONSTRAINT "ArtistPayoutReview_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArtistPayoutReview"
ADD CONSTRAINT "ArtistPayoutReview_reviewerAdminId_fkey" FOREIGN KEY ("reviewerAdminId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArtistSettlement"
ADD CONSTRAINT "ArtistSettlement_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArtistSettlement"
ADD CONSTRAINT "ArtistSettlement_payoutMethodId_fkey" FOREIGN KEY ("payoutMethodId") REFERENCES "ArtistPayoutMethod"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArtistSettlement"
ADD CONSTRAINT "ArtistSettlement_processedByAdminId_fkey" FOREIGN KEY ("processedByAdminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
