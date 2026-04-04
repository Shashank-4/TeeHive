-- CreateEnum
CREATE TYPE "ReturnClaimReason" AS ENUM (
    'DAMAGED_GOODS',
    'WRONG_PRODUCT',
    'WRONG_SIZE',
    'WRONG_COLOR',
    'OTHER_ELIGIBLE_ISSUE'
);

-- CreateEnum
CREATE TYPE "ReturnClaimStatus" AS ENUM (
    'OPEN',
    'UNDER_REVIEW',
    'APPROVED',
    'REJECTED',
    'REFUNDED'
);

-- CreateTable
CREATE TABLE "OrderReturnClaim" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "reason" "ReturnClaimReason" NOT NULL,
    "status" "ReturnClaimStatus" NOT NULL DEFAULT 'OPEN',
    "description" TEXT NOT NULL,
    "evidenceUrls" JSONB,
    "evidenceKeys" JSONB,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewNote" TEXT,
    "reviewedByAdminId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderReturnClaim_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OrderReturnClaim_orderId_key" ON "OrderReturnClaim"("orderId");

-- CreateIndex
CREATE INDEX "OrderReturnClaim_customerId_status_idx" ON "OrderReturnClaim"("customerId", "status");

-- CreateIndex
CREATE INDEX "OrderReturnClaim_status_requestedAt_idx" ON "OrderReturnClaim"("status", "requestedAt");

-- AddForeignKey
ALTER TABLE "OrderReturnClaim"
ADD CONSTRAINT "OrderReturnClaim_orderId_fkey"
FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderReturnClaim"
ADD CONSTRAINT "OrderReturnClaim_customerId_fkey"
FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderReturnClaim"
ADD CONSTRAINT "OrderReturnClaim_reviewedByAdminId_fkey"
FOREIGN KEY ("reviewedByAdminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
