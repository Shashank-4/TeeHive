import type { PrismaClient } from "@prisma/client";

/** Aligns with storefront `canonicalHex` so cart lines match Prisma variant rows. */
export function canonicalHex(hex: string): string {
    const s = (hex || "").trim().toLowerCase().replace(/^#/, "").replace(/[^0-9a-f]/g, "");
    return s ? `#${s}` : "#ffffff";
}

export type GlobalInventoryMatrix = Record<string, Record<string, string>>;

export function parseGlobalInventoryMatrix(raw: unknown): GlobalInventoryMatrix | null {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
    return raw as GlobalInventoryMatrix;
}

export function resolveMatrixRowKey(matrix: GlobalInventoryMatrix, colorHex: string): string | null {
    const want = canonicalHex(colorHex);
    for (const k of Object.keys(matrix)) {
        const nk = k.trim().toLowerCase();
        const nkCanon = canonicalHex(nk.startsWith("#") ? nk : `#${nk}`);
        if (nkCanon === want) return k;
    }
    return null;
}

/**
 * Only explicit OUT_OF_STOCK blocks checkout. LOW_STOCK and missing cells do not block
 * (storefront may show a low-stock label only).
 */
export function isGlobalMatrixOutOfStock(
    matrix: GlobalInventoryMatrix | null | undefined,
    colorHex: string,
    size: string
): boolean {
    if (!matrix) return false;
    const rowKey = resolveMatrixRowKey(matrix, colorHex);
    if (!rowKey) return false;
    return matrix[rowKey]?.[size] === "OUT_OF_STOCK";
}

export type CheckoutItemShape = {
    id: string;
    quantity: number;
    size: string;
    color: string;
};

type ProductRow = {
    id: string;
    name: string;
    price: number;
    compareAtPrice: number | null;
    stockStatus: string;
    tshirtColor: string;
    availableColors: string[] | null;
    categories: string[];
    status: string;
    artistId: string;
};

type VariantRow = {
    productId: string;
    color: string;
    size: string;
    stockStatus: string;
};

export type CartValidationContext = {
    productsById: Map<string, ProductRow>;
    variantsByProductId: Map<string, VariantRow[]>;
    globalMatrix: GlobalInventoryMatrix | null;
};

export async function loadCartValidationContext(
    prisma: PrismaClient,
    productIds: string[]
): Promise<CartValidationContext> {
    const [products, variants, matrixRow] = await Promise.all([
        prisma.product.findMany({
            where: { id: { in: productIds } },
            select: {
                id: true,
                name: true,
                price: true,
                compareAtPrice: true,
                stockStatus: true,
                tshirtColor: true,
                availableColors: true,
                categories: true,
                status: true,
                artistId: true,
            },
        }),
        prisma.productVariant.findMany({
            where: { productId: { in: productIds } },
            select: {
                productId: true,
                color: true,
                size: true,
                stockStatus: true,
            },
        }),
        prisma.siteConfig.findUnique({ where: { key: "global_inventory" } }),
    ]);

    const productsById = new Map(products.map((p) => [p.id, p]));
    const variantsByProductId = new Map<string, VariantRow[]>();
    variants.forEach((v) => {
        const bucket = variantsByProductId.get(v.productId) || [];
        bucket.push(v);
        variantsByProductId.set(v.productId, bucket);
    });
    const globalMatrix = parseGlobalInventoryMatrix(matrixRow?.value);

    return { productsById, variantsByProductId, globalMatrix };
}

function colorAllowed(product: ProductRow, itemColor: string): boolean {
    const allowed = product.availableColors?.length ? product.availableColors : [product.tshirtColor];
    const want = canonicalHex(itemColor);
    return allowed.some((c) => canonicalHex(c) === want);
}

export function findVariantForLine(
    productVariants: VariantRow[],
    itemColor: string,
    itemSize: string
): VariantRow | undefined {
    const size = String(itemSize || "").trim();
    const c = canonicalHex(itemColor);
    return productVariants.find(
        (entry) => canonicalHex(entry.color) === c && entry.size === size
    );
}

export type CartLineIssue = {
    productId: string;
    productName: string;
    size: string;
    color: string;
    message: string;
};

/**
 * Returns a customer-facing error message, or null if the line can be sold.
 */
export function validateCheckoutLine(
    item: CheckoutItemShape,
    ctx: CartValidationContext
): string | null {
    if (!item?.id) return "A cart item is missing its product id.";
    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
        return "Each cart item must have a quantity of at least 1.";
    }
    const size = String(item.size || "").trim();
    const color = String(item.color || "").trim();
    if (!size) return "Each cart item must include a size.";
    if (!color) return "Each cart item must include a color.";

    const product = ctx.productsById.get(item.id);
    if (!product || product.status !== "PUBLISHED") {
        return `Product is no longer available.`;
    }

    if (!colorAllowed(product, color)) {
        return `${product.name} is no longer available in the selected color.`;
    }

    if (isGlobalMatrixOutOfStock(ctx.globalMatrix, color, size)) {
        return `${product.name} is currently out of stock in ${color} / ${size} (global inventory).`;
    }

    const productVariants = ctx.variantsByProductId.get(product.id) || [];
    if (productVariants.length > 0) {
        const variant = findVariantForLine(productVariants, color, size);
        if (!variant) {
            return `${product.name} is not available in ${canonicalHex(color)} / ${size}.`;
        }
        if (variant.stockStatus === "OUT_OF_STOCK") {
            return `${product.name} is currently out of stock in ${canonicalHex(color)} / ${size}.`;
        }
    } else if (product.stockStatus === "OUT_OF_STOCK") {
        return `${product.name} is currently out of stock.`;
    }

    return null;
}

export async function collectCartIssues(
    prisma: PrismaClient,
    items: CheckoutItemShape[]
): Promise<CartLineIssue[]> {
    if (!Array.isArray(items) || items.length === 0) return [];

    const productIds = [...new Set(items.map((i) => i.id).filter(Boolean))];
    const ctx = await loadCartValidationContext(prisma, productIds);
    const issues: CartLineIssue[] = [];

    for (const item of items) {
        const product = ctx.productsById.get(item.id);
        const name = product?.name || "This product";
        const msg = validateCheckoutLine(item, ctx);
        if (msg) {
            issues.push({
                productId: item.id,
                productName: name,
                size: String(item.size || "").trim(),
                color: canonicalHex(String(item.color || "").trim()),
                message: msg,
            });
        }
    }

    return issues;
}
