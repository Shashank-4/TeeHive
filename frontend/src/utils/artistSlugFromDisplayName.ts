import type { AxiosInstance } from "axios";

/** Turn display name into a URL handle: lowercase, spaces → hyphens, strip invalid chars. */
export function displayNameToArtistSlug(displayName: string): string {
    let s = displayName.trim().toLowerCase();
    s = s.replace(/[\s_]+/g, "-");
    s = s.replace(/[^a-z0-9-]/g, "");
    s = s.replace(/-+/g, "-");
    s = s.replace(/^-+|-+$/g, "");
    if (s.length > 32) s = s.slice(0, 32).replace(/-+$/g, "");
    return s;
}

export function isValidArtistSlugFormatLocal(slug: string): boolean {
    const s = slug.trim().toLowerCase();
    if (s.length < 2 || s.length > 32) return false;
    return /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(s);
}

function tightenSlug(s: string): string {
    return s
        .replace(/-+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 32)
        .replace(/-+$/g, "");
}

/**
 * Pick first available slug derived from display name (tries base, base-2, base-3, …).
 */
export async function allocateSlugFromDisplayName(
    displayName: string,
    api: AxiosInstance,
    excludeUserId?: string
): Promise<string | null> {
    const baseRaw = displayNameToArtistSlug(displayName);
    if (baseRaw.length < 2) return null;
    const base = tightenSlug(baseRaw.slice(0, 32));
    if (base.length < 2) return null;

    for (let n = 0; n < 40; n++) {
        const suffix = n === 0 ? "" : `-${n + 1}`;
        let candidate: string;
        if (n === 0) {
            candidate = base;
        } else {
            const maxBase = Math.max(2, 32 - suffix.length);
            candidate = tightenSlug(base.slice(0, maxBase) + suffix);
        }
        if (!isValidArtistSlugFormatLocal(candidate)) continue;

        const q = new URLSearchParams({ slug: candidate });
        if (excludeUserId) q.set("excludeUserId", excludeUserId);
        const res = await api.get(`/api/artists/check-slug?${q.toString()}`);
        if (res.data?.data?.available === true) return candidate;
    }
    return null;
}
