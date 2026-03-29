-- Add primaryColor and primaryView to Product table
ALTER TABLE "Product" ADD COLUMN "primaryColor" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Product" ADD COLUMN "primaryView" TEXT NOT NULL DEFAULT 'front';
