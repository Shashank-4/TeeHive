/** True if string looks like a UUID (artist profile may still be loaded by legacy id URLs). */
export function isUuidParam(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        value.trim()
    );
}

const RESERVED_SLUGS = new Set([
    "api",
    "admin",
    "check-slug",
    "artists",
    "products",
    "cart",
    "orders",
    "login",
    "register",
    "hive50",
    "order",
    "user",
    "artist",
]);

export function isReservedArtistSlug(slug: string): boolean {
    return RESERVED_SLUGS.has(slug.trim().toLowerCase());
}

/** Normalize handle for storage / comparison (lowercase, trim). */
export function normalizeArtistSlug(input: string): string {
    return input.trim().toLowerCase();
}

/** Validate format: 2–32 chars, start/end alphanumeric, middle [a-z0-9-]. */
export function isValidArtistSlugFormat(slug: string): boolean {
    const s = normalizeArtistSlug(slug);
    if (s.length < 2 || s.length > 32) return false;
    return /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(s);
}
