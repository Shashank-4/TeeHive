/** Label shown to customers: trimmed `displayName` when set, otherwise account `name`. */
export function artistPublicDisplayName(artist: { displayName?: string | null; name: string }): string {
    const d = artist.displayName?.trim();
    return d && d.length > 0 ? d : artist.name;
}

/** Public storefront path: prefer slug; fall back to legacy UUID. */
export function artistPublicPath(artist: {
    id: string;
    artistSlug?: string | null;
}): string {
    const slug = artist.artistSlug?.trim();
    if (slug) return `/artists/${encodeURIComponent(slug)}`;
    return `/artists/${artist.id}`;
}
