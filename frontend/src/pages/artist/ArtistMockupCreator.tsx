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
    MousePointer2
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import MockupCanvas, {
    TShirtColor,
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

export default function ArtistMockupCreator() {
    const navigate = useNavigate();
    const [previewColor, setPreviewColor] = useState<TShirtColor>(TShirtColor.White);
    const [selectedColors, setSelectedColors] = useState<TShirtColor[]>([TShirtColor.White]);
    const [primaryColor, setPrimaryColor] = useState<TShirtColor>(TShirtColor.White);
    const [primaryView, setPrimaryView] = useState<ViewType>("front");
    const [currentView, setCurrentView] = useState<ViewType>("front");
    const [productName, setProductName] = useState("");
    const [price, setPrice] = useState("");
    const [showGuides, setShowGuides] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [showPublishModal, setShowPublishModal] = useState(false);
    const mockupRef = useRef<MockupCanvasHandle>(null);

    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [pricingProtocols, setPricingProtocols] = useState<PricingProtocol[]>([]);

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
        fetchCategories();
        fetchPricing();
    }, []);

    const [frontDesign, setFrontDesign] = useState<Design | null>(null);
    const [backDesign, setBackDesign] = useState<Design | null>(null);

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

    const colors = [
        { name: "White", color: TShirtColor.White },
        { name: "Black", color: TShirtColor.Black },
        { name: "Grey", color: TShirtColor.Grey },
        { name: "Navy Blue", color: TShirtColor.NavyBlue },
        { name: "Maroon", color: TShirtColor.Maroon },
        { name: "Red", color: TShirtColor.Red },
        { name: "Royal Blue", color: TShirtColor.RoyalBlue },
    ];

    const handleSaveProduct = async (status: "DRAFT" | "PUBLISHED") => {
        setSaveError(null);
        if (!productName.trim()) return setSaveError("Identity Tag Required");
        if (!price || parseFloat(price) <= 0) return setSaveError("Invalid Pricing Logic");
        if (!frontDesign && !backDesign) return setSaveError("No Visual Data Appended");
        if (selectedCategories.length === 0) return setSaveError("Classification Required");

        setIsSaving(true);
        try {
            if (!mockupRef.current) throw new Error("Manifestation Engine Offline");

            const frontBlob = await mockupRef.current.exportView("front");
            const frontFile = new File([frontBlob], `${productName.toLowerCase().replace(/\s+/g, "-")}-front.png`, { type: "image/png" });

            let backFile: File | null = null;
            if (backDesign) {
                const backBlob = await mockupRef.current.exportView("back");
                backFile = new File([backBlob], `${productName.toLowerCase().replace(/\s+/g, "-")}-back.png`, { type: "image/png" });
            }

            const formData = new FormData();
            formData.append("mockupImage", frontFile);
            if (backFile) formData.append("backMockupImage", backFile);
            formData.append("name", productName.trim());
            formData.append("price", price);
            formData.append("tshirtColor", previewColor);
            formData.append("availableColors", JSON.stringify(selectedColors));
            formData.append("primaryColor", primaryColor);
            formData.append("primaryView", primaryView);
            formData.append("designId", (frontDesign || backDesign)!.id);
            formData.append("status", status);
            formData.append("categories", JSON.stringify(selectedCategories));

            await api.post("/api/artist/products", formData, { headers: { "Content-Type": "multipart/form-data" } });
            navigate("/artist/manage-products");
        } catch (err: any) {
            setSaveError(err.response?.data?.message || "Transmission Failure to Hive Server");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="w-full min-h-screen bg-neutral-g1 flex flex-col pt-4">
            <div className="flex-1 px-4 sm:px-8 pb-12 w-full">
                {/* Workspace Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 bg-neutral-black text-white px-3 py-1 rounded-[4px] font-display text-[10px] font-black uppercase tracking-[2px]">
                            <MousePointer2 className="w-3 h-3 text-primary" /> Manifestation Forge
                        </div>
                        <h1 className="font-display text-[ clamp(32px,5vw,48px) ] font-black text-neutral-black leading-none uppercase tracking-tight">
                            Product <span className="text-primary italic">Creator</span>
                        </h1>
                        <p className="font-display text-[14px] font-bold text-neutral-g4 uppercase tracking-wider">
                            Transform your source graphics into verified hive gear.
                        </p>
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={() => handleSaveProduct("DRAFT")}
                            className="flex items-center gap-3 px-6 py-3 bg-white border-[2px] border-neutral-black rounded-[4px] font-display text-[13px] font-black uppercase tracking-[1px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all"
                        >
                            <FileText className="w-4 h-4" /> Save Lab Draft
                        </button>
                        <button
                            onClick={() => setShowPublishModal(true)}
                            className="flex items-center gap-3 px-8 py-3 bg-primary border-[2px] border-neutral-black rounded-[4px] font-display text-[13px] font-black uppercase tracking-[1px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
                        >
                            <Send className="w-4 h-4" /> Transmit to Store
                        </button>
                    </div>
                </div>

                {/* Main Workspace */}
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-8">
                    {/* Left Side: The Canvas */}
                    <div className="space-y-6">
                        <div className="bg-white border-[2px] border-neutral-black rounded-[6px] p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-full bg-neutral-g1/50 -skew-x-12 translate-x-16 pointer-events-none" />

                            <div className="flex justify-between items-center mb-8 relative z-10">
                                <h2 className="font-display text-[18px] font-black uppercase tracking-[1px]">Real-Time Preview</h2>
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
                                />
                                {!frontDesign && !backDesign && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-20">
                                        <ImageIcon className="w-24 h-24 mb-4" />
                                        <p className="font-display text-[14px] font-black uppercase italic tracking-[2px]">Awaiting Visual Input</p>
                                    </div>
                                )}
                            </div>

                            {/* View Switcher */}
                            <div className="mt-8 flex gap-4 relative z-10">
                                {["front", "back"].map((v) => (
                                    <button
                                        key={v}
                                        onClick={() => setCurrentView(v as ViewType)}
                                        className={`flex-1 py-4 border-[2px] border-neutral-black rounded-[4px] font-display text-[12px] font-black uppercase tracking-[2px] transition-all ${currentView === v ? 'bg-neutral-black text-white shadow-[6px_6px_0px_0px_rgba(255,222,0,1)] translate-x-[-2px] translate-y-[-2px]' : 'bg-white hover:bg-neutral-g1'}`}
                                    >
                                        {v} Side {(v === "front" ? frontDesign : backDesign) && "●"}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Error Handling */}
                        {saveError && (
                            <div className="bg-red-50 border-[2px] border-red-500 p-4 rounded-[4px] flex items-center gap-4 animate-bounce">
                                <AlertTriangle className="text-red-500 w-6 h-6" />
                                <p className="font-display text-[12px] font-black text-red-500 uppercase tracking-[1px]">{saveError}</p>
                            </div>
                        )}
                    </div>

                    {/* Right Side: Configuration Sidebar */}
                    <div className="space-y-8">
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
                            </div>
                        </div>

                        {/* 3. Fabrication Config */}
                        <div className="bg-white border-[2px] border-neutral-black rounded-[6px] p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                            <h3 className="font-display text-[14px] font-black uppercase tracking-[1px] mb-6 flex items-center gap-2">
                                <Palette className="w-4 h-4 text-primary" /> Fabrication Config
                            </h3>
                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <label className="font-display text-[10px] font-black uppercase tracking-[2px] text-neutral-g4 px-1">Available Fabrics ({selectedColors.length})</label>
                                    <div className="flex flex-wrap gap-3">
                                        {colors.map((c) => {
                                            const isSelected = selectedColors.includes(c.color);
                                            const isPrimary = primaryColor === c.color;
                                            return (
                                                <div key={c.name} className="relative group">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedColors(prev => isSelected ? (prev.length > 1 ? prev.filter(x => x !== c.color) : prev) : [...prev, c.color]);
                                                            setPreviewColor(c.color);
                                                        }}
                                                        className={`w-10 h-10 border-[2px] border-neutral-black rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] group-hover:scale-110 group-hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all ${isSelected ? 'scale-110 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ring-offset-2 ring-2 ring-primary' : ''}`}
                                                        style={{ backgroundColor: c.color }}
                                                    />
                                                    {isSelected && (
                                                        <button
                                                            onClick={() => setPrimaryColor(c.color)}
                                                            className={`absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border-[1px] border-neutral-black shadow-sm transition-all ${isPrimary ? 'bg-primary' : 'bg-white'}`}
                                                        >
                                                            <Star className={`w-3 h-3 ${isPrimary ? 'fill-neutral-black' : 'text-neutral-g2'}`} />
                                                        </button>
                                                    )}
                                                </div>
                                            )
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
