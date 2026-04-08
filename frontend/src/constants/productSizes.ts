/** Canonical garment sizes for PDP, cart, admin matrix, and artist variant editor. */
export const PRODUCT_SIZES = [
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

export type ProductSize = (typeof PRODUCT_SIZES)[number];

/** Approximate body measurements for the size guide (unisex tee, inches). ±1 in industry tolerance. */
export const SIZE_GUIDE_MEASUREMENTS: ReadonlyArray<{
    size: ProductSize;
    chestIn: string;
    lengthIn: string;
}> = [
    { size: "XS", chestIn: "34", lengthIn: "26" },
    { size: "S", chestIn: "36", lengthIn: "27" },
    { size: "M", chestIn: "38", lengthIn: "28" },
    { size: "L", chestIn: "40", lengthIn: "29" },
    { size: "XL", chestIn: "42", lengthIn: "30" },
    { size: "XXL", chestIn: "44", lengthIn: "31" },
    { size: "3XL", chestIn: "46", lengthIn: "32" },
    { size: "4XL", chestIn: "48", lengthIn: "33" },
    { size: "5XL", chestIn: "50", lengthIn: "34" },
];
