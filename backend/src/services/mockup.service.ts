/**
 * mockup.service.ts — High-fidelity production mockup renderer
 *
 * Uses Sharp to composite the artist's transparent design onto a color base.
 *
 * Note: displacement mapping + shadow overlay were disabled because they were
 * producing visible artifacts in mockups.
 *
 * Pipeline:
 *   1. Load color base image (the blank t-shirt in a specific color)
 *   2. Load displacement map (grayscale) → warp design pixels to follow
 *      fabric folds & wrinkles
 *   3. Load shadow/highlight map → composite on top using multiply blend
 *   4. Alpha-mask the design to the print area
 *   5. Output a single high-res PNG
 */

import sharp from "sharp";

interface MockupRenderInput {
    /** URL of the base color t-shirt image */
    baseImageUrl: string;
    /** URL of the artist's transparent design PNG */
    designImageUrl: string;
    /** URL of the shadow/highlight overlay PNG (optional) */
    shadowMapUrl?: string;
    /** URL of the displacement map — 8-bit grayscale (optional) */
    displacementMapUrl?: string;
    /** Displacement intensity in pixels (how far pixels shift). Default 8. */
    displacementStrength?: number;
    /** Print area position/size on the base image */
    printArea: { x: number; y: number; width: number; height: number };
    /** Is this a "dark" shirt? Affects shadow blend mode logic. */
    isDark?: boolean;
}

/**
 * Fetch an image URL and return a Buffer.
 */
async function fetchImageBuffer(url: string): Promise<Buffer> {
    // Handle local files
    if (url.startsWith("/") || url.startsWith("file://")) {
        const fs = await import("fs");
        const path = url.replace("file://", "");
        return fs.readFileSync(path);
    }

    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch image: ${url} (${response.status})`);
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
}

/**
 * Apply displacement mapping to warp design pixels.
 *
 * For each pixel in the output, we look up the displacement map value
 * at that position. The grayscale value (0–255) determines how much
 * to shift the source pixel. 128 = no shift, 0 = shift left/up,
 * 255 = shift right/down.
 *
 * This creates the effect of the design "following" the fabric's
 * wrinkles and folds.
 */
async function applyDisplacement(
    designBuffer: Buffer,
    displacementBuffer: Buffer,
    strength: number,
    targetWidth: number,
    targetHeight: number
): Promise<Buffer> {
    // Resize both to match target dimensions
    const designResized = await sharp(designBuffer)
        .resize(targetWidth, targetHeight, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

    const dispResized = await sharp(displacementBuffer)
        .resize(targetWidth, targetHeight, { fit: "cover" })
        .grayscale()
        .raw()
        .toBuffer({ resolveWithObject: true });

    const { data: designPixels, info: designInfo } = designResized;
    const { data: dispPixels } = dispResized;

    const width = designInfo.width;
    const height = designInfo.height;
    const channels = designInfo.channels; // 4 (RGBA)

    // Create output buffer
    const output = Buffer.alloc(width * height * channels);

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const dispIdx = y * width + x;
            const dispValue = dispPixels[dispIdx]; // 0-255 grayscale

            // Map 0-255 to displacement offset: 128 = 0, 0 = -strength, 255 = +strength
            const offsetX = Math.round(((dispValue - 128) / 128) * strength);
            const offsetY = Math.round(((dispValue - 128) / 128) * strength * 0.5); // Less vertical shift

            // Sample source pixel with displacement
            const srcX = Math.min(Math.max(x - offsetX, 0), width - 1);
            const srcY = Math.min(Math.max(y - offsetY, 0), height - 1);

            const srcIdx = (srcY * width + srcX) * channels;
            const dstIdx = (y * width + x) * channels;

            output[dstIdx] = designPixels[srcIdx];         // R
            output[dstIdx + 1] = designPixels[srcIdx + 1]; // G
            output[dstIdx + 2] = designPixels[srcIdx + 2]; // B
            output[dstIdx + 3] = designPixels[srcIdx + 3]; // A
        }
    }

    return sharp(output, { raw: { width, height, channels } }).png().toBuffer();
}

/**
 * Render a production-quality mockup.
 */
export async function renderProductionMockup(input: MockupRenderInput): Promise<Buffer> {
    const {
        baseImageUrl,
        designImageUrl,
        shadowMapUrl,
        displacementMapUrl,
        displacementStrength = 8,
        printArea,
        isDark = false,
    } = input;

    // 1. Load the base image and get its dimensions
    const baseBuffer = await fetchImageBuffer(baseImageUrl);
    const baseMeta = await sharp(baseBuffer).metadata();
    const baseWidth = baseMeta.width!;
    const baseHeight = baseMeta.height!;

    // 2. Load and prepare the design
    let designBuffer = await fetchImageBuffer(designImageUrl);

    // Resize design to fit print area
    designBuffer = await sharp(designBuffer)
        .resize(printArea.width, printArea.height, {
            fit: "contain",
            background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .ensureAlpha()
        .png()
        .toBuffer();

    // 3. (disabled) Apply displacement if map is available
    // Intentionally skipped to avoid visual artifacts during mockup creation.

    // 4. Apply slight blur + opacity reduction for "printed into fabric" look
    designBuffer = await sharp(designBuffer)
        .blur(0.5)
        .ensureAlpha()
        .png()
        .toBuffer();

    // Reduce opacity to 95% to allow texture bleed-through
    const designWithOpacity = await sharp(designBuffer)
        .raw()
        .toBuffer({ resolveWithObject: true });

    const { data: designPixels, info: designInfo } = designWithOpacity;
    for (let i = 3; i < designPixels.length; i += 4) {
        designPixels[i] = Math.round(designPixels[i] * 0.95);
    }

    designBuffer = await sharp(designPixels, {
        raw: {
            width: designInfo.width,
            height: designInfo.height,
            channels: designInfo.channels as 4,
        },
    }).png().toBuffer();

    // 5. Composite the design onto the base
    let result = sharp(baseBuffer).composite([
        {
            input: designBuffer,
            left: printArea.x,
            top: printArea.y,
            blend: "over" as any,
        },
    ]);

    // 6. (disabled) Apply shadow/highlight overlay if available
    // Intentionally skipped to keep mockups visually consistent.

    // 7. Output final PNG
    return result.png({ quality: 95 }).toBuffer();
}
