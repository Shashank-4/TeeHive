import { useState, useEffect } from "react";
import { Save, AlertCircle, Loader2, Settings, Home, Palette, Image as ImageIcon, Zap, ShieldCheck, Tag, Trash2, Plus } from "lucide-react";
import api from "../../api/axios";

interface CustomerHomeConfig {
    showHeroSection: boolean;
    heroTitle: string;
    heroSubtitle: string;
    heroTileFreshTitle?: string;
    heroTileFreshButton?: string;
    heroTileFreshLink?: string;
    heroTileArtistsTitle?: string;
    heroTileArtistsButton?: string;
    heroTileArtistsLink?: string;
    showCategoriesSection: boolean;
    showFeaturedProducts: boolean;
    showTrendingArtists: boolean;
}

interface ArtistDashboardConfig {
    showAnnouncement: boolean;
    announcementText: string;
}

interface BannersConfig {
    heroBrowseArtists: string;
    heroFreshDesigns: string;
    shopBanner: string;
    artistsListBanner: string;
    hive50Banner: string;
    emailBanner: string;
    heroBgImage: string;
    headerLogo: string;
}


interface PricingProtocol {
    category: string;
    frontOnly: number;
    backOnly: number;
    bothSides: number;
}

interface PricingConfig {
    protocols: PricingProtocol[];
}

interface SpecialOfferConfig {
    title: string;
    subtitle: string;
    categoryName: string;
    discountPercent: number;
    isVisible: boolean;
    ctaText: string;
}

interface CouponConfig {
    id: string;
    code: string;
    discountPercent: number;
    isActive: boolean;
    createdAt: string;
}

const SUBTITLE_DEFAULT =
    "Behind every design is a real Indian creator with a dream. Your purchase puts money directly in their hands — not a factory, not a corporation. Just art and the people who make it.";

const DEFAULT_HOME_CONFIG: CustomerHomeConfig = {
    showHeroSection: true,
    heroTitle: "",
    heroSubtitle: SUBTITLE_DEFAULT,
    heroTileFreshTitle: "Fresh Designs\nEvery Day",
    heroTileFreshButton: "Explore",
    heroTileFreshLink: "/products?latestDrops=true&sort=newest",
    heroTileArtistsTitle: "Meet Independent\nIndian Artists",
    heroTileArtistsButton: "Browse",
    heroTileArtistsLink: "/artists",
    showCategoriesSection: true,
    showFeaturedProducts: true,
    showTrendingArtists: true,
};

const DEFAULT_ARTIST_CONFIG: ArtistDashboardConfig = {
    showAnnouncement: true,
    announcementText: "Welcome to TeeHive! Upload at least 3 designs to submit your profile for verification and start selling.",
};

const DEFAULT_BANNERS_CONFIG: BannersConfig = {
    heroBrowseArtists: "/assets/banners/hero_browse_artists.jpg",
    heroFreshDesigns: "/assets/banners/hero_fresh_designs.jpg",
    shopBanner: "/assets/banners/shop_banner.jpg",
    artistsListBanner: "/assets/banners/artists_list_banner.jpg",
    hive50Banner: "/assets/banners/hive50_banner.jpg",
    emailBanner: "https://pub-7f5de94304e647a1b6b59ba54680291a.r2.dev/site-assets/email-banner-1774510626168.png",
    heroBgImage: "",
    headerLogo: "",
};

const DEFAULT_PRICING_CONFIG: PricingConfig = {
    protocols: [
        { category: "T-Shirt", frontOnly: 999, backOnly: 999, bothSides: 1199 },
        { category: "Hoodie", frontOnly: 1499, backOnly: 1499, bothSides: 1699 },
        { category: "Oversized T-Shirt", frontOnly: 1099, backOnly: 1099, bothSides: 1299 }
    ]
};

const DEFAULT_SPECIAL_OFFER: SpecialOfferConfig = {
    title: "Flash Sale!",
    subtitle: "Limited time offer on select items.",
    categoryName: "",
    discountPercent: 0,
    isVisible: false,
    ctaText: "SHOP NOW"
};

type Tab = "home" | "artist" | "banners" | "pricing" | "promotions";

export default function AdminConfig() {
    const [activeTab, setActiveTab] = useState<Tab>("home");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    const [homeConfig, setHomeConfig] = useState<CustomerHomeConfig>(DEFAULT_HOME_CONFIG);
    const [artistConfig, setArtistConfig] = useState<ArtistDashboardConfig>(DEFAULT_ARTIST_CONFIG);
    const [bannersConfig, setBannersConfig] = useState<BannersConfig>(DEFAULT_BANNERS_CONFIG);
    const [pricingConfig, setPricingConfig] = useState<PricingConfig>(DEFAULT_PRICING_CONFIG);
    const [specialOffer, setSpecialOffer] = useState<SpecialOfferConfig>(DEFAULT_SPECIAL_OFFER);
    const [coupons, setCoupons] = useState<CouponConfig[]>([]);

    const [newCouponCode, setNewCouponCode] = useState("");
    const [newCouponDiscount, setNewCouponDiscount] = useState("");
    
    // Additional state for categories selection
    const [categories, setCategories] = useState<{id: string, name: string}[]>([]);

    const fetchConfigs = async () => {
        setLoading(true);
        setError(null);
        try {
            const [homeRes, artistRes, bannersRes, pricingRes, offerRes, couponsRes, categoriesRes] = await Promise.allSettled([
                api.get("/api/config/customer_home"),
                api.get("/api/config/artist_dashboard"),
                api.get("/api/config/site_banners"),
                api.get("/api/config/pricing_protocols"),
                api.get("/api/promotions/special-offer"),
                api.get("/api/promotions/coupons"),
                api.get("/api/categories")
            ]);

            if (homeRes.status === "fulfilled" && homeRes.value.data?.data?.config) {
                const c = { ...homeRes.value.data.data.config } as Record<string, unknown>;
                delete c.heroButtonText;
                delete c.heroButtonLink;
                setHomeConfig({ ...DEFAULT_HOME_CONFIG, ...c });
            }
            if (artistRes.status === "fulfilled" && artistRes.value.data?.data?.config) {
                setArtistConfig({ ...DEFAULT_ARTIST_CONFIG, ...artistRes.value.data.data.config });
            }
            if (bannersRes.status === "fulfilled" && bannersRes.value.data?.data?.config) {
                setBannersConfig({ ...DEFAULT_BANNERS_CONFIG, ...bannersRes.value.data.data.config });
            }
            if (pricingRes.status === "fulfilled" && pricingRes.value.data?.data?.config) {
                setPricingConfig({ ...DEFAULT_PRICING_CONFIG, ...pricingRes.value.data.data.config });
            }
            if (offerRes.status === "fulfilled" && offerRes.value.data?.data) {
                setSpecialOffer(offerRes.value.data.data);
            }
            if (couponsRes.status === "fulfilled" && couponsRes.value.data?.data) {
                setCoupons(couponsRes.value.data.data);
            }
            if (categoriesRes.status === "fulfilled" && categoriesRes.value.data?.data?.categories) {
                setCategories(categoriesRes.value.data.data.categories);
            }
        } catch (err) {
            console.error("Failed to load configs", err);
            setError("Failed to load configuration. Using defaults.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchConfigs();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        setSuccessMsg(null);

        try {
            if (activeTab === "promotions") {
                await api.put(`/api/promotions/special-offer`, specialOffer);
            } else {
                let key = "";
                let value: any = null;

                if (activeTab === "home") {
                    key = "customer_home";
                    const v = { ...homeConfig } as Record<string, unknown>;
                    delete v.heroButtonText;
                    delete v.heroButtonLink;
                    value = v;
                } else if (activeTab === "artist") {
                    key = "artist_dashboard";
                    value = artistConfig;
                } else if (activeTab === "banners") {
                    key = "site_banners";
                    value = bannersConfig;
                } else if (activeTab === "pricing") {
                    key = "pricing_protocols";
                    value = pricingConfig;
                }

                await api.put(`/api/config/${key}`, { value });
            }

            setSuccessMsg("Configuration synchronized successfully.");
            setTimeout(() => setSuccessMsg(null), 3000);
        } catch (err: any) {
            console.error("Failed to save config", err);
            setError(err.response?.data?.error || "Failed to save configuration.");
        } finally {
            setSaving(false);
        }
    };

    const handleCreateCoupon = async () => {
        if (!newCouponCode || !newCouponDiscount) return;
        try {
            const res = await api.post("/api/promotions/coupons", {
                code: newCouponCode,
                discountPercent: parseFloat(newCouponDiscount),
                isActive: true
            });
            setCoupons([res.data.data, ...coupons]);
            setNewCouponCode("");
            setNewCouponDiscount("");
        } catch (err: any) {
            setError(err.response?.data?.error || "Failed to create coupon");
        }
    };

    const handleToggleCoupon = async (id: string, currentStatus: boolean) => {
        try {
            const res = await api.patch(`/api/promotions/coupons/${id}`, { isActive: !currentStatus });
            setCoupons(coupons.map(c => c.id === id ? res.data.data : c));
        } catch (err) {
            console.error(err);
        }
    };

    const handleDeleteCoupon = async (id: string) => {
        try {
            await api.delete(`/api/promotions/coupons/${id}`);
            setCoupons(coupons.filter(c => c.id !== id));
        } catch (err) {
            console.error(err);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, key: keyof BannersConfig) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("file", file);

        try {
            setLoading(true);
            const res = await api.post("/api/config/upload", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            const url = res.data.data.url;
            setBannersConfig(prev => ({ ...prev, [key]: url }));
            setSuccessMsg("Asset uploaded and staged for synchronization.");
            setTimeout(() => setSuccessMsg(null), 3000);
        } catch (err: any) {
            console.error("Upload failed", err);
            setError("Failed to upload asset to R2.");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
                <p className="font-display text-[10px] font-black uppercase tracking-[2px]">Syncing Core Schema...</p>
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen bg-neutral-g1 flex flex-col pt-4">
            <div className="flex-1 px-4 sm:px-8 pb-12 w-full">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 bg-neutral-black text-white px-3 py-1 rounded-[4px] font-display text-[10px] font-black uppercase tracking-[2px]">
                            <Settings className="w-3 h-3 text-primary" /> Global Protocol
                        </div>
                        <h1 className="font-display text-[ clamp(32px,5vw,48px) ] font-black text-neutral-black leading-none uppercase tracking-tight">
                            System <span className="text-primary italic">Configuration</span>
                        </h1>
                        <p className="font-display text-[14px] font-bold text-neutral-g4 uppercase tracking-wider">
                            Modify global site toggles, interface logic, and asset endpoints.
                        </p>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 border-[2px] border-red-500 p-6 rounded-[4px] mb-8 flex items-center gap-4 animate-bounce">
                        <AlertCircle className="text-red-500 w-8 h-8" />
                        <div>
                            <h4 className="font-display text-[12px] font-black uppercase text-red-500 tracking-[1px]">Protocol Override Violation</h4>
                            <p className="font-display text-[11px] font-bold text-red-400 uppercase">{error}</p>
                        </div>
                    </div>
                )}

                {successMsg && (
                    <div className="bg-success border-[2px] border-neutral-black p-6 rounded-[4px] mb-8 flex items-center gap-4 shadow-[4px_4px_0px_0px_rgba(34,197,94,0.3)]">
                        <ShieldCheck className="text-white w-8 h-8" />
                        <div>
                            <h4 className="font-display text-[12px] font-black uppercase text-white tracking-[1px]">Integrity Check Passed</h4>
                            <p className="font-display text-[11px] font-bold text-white uppercase opacity-80">{successMsg}</p>
                        </div>
                    </div>
                )}

                <div className="bg-white border-[2px] border-neutral-black rounded-[6px] shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                    {/* Tab Bar */}
                    <div className="flex flex-wrap border-b-[2px] border-neutral-black bg-neutral-black">
                        {[
                            { id: "home", label: "Front-End", icon: Home },
                            { id: "artist", label: "Artist", icon: Palette },
                            { id: "banners", label: "Assets", icon: ImageIcon },
                            { id: "pricing", label: "Pricing", icon: Zap },
                            { id: "promotions", label: "Promotions", icon: Tag }
                        ].map((t) => (
                            <button
                                key={t.id}
                                onClick={() => setActiveTab(t.id as Tab)}
                                className={`flex-1 py-5 px-6 font-display text-[11px] font-black uppercase tracking-[2px] flex items-center justify-center gap-3 transition-all ${activeTab === t.id ? "bg-white text-neutral-black border-r-[2px] border-neutral-black last:border-r-0" : "text-white/40 hover:text-white"}`}
                            >
                                <t.icon className={`w-4 h-4 ${activeTab === t.id ? 'text-primary' : ''}`} /> {t.label}
                            </button>
                        ))}
                    </div>

                    {/* Content Area */}
                    <div className="p-10">
                        {activeTab === "home" && (
                            <div className="space-y-12 animate-in fade-in duration-300">
                                {/* Hero Section */}
                                <div className="space-y-6">
                                    <h3 className="font-display text-[14px] font-black uppercase tracking-[2px] text-neutral-black border-b-[2px] border-neutral-black/5 pb-2 flex items-center gap-3">
                                        <Zap className="w-4 h-4 text-primary" /> Landing Protocol (Hero)
                                    </h3>

                                    <div className="grid gap-8">
                                        <label className="flex items-center gap-4 cursor-pointer group w-fit">
                                            <div className="relative">
                                                <input
                                                    type="checkbox"
                                                    checked={homeConfig.showHeroSection}
                                                    onChange={(e) => setHomeConfig({ ...homeConfig, showHeroSection: e.target.checked })}
                                                    className="sr-only"
                                                />
                                                <div className={`w-6 h-6 border-[2px] border-neutral-black rounded-[2px] flex items-center justify-center transition-all ${homeConfig.showHeroSection ? 'bg-primary shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'bg-neutral-g1'}`}>
                                                    {homeConfig.showHeroSection && <div className="w-2 h-2 bg-neutral-black rounded-full" />}
                                                </div>
                                            </div>
                                            <span className="font-display text-[12px] font-black uppercase text-neutral-black group-hover:text-primary transition-colors">Activate Hero Node</span>
                                        </label>

                                        {homeConfig.showHeroSection && (
                                            <div className="grid grid-cols-1 gap-6 pl-10 border-l-[2px] border-neutral-black/5">
                                                <div className="space-y-2">
                                                    <label className="font-display text-[10px] font-black uppercase tracking-[2px] text-neutral-g4 px-1">
                                                        Global Headline (two lines — use line break between)
                                                    </label>
                                                    <textarea
                                                        value={homeConfig.heroTitle}
                                                        onChange={(e) => setHomeConfig({ ...homeConfig, heroTitle: e.target.value })}
                                                        rows={2}
                                                        placeholder={"Wear Art.\nBreak The Basic."}
                                                        className="w-full px-5 py-4 bg-neutral-g1 border-[2px] border-neutral-black rounded-[4px] font-display text-[16px] font-black uppercase tracking-[1px] outline-none focus:bg-white transition-all italic resize-y min-h-[88px]"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="font-display text-[10px] font-black uppercase tracking-[2px] text-neutral-g4 px-1">Sub-Transmission Text</label>
                                                    <textarea
                                                        value={homeConfig.heroSubtitle}
                                                        onChange={(e) => setHomeConfig({ ...homeConfig, heroSubtitle: e.target.value })}
                                                        rows={3}
                                                        className="w-full px-5 py-4 bg-neutral-g1 border-[2px] border-neutral-black rounded-[4px] font-display text-[13px] font-bold text-neutral-black uppercase tracking-[1px] outline-none focus:bg-white transition-all resize-none"
                                                    />
                                                </div>

                                                <div className="space-y-4 pt-4 border-t-[2px] border-neutral-black/10">
                                                    <p className="font-display text-[10px] font-black uppercase tracking-[2px] text-neutral-g4 px-1">
                                                        Hero right column — top tile (fresh designs)
                                                    </p>
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                        <div className="space-y-2 md:col-span-1">
                                                            <label className="font-display text-[9px] font-black uppercase tracking-[2px] text-neutral-g4 px-1">
                                                                Title (line break allowed)
                                                            </label>
                                                            <textarea
                                                                value={homeConfig.heroTileFreshTitle ?? ""}
                                                                onChange={(e) =>
                                                                    setHomeConfig({ ...homeConfig, heroTileFreshTitle: e.target.value })
                                                                }
                                                                rows={2}
                                                                className="w-full px-4 py-3 bg-neutral-g1 border-[2px] border-neutral-black rounded-[4px] font-display text-[12px] font-bold outline-none focus:bg-white transition-all resize-y min-h-[72px]"
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="font-display text-[9px] font-black uppercase tracking-[2px] text-neutral-g4 px-1">
                                                                Button
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={homeConfig.heroTileFreshButton ?? ""}
                                                                onChange={(e) =>
                                                                    setHomeConfig({ ...homeConfig, heroTileFreshButton: e.target.value })
                                                                }
                                                                className="w-full px-4 py-3 bg-neutral-g1 border-[2px] border-neutral-black rounded-[4px] font-display text-[11px] font-black uppercase tracking-[2px] outline-none focus:bg-white transition-all"
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="font-display text-[9px] font-black uppercase tracking-[2px] text-neutral-g4 px-1">
                                                                Link
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={homeConfig.heroTileFreshLink ?? ""}
                                                                onChange={(e) =>
                                                                    setHomeConfig({ ...homeConfig, heroTileFreshLink: e.target.value })
                                                                }
                                                                className="w-full px-4 py-3 bg-neutral-g1 border-[2px] border-neutral-black rounded-[4px] font-display text-[11px] font-bold outline-none focus:bg-white transition-all"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="space-y-4 pt-4 border-t-[2px] border-neutral-black/10">
                                                    <p className="font-display text-[10px] font-black uppercase tracking-[2px] text-neutral-g4 px-1">
                                                        Hero right column — bottom tile (artists)
                                                    </p>
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                        <div className="space-y-2 md:col-span-1">
                                                            <label className="font-display text-[9px] font-black uppercase tracking-[2px] text-neutral-g4 px-1">
                                                                Title (line break allowed)
                                                            </label>
                                                            <textarea
                                                                value={homeConfig.heroTileArtistsTitle ?? ""}
                                                                onChange={(e) =>
                                                                    setHomeConfig({ ...homeConfig, heroTileArtistsTitle: e.target.value })
                                                                }
                                                                rows={2}
                                                                className="w-full px-4 py-3 bg-neutral-g1 border-[2px] border-neutral-black rounded-[4px] font-display text-[12px] font-bold outline-none focus:bg-white transition-all resize-y min-h-[72px]"
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="font-display text-[9px] font-black uppercase tracking-[2px] text-neutral-g4 px-1">
                                                                Button
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={homeConfig.heroTileArtistsButton ?? ""}
                                                                onChange={(e) =>
                                                                    setHomeConfig({ ...homeConfig, heroTileArtistsButton: e.target.value })
                                                                }
                                                                className="w-full px-4 py-3 bg-neutral-g1 border-[2px] border-neutral-black rounded-[4px] font-display text-[11px] font-black uppercase tracking-[2px] outline-none focus:bg-white transition-all"
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="font-display text-[9px] font-black uppercase tracking-[2px] text-neutral-g4 px-1">
                                                                Link
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={homeConfig.heroTileArtistsLink ?? ""}
                                                                onChange={(e) =>
                                                                    setHomeConfig({ ...homeConfig, heroTileArtistsLink: e.target.value })
                                                                }
                                                                className="w-full px-4 py-3 bg-neutral-g1 border-[2px] border-neutral-black rounded-[4px] font-display text-[11px] font-bold outline-none focus:bg-white transition-all"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Section Toggles */}
                                <div className="space-y-6">
                                    <h3 className="font-display text-[14px] font-black uppercase tracking-[2px] text-neutral-black border-b-[2px] border-neutral-black/5 pb-2 flex items-center gap-3">
                                        <Layers className="w-4 h-4 text-primary" /> Grid Visibility Protocols
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {[
                                            { key: "showCategoriesSection", label: "Taxonomy Grid" },
                                            { key: "showFeaturedProducts", label: "Featured Assets" },
                                            { key: "showTrendingArtists", label: "Personnel Spotlight" }
                                        ].map((sec) => (
                                            <label key={sec.key} className="flex items-center gap-4 cursor-pointer group p-4 border-[2px] border-neutral-black rounded-[4px] bg-neutral-g1 hover:bg-white hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all">
                                                <div className="relative">
                                                    <input
                                                        type="checkbox"
                                                        checked={(homeConfig as any)[sec.key]}
                                                        onChange={(e) => setHomeConfig({ ...homeConfig, [sec.key]: e.target.checked })}
                                                        className="sr-only"
                                                    />
                                                    <div className={`w-6 h-6 border-[2px] border-neutral-black rounded-[2px] flex items-center justify-center transition-all ${(homeConfig as any)[sec.key] ? 'bg-primary' : 'bg-white'}`}>
                                                        {(homeConfig as any)[sec.key] && <div className="w-2 h-2 bg-neutral-black rounded-full" />}
                                                    </div>
                                                </div>
                                                <span className="font-display text-[11px] font-black uppercase text-neutral-black tracking-tight">{sec.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === "artist" && (
                            <div className="space-y-12 animate-in fade-in duration-300">
                                <div className="space-y-6">
                                    <h3 className="font-display text-[14px] font-black uppercase tracking-[2px] text-neutral-black border-b-[2px] border-neutral-black/5 pb-2 flex items-center gap-3">
                                        <MessageSquare className="w-4 h-4 text-primary" /> Dashboard Broadcast
                                    </h3>

                                    <div className="space-y-8">
                                        <label className="flex items-center gap-4 cursor-pointer group w-fit">
                                            <div className="relative">
                                                <input
                                                    type="checkbox"
                                                    checked={artistConfig.showAnnouncement}
                                                    onChange={(e) => setArtistConfig({ ...artistConfig, showAnnouncement: e.target.checked })}
                                                    className="sr-only"
                                                />
                                                <div className={`w-6 h-6 border-[2px] border-neutral-black rounded-[2px] flex items-center justify-center transition-all ${artistConfig.showAnnouncement ? 'bg-primary shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'bg-neutral-g1'}`}>
                                                    {artistConfig.showAnnouncement && <div className="w-2 h-2 bg-neutral-black rounded-full" />}
                                                </div>
                                            </div>
                                            <span className="font-display text-[12px] font-black uppercase text-neutral-black group-hover:text-primary transition-colors">Display Global Announcement</span>
                                        </label>

                                        {artistConfig.showAnnouncement && (
                                            <div className="space-y-4 pl-10 border-l-[2px] border-neutral-black/5">
                                                <label className="font-display text-[10px] font-black uppercase tracking-[2px] text-neutral-g4 px-1">Announcement Payload</label>
                                                <textarea
                                                    value={artistConfig.announcementText}
                                                    onChange={(e) => setArtistConfig({ ...artistConfig, announcementText: e.target.value })}
                                                    rows={5}
                                                    className="w-full px-5 py-4 bg-neutral-g1 border-[2px] border-neutral-black rounded-[4px] font-display text-[14px] font-bold text-neutral-black uppercase tracking-[1px] outline-none focus:bg-white transition-all resize-none italic"
                                                />
                                                <p className="font-display text-[10px] font-bold text-neutral-g3 uppercase tracking-wider italic">● This transmission is visible to all registered artist nodes.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === "banners" && (
                            <div className="space-y-8 animate-in fade-in duration-300">
                                <h3 className="font-display text-[14px] font-black uppercase tracking-[2px] text-neutral-black border-b-[2px] border-neutral-black/5 pb-4 flex items-center gap-3">
                                    <ImageIcon className="w-4 h-4 text-primary" /> Visual Asset Management
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {[
                                        { key: "heroBrowseArtists", label: "Artist Discovery Banner" },
                                        { key: "heroFreshDesigns", label: "Trending Catalog Banner" },
                                        { key: "shopBanner", label: "Primary Storefront Banner" },
                                        { key: "artistsListBanner", label: "Personnel Directory Banner" },
                                        { key: "hive50Banner", label: "Hive-50 Loyalty Banner" },
                                        { key: "emailBanner", label: "Email Template Banner" },
                                        { key: "heroBgImage", label: "Hero Background Decoration (Honeycomb)" },
                                        { key: "headerLogo", label: "Site logo (navbar, footer, login, forgot password, artist & admin sidebars)" }
                                    ].map((b) => (
                                        <div key={b.key} className="space-y-3 p-6 border-[2px] border-neutral-black rounded-[4px] bg-neutral-g1 hover:bg-white transition-all group relative">
                                            <label className="block font-display text-[11px] font-black uppercase tracking-[1px] text-neutral-black">{b.label}</label>
                                            <div className="space-y-4">
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        value={(bannersConfig as any)[b.key]}
                                                        onChange={(e) => setBannersConfig({ ...bannersConfig, [b.key]: e.target.value })}
                                                        placeholder="URL OR PATH..."
                                                        className="flex-1 px-4 py-3 bg-white border-[1px] border-neutral-black/10 rounded-[2px] font-display text-[10px] font-bold uppercase outline-none focus:border-neutral-black transition-all"
                                                    />
                                                    <label className="shrink-0 w-11 h-11 bg-neutral-black text-white rounded-[2px] flex items-center justify-center cursor-pointer hover:bg-primary hover:text-neutral-black transition-all shadow-[2px_2px_0px_0px_rgba(255,190,0,1)]">
                                                        <Save className="w-4 h-4" />
                                                        <input 
                                                            type="file" 
                                                            className="hidden" 
                                                            accept="image/*"
                                                            onChange={(e) => handleFileUpload(e, b.key as keyof BannersConfig)}
                                                        />
                                                    </label>
                                                </div>
                                                <div className="h-32 bg-neutral-black rounded-[2px] overflow-hidden border-[1px] border-neutral-black group-hover:shadow-[6px_6px_0px_0px_rgba(255,222,0,1)] transition-all relative">
                                                    {(bannersConfig as any)[b.key] ? (
                                                        <img src={(bannersConfig as any)[b.key]} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center opacity-20">
                                                            <ImageIcon className="w-10 h-10 text-white" />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === "pricing" && (
                            <div className="space-y-8 animate-in fade-in duration-300">
                                <h3 className="font-display text-[14px] font-black uppercase tracking-[2px] text-neutral-black border-b-[2px] border-neutral-black/5 pb-4 flex items-center gap-3">
                                    <Zap className="w-4 h-4 text-primary" /> Pricing & Monetization Protocols
                                </h3>

                                <div className="space-y-6">
                                    <div className="flex justify-between items-center bg-neutral-black text-white p-4 rounded-[4px]">
                                        <p className="font-display text-[10px] font-black uppercase tracking-[2px]">Category Model</p>
                                        <div className="grid grid-cols-3 gap-8 w-[60%]">
                                            <p className="font-display text-[10px] font-black uppercase tracking-[2px] text-center">Front Only</p>
                                            <p className="font-display text-[10px] font-black uppercase tracking-[2px] text-center">Back Only</p>
                                            <p className="font-display text-[10px] font-black uppercase tracking-[2px] text-center">Double Side</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        {pricingConfig.protocols.map((protocol, idx) => (
                                            <div key={protocol.category} className="p-6 border-[2px] border-neutral-black rounded-[4px] bg-neutral-g1 flex items-center justify-between group hover:bg-white transition-all">
                                                <div className="w-[30%]">
                                                    <p className="font-display text-[13px] font-black uppercase text-neutral-black">{protocol.category}</p>
                                                    <p className="font-display text-[9px] font-bold text-neutral-g4 uppercase italic">Active Tier</p>
                                                </div>
                                                <div className="grid grid-cols-3 gap-8 w-[60%]">
                                                    <div className="relative">
                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-display text-[12px] font-black text-neutral-g3">₹</span>
                                                        <input 
                                                            type="number" 
                                                            value={protocol.frontOnly} 
                                                            onChange={(e) => {
                                                                const newProtocols = [...pricingConfig.protocols];
                                                                newProtocols[idx].frontOnly = parseInt(e.target.value);
                                                                setPricingConfig({ protocols: newProtocols });
                                                            }}
                                                            className="w-full bg-white border-[1px] border-neutral-black/10 rounded-[2px] pl-7 pr-3 py-2 font-display text-[12px] font-black outline-none focus:border-primary transition-all text-center"
                                                        />
                                                    </div>
                                                    <div className="relative">
                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-display text-[12px] font-black text-neutral-g3">₹</span>
                                                        <input 
                                                            type="number" 
                                                            value={protocol.backOnly} 
                                                            onChange={(e) => {
                                                                const newProtocols = [...pricingConfig.protocols];
                                                                newProtocols[idx].backOnly = parseInt(e.target.value);
                                                                setPricingConfig({ protocols: newProtocols });
                                                            }}
                                                            className="w-full bg-white border-[1px] border-neutral-black/10 rounded-[2px] pl-7 pr-3 py-2 font-display text-[12px] font-black outline-none focus:border-primary transition-all text-center"
                                                        />
                                                    </div>
                                                    <div className="relative">
                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-display text-[12px] font-black text-neutral-g3">₹</span>
                                                        <input 
                                                            type="number" 
                                                            value={protocol.bothSides} 
                                                            onChange={(e) => {
                                                                const newProtocols = [...pricingConfig.protocols];
                                                                newProtocols[idx].bothSides = parseInt(e.target.value);
                                                                setPricingConfig({ protocols: newProtocols });
                                                            }}
                                                            className="w-full bg-white border-[1px] border-neutral-black/10 rounded-[2px] pl-7 pr-3 py-2 font-display text-[12px] font-black outline-none focus:border-primary transition-all text-center"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <p className="font-display text-[10px] font-bold text-neutral-g3 uppercase tracking-[1px] px-2 italic leading-relaxed">
                                        ● Saving syncs all draft & published catalog base prices from the <span className="text-neutral-black not-italic">T-Shirt</span> row
                                        (double-side if the product has a back mockup; otherwise front only), so shop and storefronts match. You can still override a SKU under
                                        Admin → Global Stockpile. The mockup lab uses these tiers for new products.
                                    </p>
                                </div>
                            </div>
                        )}

                        {activeTab === "promotions" && (
                            <div className="space-y-12 animate-in fade-in duration-300">
                                {/* Special Offer Section */}
                                <div className="space-y-6">
                                    <h3 className="font-display text-[14px] font-black uppercase tracking-[2px] text-neutral-black border-b-[2px] border-neutral-black/5 pb-2 flex items-center gap-3">
                                        <Tag className="w-4 h-4 text-primary" /> Special Offer Broadcast (Home Page)
                                    </h3>
                                    
                                    <div className="grid gap-8">
                                        <label className="flex items-center gap-4 cursor-pointer group w-fit">
                                            <div className="relative">
                                                <input
                                                    type="checkbox"
                                                    checked={specialOffer.isVisible}
                                                    onChange={(e) => setSpecialOffer({ ...specialOffer, isVisible: e.target.checked })}
                                                    className="sr-only"
                                                />
                                                <div className={`w-6 h-6 border-[2px] border-neutral-black rounded-[2px] flex items-center justify-center transition-all ${specialOffer.isVisible ? 'bg-primary shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'bg-neutral-g1'}`}>
                                                    {specialOffer.isVisible && <div className="w-2 h-2 bg-neutral-black rounded-full" />}
                                                </div>
                                            </div>
                                            <span className="font-display text-[12px] font-black uppercase text-neutral-black group-hover:text-primary transition-colors">Activate Offer Broadcast</span>
                                        </label>

                                        {specialOffer.isVisible && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-10 border-l-[2px] border-neutral-black/5">
                                                <div className="space-y-2 col-span-1 md:col-span-2">
                                                    <label className="font-display text-[10px] font-black uppercase tracking-[2px] text-neutral-g4 px-1">Offer Title</label>
                                                    <input
                                                        type="text"
                                                        value={specialOffer.title}
                                                        onChange={(e) => setSpecialOffer({ ...specialOffer, title: e.target.value })}
                                                        className="w-full px-5 py-3 bg-neutral-g1 border-[2px] border-neutral-black rounded-[4px] font-display text-[14px] font-black uppercase tracking-[1px] outline-none focus:bg-white transition-all italic"
                                                    />
                                                </div>
                                                <div className="space-y-2 col-span-1 md:col-span-2">
                                                    <label className="font-display text-[10px] font-black uppercase tracking-[2px] text-neutral-g4 px-1">Offer Subtitle</label>
                                                    <input
                                                        type="text"
                                                        value={specialOffer.subtitle}
                                                        onChange={(e) => setSpecialOffer({ ...specialOffer, subtitle: e.target.value })}
                                                        className="w-full px-5 py-3 bg-neutral-g1 border-[2px] border-neutral-black rounded-[4px] font-display text-[12px] font-bold text-neutral-black uppercase tracking-[1px] outline-none focus:bg-white transition-all"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="font-display text-[10px] font-black uppercase tracking-[2px] text-neutral-g4 px-1">Target Category Name</label>
                                                    <select
                                                        value={specialOffer.categoryName}
                                                        onChange={(e) => setSpecialOffer({ ...specialOffer, categoryName: e.target.value })}
                                                        className="w-full px-5 py-3 bg-neutral-g1 border-[2px] border-neutral-black rounded-[4px] font-display text-[12px] font-black text-neutral-black uppercase tracking-[1px] outline-none focus:bg-white transition-all appearance-none cursor-pointer"
                                                    >
                                                        <option value="" disabled>Select Target Category</option>
                                                        {categories.map(c => (
                                                            <option key={c.id} value={c.name}>{c.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="font-display text-[10px] font-black uppercase tracking-[2px] text-neutral-g4 px-1">Discount Percentage (%)</label>
                                                    <input
                                                        type="number"
                                                        value={specialOffer.discountPercent}
                                                        onChange={(e) => setSpecialOffer({ ...specialOffer, discountPercent: parseFloat(e.target.value) || 0 })}
                                                        className="w-full px-5 py-3 bg-neutral-g1 border-[2px] border-neutral-black rounded-[4px] font-display text-[12px] font-black text-neutral-black uppercase tracking-[1px] outline-none focus:bg-white transition-all"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="font-display text-[10px] font-black uppercase tracking-[2px] text-neutral-g4 px-1">CTA Text</label>
                                                    <input
                                                        type="text"
                                                        value={specialOffer.ctaText}
                                                        onChange={(e) => setSpecialOffer({ ...specialOffer, ctaText: e.target.value })}
                                                        placeholder="SHOP NOW"
                                                        className="w-full px-5 py-3 bg-neutral-g1 border-[2px] border-neutral-black rounded-[4px] font-display text-[12px] font-black text-neutral-black uppercase tracking-[1px] outline-none focus:bg-white transition-all"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Coupons Section */}
                                <div className="space-y-6 pt-8 border-t-[2px] border-neutral-black/10">
                                    <h3 className="font-display text-[14px] font-black uppercase tracking-[2px] text-neutral-black border-b-[2px] border-neutral-black/5 pb-2 flex items-center gap-3">
                                        <Tag className="w-4 h-4 text-primary" /> Global Discount Codes
                                    </h3>

                                    <div className="bg-neutral-g1 border-[2px] border-neutral-black rounded-[4px] p-6 flex flex-wrap gap-4 items-end mb-6">
                                        <div className="flex-1 space-y-2 min-w-[200px]">
                                            <label className="font-display text-[10px] font-black uppercase tracking-[2px] text-neutral-g4 px-1">Discount Code</label>
                                            <input
                                                type="text"
                                                value={newCouponCode}
                                                onChange={(e) => setNewCouponCode(e.target.value.toUpperCase())}
                                                placeholder="e.g. SUMMER20"
                                                className="w-full px-4 py-2 bg-white border-[2px] border-neutral-black rounded-[2px] font-display text-[13px] font-black uppercase tracking-[2px] outline-none focus:border-primary transition-all"
                                            />
                                        </div>
                                        <div className="w-32 space-y-2">
                                            <label className="font-display text-[10px] font-black uppercase tracking-[2px] text-neutral-g4 px-1">Percent (%)</label>
                                            <input
                                                type="number"
                                                value={newCouponDiscount}
                                                onChange={(e) => setNewCouponDiscount(e.target.value)}
                                                placeholder="0 - 100"
                                                className="w-full px-4 py-2 bg-white border-[2px] border-neutral-black rounded-[2px] font-display text-[13px] font-black uppercase tracking-[1px] outline-none focus:border-primary transition-all text-center"
                                            />
                                        </div>
                                        <button
                                            onClick={handleCreateCoupon}
                                            disabled={!newCouponCode || !newCouponDiscount}
                                            className="h-[44px] px-6 bg-primary border-[2px] border-neutral-black rounded-[2px] font-display text-[11px] font-black uppercase tracking-[1px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all disabled:opacity-50 disabled:shadow-none disabled:translate-x-0 disabled:translate-y-0"
                                        >
                                            <div className="flex items-center gap-2"><Plus className="w-4 h-4"/> Add Code</div>
                                        </button>
                                    </div>

                                    <div className="space-y-3">
                                        {coupons.length === 0 ? (
                                            <p className="font-display text-[11px] font-bold text-neutral-g4 uppercase tracking-[1px] italic text-center py-6">No active discount codes.</p>
                                        ) : (
                                            coupons.map(coupon => (
                                                <div key={coupon.id} className="flex items-center justify-between p-4 bg-white border-[2px] border-neutral-black rounded-[4px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all">
                                                    <div className="flex items-center gap-6">
                                                        <span className="font-display text-[16px] font-black uppercase tracking-[2px] text-neutral-black">{coupon.code}</span>
                                                        <span className="font-display text-[14px] font-black text-primary bg-primary/10 px-3 py-1 rounded-[2px] border-[1px] border-primary">{coupon.discountPercent}% OFF</span>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <label className="flex items-center gap-2 cursor-pointer group">
                                                            <div className="relative">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={coupon.isActive}
                                                                    onChange={() => handleToggleCoupon(coupon.id, coupon.isActive)}
                                                                    className="sr-only"
                                                                />
                                                                <div className={`w-10 h-5 border-[2px] border-neutral-black rounded-full flex items-center transition-all ${coupon.isActive ? 'bg-success' : 'bg-neutral-g3'}`}>
                                                                    <div className={`w-3 h-3 bg-white border-[2px] border-neutral-black rounded-full transition-all ${coupon.isActive ? 'ml-5' : 'ml-1'}`} />
                                                                </div>
                                                            </div>
                                                        </label>
                                                        <button 
                                                            onClick={() => handleDeleteCoupon(coupon.id)}
                                                            className="text-neutral-g4 hover:text-danger hover:bg-danger/10 p-2 rounded transition-colors"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Footer Commands */}
                        <div className="mt-16 pt-10 border-t-[2px] border-neutral-black flex justify-end">
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="px-12 py-4 bg-primary border-[2px] border-neutral-black rounded-[4px] font-display text-[14px] font-black uppercase tracking-[2px] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all disabled:opacity-20 flex items-center gap-3"
                            >
                                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                Execute Synchronization
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Missing icons used in components
const Layers = ({ className }: { className?: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.27a1 1 0 0 0 0 1.83l8.57 4.09a2 2 0 0 0 1.66 0l8.57-4.09a1 1 0 0 0 0-1.83Z" /><path d="m2.6 11.41 8.57 4.09a2 2 0 0 0 1.66 0l8.57-4.09" /><path d="m2.6 15.82 8.57 4.09a2 2 0 0 0 1.66 0l8.57-4.09" /></svg>
);

const MessageSquare = ({ className }: { className?: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
);
