import { canonicalHex } from "./productMockup";
import { PRODUCT_SIZES } from "../constants/productSizes";

export type GlobalMatrixStockStatus = "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";

const VALID = new Set<string>(["IN_STOCK", "LOW_STOCK", "OUT_OF_STOCK"]);

/**
 * Builds a full color × size matrix from saved config and the current global color palette.
 * Missing cells default to IN_STOCK. Unknown status strings default to IN_STOCK.
 * Row keys are canonical hex (matches PDP / checkout).
 */
export function mergeGlobalInventoryMatrix(
    existing: Record<string, Record<string, string>> | null | undefined,
    palette: ReadonlyArray<{ hex: string }>,
    sizes: readonly string[] = [...PRODUCT_SIZES]
): Record<string, Record<string, GlobalMatrixStockStatus>> {
    const ex =
        existing && typeof existing === "object" && !Array.isArray(existing)
            ? existing
            : {};
    const merged: Record<string, Record<string, GlobalMatrixStockStatus>> = {};

    for (const { hex } of palette) {
        const rowKey = canonicalHex(hex);
        merged[rowKey] = {};
        const legacyKey = Object.keys(ex).find((k) => canonicalHex(k) === rowKey);
        const oldRow =
            legacyKey &&
            ex[legacyKey] &&
            typeof ex[legacyKey] === "object" &&
            !Array.isArray(ex[legacyKey])
                ? (ex[legacyKey] as Record<string, string>)
                : {};
        for (const s of sizes) {
            const raw = oldRow[s];
            merged[rowKey][s] = VALID.has(raw)
                ? (raw as GlobalMatrixStockStatus)
                : "IN_STOCK";
        }
    }
    return merged;
}
