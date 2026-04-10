/**
 * Tailwind classes for t-shirt mockups in listings/cards/cart — same vertical anchor as the customer PDP hero.
 * Compose with hover/scale: e.g. `${STOREFRONT_TEE_MOCKUP_IMAGE_CLASS} group-hover:scale-105 transition-transform`.
 */
export const STOREFRONT_TEE_MOCKUP_IMAGE_CLASS = "object-cover object-[center_30%]";

export function canonicalHex(hex: string): string {
    const s = (hex || "").trim().toLowerCase().replace(/^#/, "").replace(/[^0-9a-f]/g, "");
    return s ? `#${s}` : "#ffffff";
}

type MockupProductLike = {
    mockupImageUrl: string;
    /** Product-level back mockup when per-color map has no `back` */
    backMockupImageUrl?: string;
    colorMockups?: Record<string, { front?: string; back?: string }> | null;
    primaryColor?: string;
    tshirtColor: string;
};

/** Resolve front mockup URL for a fabric color (matches PDP logic). */
export function frontMockupUrl(product: MockupProductLike, colorRef: string): string {
    const map = product.colorMockups;
    const c = canonicalHex(colorRef || product.primaryColor || product.tshirtColor);
    let entry: { front?: string; back?: string } | null = null;
    if (map && typeof map === "object") {
        const direct = map[c] ?? map[colorRef];
        if (direct?.front) entry = direct;
        else {
            for (const k of Object.keys(map)) {
                if (canonicalHex(k) === c) {
                    entry = map[k];
                    break;
                }
            }
        }
    }
    return entry?.front || product.mockupImageUrl;
}

/** Resolve back mockup URL for a fabric color (matches PDP displayMockups.back). */
export function backMockupUrl(product: MockupProductLike, colorRef: string): string {
    const map = product.colorMockups;
    const c = canonicalHex(colorRef || product.primaryColor || product.tshirtColor);
    let entry: { front?: string; back?: string } | null = null;
    if (map && typeof map === "object") {
        const direct = map[c] ?? map[colorRef];
        if (direct?.back) entry = direct;
        else {
            for (const k of Object.keys(map)) {
                if (canonicalHex(k) === c) {
                    entry = map[k];
                    break;
                }
            }
        }
    }
    const perColorBack = entry?.back;
    if (perColorBack) return perColorBack;
    if (product.backMockupImageUrl) return product.backMockupImageUrl;
    return frontMockupUrl(product, colorRef);
}

export type CartThumbnailInput = {
    image: string;
    color: string;
    mockupView?: "front" | "back";
    mockupImageUrl?: string;
    backMockupImageUrl?: string;
    colorMockups?: Record<string, { front?: string; back?: string }> | null;
    primaryColor?: string;
    defaultProductColor?: string;
};

/** Cart / checkout thumbnail: respects selected front vs back and current color. */
export function cartItemThumbnail(item: CartThumbnailInput): string {
    const base: MockupProductLike = {
        mockupImageUrl: item.mockupImageUrl || item.image,
        backMockupImageUrl: item.backMockupImageUrl,
        colorMockups: item.colorMockups,
        primaryColor: item.primaryColor,
        tshirtColor: item.defaultProductColor || item.color,
    };
    const view = item.mockupView === "back" ? "back" : "front";
    if (view === "back") {
        return backMockupUrl(base, item.color);
    }
    return frontMockupUrl(base, item.color);
}

/** Whether a line item can show a back view (same idea as PDP hasBackView). */
export function cartLineHasBackMockup(item: CartThumbnailInput): boolean {
    const base: MockupProductLike = {
        mockupImageUrl: item.mockupImageUrl || item.image,
        backMockupImageUrl: item.backMockupImageUrl,
        colorMockups: item.colorMockups,
        primaryColor: item.primaryColor,
        tshirtColor: item.defaultProductColor || item.color,
    };
    const b = backMockupUrl(base, item.color);
    const f = frontMockupUrl(base, item.color);
    return Boolean(b && b !== f);
}
