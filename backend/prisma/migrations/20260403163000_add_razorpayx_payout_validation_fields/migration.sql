ALTER TYPE "PayoutVerificationStatus" ADD VALUE IF NOT EXISTS 'PENDING_PROVIDER';

ALTER TABLE "ArtistPayoutMethod"
ADD COLUMN "providerValidationId" TEXT,
ADD COLUMN "providerValidationStatus" TEXT,
ADD COLUMN "providerValidationMode" TEXT,
ADD COLUMN "providerValidationReference" TEXT,
ADD COLUMN "providerContactId" TEXT,
ADD COLUMN "providerFundAccountId" TEXT,
ADD COLUMN "providerRegisteredName" TEXT,
ADD COLUMN "providerNameMatchScore" INTEGER,
ADD COLUMN "providerValidationReason" TEXT,
ADD COLUMN "providerValidationPayload" JSONB,
ADD COLUMN "providerValidatedAt" TIMESTAMP(3),
ADD COLUMN "providerUtr" TEXT;

CREATE UNIQUE INDEX "ArtistPayoutMethod_providerValidationId_key"
ON "ArtistPayoutMethod"("providerValidationId");
