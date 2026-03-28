// frontend/src/components/mockup-editor/MockupCanvas.tsx (FINAL FIX - BASE REMOVAL)

import { useState, useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import * as fabric from "fabric";
import {
    TSHIRT_FRONT_URL,
    TSHIRT_BACK_URL,
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
}

export interface MockupCanvasHandle {
    exportView: (view: ViewType) => Promise<Blob>;
}

const MockupCanvas = forwardRef<MockupCanvasHandle, MockupCanvasProps>((
    {
        tshirtColor,
        showGuides,
        onCanvasReady,
        frontDesignUrl,
        backDesignUrl,
        currentView,
    },
    ref
) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fabricRef = useRef<fabric.Canvas | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Store transforms for each view
    const frontTransformRef = useRef<DesignTransform | null>(null);
    const backTransformRef = useRef<DesignTransform | null>(null);

    // Track current view in a ref (for closures)
    const currentViewRef = useRef<ViewType>(currentView);
    const containerRef = useRef<HTMLDivElement>(null);

    // Update canvas scaling dynamically
    useEffect(() => {
        if (!containerRef.current) return;

        const resizeObserver = new ResizeObserver((entries) => {
            const entry = entries[0];
            if (!entry) return;

            const { width } = entry.contentRect;
            const canvas = fabricRef.current;

            if (canvas && width > 0) {
                // The base canvas target is 800px. We scale relative to that.
                const scale = width / CANVAS_WIDTH;
                canvas.setDimensions({ width: width, height: width });
                canvas.setZoom(scale);
            }
        });

        resizeObserver.observe(containerRef.current);
        return () => resizeObserver.disconnect();
    }, []);

    // Update ref whenever currentView changes
    useEffect(() => {
        currentViewRef.current = currentView;
        console.log(`[ViewRef] Updated to: ${currentView}`);
    }, [currentView]);

    const currentDesignUrl =
        currentView === "front" ? frontDesignUrl : backDesignUrl;
    const currentPrintArea =
        currentView === "front" ? PRINT_AREA_FRONT : PRINT_AREA_BACK;

    // Initialize Canvas ONCE
    useEffect(() => {
        if (!canvasRef.current) return;

        console.log("[Canvas] Initializing...");

        const canvas = new fabric.Canvas(canvasRef.current, {
            width: CANVAS_WIDTH,
            height: CANVAS_HEIGHT,
            backgroundColor: "#ffffff",
            selection: false,
            preserveObjectStacking: true,
        });

        fabricRef.current = canvas;
        onCanvasReady(canvas);

        // Set initial scale immediately based on container size
        if (containerRef.current) {
            const width = containerRef.current.clientWidth;
            if (width > 0) {
                const scale = width / CANVAS_WIDTH;
                canvas.setDimensions({ width: width, height: width });
                canvas.setZoom(scale);
            }
        }

        // Constraint Logic
        const enforceConstraints = (obj: fabric.Object) => {
            if (!obj) return;

            obj.setCoords();
            let objBounds = obj.getBoundingRect();
            const area =
                currentViewRef.current === "front"
                    ? PRINT_AREA_FRONT
                    : PRINT_AREA_BACK;

            // Constrain scale
            if (
                objBounds.width > area.width ||
                objBounds.height > area.height
            ) {
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

            // Constrain position
            let dx = 0;
            let dy = 0;

            if (objBounds.width <= area.width) {
                if (objBounds.left < area.x) {
                    dx = area.x - objBounds.left;
                } else if (
                    objBounds.left + objBounds.width >
                    area.x + area.width
                ) {
                    dx =
                        area.x +
                        area.width -
                        (objBounds.left + objBounds.width);
                }
            } else {
                if (objBounds.left < area.x) dx = area.x - objBounds.left;
            }

            if (objBounds.height <= area.height) {
                if (objBounds.top < area.y) {
                    dy = area.y - objBounds.top;
                } else if (
                    objBounds.top + objBounds.height >
                    area.y + area.height
                ) {
                    dy =
                        area.y +
                        area.height -
                        (objBounds.top + objBounds.height);
                }
            } else {
                if (objBounds.top < area.y) dy = area.y - objBounds.top;
            }

            if (dx !== 0 || dy !== 0) {
                obj.left = (obj.left ?? 0) + dx;
                obj.top = (obj.top ?? 0) + dy;
                obj.setCoords();
            }
        };

        // Save transform function
        const saveTransform = (obj: fabric.Object) => {
            if ((obj as any).id !== "user-design") return;

            const transform: DesignTransform = {
                left: obj.left ?? 0,
                top: obj.top ?? 0,
                scaleX: obj.scaleX ?? 1,
                scaleY: obj.scaleY ?? 1,
                angle: obj.angle ?? 0,
            };

            const view = currentViewRef.current;

            if (view === "front") {
                frontTransformRef.current = transform;
                console.log(`[Transform] Saved FRONT:`, transform);
            } else {
                backTransformRef.current = transform;
                console.log(`[Transform] Saved BACK:`, transform);
            }
        };

        // Attach events
        canvas.on("object:moving", (e) => {
            if (e.target) {
                enforceConstraints(e.target);
                saveTransform(e.target);
            }
        });
        canvas.on("object:scaling", (e) => {
            if (e.target) {
                enforceConstraints(e.target);
                saveTransform(e.target);
            }
        });
        canvas.on("object:rotating", (e) => {
            if (e.target) {
                enforceConstraints(e.target);
                saveTransform(e.target);
            }
        });
        canvas.on("object:modified", (e) => {
            if (e.target) {
                saveTransform(e.target);
            }
        });

        // Load initial t-shirt base
        loadTShirtBase(canvas, currentView, tshirtColor);

        return () => {
            canvas.dispose();
            fabricRef.current = null;
        };
    }, []);

    // Switch view - CRITICAL FIX HERE
    useEffect(() => {
        const canvas = fabricRef.current;
        if (!canvas) return;

        console.log(`[View] Switching to ${currentView}`);
        setIsLoading(true);

        // ✅ FIX 1: Remove ALL t-shirt bases (in case of duplicates)
        const allObjects = canvas.getObjects();
        const tshirtBases = allObjects.filter(
            (obj) => (obj as any).id === "tshirt-base"
        );

        if (tshirtBases.length > 0) {
            console.log(
                `[View] Removing ${tshirtBases.length} t-shirt base(s)`
            );
            tshirtBases.forEach((base) => canvas.remove(base));
        }

        // ✅ FIX 2: Remove old design
        const oldDesign = canvas
            .getObjects()
            .find((obj) => (obj as any).id === "user-design");
        if (oldDesign) {
            console.log("[View] Removing old design");
            canvas.remove(oldDesign);
        }

        // ✅ FIX 3: Force render to clear canvas
        canvas.requestRenderAll();

        // ✅ FIX 4: Wait a tick before loading new base (ensures removal completes)
        setTimeout(() => {
            loadTShirtBase(canvas, currentView, tshirtColor).then(() => {
                setIsLoading(false);
                console.log(`[View] Switch to ${currentView} complete`);
            });
        }, 0);
    }, [currentView, tshirtColor]);

    // Load/update design
    useEffect(() => {
        const canvas = fabricRef.current;
        if (!canvas || isLoading) {
            console.log("[Design] Skipping load (canvas not ready or loading)");
            return;
        }

        console.log(`[Design] Loading for ${currentView}:`, currentDesignUrl);

        // Remove existing design
        const existingDesign = canvas
            .getObjects()
            .find((obj) => (obj as any).id === "user-design");
        if (existingDesign) {
            console.log("[Design] Removing existing design");
            canvas.remove(existingDesign);
        }

        // If no design URL, just exit
        if (!currentDesignUrl) {
            console.log("[Design] No design URL");
            canvas.requestRenderAll();
            return;
        }

        const savedTransform =
            currentView === "front"
                ? frontTransformRef.current
                : backTransformRef.current;

        // Load new design via proxy to bypass CORS
        const proxyUrl = `${import.meta.env.VITE_API_URL || "http://localhost:3000"}/api/proxy/image?url=${encodeURIComponent(currentDesignUrl)}`;
        console.log("[Design] Loading image from URL...");
        fabric.FabricImage.fromURL(proxyUrl, {
            crossOrigin: "anonymous",
        })
            .then((img) => {
                if (!img) {
                    console.error("[Design] Failed to load image");
                    return;
                }

                if (savedTransform) {
                    console.log(
                        `[Design] Restoring saved transform for ${currentView}:`,
                        savedTransform
                    );
                    img.set({
                        left: savedTransform.left,
                        top: savedTransform.top,
                        scaleX: savedTransform.scaleX,
                        scaleY: savedTransform.scaleY,
                        angle: savedTransform.angle,
                        originX: "center",
                        originY: "center",
                        cornerColor: "white",
                        cornerStrokeColor: "#3b82f6",
                        borderColor: "#3b82f6",
                        cornerSize: 10,
                        transparentCorners: false,
                        padding: 0,
                        strokeWidth: 0,
                    });
                    img.setControlVisible("ml", false); // Middle Left
                    img.setControlVisible("mr", false); // Middle Right
                    img.setControlVisible("mt", false); // Middle Top
                    img.setControlVisible("mb", false); // Middle Bottom
                    img.setControlVisible("tl", false); // top left
                    img.setControlVisible("tr", false); // top right
                    img.setControlVisible("bl", false); // bottom left
                    img.setControlVisible("mtr", false);
                } else {
                    console.log(`[Design] Initial load for ${currentView}`);
                    const scale = Math.min(
                        (currentPrintArea.width * 0.8) / (img.width || 1),
                        (currentPrintArea.height * 0.8) / (img.height || 1)
                    );

                    img.set({
                        scaleX: scale,
                        scaleY: scale,
                        left: currentPrintArea.x + currentPrintArea.width / 2,
                        top: currentPrintArea.y + currentPrintArea.height / 2,
                        originX: "center",
                        originY: "center",
                        cornerColor: "white",
                        cornerStrokeColor: "#3b82f6",
                        borderColor: "#3b82f6",
                        cornerSize: 10,
                        transparentCorners: false,
                        // padding: 0,
                        // strokeWidth: 0,
                    });
                    img.setControlVisible("ml", false); // Middle Left
                    img.setControlVisible("mr", false); // Middle Right
                    img.setControlVisible("mt", false); // Middle Top
                    img.setControlVisible("mb", false); // Middle Bottom
                    img.setControlVisible("tl", false); // top left
                    img.setControlVisible("tr", false); // top right
                    img.setControlVisible("bl", false); // bottom left
                    img.setControlVisible("mtr", false);
                    const initialTransform: DesignTransform = {
                        left: img.left ?? 0,
                        top: img.top ?? 0,
                        scaleX: img.scaleX ?? 1,
                        scaleY: img.scaleY ?? 1,
                        angle: img.angle ?? 0,
                    };

                    if (currentView === "front") {
                        frontTransformRef.current = initialTransform;
                    } else {
                        backTransformRef.current = initialTransform;
                    }

                    console.log(
                        `[Design] Saved initial ${currentView} transform:`,
                        initialTransform
                    );
                }

                (img as any).id = "user-design";

                canvas.add(img);
                canvas.setActiveObject(img);
                canvas.requestRenderAll();
                console.log("[Design] Loaded and added to canvas");
            })
            .catch((err) => {
                console.error("[Design] Error loading:", err);
            });
    }, [currentDesignUrl, isLoading, currentView]);

    // Update guides SEPARATELY
    useEffect(() => {
        const canvas = fabricRef.current;
        if (!canvas) return;

        console.log(`[Guides] Updating - show: ${showGuides}`);
        updateGuides(canvas, showGuides, currentPrintArea);
    }, [showGuides, currentPrintArea]);

    const applyTShirtColor = (img: fabric.Image, color: string) => {
        const blendFilter = img.filters?.find(
            (filter) => filter.type === "BlendColor"
        ) as fabric.filters.BlendColor;

        if (blendFilter) {
            blendFilter.color = color;
        } else {
            const newBlendFilter = new fabric.filters.BlendColor({
                color: color,
                mode: "multiply",
                alpha: 1,
            });
            img.filters = [...(img.filters || []), newBlendFilter];
        }
        img.applyFilters();
    };

    const loadTShirtBase = async (
        canvas: fabric.Canvas,
        view: ViewType,
        color: string
    ): Promise<void> => {
        try {
            const imageUrl =
                view === "front" ? TSHIRT_FRONT_URL : TSHIRT_BACK_URL;

            console.log(`[Base] Loading ${view} t-shirt from:`, imageUrl);

            const img = await fabric.FabricImage.fromURL(imageUrl, {
                crossOrigin: "anonymous",
            });

            if (!img) {
                throw new Error("Image failed to load");
            }

            console.log(`[Base] Image loaded successfully for ${view}`);

            const padding = 20;
            const maxWidth = CANVAS_WIDTH - padding * 2;
            const maxHeight = CANVAS_HEIGHT - padding * 2;

            const scale = Math.min(
                maxWidth / (img.width || 1),
                maxHeight / (img.height || 1)
            );

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

            applyTShirtColor(img, color);
            (img as any).id = "tshirt-base";

            // ✅ FIX 5: Use insertAt(0) to ensure it's at the back
            canvas.insertAt(0, img);
            canvas.requestRenderAll();

            console.log(`[Base] ${view} t-shirt added to canvas at index 0`);
        } catch (err) {
            console.error(`[Base] Failed to load ${view} t-shirt:`, err);

            // Fallback
            if (view === "back") {
                console.log("[Base] Falling back to front image for back view");
                try {
                    const img = await fabric.FabricImage.fromURL(
                        TSHIRT_FRONT_URL,
                        {
                            crossOrigin: "anonymous",
                        }
                    );

                    if (img) {
                        const padding = 20;
                        const maxWidth = CANVAS_WIDTH - padding * 2;
                        const maxHeight = CANVAS_HEIGHT - padding * 2;
                        const scale = Math.min(
                            maxWidth / (img.width || 1),
                            maxHeight / (img.height || 1)
                        );

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

                        applyTShirtColor(img, color);
                        (img as any).id = "tshirt-base";

                        canvas.insertAt(0, img);
                        canvas.requestRenderAll();
                        console.log("[Base] Fallback front image loaded");
                    }
                } catch (fallbackErr) {
                    console.error("[Base] Fallback also failed:", fallbackErr);
                }
            }
        }
    };

    const updateGuides = (
        canvas: fabric.Canvas,
        shouldShow: boolean,
        printArea: typeof PRINT_AREA_FRONT
    ) => {
        const existingGuide = canvas
            .getObjects()
            .find((obj) => (obj as any).id === "print-guide");
        if (existingGuide) canvas.remove(existingGuide);

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
                strokeWidth: strokeWidth,
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
    };

    useImperativeHandle(ref, () => ({
        exportView: async (view: ViewType) => {
            const canvas = fabricRef.current;
            if (!canvas) throw new Error("Canvas not ready");

            console.log(`[Export] Starting export for ${view}`);

            // Save current state to restore later
            const originalView = currentViewRef.current;
            const originalGuide = canvas.getObjects().find(obj => (obj as any).id === "print-guide");
            const originalGuideVisible = originalGuide?.visible;

            if (originalView !== view) {
                // If we're exporting a different view, we need to temporarily load it
                // This is a bit slow but ensures consistency with the component's logic
                await loadTShirtBase(canvas, view, tshirtColor);

                // Clear existing design
                const oldDesign = canvas.getObjects().find((obj) => (obj as any).id === "user-design");
                if (oldDesign) canvas.remove(oldDesign);

                // Load the design for this view
                const designUrl = view === "front" ? frontDesignUrl : backDesignUrl;
                if (designUrl) {
                    const savedTransform = view === "front" ? frontTransformRef.current : backTransformRef.current;
                    const printArea = view === "front" ? PRINT_AREA_FRONT : PRINT_AREA_BACK;

                    const proxyUrl = `${import.meta.env.VITE_API_URL || "http://localhost:3000"}/api/proxy/image?url=${encodeURIComponent(designUrl)}`;
                    const img = await fabric.FabricImage.fromURL(proxyUrl, { crossOrigin: "anonymous" });

                    if (img) {
                        if (savedTransform) {
                            img.set({
                                left: savedTransform.left,
                                top: savedTransform.top,
                                scaleX: savedTransform.scaleX,
                                scaleY: savedTransform.scaleY,
                                angle: savedTransform.angle,
                                originX: "center",
                                originY: "center",
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
                            });
                        }
                        (img as any).id = "user-design";
                        canvas.add(img);
                    }
                }
            }

            // Hide guide
            const guide = canvas.getObjects().find(obj => (obj as any).id === "print-guide");
            if (guide) {
                guide.visible = false;
                canvas.requestRenderAll();
            }

            // Export
            const dataUrl = canvas.toDataURL({
                format: "png",
                quality: 1,
                multiplier: 2,
            });

            // Restore if needed
            if (originalView !== view) {
                await loadTShirtBase(canvas, originalView, tshirtColor);
                // The main useEffect for design will handle restoring the original design because currentView prop hasn't changed
            } else if (guide) {
                guide.visible = !!originalGuideVisible;
                canvas.requestRenderAll();
            }

            const res = await fetch(dataUrl);
            return res.blob();
        }
    }));

    /*
    const deleteActiveObject = () => {
        if (fabricRef.current && activeObject) {
            fabricRef.current.remove(activeObject);
            fabricRef.current.discardActiveObject();
            fabricRef.current.requestRenderAll();

            if (currentViewRef.current === "front") {
                frontTransformRef.current = null;
            } else {
                backTransformRef.current = null;
            }
        }
    };
    */

    /*
    const rotateActiveObject = () => {
        if (activeObject) {
            activeObject.rotate((activeObject.angle || 0) + 90);
            activeObject.setCoords();

            const transform: DesignTransform = {
                left: activeObject.left ?? 0,
                top: activeObject.top ?? 0,
                scaleX: activeObject.scaleX ?? 1,
                scaleY: activeObject.scaleY ?? 1,
                angle: activeObject.angle ?? 0,
            };

            if (currentViewRef.current === "front") {
                frontTransformRef.current = transform;
            } else {
                backTransformRef.current = transform;
            }

            console.log(
                `[Transform] Saved after rotate (${currentViewRef.current}):`,
                transform
            );

            fabricRef.current?.requestRenderAll();
        }
    };
    */

    /*
    const centerActiveObject = () => {
        if (activeObject) {
            activeObject.set({
                left: currentPrintArea.x + currentPrintArea.width / 2,
                top: currentPrintArea.y + currentPrintArea.height / 2,
                originX: "center",
                originY: "center",
            });
            activeObject.setCoords();

            const transform: DesignTransform = {
                left: activeObject.left ?? 0,
                top: activeObject.top ?? 0,
                scaleX: activeObject.scaleX ?? 1,
                scaleY: activeObject.scaleY ?? 1,
                angle: activeObject.angle ?? 0,
            };

            if (currentViewRef.current === "front") {
                frontTransformRef.current = transform;
            } else {
                backTransformRef.current = transform;
            }

            console.log(
                `[Transform] Saved after center (${currentViewRef.current}):`,
                transform
            );

            fabricRef.current?.requestRenderAll();
        }
    };
    */

    return (
        <div ref={containerRef} className="w-full h-full relative" style={{ minHeight: '300px' }}>
            {isLoading && (
                <div className="absolute inset-0 bg-white/80 z-10 flex items-center justify-center rounded-xl">
                    <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
                </div>
            )}

            <div className="w-full h-full">
                <canvas ref={canvasRef} className="w-full h-full rounded-xl" />
            </div>

            {/* {activeObject && (
                <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-white/95 backdrop-blur-sm border border-gray-200 shadow-xl rounded-full px-4 py-2 flex items-center gap-2 z-10">
                    <button
                        onClick={rotateActiveObject}
                        className="p-2 hover:bg-gray-100 rounded-full text-gray-700 transition-colors"
                        title="Rotate 90°"
                    >
                        <RotateCw size={18} />
                    </button>
                    <button
                        onClick={centerActiveObject}
                        className="p-2 hover:bg-gray-100 rounded-full text-gray-700 transition-colors"
                        title="Center"
                    >
                        <Move size={18} />
                    </button>
                    <div className="w-px h-4 bg-gray-300 mx-1"></div>
                    <button
                        onClick={deleteActiveObject}
                        className="p-2 hover:bg-red-50 text-red-600 rounded-full transition-colors"
                        title="Remove"
                    >
                        <X size={18} />
                    </button>
                </div>
            )} */}
        </div>
    );
});

export default MockupCanvas;
