// ── Mockup Canvas Dimensions ──
export const CANVAS_WIDTH = 500;
export const CANVAS_HEIGHT = 600;

// ── Print Areas (relative to canvas coordinate space) ──
// Defines the printable area centered on the T-shirt.
// Canvas Width: 500. Print Width: 173. Center X: ~165.
export const PRINT_AREA_FRONT = { x: 165, y: 200, width: 173, height: 220 };
export const PRINT_AREA_BACK = { x: 165, y: 200, width: 173, height: 220 };

// ── Backend print area (scaled for high-res production renders) ──
// The base images from admin are typically ~1024px wide.
// These values are used by the backend Sharp engine.
export const PRODUCTION_PRINT_AREA = {
    x: 330,
    y: 400,
    width: 346,
    height: 440,
};
