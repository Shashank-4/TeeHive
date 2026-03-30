-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "OrderStatus" ADD VALUE 'IN_TRANSIT';
ALTER TYPE "OrderStatus" ADD VALUE 'UNDELIVERED_1';
ALTER TYPE "OrderStatus" ADD VALUE 'UNDELIVERED_2';
ALTER TYPE "OrderStatus" ADD VALUE 'UNDELIVERED_3';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "PaymentStatus" ADD VALUE 'PAID';
ALTER TYPE "PaymentStatus" ADD VALUE 'CANCELLED';
ALTER TYPE "PaymentStatus" ADD VALUE 'REFUNDED';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "artistRating" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
ADD COLUMN     "reviewCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "GlobalColor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "hex" TEXT NOT NULL,
    "mockupUrl" TEXT NOT NULL,
    "fileKey" TEXT NOT NULL,
    "shadowMapUrl" TEXT,
    "shadowMapKey" TEXT,
    "displacementMapUrl" TEXT,
    "displacementMapKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GlobalColor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "artistId" TEXT NOT NULL,
    "productRating" INTEGER NOT NULL,
    "artistRating" INTEGER NOT NULL,
    "feedback" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_GlobalColorToProduct" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "GlobalColor_name_key" ON "GlobalColor"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Review_orderId_productId_key" ON "Review"("orderId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "_GlobalColorToProduct_AB_unique" ON "_GlobalColorToProduct"("A", "B");

-- CreateIndex
CREATE INDEX "_GlobalColorToProduct_B_index" ON "_GlobalColorToProduct"("B");

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GlobalColorToProduct" ADD CONSTRAINT "_GlobalColorToProduct_A_fkey" FOREIGN KEY ("A") REFERENCES "GlobalColor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GlobalColorToProduct" ADD CONSTRAINT "_GlobalColorToProduct_B_fkey" FOREIGN KEY ("B") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
