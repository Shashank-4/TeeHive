/**
 * MockupCanvas.tsx — Realistic "Sandwich" Layering Mockup Editor
 *
 * 3-Layer Stack:
 *   Layer 0 (tshirt-base)   → High-res AI-generated color base image
 *   Layer 1 (user-design)   → Artist's transparent design (blur + reduced opacity)
 *   Layer 2 (shadow-overlay) → Grayscale shadow/highlight map (multiply/overlay blend)
 *
 * The shadow overlay sits on top of the design so folds appear "over" the print,
 * creating a realistic "printed into the fabric" look.
 */

import { useState, useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import * as fabric from "fabric";
import {
    CANVAS_WIDTH,
    CANVAS_HEIGHT,
    PRINT_AREA_FRONT,
    PRINT_AREA_BACK,
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

interface DesignTransform {
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
    /** URL to the color base mockup (AI-generated blank t-shirt photo) */
    colorBaseUrl?: string | null;
    /** URL to the shadow/highlight map PNG for sandwich overlay */
    shadowMapUrl?: string | null;
}

export interface MockupCanvasHandle {
    exportView: (view: ViewType) => Promise<Blob>;
    /** Return the current design transform for backend rendering */
    getDesignTransform: (view: ViewType) => DesignTransform | null;
}

// ── Helpers ──

const PROXY_BASE = () =>
    `${import.meta.env.VITE_API_URL || "http://localhost:3000"}/api/proxy/image?url=`;

/** Determine if a hex color is "dark" (for shadow blend mode selection) */
function isDarkColor(hex: string): boolean {
    const c = hex.replace("#", "");
    const r = parseInt(c.substring(0, 2), 16);
    const g = parseInt(c.substring(2, 4), 16);
    const b = parseInt(c.substring(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance < 0.5;
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
        shadowMapUrl,
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
    const shadowMapUrlRef = useRef(shadowMapUrl);

    useEffect(() => { tshirtColorRef.current = tshirtColor; }, [tshirtColor]);
    useEffect(() => { colorBaseUrlRef.current = colorBaseUrl; }, [colorBaseUrl]);
    useEffect(() => { shadowMapUrlRef.current = shadowMapUrl; }, [shadowMapUrl]);

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

        // Load initial scene
        loadFullScene(canvas, currentView);

        return () => {
            canvas.dispose();
            fabricRef.current = null;
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // ── View / color change ──
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
    }, [currentView, tshirtColor, colorBaseUrl, shadowMapUrl]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Design changes ──
    useEffect(() => {
        const canvas = fabricRef.current;
        if (!canvas || isLoading) return;

        // Remove old design + shadow
        removeById(canvas, "user-design");
        removeById(canvas, "shadow-overlay");

        if (!currentDesignUrl) {
            canvas.requestRenderAll();
            return;
        }

        loadDesignLayer(canvas, currentDesignUrl, currentView, currentPrintArea).then(() => {
            // Re-add shadow on top of new design
            loadShadowOverlay(canvas);
        });
    }, [currentDesignUrl, isLoading, currentView]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Guides ──
    useEffect(() => {
        const canvas = fabricRef.current;
        if (!canvas) return;
        updateGuides(canvas, showGuides, currentPrintArea);
    }, [showGuides, currentPrintArea]);

    // ─────────────────────────────────────────────────────────
    // LAYER MANAGEMENT FUNCTIONS
    // ─────────────────────────────────────────────────────────

    /** Clear all managed layers from canvas */
    function clearCanvas(canvas: fabric.Canvas) {
        const ids = ["tshirt-base", "user-design", "shadow-overlay", "print-guide"];
        ids.forEach((id) => removeById(canvas, id));
    }

    /** Remove all objects with a specific id */
    function removeById(canvas: fabric.Canvas, id: string) {
        canvas.getObjects().filter((o) => (o as any).id === id).forEach((o) => canvas.remove(o));
    }

    /** Load the full 3-layer scene */
    async function loadFullScene(canvas: fabric.Canvas, view: ViewType) {
        // Layer 0: Base
        await loadBaseLayer(canvas, view);

        // Layer 1: Design (if exists)
        const designUrl = view === "front" ? frontDesignUrl : backDesignUrl;
        const printArea = view === "front" ? PRINT_AREA_FRONT : PRINT_AREA_BACK;
        if (designUrl) {
            await loadDesignLayer(canvas, designUrl, view, printArea);
        }

        // Layer 2: Shadow overlay
        await loadShadowOverlay(canvas);

        // Guides on top
        updateGuides(canvas, showGuides, printArea);
    }

    /**
     * LAYER 0: Load the base t-shirt image.
     *
     * If a colorBaseUrl is provided (from global colors), use it directly.
     * Otherwise fall back to the local white mockup with a BlendColor filter.
     */
    async function loadBaseLayer(canvas: fabric.Canvas, view: ViewType) {
        removeById(canvas, "tshirt-base");

        let imageUrl: string;
        let useColorFilter = false;
        const currentColorBaseUrl = colorBaseUrlRef.current;

        if (currentColorBaseUrl) {
            // Use the admin-configured AI-generated base image
            imageUrl = `${PROXY_BASE()}${encodeURIComponent(currentColorBaseUrl)}`;
        } else {
            // Fallback to local static mockup
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
                top: CANVAS_HEIGHT / 2,
                originX: "center",
                originY: "center",
                selectable: false,
                evented: false,
                hoverCursor: "default",
            });

            // Only apply color filter for fallback local images
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
     * LAYER 1: Load the artist's design with realism tweaks.
     *
     * - 0.5px Gaussian blur
     * - 95% opacity to allow texture bleed-through
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

        try {
            const img = await fabric.FabricImage.fromURL(proxyUrl, { crossOrigin: "anonymous" });
            if (!img) return;

            // Apply realism filters: subtle blur for "printed" look
            const blurFilter = new fabric.filters.Blur({ blur: 0.01 }); // ~0.5px at canvas scale
            img.filters = [blurFilter];
            img.applyFilters();

            if (savedTransform) {
                img.set({
                    left: savedTransform.left,
                    top: savedTransform.top,
                    scaleX: savedTransform.scaleX,
                    scaleY: savedTransform.scaleY,
                    angle: savedTransform.angle,
                    originX: "center",
                    originY: "center",
                    opacity: 0.95, // Allow underlying texture bleed-through
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
                    (printArea.width * 0.8) / (img.width || 1),
                    (printArea.height * 0.8) / (img.height || 1)
                );
                img.set({
                    scaleX: scale,
                    scaleY: scale,
                    left: printArea.x + printArea.width / 2,
                    top: printArea.y + printArea.height / 2,
                    originX: "center",
                    originY: "center",
                    opacity: 0.95,
                    cornerColor: "white",
                    cornerStrokeColor: "#3b82f6",
                    borderColor: "#3b82f6",
                    cornerSize: 10,
                    transparentCorners: false,
                });

                // Save initial transform
                const initialTransform: DesignTransform = {
                    left: img.left ?? 0,
                    top: img.top ?? 0,
                    scaleX: img.scaleX ?? 1,
                    scaleY: img.scaleY ?? 1,
                    angle: img.angle ?? 0,
                };
                if (view === "front") frontTransformRef.current = initialTransform;
                else backTransformRef.current = initialTransform;
            }

            // Hide middle-edge controls (only allow corner scale + rotate)
            ["ml", "mr", "mt", "mb", "tl", "tr", "bl", "mtr"].forEach((c) =>
                img.setControlVisible(c, false)
            );

            (img as any).id = "user-design";
            canvas.add(img);
            canvas.setActiveObject(img);
            canvas.requestRenderAll();
        } catch (err) {
            console.error("[Design] Error loading:", err);
        }
    }

    /**
     * LAYER 2: Shadow/Highlight overlay.
     *
     * This sits on top of the design. The composite operation is set to
     * 'multiply' for light shirts (darkens folds) or a custom approach for
     * dark shirts so highlights appear correctly.
     *
     * It's non-interactive so the artist can still move the design underneath.
     */
    async function loadShadowOverlay(canvas: fabric.Canvas) {
        removeById(canvas, "shadow-overlay");

        const currentShadowUrl = shadowMapUrlRef.current;
        if (!currentShadowUrl) return;

        const proxyUrl = `${PROXY_BASE()}${encodeURIComponent(currentShadowUrl)}`;

        try {
            const img = await fabric.FabricImage.fromURL(proxyUrl, { crossOrigin: "anonymous" });
            if (!img) return;

            const padding = 20;
            const maxWidth = CANVAS_WIDTH - padding * 2;
            const maxHeight = CANVAS_HEIGHT - padding * 2;
            const scale = Math.min(maxWidth / (img.width || 1), maxHeight / (img.height || 1));

            img.set({
                scaleX: scale,
                scaleY: scale,
                left: CANVAS_WIDTH / 2,
                top: CANVAS_HEIGHT / 2,
                originX: "center",
                originY: "center",
                selectable: false,
                evented: false,
                hoverCursor: "default",
                opacity: 0.6, // Subtle effect, not overpowering
            });

            // Apply multiply blend via globalCompositeOperation
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

            // Hide guide for export
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

            // Restore
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
