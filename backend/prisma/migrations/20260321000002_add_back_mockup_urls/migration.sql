-- Add back mockup image fields to Product table
ALTER TABLE "Product" ADD COLUMN "backMockupImageUrl" TEXT;
ALTER TABLE "Product" ADD COLUMN "backMockupFileKey" TEXT;
