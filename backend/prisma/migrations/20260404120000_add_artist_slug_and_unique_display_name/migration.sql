-- AlterTable: public storefront slug (nullable until artist sets / backfill)
ALTER TABLE "User" ADD COLUMN "artistSlug" TEXT;

-- Dedupe displayName (case-insensitive) before unique index: keep oldest row, suffix others with id fragment
WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY lower(trim("displayName"))
      ORDER BY "createdAt" ASC
    ) AS rn
  FROM "User"
  WHERE "displayName" IS NOT NULL AND trim("displayName") <> ''
)
UPDATE "User" u
SET "displayName" = trim(u."displayName") || '-' || substr(replace(u.id::text, '-', ''), 1, 8)
FROM ranked r
WHERE u.id = r.id AND r.rn > 1;

-- Unique displayName when set (PostgreSQL allows multiple NULLs)
CREATE UNIQUE INDEX "User_displayName_key" ON "User"("displayName");

-- Backfill slugs for verified artists (id suffix guarantees uniqueness)
UPDATE "User" u
SET "artistSlug" = LEFT(
  concat_ws(
    '-',
    NULLIF(
      trim(both '-' FROM lower(regexp_replace(regexp_replace(
        COALESCE(NULLIF(trim(u."displayName"), ''), NULLIF(trim(u."name"), ''), 'artist'),
        '[^a-zA-Z0-9]+', '-', 'g'
      ), '-+', '-', 'g'))),
      ''
    ),
    substr(replace(u.id::text, '-', ''), 1, 10)
  ),
  48
)
WHERE u."isArtist" = TRUE
  AND u."verificationStatus" = 'VERIFIED'
  AND u."artistSlug" IS NULL;

-- Normalize empty slugs
UPDATE "User"
SET "artistSlug" = 'artist-' || substr(replace(id::text, '-', ''), 1, 12)
WHERE "artistSlug" IS NOT NULL AND trim("artistSlug") IN ('', '-');

CREATE UNIQUE INDEX "User_artistSlug_key" ON "User"("artistSlug");
