import type { PrismaClient } from "@prisma/client";
import {
    canonicalHex,
    parseGlobalInventoryMatrix,
    type GlobalInventoryMatrix,
} from "./cartAvailability.service";

/** Must match `PRODUCT_SIZES` in the frontend. */
export const GLOBAL_INVENTORY_SIZES = [
    "XS",
    "S",
    "M",
    "L",
    "XL",
    "XXL",
    "3XL",
    "4XL",
    "5XL",
] as const;

function blankRow(): Record<string, string> {
    return Object.fromEntries(GLOBAL_INVENTORY_SIZES.map((s) => [s, "IN_STOCK"]));
}

function normalizeMatrixKeys(mat: GlobalInventoryMatrix): GlobalInventoryMatrix {
    const next: GlobalInventoryMatrix = {};
    for (const [k, v] of Object.entries(mat)) {
        if (!v || typeof v !== "object" || Array.isArray(v)) continue;
        const nk = canonicalHex(k);
        next[nk] = { ...(next[nk] || {}), ...(v as Record<string, string>) };
    }
    return next;
}

/** After a new global color is created, ensure the matrix has an IN_STOCK row for every size. */
export async function ensureGlobalInventoryRowForNewColor(db: PrismaClient, hex: string) {
    const key = canonicalHex(hex);
    const cfg = await db.siteConfig.findUnique({ where: { key: "global_inventory" } });
    const parsed = parseGlobalInventoryMatrix(cfg?.value);
    const normalized = normalizeMatrixKeys(parsed || {});

    if (!normalized[key]) {
        normalized[key] = blankRow();
    } else {
        const row = { ...normalized[key] };
        for (const s of GLOBAL_INVENTORY_SIZES) {
            const st = row[s];
            if (st !== "OUT_OF_STOCK" && st !== "LOW_STOCK" && st !== "IN_STOCK") {
                row[s] = "IN_STOCK";
            }
        }
        normalized[key] = row;
    }

    await db.siteConfig.upsert({
        where: { key: "global_inventory" },
        create: { key: "global_inventory", value: normalized },
        update: { value: normalized },
    });
}

/** When a global color is deleted, drop its matrix row so config stays aligned. */
export async function removeGlobalInventoryRowForColor(db: PrismaClient, hex: string) {
    const want = canonicalHex(hex);
    const cfg = await db.siteConfig.findUnique({ where: { key: "global_inventory" } });
    const parsed = parseGlobalInventoryMatrix(cfg?.value);
    const normalized = normalizeMatrixKeys(parsed || {});
    for (const k of Object.keys(normalized)) {
        if (canonicalHex(k) === want) {
            delete normalized[k];
        }
    }
    await db.siteConfig.upsert({
        where: { key: "global_inventory" },
        create: { key: "global_inventory", value: normalized },
        update: { value: normalized },
    });
}
