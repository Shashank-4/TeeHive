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

/** Approximate garment / body measurements for the size guide (unisex tee, inches). ±1 in industry tolerance. Sleeve: shoulder seam to cuff. */
export const SIZE_GUIDE_MEASUREMENTS: ReadonlyArray<{
    size: ProductSize;
    chestIn: string;
    lengthIn: string;
    sleeveIn: string;
}> = [
    { size: "XS", chestIn: "34", lengthIn: "26", sleeveIn: "8" },
    { size: "S", chestIn: "36", lengthIn: "27", sleeveIn: "8" },
    { size: "M", chestIn: "38", lengthIn: "28", sleeveIn: "9" },
    { size: "L", chestIn: "40", lengthIn: "29", sleeveIn: "9" },
    { size: "XL", chestIn: "42", lengthIn: "30", sleeveIn: "10" },
    { size: "XXL", chestIn: "44", lengthIn: "31", sleeveIn: "10" },
    { size: "3XL", chestIn: "46", lengthIn: "32", sleeveIn: "11" },
    { size: "4XL", chestIn: "48", lengthIn: "33", sleeveIn: "11" },
    { size: "5XL", chestIn: "50", lengthIn: "34", sleeveIn: "12" },
];
