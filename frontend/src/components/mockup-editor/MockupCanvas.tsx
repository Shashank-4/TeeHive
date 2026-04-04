/**
 * MockupCanvas.tsx — Flat Mockup Editor (no displacement/shadow)
 *
 * 2-Layer Stack:
 *   Layer 0 (tshirt-base)  → Color base image (front or back, from global colors or fallback)
 *   Layer 1 (user-design)  → Artist's design rendered as-is (no displacement warping)
 *
 * Displacement + shadow overlay were disabled because they were causing visible artifacts
 * while creating mockups.
 */

import { useState, useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import * as fabric from "fabric";
import {
    CANVAS_WIDTH,
    CANVAS_HEIGHT,
    PRINT_AREA_FRONT,
    PRINT_AREA_BACK,
    DEFAULT_SHADOW_INTENSITY,
} from "../../constants";
import { Loader2 } from "lucide-react";

export enum TShirtColor {
    White = "#ffffff",
    Black = "#202020",
    Grey = "#afafaf",
    NavyBlue = "#032d49",
    Maroon = "#650c17",
    Red = "#ce051f",
    RoyalBlue = "#101c86",
}

type ViewType = "front" | "back";

export interface DesignTransform {
    left: number;
    top: number;
    scaleX: number;
    scaleY: number;
    angle: number;
}

interface MockupCanvasProps {
    tshirtColor: TShirtColor;
    showGuides: boolean;
    onCanvasReady: (canvas: fabric.Canvas) => void;
    frontDesignUrl: string | null;
    backDesignUrl: string | null;
    currentView: ViewType;
    /** URL to the FRONT color base mockup */
    colorBaseUrl?: string | null;
    /** URL to the BACK color base mockup */
    colorBackBaseUrl?: string | null;
    /** URL to the shadow/highlight map PNG */
    shadowMapUrl?: string | null;
    /** URL to the displacement map PNG */
    displacementMapUrl?: string | null;
    /** Shadow overlay intensity (0–1) */
    shadowIntensity?: number;
    initialFrontTransform?: DesignTransform | null;
    initialBackTransform?: DesignTransform | null;
}

export interface MockupCanvasHandle {
    exportView: (view: ViewType) => Promise<Blob>;
    getDesignTransform: (view: ViewType) => DesignTransform | null;
    /** Export one view using temporary fabric/color URLs, then restore the live canvas. */
    exportViewWithAppearance: (opts: {
        tshirtColor: string;
        colorBaseUrl: string | null;
        colorBackBaseUrl: string | null;
        shadowMapUrl: string | null;
        displacementMapUrl: string | null;
        view: ViewType;
    }) => Promise<Blob>;
}

// ── Helpers ──

const PROXY_BASE = () =>
    `${import.meta.env.VITE_API_URL || "http://localhost:3000"}/api/proxy/image?url=`;

function isDarkColor(hex: string): boolean {
    const c = hex.replace("#", "");
    const r = parseInt(c.substring(0, 2), 16);
    const g = parseInt(c.substring(2, 4), 16);
    const b = parseInt(c.substring(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance < 0.5;
}

/** Load an image as HTMLImageElement (for offscreen pixel manipulation) */
function loadImageElement(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
        img.src = url;
    });
}

/**
 * Apply pixel-level displacement to a design image.
 *
 * For each output pixel, we sample the displacement map to determine how much
 * to shift the source pixel. 128 = no shift, 0 = shift left/up, 255 = shift right/down.
 * This creates the effect of the design "following" fabric folds.
 */
function applyPixelDisplacement(
    designImg: HTMLImageElement,
    dispImg: HTMLImageElement,
    strength: number,
    printArea: { x: number; y: number; width: number; height: number },
    targetWidth: number,
    targetHeight: number
): HTMLCanvasElement {
    // 1. Draw displacement map at the same scale/position as the base t-shirt
    const dispCanvas = document.createElement("canvas");
    dispCanvas.width = CANVAS_WIDTH;
    dispCanvas.height = CANVAS_HEIGHT;
    const dispCtx = dispCanvas.getContext("2d")!;

    const padding = 20;
    const maxW = CANVAS_WIDTH - padding * 2;
    const maxH = CANVAS_HEIGHT - padding * 2;
    const dScale = Math.min(maxW / dispImg.width, maxH / dispImg.height);
    const dw = dispImg.width * dScale;
    const dh = dispImg.height * dScale;
    // Align displacement map with the shirt base layer.
    // The base layer is positioned at (CANVAS_HEIGHT/2 - 25) in `loadBaseLayer`,
    // so we shift the displacement map's vertical center by the same amount.
    const BASE_TOP_Y_OFFSET_PX = -25;
    dispCtx.drawImage(
        dispImg,
        (CANVAS_WIDTH - dw) / 2,
        (CANVAS_HEIGHT - dh) / 2 + BASE_TOP_Y_OFFSET_PX,
        dw,
        dh
    );

    // 2. Extract the print area region from the displacement map
    const dispData = dispCtx.getImageData(printArea.x, printArea.y, printArea.width, printArea.height);

    // 3. Draw design at target dimensions (print area size)
    const designCanvas = document.createElement("canvas");
    designCanvas.width = targetWidth;
    designCanvas.height = targetHeight;
    const designCtx = designCanvas.getContext("2d")!;
    designCtx.drawImage(designImg, 0, 0, targetWidth, targetHeight);
    const designData = designCtx.getImageData(0, 0, targetWidth, targetHeight);

    // 4. Scale displacement data to match target dimensions
    const dispScaleCanvas = document.createElement("canvas");
    dispScaleCanvas.width = targetWidth;
    dispScaleCanvas.height = targetHeight;
    const dispScaleCtx = dispScaleCanvas.getContext("2d")!;
    dispScaleCtx.putImageData(dispData, 0, 0);
    // Re-draw at target size if dimensions differ
    if (targetWidth !== printArea.width || targetHeight !== printArea.height) {
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = printArea.width;
        tempCanvas.height = printArea.height;
        tempCanvas.getContext("2d")!.putImageData(dispData, 0, 0);
        dispScaleCtx.clearRect(0, 0, targetWidth, targetHeight);
        dispScaleCtx.drawImage(tempCanvas, 0, 0, targetWidth, targetHeight);
    }
    const scaledDispData = dispScaleCtx.getImageData(0, 0, targetWidth, targetHeight);

    // 5. Apply displacement: for each pixel, sample design at offset position
    const output = designCtx.createImageData(targetWidth, targetHeight);

    for (let y = 0; y < targetHeight; y++) {
        for (let x = 0; x < targetWidth; x++) {
            const idx = (y * targetWidth + x) * 4;
            const dispValue = scaledDispData.data[idx]; // R channel (grayscale)

            // Map 0–255 → displacement offset: 128 = 0, 0 = -strength, 255 = +strength
            const offsetX = Math.round(((dispValue - 128) / 128) * strength);
            const offsetY = Math.round(((dispValue - 128) / 128) * strength * 0.5);

            const srcX = Math.min(Math.max(x - offsetX, 0), targetWidth - 1);
            const srcY = Math.min(Math.max(y - offsetY, 0), targetHeight - 1);
            const srcIdx = (srcY * targetWidth + srcX) * 4;

            output.data[idx] = designData.data[srcIdx];         // R
            output.data[idx + 1] = designData.data[srcIdx + 1]; // G
            output.data[idx + 2] = designData.data[srcIdx + 2]; // B
            output.data[idx + 3] = designData.data[srcIdx + 3]; // A
        }
    }

    const resultCanvas = document.createElement("canvas");
    resultCanvas.width = targetWidth;
    resultCanvas.height = targetHeight;
    resultCanvas.getContext("2d")!.putImageData(output, 0, 0);
    return resultCanvas;
}

// ── Component ──

const MockupCanvas = forwardRef<MockupCanvasHandle, MockupCanvasProps>((
    {
        tshirtColor,
        showGuides,
        onCanvasReady,
        frontDesignUrl,
        backDesignUrl,
        currentView,
        colorBaseUrl,
        colorBackBaseUrl,
        shadowMapUrl,
        displacementMapUrl,
        shadowIntensity = DEFAULT_SHADOW_INTENSITY,
        initialFrontTransform = null,
        initialBackTransform = null,
    },
    ref
) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fabricRef = useRef<fabric.Canvas | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const frontTransformRef = useRef<DesignTransform | null>(null);
    const backTransformRef = useRef<DesignTransform | null>(null);
    const currentViewRef = useRef<ViewType>(currentView);
    const containerRef = useRef<HTMLDivElement>(null);

    // Track props in refs for stable closures
    const tshirtColorRef = useRef(tshirtColor);
    const colorBaseUrlRef = useRef(colorBaseUrl);
    const colorBackBaseUrlRef = useRef(colorBackBaseUrl);
    const shadowMapUrlRef = useRef(shadowMapUrl);
    const displacementMapUrlRef = useRef(displacementMapUrl);
    const shadowIntensityRef = useRef(shadowIntensity);

    // Cache loaded displacement map element
    const dispImgCacheRef = useRef<{ url: string; img: HTMLImageElement } | null>(null);

    useEffect(() => { tshirtColorRef.current = tshirtColor; }, [tshirtColor]);
    useEffect(() => { colorBaseUrlRef.current = colorBaseUrl; }, [colorBaseUrl]);
    useEffect(() => { colorBackBaseUrlRef.current = colorBackBaseUrl; }, [colorBackBaseUrl]);
    useEffect(() => { shadowMapUrlRef.current = shadowMapUrl; }, [shadowMapUrl]);
    useEffect(() => { displacementMapUrlRef.current = displacementMapUrl; }, [displacementMapUrl]);
    useEffect(() => { shadowIntensityRef.current = shadowIntensity; }, [shadowIntensity]);

    useEffect(() => {
        frontTransformRef.current = initialFrontTransform ?? null;
        backTransformRef.current = initialBackTransform ?? null;
    }, [initialFrontTransform, initialBackTransform]);

    const currentDesignUrl = currentView === "front" ? frontDesignUrl : backDesignUrl;
    const currentPrintArea = currentView === "front" ? PRINT_AREA_FRONT : PRINT_AREA_BACK;

    // ── Responsive scaling ──
    useEffect(() => {
        if (!containerRef.current) return;

        const resizeObserver = new ResizeObserver((entries) => {
            const entry = entries[0];
            if (!entry) return;
            const { width } = entry.contentRect;
            const canvas = fabricRef.current;
            if (canvas && width > 0) {
                const scale = width / CANVAS_WIDTH;
                canvas.setDimensions({ width, height: width * (CANVAS_HEIGHT / CANVAS_WIDTH) });
                canvas.setZoom(scale);
            }
        });

        resizeObserver.observe(containerRef.current);
        return () => resizeObserver.disconnect();
    }, []);

    // Track current view
    useEffect(() => {
        currentViewRef.current = currentView;
    }, [currentView]);

    // ── Canvas initialization ──
    useEffect(() => {
        if (!canvasRef.current) return;

        const canvas = new fabric.Canvas(canvasRef.current, {
            width: CANVAS_WIDTH,
            height: CANVAS_HEIGHT,
            backgroundColor: "#ffffff",
            selection: false,
            preserveObjectStacking: true,
        });

        fabricRef.current = canvas;
        onCanvasReady(canvas);

        // Initial scale
        if (containerRef.current) {
            const width = containerRef.current.clientWidth;
            if (width > 0) {
                const scale = width / CANVAS_WIDTH;
                canvas.setDimensions({ width, height: width * (CANVAS_HEIGHT / CANVAS_WIDTH) });
                canvas.setZoom(scale);
            }
        }

        // ── Constraint Logic ──
        const enforceConstraints = (obj: fabric.Object) => {
            if (!obj) return;
            obj.setCoords();
            let objBounds = obj.getBoundingRect();
            const area = currentViewRef.current === "front" ? PRINT_AREA_FRONT : PRINT_AREA_BACK;

            if (objBounds.width > area.width || objBounds.height > area.height) {
                const scaleX = area.width / objBounds.width;
                const scaleY = area.height / objBounds.height;
                const scaleFactor = Math.min(scaleX, scaleY);
                if (scaleFactor < 1) {
                    obj.scaleX = (obj.scaleX || 1) * scaleFactor;
                    obj.scaleY = (obj.scaleY || 1) * scaleFactor;
                    obj.setCoords();
                    objBounds = obj.getBoundingRect();
                }
            }

            let dx = 0, dy = 0;
            if (objBounds.width <= area.width) {
                if (objBounds.left < area.x) dx = area.x - objBounds.left;
                else if (objBounds.left + objBounds.width > area.x + area.width)
                    dx = area.x + area.width - (objBounds.left + objBounds.width);
            } else {
                if (objBounds.left < area.x) dx = area.x - objBounds.left;
            }
            if (objBounds.height <= area.height) {
                if (objBounds.top < area.y) dy = area.y - objBounds.top;
                else if (objBounds.top + objBounds.height > area.y + area.height)
                    dy = area.y + area.height - (objBounds.top + objBounds.height);
            } else {
                if (objBounds.top < area.y) dy = area.y - objBounds.top;
            }

            if (dx !== 0 || dy !== 0) {
                obj.left = (obj.left ?? 0) + dx;
                obj.top = (obj.top ?? 0) + dy;
                obj.setCoords();
            }
        };

        const saveTransform = (obj: fabric.Object) => {
            if ((obj as any).id !== "user-design") return;
            const transform: DesignTransform = {
                left: obj.left ?? 0,
                top: obj.top ?? 0,
                scaleX: obj.scaleX ?? 1,
                scaleY: obj.scaleY ?? 1,
                angle: obj.angle ?? 0,
            };
            if (currentViewRef.current === "front") frontTransformRef.current = transform;
            else backTransformRef.current = transform;
        };

        canvas.on("object:moving", (e) => { if (e.target) { enforceConstraints(e.target); saveTransform(e.target); } });
        canvas.on("object:scaling", (e) => { if (e.target) { enforceConstraints(e.target); saveTransform(e.target); } });
        canvas.on("object:rotating", (e) => { if (e.target) { enforceConstraints(e.target); saveTransform(e.target); } });
        canvas.on("object:modified", (e) => { if (e.target) { saveTransform(e.target); } });

        loadFullScene(canvas, currentView);

        return () => {
            canvas.dispose();
            fabricRef.current = null;
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // ── View / color / realism change ──
    useEffect(() => {
        const canvas = fabricRef.current;
        if (!canvas) return;
        setIsLoading(true);
        clearCanvas(canvas);
        canvas.requestRenderAll();

        setTimeout(() => {
            loadFullScene(canvas, currentView).then(() => {
                setIsLoading(false);
            });
        }, 0);
    }, [currentView, tshirtColor, colorBaseUrl, colorBackBaseUrl, shadowMapUrl, displacementMapUrl, shadowIntensity]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Design changes ──
    useEffect(() => {
        const canvas = fabricRef.current;
        if (!canvas) return;
        if (isLoading) return;

        removeById(canvas, "user-design");
        removeById(canvas, "shadow-overlay");

        if (!currentDesignUrl) {
            canvas.requestRenderAll();
            return;
        }

        // Flat mode: render design only (no displacement, no shadow overlay).
        loadDesignLayer(canvas, currentDesignUrl, currentView, currentPrintArea);
    }, [currentDesignUrl, currentView]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Guides ──
    useEffect(() => {
        const canvas = fabricRef.current;
        if (!canvas) return;
        updateGuides(canvas, showGuides, currentPrintArea);
    }, [showGuides, currentPrintArea]);

    // ─────────────────────────────────────────────────────────
    // LAYER MANAGEMENT FUNCTIONS
    // ─────────────────────────────────────────────────────────

    function clearCanvas(canvas: fabric.Canvas) {
        const ids = ["tshirt-base", "user-design", "shadow-overlay", "print-guide"];
        ids.forEach((id) => removeById(canvas, id));
    }

    function removeById(canvas: fabric.Canvas, id: string) {
        canvas.getObjects().filter((o) => (o as any).id === id).forEach((o) => canvas.remove(o));
    }

    async function loadFullScene(canvas: fabric.Canvas, view: ViewType) {
        await loadBaseLayer(canvas, view);
        const designUrl = view === "front" ? frontDesignUrl : backDesignUrl;
        const printArea = view === "front" ? PRINT_AREA_FRONT : PRINT_AREA_BACK;
        if (designUrl) {
            await loadDesignLayer(canvas, designUrl, view, printArea);
        }
        updateGuides(canvas, showGuides, printArea);
    }

    /**
     * LAYER 0: Load the base t-shirt image.
     * Uses colorBackBaseUrl for back view, colorBaseUrl for front view.
     * Falls back to local white mockups with BlendColor filter.
     */
    async function loadBaseLayer(canvas: fabric.Canvas, view: ViewType) {
        removeById(canvas, "tshirt-base");

        let imageUrl: string;
        let useColorFilter = false;
        const currentFrontUrl = colorBaseUrlRef.current;
        const currentBackUrl = colorBackBaseUrlRef.current;

        if (view === "front" && currentFrontUrl) {
            imageUrl = `${PROXY_BASE()}${encodeURIComponent(currentFrontUrl)}`;
        } else if (view === "back" && currentBackUrl) {
            imageUrl = `${PROXY_BASE()}${encodeURIComponent(currentBackUrl)}`;
        } else if (view === "back" && currentFrontUrl && !currentBackUrl) {
            // Fallback: if there's a front URL but no back URL, use local back with color filter
            imageUrl = "/mockups/white-back.png";
            useColorFilter = true;
        } else if (!currentFrontUrl && !currentBackUrl) {
            imageUrl = view === "front" ? "/mockups/white-front.png" : "/mockups/white-back.png";
            useColorFilter = true;
        } else {
            imageUrl = view === "front" ? "/mockups/white-front.png" : "/mockups/white-back.png";
            useColorFilter = true;
        }

        try {
            const img = await fabric.FabricImage.fromURL(imageUrl, { crossOrigin: "anonymous" });
            if (!img) throw new Error("Image failed to load");

            const padding = 20;
            const maxWidth = CANVAS_WIDTH - padding * 2;
            const maxHeight = CANVAS_HEIGHT - padding * 2;
            const scale = Math.min(maxWidth / (img.width || 1), maxHeight / (img.height || 1));

            img.set({
                scaleX: scale,
                scaleY: scale,
                left: CANVAS_WIDTH / 2,
                top: CANVAS_HEIGHT / 2 - 25,
                originX: "center",
                originY: "center",
                selectable: false,
                evented: false,
                hoverCursor: "default",
            });

            if (useColorFilter) {
                const blendFilter = new fabric.filters.BlendColor({
                    color: tshirtColorRef.current,
                    mode: "multiply",
                    alpha: 1,
                });
                img.filters = [blendFilter];
                img.applyFilters();
            }

            (img as any).id = "tshirt-base";
            canvas.insertAt(0, img);
            canvas.requestRenderAll();
        } catch (err) {
            console.error(`[Base] Failed to load:`, err);
        }
    }

    /**
     * Load and cache the displacement map as an HTMLImageElement.
     */
    async function getDisplacementImage(): Promise<HTMLImageElement | null> {
        // Determine URL: per-color override or local fallback
        const url = displacementMapUrlRef.current || "/mockups/tshirt-displacement.png";

        // Check cache
        if (dispImgCacheRef.current && dispImgCacheRef.current.url === url) {
            return dispImgCacheRef.current.img;
        }

        try {
            const resolvedUrl = url.startsWith("/") ? url : `${PROXY_BASE()}${encodeURIComponent(url)}`;
            const img = await loadImageElement(resolvedUrl);
            dispImgCacheRef.current = { url, img };
            return img;
        } catch (err) {
            console.error("[Displacement] Failed to load displacement map:", err);
            return null;
        }
    }

    /**
     * LAYER 1: Load the artist's design with displacement warp.
     *
     * 1. Load raw design as HTMLImageElement
     * 2. If displacement map available, warp pixels via offscreen canvas
     * 3. Create fabric.Image from the processed result
     * 4. Apply blur + configurable opacity for "printed" look
     */
    async function loadDesignLayer(
        canvas: fabric.Canvas,
        designUrl: string,
        view: ViewType,
        printArea: typeof PRINT_AREA_FRONT
    ) {
        removeById(canvas, "user-design");

        const savedTransform = view === "front" ? frontTransformRef.current : backTransformRef.current;
        const proxyUrl = `${PROXY_BASE()}${encodeURIComponent(designUrl)}`;
        const opacity = 0.92;

        try {
            // Flat mode: render the design without displacement warping.
            const fabricImg = await fabric.FabricImage.fromURL(proxyUrl, { crossOrigin: "anonymous" });

            if (!fabricImg) return;

            // Apply subtle blur for "printed on fabric" look
            const blurFilter = new fabric.filters.Blur({ blur: 0.01 });
            fabricImg.filters = [blurFilter];
            fabricImg.applyFilters();

            if (savedTransform) {
                fabricImg.set({
                    left: savedTransform.left,
                    top: savedTransform.top,
                    scaleX: savedTransform.scaleX,
                    scaleY: savedTransform.scaleY,
                    angle: savedTransform.angle,
                    originX: "center",
                    originY: "center",
                    opacity: opacity,
                    cornerColor: "white",
                    cornerStrokeColor: "#3b82f6",
                    borderColor: "#3b82f6",
                    cornerSize: 10,
                    transparentCorners: false,
                    padding: 0,
                    strokeWidth: 0,
                });
            } else {
                const scale = Math.min(
                    (printArea.width * 0.8) / (fabricImg.width || 1),
                    (printArea.height * 0.8) / (fabricImg.height || 1)
                );
                fabricImg.set({
                    scaleX: scale,
                    scaleY: scale,
                    left: printArea.x + printArea.width / 2,
                    top: printArea.y + printArea.height / 2,
                    originX: "center",
                    originY: "center",
                    opacity: opacity,
                    cornerColor: "white",
                    cornerStrokeColor: "#3b82f6",
                    borderColor: "#3b82f6",
                    cornerSize: 10,
                    transparentCorners: false,
                });

                const initialTransform: DesignTransform = {
                    left: fabricImg.left ?? 0,
                    top: fabricImg.top ?? 0,
                    scaleX: fabricImg.scaleX ?? 1,
                    scaleY: fabricImg.scaleY ?? 1,
                    angle: fabricImg.angle ?? 0,
                };
                if (view === "front") frontTransformRef.current = initialTransform;
                else backTransformRef.current = initialTransform;
            }

            // Hide middle-edge controls (only corner scale + rotate)
            ["ml", "mr", "mt", "mb", "tl", "tr", "bl", "mtr"].forEach((c) =>
                fabricImg.setControlVisible(c, false)
            );

            (fabricImg as any).id = "user-design";
            canvas.add(fabricImg);
            canvas.setActiveObject(fabricImg);
            canvas.requestRenderAll();
        } catch (err) {
            console.error("[Design] Error loading:", err);
        }
    }

    /**
     * LAYER 2: Shadow/Highlight overlay with multiply blend.
     *
     * Uses configurable intensity. Falls back to local shadow map
     * if no per-color shadow URL is provided.
     */
    async function loadShadowOverlay(canvas: fabric.Canvas) {
        removeById(canvas, "shadow-overlay");

        // Use per-color shadow URL or fall back to local universal shadow
        const currentShadowUrl = shadowMapUrlRef.current || "/mockups/tshirt-shading.png";
        const intensity = shadowIntensityRef.current;

        if (intensity <= 0) return; // Shadow disabled

        const resolvedUrl = currentShadowUrl.startsWith("/")
            ? currentShadowUrl
            : `${PROXY_BASE()}${encodeURIComponent(currentShadowUrl)}`;

        try {
            const img = await fabric.FabricImage.fromURL(resolvedUrl, { crossOrigin: "anonymous" });
            if (!img) return;

            const padding = 20;
            const maxWidth = CANVAS_WIDTH - padding * 2;
            const maxHeight = CANVAS_HEIGHT - padding * 2;
            const scale = Math.min(maxWidth / (img.width || 1), maxHeight / (img.height || 1));

            img.set({
                scaleX: scale,
                scaleY: scale,
                left: CANVAS_WIDTH / 2,
                top: CANVAS_HEIGHT / 2 - 25,
                originX: "center",
                originY: "center",
                selectable: false,
                evented: false,
                hoverCursor: "default",
                opacity: intensity,
            });

            // Apply multiply blend — darkens fold areas over design + base
            const dark = isDarkColor(tshirtColorRef.current);
            (img as any).globalCompositeOperation = dark ? "overlay" : "multiply";

            (img as any).id = "shadow-overlay";
            canvas.add(img);
            canvas.requestRenderAll();
        } catch (err) {
            console.error("[Shadow] Failed to load overlay:", err);
        }
    }

    /** Update print area guides */
    function updateGuides(
        canvas: fabric.Canvas,
        shouldShow: boolean,
        printArea: typeof PRINT_AREA_FRONT
    ) {
        removeById(canvas, "print-guide");

        if (shouldShow) {
            const strokeWidth = 2;
            const centerX = printArea.x + printArea.width / 2;
            const centerY = printArea.y + printArea.height / 2;

            const guideRect = new fabric.Rect({
                left: centerX,
                top: centerY,
                width: printArea.width + strokeWidth,
                height: printArea.height + strokeWidth,
                fill: "transparent",
                stroke: "#3b82f6",
                strokeWidth,
                strokeDashArray: [5, 5],
                selectable: false,
                evented: false,
                originX: "center",
                originY: "center",
                opacity: 0.6,
                rx: 4,
                ry: 4,
            });
            (guideRect as any).id = "print-guide";
            canvas.add(guideRect);
        }
        canvas.requestRenderAll();
    }

    // ─────────────────────────────────────────────────────────
    // IMPERATIVE HANDLE (export + transform access)
    // ─────────────────────────────────────────────────────────

    useImperativeHandle(ref, () => ({
        exportView: async (view: ViewType) => {
            const canvas = fabricRef.current;
            if (!canvas) throw new Error("Canvas not ready");

            const originalView = currentViewRef.current;

            if (originalView !== view) {
                clearCanvas(canvas);
                await loadFullScene(canvas, view);
            }

            const guide = canvas.getObjects().find((o) => (o as any).id === "print-guide");
            const guideWasVisible = guide?.visible;
            if (guide) {
                guide.visible = false;
                canvas.requestRenderAll();
            }

            const dataUrl = canvas.toDataURL({
                format: "png",
                quality: 1,
                multiplier: 2,
            });

            if (originalView !== view) {
                clearCanvas(canvas);
                await loadFullScene(canvas, originalView);
            } else if (guide) {
                guide.visible = !!guideWasVisible;
                canvas.requestRenderAll();
            }

            const res = await fetch(dataUrl);
            return res.blob();
        },

        exportViewWithAppearance: async (opts) => {
            const canvas = fabricRef.current;
            if (!canvas) throw new Error("Canvas not ready");

            const backup = {
                tshirt: tshirtColorRef.current,
                cf: colorBaseUrlRef.current,
                cb: colorBackBaseUrlRef.current,
                sh: shadowMapUrlRef.current,
                dp: displacementMapUrlRef.current,
                v: currentViewRef.current,
            };

            tshirtColorRef.current = opts.tshirtColor;
            colorBaseUrlRef.current = opts.colorBaseUrl;
            colorBackBaseUrlRef.current = opts.colorBackBaseUrl;
            shadowMapUrlRef.current = opts.shadowMapUrl;
            displacementMapUrlRef.current = opts.displacementMapUrl;
            currentViewRef.current = opts.view;

            clearCanvas(canvas);
            await loadFullScene(canvas, opts.view);

            const guide = canvas.getObjects().find((o) => (o as any).id === "print-guide");
            if (guide) {
                guide.visible = false;
                canvas.requestRenderAll();
            }

            const dataUrl = canvas.toDataURL({
                format: "png",
                quality: 1,
                multiplier: 2,
            });

            tshirtColorRef.current = backup.tshirt;
            colorBaseUrlRef.current = backup.cf;
            colorBackBaseUrlRef.current = backup.cb;
            shadowMapUrlRef.current = backup.sh;
            displacementMapUrlRef.current = backup.dp;
            currentViewRef.current = backup.v;

            clearCanvas(canvas);
            await loadFullScene(canvas, backup.v);

            const res = await fetch(dataUrl);
            return res.blob();
        },

        getDesignTransform: (view: ViewType) => {
            return view === "front" ? frontTransformRef.current : backTransformRef.current;
        },
    }));

    // ── Render ──
    return (
        <div ref={containerRef} className="w-full h-full relative" style={{ minHeight: "300px" }}>
            {isLoading && (
                <div className="absolute inset-0 bg-white/80 z-10 flex items-center justify-center rounded-xl">
                    <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
                </div>
            )}
            <div className="w-full h-full">
                <canvas ref={canvasRef} className="w-full h-full rounded-xl" />
            </div>
        </div>
    );
});

MockupCanvas.displayName = "MockupCanvas";

export default MockupCanvas;
