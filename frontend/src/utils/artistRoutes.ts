/** Public storefront path: prefer slug; fall back to legacy UUID. */
export function artistPublicPath(artist: {
    id: string;
    artistSlug?: string | null;
}): string {
    const slug = artist.artistSlug?.trim();
    if (slug) return `/artists/${encodeURIComponent(slug)}`;
    return `/artists/${artist.id}`;
}
