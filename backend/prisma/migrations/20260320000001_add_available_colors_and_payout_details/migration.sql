-- Add availableColors column to Product table
ALTER TABLE "Product" ADD COLUMN "availableColors" TEXT[] NOT NULL DEFAULT '{}';

-- Add payoutDetails column to User table (stored as JSON)
ALTER TABLE "User" ADD COLUMN "payoutDetails" JSONB;
