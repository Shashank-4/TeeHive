/** Default horizontal wordmark when admin `site_banners.headerLogo` is empty or unset. */
export const SITE_HEADER_LOGO_FALLBACK_SRC = "/assets/logoHorizontalBlack.svg";

export function resolveSiteHeaderLogoSrc(raw: unknown): string {
    if (typeof raw !== "string") return SITE_HEADER_LOGO_FALLBACK_SRC;
    const t = raw.trim();
    return t.length > 0 ? t : SITE_HEADER_LOGO_FALLBACK_SRC;
}
