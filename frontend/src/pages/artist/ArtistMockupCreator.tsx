import { useState, useEffect, useRef } from "react";
import {
    Palette,
    Image as ImageIcon,
    Plus,
    Tag,
    Star,
    Send,
    FileText,
    AlertTriangle,
    Maximize2,
    X,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import MockupCanvas, {
    TShirtColor,
    type DesignTransform,
} from "../../components/mockup-editor/MockupCanvas";
import type { MockupCanvasHandle } from "../../components/mockup-editor/MockupCanvas";
import SelectDesignModal from "../../components/modals/SelectDesignModal";
import api from "../../api/axios";

type ViewType = "front" | "back";

interface PricingProtocol {
    category: string;
    frontOnly: number;
    backOnly: number;
    bothSides: number;
}

interface Design {
    id: string;
    title: string;
    imageUrl: string;
}

interface Category {
    id: string;
    name: string;
}

interface DraftEditorState {
    frontDesign?: Design | null;
    backDesign?: Design | null;
    frontTransform?: DesignTransform | null;
    backTransform?: DesignTransform | null;
    selectedColors?: string[];
    primaryColor?: string;
    primaryView?: ViewType;
}

export default function ArtistMockupCreator() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const editingProductId = searchParams.get("productId");
    const isEditMode = Boolean(editingProductId);
    const [previewColor, setPreviewColor] = useState<TShirtColor>(TShirtColor.White);
    const [selectedColors, setSelectedColors] = useState<TShirtColor[]>([TShirtColor.White]);
    const [primaryColor, setPrimaryColor] = useState<TShirtColor>(TShirtColor.White);
    /** User must tap the ★ on a selected fabric (set once per session / after primary fabric is removed). Hydrated drafts start confirmed. */
    const [primaryColorConfirmed, setPrimaryColorConfirmed] = useState(false);
    const [primaryView, setPrimaryView] = useState<ViewType>("front");
    const [currentView, setCurrentView] = useState<ViewType>("front");
    const [productName, setProductName] = useState("");
    const [tagInput, setTagInput] = useState("");
    const [tags, setTags] = useState<string[]>([]);
    const [price, setPrice] = useState("");
    const [showGuides, setShowGuides] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isHydratingDraft, setIsHydratingDraft] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [showPublishModal, setShowPublishModal] = useState(false);
    const mockupRef = useRef<MockupCanvasHandle>(null);
    const [initialFrontTransform, setInitialFrontTransform] = useState<DesignTransform | null>(null);
    const [initialBackTransform, setInitialBackTransform] = useState<DesignTransform | null>(null);

    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [pricingProtocols, setPricingProtocols] = useState<PricingProtocol[]>([]);
    const [globalColors, setGlobalColors] = useState<{ name: string; hex: string; mockupUrl: string; backMockupUrl?: string; shadowMapUrl?: string; displacementMapUrl?: string }[]>([]);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await api.get("/api/categories");
                setCategories(res.data.data.categories);
            } catch (err) {
                console.error("Failed to load categories", err);
            }
        };
        const fetchPricing = async () => {
            try {
                const res = await api.get("/api/config/pricing_protocols");
                if (res.data?.data?.config?.protocols) {
                    setPricingProtocols(res.data.data.config.protocols);
                }
            } catch (err) {
                console.error("Failed to load pricing protocols", err);
            }
        };
        const fetchColors = async () => {
            try {
                const res = await api.get("/api/colors");
                const colors = res.data.data.colors;
                setGlobalColors(colors);
                // Auto-select first global color as default
                if (!isEditMode && colors.length > 0) {
                    const firstHex = colors[0].hex as TShirtColor;
                    setPreviewColor(firstHex);
                    setSelectedColors([firstHex]);
                    setPrimaryColor(firstHex);
                    setPrimaryColorConfirmed(false);
                }
            } catch (err) {
                console.error("Failed to load global colors", err);
            }
        };
        fetchCategories();
        fetchPricing();
        fetchColors();
    }, [isEditMode]);

    const [frontDesign, setFrontDesign] = useState<Design | null>(null);
    const [backDesign, setBackDesign] = useState<Design | null>(null);

    useEffect(() => {
        if (!editingProductId) return;

        const fetchDraftProduct = async () => {
            try {
                setIsHydratingDraft(true);
                setSaveError(null);
                const res = await api.get(`/api/artist/products/${editingProductId}`);
                const product = res.data.data.product;
                const draftState = (product.draftEditorState || {}) as DraftEditorState;

                setProductName(product.name || "");
                setSelectedCategories(Array.isArray(product.categories) ? product.categories : []);
                setTags(Array.isArray(product.tags) ? product.tags : []);
                setPreviewColor((draftState.primaryColor || product.primaryColor || product.tshirtColor) as TShirtColor);
                setSelectedColors(
                    ((draftState.selectedColors && draftState.selectedColors.length
                        ? draftState.selectedColors
                        : product.availableColors && product.availableColors.length
                          ? product.availableColors
                          : [product.tshirtColor]) as TShirtColor[])
                );
                setPrimaryColor((draftState.primaryColor || product.primaryColor || product.tshirtColor) as TShirtColor);
                setPrimaryColorConfirmed(true);
                setPrimaryView((draftState.primaryView || product.primaryView || "front") as ViewType);
                setFrontDesign(draftState.frontDesign || product.design || null);
                setBackDesign(draftState.backDesign || null);
                setInitialFrontTransform(draftState.frontTransform || null);
                setInitialBackTransform(draftState.backTransform || null);
            } catch (err: any) {
                setSaveError(err.response?.data?.message || "Failed to load draft product");
            } finally {
                setIsHydratingDraft(false);
            }
        };

        fetchDraftProduct();
    }, [editingProductId]);

    // Auto-calculate Price Logic
    useEffect(() => {
        // Find T-Shirt protocol or use defaults
        const protocol = pricingProtocols.find(p => p.category === "T-Shirt") || {
            frontOnly: 999,
            backOnly: 999,
            bothSides: 1199
        };

        if (!frontDesign && !backDesign) {
            setPrice("0");
        } else if (frontDesign && backDesign) {
            setPrice(protocol.bothSides.toString());
        } else if (frontDesign) {
            setPrice(protocol.frontOnly.toString());
        } else if (backDesign) {
            setPrice(protocol.backOnly.toString());
        }
    }, [frontDesign, backDesign, pricingProtocols]);

    const [isSelectModalOpen, setIsSelectModalOpen] = useState(false);
    const [modalTargetView, setModalTargetView] = useState<ViewType>("front");

    const handleOpenSelectModal = (view: ViewType) => {
        setModalTargetView(view);
        setIsSelectModalOpen(true);
    };

    const handleDesignSelect = (design: Design, view: ViewType) => {
        if (view === "front") setFrontDesign(design);
        else setBackDesign(design);
    };

    const handleRemoveDesign = (view: ViewType) => {
        if (view === "front") setFrontDesign(null);
        else setBackDesign(null);
    };

    const addTag = (rawValue: string) => {
        const normalized = rawValue.trim().toLowerCase();
        if (!normalized) return;
        if (tags.includes(normalized)) return;
        if (tags.length >= 5) {
            setSaveError("Maximum 5 tags allowed");
            return;
        }
        setTags((prev) => [...prev, normalized]);
        setTagInput("");
    };

    const removeTag = (tag: string) => {
        setTags((prev) => prev.filter((t) => t !== tag));
    };

    // colors is now dynamically fetched
    const activeColorsList = globalColors.length > 0 ? globalColors.map(c => ({ name: c.name, color: c.hex as TShirtColor, mockupUrl: c.mockupUrl })) : [];

    const handleSaveProduct = async (status: "DRAFT" | "PUBLISHED") => {
        setSaveError(null);
        if (!productName.trim()) return setSaveError("Identity Tag Required");
        if (!price || parseFloat(price) <= 0) return setSaveError("Invalid Pricing Logic");
        if (!frontDesign && !backDesign) return setSaveError("No Visual Data Appended");
        if (selectedCategories.length === 0) return setSaveError("Classification Required");
        if (!primaryColorConfirmed) {
            return setSaveError("Tap the star (★) on a selected fabric to confirm the primary storefront color.");
        }
        const primaryInSelection = selectedColors.some(
            (c) => c.toLowerCase() === primaryColor.toLowerCase()
        );
        if (!primaryInSelection) {
            return setSaveError("Primary fabric must be one of your selected colors. Tap ★ on a selected swatch.");
        }

        setIsSaving(true);
        try {
            if (!mockupRef.current) throw new Error("Manifestation Engine Offline");

            const hexSlug = (hex: string) => hex.replace(/^#/, "").toLowerCase();

            const blobsByColor: { hex: string; front: Blob; back: Blob | null }[] = [];
            for (const color of selectedColors) {
                const gc = globalColors.find((c) => c.hex.toLowerCase() === color.toLowerCase());
                if (!gc) continue;
                const frontBlob = await mockupRef.current.exportViewWithAppearance({
                    tshirtColor: color,
                    colorBaseUrl: gc.mockupUrl || null,
                    colorBackBaseUrl: gc.backMockupUrl || null,
                    shadowMapUrl: gc.shadowMapUrl || null,
                    displacementMapUrl: gc.displacementMapUrl || null,
                    view: "front",
                });
                let backBlob: Blob | null = null;
                if (backDesign) {
                    backBlob = await mockupRef.current.exportViewWithAppearance({
                        tshirtColor: color,
                        colorBaseUrl: gc.mockupUrl || null,
                        colorBackBaseUrl: gc.backMockupUrl || null,
                        shadowMapUrl: gc.shadowMapUrl || null,
                        displacementMapUrl: gc.displacementMapUrl || null,
                        view: "back",
                    });
                }
                blobsByColor.push({ hex: color, front: frontBlob, back: backBlob });
            }

            const primaryEntry =
                blobsByColor.find((b) => b.hex.toLowerCase() === primaryColor.toLowerCase()) ??
                blobsByColor[0];
            if (!primaryEntry) throw new Error("Could not export mockups for selected colors");

            const frontFile = new File(
                [primaryEntry.front],
                `${productName.toLowerCase().replace(/\s+/g, "-")}-front.png`,
                { type: "image/png" }
            );
            let backFile: File | null = null;
            if (backDesign && primaryEntry.back) {
                backFile = new File(
                    [primaryEntry.back],
                    `${productName.toLowerCase().replace(/\s+/g, "-")}-back.png`,
                    { type: "image/png" }
                );
            }

            const formData = new FormData();
            formData.append("mockupImage", frontFile);
            if (backFile) formData.append("backMockupImage", backFile);

            for (const { hex, front, back } of blobsByColor) {
                if (hex.toLowerCase() === primaryColor.toLowerCase()) continue;
                const slug = hexSlug(hex);
                formData.append(
                    `cfront_${slug}`,
                    new File([front], `front-${slug}.png`, { type: "image/png" })
                );
                if (back) {
                    formData.append(
                        `cback_${slug}`,
                        new File([back], `back-${slug}.png`, { type: "image/png" })
                    );
                }
            }
            formData.append("name", productName.trim());
            formData.append("price", price);
            formData.append("tshirtColor", previewColor);
            formData.append("availableColors", JSON.stringify(selectedColors));
            formData.append("primaryColor", primaryColor);
            formData.append("primaryView", primaryView);
            formData.append("designId", (frontDesign || backDesign)!.id);
            formData.append("status", status);
            formData.append("categories", JSON.stringify(selectedCategories));
            formData.append("tags", JSON.stringify(tags));
            formData.append(
                "draftEditorState",
                JSON.stringify({
                    frontDesign,
                    backDesign,
                    frontTransform: mockupRef.current?.getDesignTransform("front") || null,
                    backTransform: mockupRef.current?.getDesignTransform("back") || null,
                    selectedColors,
                    primaryColor,
                    primaryView,
                })
            );

            if (isEditMode && editingProductId) {
                await api.patch(`/api/artist/products/${editingProductId}`, formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
            } else {
                await api.post("/api/artist/products", formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
            }
            navigate("/artist/manage-products");
        } catch (err: any) {
            setSaveError(err.response?.data?.message || "Transmission Failure to Hive Server");
            setIsSaving(false);
        }
    };

    return (
        <div className="w-full min-h-screen bg-neutral-g1 flex flex-col pt-4 relative">
            {saveError && (
                <div
                    className="fixed top-4 left-4 right-4 sm:left-auto sm:right-6 z-[120] w-auto sm:max-w-sm bg-red-50 border-[2px] border-red-500 p-4 rounded-[4px] flex items-start gap-3 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] animate-bounce"
                    role="alert"
                >
                    <AlertTriangle className="text-red-500 w-6 h-6 shrink-0 mt-0.5" />
                    <p className="flex-1 min-w-0 font-display text-[11px] sm:text-[12px] font-black text-red-500 uppercase tracking-[1px] leading-snug">
                        {saveError}
                    </p>
                    <button
                        type="button"
                        onClick={() => setSaveError(null)}
                        className="shrink-0 font-display text-[10px] font-black uppercase text-red-600 underline underline-offset-2"
                        aria-label="Dismiss error"
                    >
                        Dismiss
                    </button>
                </div>
            )}

            {(isSaving || isHydratingDraft) && (
                <div
                    className="fixed inset-0 z-[200] bg-neutral-black/90 backdrop-blur-sm flex flex-col items-center justify-center gap-8 px-8"
                    role="status"
                    aria-live="polite"
                    aria-busy="true"
                >
                    <img
                        src="/assets/loading-image.svg"
                        alt=""
                        className="w-28 h-28 object-contain animate-bounce"
                    />
                    <div className="text-center space-y-2 max-w-md">
                        <p className="font-display text-[13px] font-black uppercase tracking-[2px] text-primary">
                            {isHydratingDraft ? "Loading draft product" : isEditMode ? "Updating draft product" : "Manifesting product"}
                        </p>
                        <p className="font-display text-[11px] font-bold text-white/60 uppercase tracking-wider leading-relaxed">
                            {isHydratingDraft
                                ? "Restoring your draft configuration and mockup state."
                                : "Uploading mockups and syncing your catalog. You will be redirected when complete."}
                        </p>
                    </div>
                </div>
            )}
            <div className="flex-1 px-4 sm:px-8 pb-12 w-full min-h-0">
                {/* Top bar: title left, save / publish top-right — canvas workspace starts directly below */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6 lg:mb-8">
                    <div className="min-w-0">
                        <h1 className="font-display text-[clamp(1.125rem,2.5vw,1.375rem)] font-black uppercase tracking-tight text-neutral-black">
                            Mockup lab
                        </h1>
                        <p className="font-display text-[10px] font-bold text-neutral-g3 uppercase tracking-[0.2em] mt-1">
                            Canvas & product setup
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3 sm:justify-end shrink-0">
                        <button
                            type="button"
                            onClick={() => handleSaveProduct("DRAFT")}
                            disabled={isSaving || !primaryColorConfirmed}
                            title={
                                !primaryColorConfirmed
                                    ? "Confirm primary fabric with the star (★) in Fabrication Config"
                                    : undefined
                            }
                            className="flex items-center gap-3 px-5 py-2.5 sm:px-6 sm:py-3 bg-white border-[2px] border-neutral-black rounded-[4px] font-display text-[12px] sm:text-[13px] font-black uppercase tracking-[1px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all disabled:opacity-40 disabled:pointer-events-none"
                        >
                            <FileText className="w-4 h-4 shrink-0" />{" "}
                            {isEditMode ? "Update Lab Draft" : "Save Lab Draft"}
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowPublishModal(true)}
                            disabled={isSaving || !primaryColorConfirmed}
                            title={
                                !primaryColorConfirmed
                                    ? "Confirm primary fabric with the star (★) in Fabrication Config"
                                    : undefined
                            }
                            className="flex items-center gap-3 px-6 py-2.5 sm:px-8 sm:py-3 bg-primary border-[2px] border-neutral-black rounded-[4px] font-display text-[12px] sm:text-[13px] font-black uppercase tracking-[1px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all disabled:opacity-40 disabled:pointer-events-none"
                        >
                            <Send className="w-4 h-4 shrink-0" /> Transmit to Store
                        </button>
                    </div>
                </div>

                {/* Main Workspace: canvas first (top on mobile); left canvas sticky on lg; right column scrolls inside max-height */}
                <div className="flex flex-col lg:flex-row lg:gap-8 lg:items-start">
                    {/* Left Side: The Canvas */}
                    <div className="w-full lg:flex-1 lg:min-w-0 space-y-6 lg:sticky lg:top-4 lg:z-10 lg:self-start">
                        <div className="bg-white border-[2px] border-neutral-black rounded-[6px] p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-full bg-neutral-g1/50 -skew-x-12 translate-x-16 pointer-events-none" />

                            <div className="flex justify-between items-center mb-8 relative z-10">
                                
                                {/* View Switcher */}
                                <div className="flex gap-4 z-10">
                                    {["front", "back"].map((v) => (
                                        <button
                                            key={v}
                                            onClick={() => setCurrentView(v as ViewType)}
                                            className={`px-8 py-4 border-[2px] border-neutral-black rounded-[4px] font-display text-[12px] font-black uppercase tracking-[2px] transition-all ${currentView === v ? 'bg-neutral-black text-white shadow-[6px_6px_0px_0px_rgba(255,222,0,1)] translate-x-[-2px] translate-y-[-2px]' : 'bg-white hover:bg-neutral-g1'}`}
                                        >
                                            {v} Side {(v === "front" ? frontDesign : backDesign) && "●"}
                                        </button>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setShowGuides(!showGuides)}
                                        className={`px-4 h-10 flex items-center gap-2 border-[2px] border-neutral-black rounded-[4px] font-display text-[10px] font-black uppercase tracking-[1px] transition-all ${showGuides ? 'bg-primary shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'bg-white'}`}
                                    >
                                        <Maximize2 className="w-3.5 h-3.5" />
                                        {showGuides ? "Hide Guides" : "Show Guides"}
                                    </button>
                                </div>
                            </div>

                            <div className="aspect-square w-full bg-neutral-g1 border-[2px] border-neutral-black rounded-[4px] relative group-hover:shadow-[inset_0px_0px_40px_rgba(0,0,0,0.05)] transition-all overflow-hidden cursor-crosshair">
                                <MockupCanvas
                                    ref={mockupRef}
                                    tshirtColor={previewColor}
                                    showGuides={showGuides}
                                    frontDesignUrl={frontDesign?.imageUrl || null}
                                    backDesignUrl={backDesign?.imageUrl || null}
                                    currentView={currentView}
                                    onCanvasReady={() => { }}
                                    colorBaseUrl={globalColors.find(c => c.hex.toLowerCase() === previewColor.toLowerCase())?.mockupUrl || null}
                                    colorBackBaseUrl={globalColors.find(c => c.hex.toLowerCase() === previewColor.toLowerCase())?.backMockupUrl || null}
                                    shadowMapUrl={globalColors.find(c => c.hex.toLowerCase() === previewColor.toLowerCase())?.shadowMapUrl || null}
                                    displacementMapUrl={globalColors.find(c => c.hex.toLowerCase() === previewColor.toLowerCase())?.displacementMapUrl || null}
                                    initialFrontTransform={initialFrontTransform}
                                    initialBackTransform={initialBackTransform}
                                />
                                {!frontDesign && !backDesign && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-20">
                                        <ImageIcon className="w-24 h-24 mb-4" />
                                        <p className="font-display text-[14px] font-black uppercase italic tracking-[2px]">Awaiting Visual Input</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Side: Configuration Sidebar */}
                    <div className="w-full lg:w-[420px] lg:shrink-0 space-y-8 lg:max-h-[calc(100dvh-7.5rem)] lg:min-h-0 lg:overflow-y-auto lg:overscroll-y-contain lg:pr-2 lg:pb-2 [scrollbar-width:thin]">
                        {/* 1. Visual Assembly */}
                        <div className="bg-white border-[2px] border-neutral-black rounded-[6px] p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                            <h3 className="font-display text-[14px] font-black uppercase tracking-[1px] mb-6 flex items-center gap-2">
                                <ImageIcon className="w-4 h-4 text-primary" /> Visual Assembly
                            </h3>
                            <div className="space-y-4">
                                {["front", "back"].map((side) => {
                                    const design = side === "front" ? frontDesign : backDesign;
                                    return (
                                        <div key={side} className="bg-neutral-g1 border-[2px] border-neutral-black p-4 rounded-[4px] relative group hover:bg-white transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className="w-16 h-16 bg-white border-[1px] border-neutral-black rounded-[2px] overflow-hidden flex-shrink-0">
                                                    {design ? <img src={design.imageUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center opacity-20"><Plus className="w-6 h-6" /></div>}
                                                </div>
                                                <div className="flex-1 overflow-hidden">
                                                    <p className="font-display text-[10px] font-black uppercase text-neutral-g4 mb-1">{side} placement</p>
                                                    <h4 className="font-display text-[13px] font-black text-neutral-black uppercase truncate">{design ? design.title : "Unassigned"}</h4>
                                                    <div className="flex gap-2 mt-2">
                                                        <button onClick={() => handleOpenSelectModal(side as ViewType)} className="text-[9px] font-black uppercase text-primary-dark underline underline-offset-2 decoration-[2px]">{design ? "Change" : "Select Source"}</button>
                                                        {design && <button onClick={() => handleRemoveDesign(side as ViewType)} className="text-[9px] font-black uppercase text-danger underline underline-offset-2 decoration-[2px]">Remove</button>}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* 2. Identity & Value */}
                        <div className="bg-white border-[2px] border-neutral-black rounded-[6px] p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                            <h3 className="font-display text-[14px] font-black uppercase tracking-[1px] mb-6 flex items-center gap-2">
                                <Tag className="w-4 h-4 text-primary" /> Identity & Value
                            </h3>
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="font-display text-[10px] font-black uppercase tracking-[2px] text-neutral-g4 px-1">Product Title</label>
                                    <input value={productName} onChange={e => setProductName(e.target.value)} placeholder="e.g. CYBER HIVE DROP V.01" className="w-full bg-neutral-g1 border-[2px] border-neutral-black px-4 py-3 font-display text-[14px] font-black uppercase tracking-[1px] rounded-[4px] outline-none focus:bg-white transition-all" />
                                </div>
                                <div className="space-y-2">
                                    <label className="font-display text-[10px] font-black uppercase tracking-[2px] text-neutral-g4 px-1">Price Protocol (Automated INR)</label>
                                    <div className="relative group/price">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 font-display text-[14px] font-black text-neutral-black">₹</div>
                                        <input
                                            readOnly
                                            type="number"
                                            value={price}
                                            className="w-full bg-neutral-g1/50 border-[2px] border-neutral-black/20 pl-10 pr-4 py-3 font-display text-[18px] font-black uppercase tracking-[1px] rounded-[4px] outline-none cursor-not-allowed group-hover/price:border-neutral-black transition-all"
                                        />
                                        <p className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-neutral-g3 uppercase italic">Locked</p>
                                    </div>
                                    <p className="text-[9px] font-bold text-success uppercase tracking-[1px]">● Estimated Earning: ₹{(parseFloat(price || "0") * 0.25).toFixed(2)}</p>
                                    <p className="text-[9px] font-bold text-neutral-g3 uppercase italic mt-1 leading-tight">
                                        Single side: ₹999 | Double-sided: ₹1199
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <label className="font-display text-[10px] font-black uppercase tracking-[2px] text-neutral-g4 px-1">Classification (Max 2)</label>
                                    <div className="flex flex-wrap gap-2">
                                        {categories.map(cat => {
                                            const isSelected = selectedCategories.includes(cat.name);
                                            return (
                                                <button
                                                    key={cat.id}
                                                    onClick={() => {
                                                        if (isSelected) setSelectedCategories(prev => prev.filter(c => c !== cat.name));
                                                        else if (selectedCategories.length < 2) setSelectedCategories(prev => [...prev, cat.name]);
                                                    }}
                                                    className={`px-3 py-1.5 border-[2px] border-neutral-black rounded-[2px] font-display text-[10px] font-black uppercase transition-all ${isSelected ? 'bg-primary shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'bg-white opacity-40 hover:opacity-100'}`}
                                                >
                                                    {cat.name}
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="font-display text-[10px] font-black uppercase tracking-[2px] text-neutral-g4 px-1">
                                        Search Tags (Max 5)
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            value={tagInput}
                                            onChange={(e) => setTagInput(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter" || e.key === ",") {
                                                    e.preventDefault();
                                                    addTag(tagInput);
                                                }
                                            }}
                                            placeholder="e.g. anime, streetwear"
                                            className="w-full bg-neutral-g1 border-[2px] border-neutral-black px-4 py-2.5 font-display text-[12px] font-black tracking-[1px] rounded-[4px] outline-none focus:bg-white transition-all"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => addTag(tagInput)}
                                            disabled={tags.length >= 5}
                                            className="px-4 py-2.5 bg-primary border-[2px] border-neutral-black rounded-[4px] font-display text-[10px] font-black uppercase tracking-[1px] disabled:opacity-40"
                                        >
                                            Add
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-2 min-h-[28px]">
                                        {tags.map((tag) => (
                                            <span
                                                key={tag}
                                                className="inline-flex items-center gap-1 px-2 py-1 bg-primary/20 border-[1px] border-neutral-black rounded-[2px] font-display text-[10px] font-black uppercase"
                                            >
                                                {tag}
                                                <button
                                                    type="button"
                                                    onClick={() => removeTag(tag)}
                                                    className="hover:text-danger"
                                                    aria-label={`Remove ${tag}`}
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                    <p className="text-[9px] font-bold text-neutral-g3 uppercase">
                                        Customer search matches these tags directly.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* 3. Fabrication Config */}
                        <div className="bg-white border-[2px] border-neutral-black rounded-[6px] p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                            <h3 className="font-display text-[14px] font-black uppercase tracking-[1px] mb-6 flex items-center gap-2">
                                <Palette className="w-4 h-4 text-primary" /> Fabrication Config
                            </h3>
                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <label className="font-display text-[10px] font-black uppercase tracking-[2px] text-neutral-g4 px-1">
                                        Available Fabrics ({selectedColors.length})
                                    </label>
                                    {!primaryColorConfirmed && selectedColors.length > 0 && (
                                        <p className="font-display text-[10px] font-black uppercase tracking-wide text-danger bg-danger/10 border border-danger/40 rounded-[4px] px-3 py-2">
                                            Required: tap the ★ on your primary fabric before saving or publishing.
                                        </p>
                                    )}
                                    <div className="flex flex-wrap gap-3">
                                        {activeColorsList.map((c) => {
                                            const isSelected = selectedColors.includes(c.color);
                                            const isPrimary = primaryColor === c.color;
                                            return (
                                                <div key={c.name} className="relative group">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            if (isSelected) {
                                                                if (selectedColors.length <= 1) return;
                                                                const next = selectedColors.filter((x) => x !== c.color);
                                                                setSelectedColors(next);
                                                                const stillHasPrimary = next.some(
                                                                    (x) =>
                                                                        x.toLowerCase() === primaryColor.toLowerCase()
                                                                );
                                                                if (!stillHasPrimary) {
                                                                    setPrimaryColorConfirmed(false);
                                                                    setPrimaryColor(next[0]);
                                                                    setPreviewColor(next[0]);
                                                                }
                                                                return;
                                                            }
                                                            setSelectedColors((prev) => [...prev, c.color]);
                                                            setPreviewColor(c.color);
                                                        }}
                                                        className={`w-10 h-10 border-[2px] border-neutral-black rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] group-hover:scale-110 group-hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all ${isSelected ? "scale-110 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ring-offset-2 ring-2 ring-primary" : ""}`}
                                                        style={{ backgroundColor: c.color }}
                                                        title={c.name}
                                                    />
                                                    {isSelected && (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setPrimaryColor(c.color);
                                                                setPreviewColor(c.color);
                                                                setPrimaryColorConfirmed(true);
                                                            }}
                                                            aria-label={`Set ${c.name} as primary storefront color`}
                                                            className={`absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border-[1px] border-neutral-black shadow-sm transition-all ${isPrimary && primaryColorConfirmed ? "bg-primary ring-2 ring-neutral-black ring-offset-1" : isPrimary ? "bg-primary/60" : "bg-white"}`}
                                                        >
                                                            <Star
                                                                className={`w-3 h-3 ${isPrimary && primaryColorConfirmed ? "fill-neutral-black" : isPrimary ? "fill-neutral-black/50" : "text-neutral-g2"}`}
                                                            />
                                                        </button>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <label className="font-display text-[10px] font-black uppercase tracking-[2px] text-neutral-g4 px-1">Primary Landing View</label>
                                    <div className="flex border-[2px] border-neutral-black rounded-[4px] overflow-hidden">
                                        {["front", "back"].map(v => (
                                            <button
                                                key={v}
                                                onClick={() => setPrimaryView(v as ViewType)}
                                                disabled={v === "back" && !backDesign}
                                                className={`flex-1 py-3 font-display text-[11px] font-black uppercase tracking-[1px] transition-all ${primaryView === v ? 'bg-neutral-black text-white' : 'bg-white hover:bg-neutral-g1 disabled:opacity-30'}`}
                                            >
                                                {v} First
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            {/* Select Design Modal */}
            {isSelectModalOpen && (
                <SelectDesignModal
                    onClose={() => setIsSelectModalOpen(false)}
                    onDesignSelect={handleDesignSelect}
                    targetView={modalTargetView}
                    currentFrontDesignId={frontDesign?.id || null}
                    currentBackDesignId={backDesign?.id || null}
                />
            )}

            {/* Publish Confirmation Modal */}
            {showPublishModal && (
                <div className="fixed inset-0 bg-neutral-black/90 backdrop-blur-sm flex items-center justify-center z-[100] p-4 text-neutral-black">
                    <div className="bg-white border-[3px] border-neutral-black rounded-[8px] shadow-[16px_16px_0px_0px_rgba(255,222,0,1)] w-full max-w-lg overflow-hidden animate-in zoom-in duration-200">
                        <div className="bg-neutral-black p-6 flex items-center gap-4 text-white">
                            <div className="w-12 h-12 bg-primary flex items-center justify-center rounded-[4px] shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]">
                                <AlertTriangle className="w-8 h-8 text-neutral-black" />
                            </div>
                            <div>
                                <h2 className="font-display text-[20px] font-black uppercase tracking-[1px]">Commit to Storefront?</h2>
                                <p className="font-display text-[11px] font-bold text-primary italic uppercase">Manifestation is irreversible</p>
                            </div>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="p-4 bg-neutral-g1 border-[2px] border-neutral-black rounded-[4px] space-y-4">
                                <p className="font-display text-[12px] font-black uppercase border-b-[1px] border-neutral-black/10 pb-2">Hive Protocols:</p>
                                <ul className="space-y-3">
                                    {[
                                        "Product identity becomes immutable once live.",
                                        "SKU generation and distribution begins immediately.",
                                        "Storefront listing will be visible to all hive customers.",
                                        "Requires manual archival to remove from public access."
                                    ].map((text, i) => (
                                        <li key={i} className="flex gap-3">
                                            <div className="w-1.5 h-1.5 bg-neutral-black rounded-full mt-1.5 flex-shrink-0" />
                                            <span className="font-display text-[11px] font-bold text-neutral-black/80 uppercase leading-snug">{text}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <p className="font-display text-[13px] font-black text-neutral-black uppercase text-center py-2">Execute Final Verification of Visuals & Pricing?</p>
                        </div>

                        <div className="p-6 bg-neutral-g1 border-t-[2px] border-neutral-black flex gap-4">
                            <button onClick={() => setShowPublishModal(false)} className="flex-1 py-4 border-[2px] border-neutral-black rounded-[4px] font-display text-[12px] font-black uppercase tracking-[2px] hover:bg-white transition-all">Abort</button>
                            <button
                                onClick={() => {
                                    setShowPublishModal(false);
                                    handleSaveProduct("PUBLISHED");
                                }}
                                disabled={isSaving}
                                className="flex-1 py-4 bg-primary border-[2px] border-neutral-black rounded-[4px] font-display text-[12px] font-black uppercase tracking-[2px] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all disabled:opacity-20"
                            >
                                {isSaving ? "Verifying..." : "Manifest Product"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
