import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, Palette, ChevronLeft, ChevronRight, ShoppingCart, Truck, ShieldCheck, Star } from "lucide-react";
import Loader from "../components/shared/Loader";
import api from "../api/axios";
import { useCart } from "../context/CartContext";

interface Product {
    id: string;
    name: string;
    price: number;
    compareAtPrice: number | null;
    mockupImageUrl: string;
    tshirtColor: string;
    category: string;
    artist: { id: string; name: string };
}

interface Category {
    id: string;
    name: string;
    imageUrl?: string | null;
}

interface ArtistSummary {
    id: string;
    name: string;
    bio?: string;
    styles?: string[];
    productCount?: number;
}

interface CustomerHomeConfig {
    showHeroSection: boolean;
    heroTitle: string;
    heroSubtitle: string;
    heroButtonText: string;
    showCategoriesSection: boolean;
    showFeaturedProducts: boolean;
    showTrendingArtists: boolean;
}

interface BannersConfig {
    heroBrowseArtists: string;
    heroFreshDesigns: string;
    heroBgImage: string;
}


interface SpecialOfferConfig {
    title: string;
    subtitle: string;
    categoryName: string;
    discountPercent: number;
    isVisible: boolean;
    ctaText: string;
}

const DEFAULT_HOME_CONFIG: CustomerHomeConfig = {
    showHeroSection: true,
    heroTitle: "WEAR ART. Change Lives.",
    heroSubtitle: "Behind every design is a real Indian creator with a dream. Your purchase puts money directly in their hands — not a factory, not a corporation. Just art and the people who make it.",
    heroButtonText: "Shop Collection",
    showCategoriesSection: true,
    showFeaturedProducts: true,
    showTrendingArtists: true,
};

const DEFAULT_BANNERS_CONFIG: BannersConfig = {
    heroBrowseArtists: "/assets/banners/hero_browse_artists.jpg",
    heroFreshDesigns: "/assets/banners/hero_fresh_designs.jpg",
    heroBgImage: "",
};

const TOPBAR_ITEMS = [
    "📦 FREE_SHIPPING_ON_ALL_INDIA_ORDERS",
    "🎨 100%_ARTIST_OWNED_DESIGNS",
    "💛 ARTISTS_EARN_25%_PER_SALE",
    "🚚 DELIVERED_IN_5-7_DAYS",
    "↩️ 7_DAY_HASSLE_FREE_RETURNS",
    "👑 JOIN_TEEHIVE_CREATOR_REGISTRY",
];

function HomePage() {
    const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [artists, setArtists] = useState<ArtistSummary[]>([]);
    const [config, setConfig] = useState<CustomerHomeConfig>(DEFAULT_HOME_CONFIG);
    const [banners, setBanners] = useState<BannersConfig>(DEFAULT_BANNERS_CONFIG);
    const [specialOffer, setSpecialOffer] = useState<SpecialOfferConfig | null>(null);
    const [offerProducts, setOfferProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeCat, setActiveCat] = useState("All");
    const { addItem } = useCart();
    const [addedId, setAddedId] = useState<string | null>(null);
    const catScrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [productsRes, categoriesRes, configRes, bannersRes, artistsRes, offerRes] = await Promise.allSettled([
                    api.get("/api/products?limit=8&sort=newest"),
                    api.get("/api/categories"),
                    api.get("/api/config/customer_home"),
                    api.get("/api/config/site_banners"),
                    api.get("/api/artists?limit=8"),
                    api.get("/api/promotions/special-offer")
                ]);
                if (productsRes.status === "fulfilled") setFeaturedProducts(productsRes.value.data.data.products || []);
                if (categoriesRes.status === "fulfilled") setCategories(categoriesRes.value.data.data.categories || []);
                if (configRes.status === "fulfilled" && configRes.value.data?.data?.config) setConfig({ ...DEFAULT_HOME_CONFIG, ...configRes.value.data.data.config });
                if (bannersRes.status === "fulfilled" && bannersRes.value.data?.data?.config) setBanners({ ...DEFAULT_BANNERS_CONFIG, ...bannersRes.value.data.data.config });
                if (artistsRes.status === "fulfilled") setArtists(artistsRes.value.data.data.artists || []);

                if (offerRes.status === "fulfilled" && offerRes.value.data?.data) {
                    const offer = offerRes.value.data.data;
                    setSpecialOffer(offer);
                    if (offer.isVisible && offer.categoryName) {
                        try {
                            const opRes = await api.get(`/api/products?category=${encodeURIComponent(offer.categoryName.toLowerCase())}&limit=4`);
                            setOfferProducts(opRes.data.data.products || []);
                        } catch (e) {
                            console.error("Failed to load offer products", e);
                        }
                    }
                }
            } catch (err) { console.error("Failed to fetch home page data:", err); }
            finally { setIsLoading(false); }
        };
        fetchData();
    }, []);

    const handleQuickAdd = (product: Product) => {
        addItem({ productId: product.id, name: product.name, price: product.price, quantity: 1, size: "M", color: product.tshirtColor, image: product.mockupImageUrl, artistName: product.artist.name });
        setAddedId(product.id);
        setTimeout(() => setAddedId(null), 2000);
    };

    const filteredProducts = activeCat === "All" ? featuredProducts : featuredProducts.filter(p => p.category?.toLowerCase() === activeCat.toLowerCase());
    const catNames = ["All", ...Array.from(new Set(categories.map(c => c.name)))];

    const scrollCat = (dir: number) => {
        if (catScrollRef.current) catScrollRef.current.scrollBy({ left: dir * 300, behavior: "smooth" });
    };

    return (
        <div className="bg-white overflow-hidden">
            {/* ── TOPBAR ── */}
            <div className="bg-neutral-black text-white py-[11px] px-5 font-display text-[11px] tracking-[2px] font-black uppercase overflow-hidden border-b-[2.5px] border-neutral-black relative z-[10]">
                <div className="flex whitespace-nowrap animate-marquee">
                    {[...TOPBAR_ITEMS, ...TOPBAR_ITEMS, ...TOPBAR_ITEMS].map((item, i) => (
                        <div key={i} className="flex items-center mx-10">
                            <span>{item}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── HERO ── */}
            {config.showHeroSection && (
                <section className="grid grid-cols-1 lg:grid-cols-2 min-h-[600px] border-b-[3px] border-neutral-black relative overflow-hidden">
                    {/* Left – Main Hero */}
                    <div className="bg-white flex relative overflow-hidden group">
                        {/* Background Decoration */}
                        {banners.heroBgImage ? (
                            <img
                                src={banners.heroBgImage}
                                className="absolute top-[0] w-full h-full object-cover opacity-[1.00] select-none -z-0 pointer-events-none"
                                alt=""
                            />
                        ) : (
                            <div className="absolute top-[-10%] left-[-5%] text-[380px] font-display font-black text-neutral-black/[0.03] select-none leading-none -z-0 pointer-events-none uppercase">
                                HIVE
                            </div>
                        )}


                        <div className="relative z-10 space-y-8 max-w-[620px] p-12 md:p-8">
                            <div className="inline-flex items-center gap-2 bg-neutral-black text-primary font-display text-[10px] font-black tracking-[2.5px] uppercase px-4 py-2 rounded-[4px] shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]">
                                <Sparkles className="w-3.5 h-3.5" /> INDIA'S ARTIST-FIRST MARKETPLACE
                            </div>

                            <h1 className="font-display text-[clamp(56px,8vw,100px)] font-black text-white leading-[0.85] tracking-light uppercase">
                                Wear <span className="text-primary italic">Art.</span><br />
                                <span className="relative tracking-light">
                                    Break The<span className="italic tracking-light text-primary ml-5">Basic.</span>
                                    {/* <div className="absolute -bottom-2 md:-bottom-4 left-0 w-full h-[6px] md:h-[10px] bg-primary -rotate-1 -z-10 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"></div> */}
                                </span>
                            </h1>

                            <p className="font-display text-[15px] md:text-[18px] font-bold text-white/40 leading-relaxed max-w-[500px] tracking-wide">
                                {config.heroSubtitle}
                            </p>

                            <div className="flex flex-wrap gap-5 pt-4">
                                {/* <Link to="/products" className="group/btn relative px-10 py-5 bg-neutral-black text-white hover:bg-primary hover:text-neutral-black font-display text-[16px] font-black uppercase tracking-[2px] rounded-[4px] transition-all duration-300 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.2)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[4px] hover:translate-y-[4px] no-underline inline-flex items-center gap-4">
                                    Explore Vault <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-2 transition-transform" />
                                </Link> */}
                                <div className="flex items-center gap-6">
                                    <div>
                                        <div className="font-display text-5xl font-black text-primary leading-none">
                                            {artists.length || "120"}
                                        </div>
                                        <div className="font-display md:text-[12px] font-bold text-neutral-g4 uppercase tracking-widest mt-1">Independent Artists</div>
                                    </div>
                                    <div className="h-10 w-[2px] bg-neutral-black/10 hidden md:block"></div>
                                    <div>
                                        <div className="font-display text-5xl font-black text-primary leading-none">
                                            {featuredProducts.length || "420"}
                                        </div>
                                        <div className="font-display text-[12px] font-bold text-neutral-g4 uppercase tracking-widest mt-1">Original Designs</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right – Swapped Interactive Grid */}
                    <div className="hidden lg:flex flex-col border-l-[3px] border-neutral-black bg-neutral-black h-full overflow-hidden">
                        {[
                            {
                                img: banners.heroFreshDesigns,
                                tag: "✨ NEW_RELEASES",
                                title: "Fresh Designs\nEvery Day",
                                link: "/products?sort=newest",
                                btn: "Explore",
                                icon: Sparkles,
                                span: true
                            },
                            {
                                img: banners.heroBrowseArtists,
                                tag: "★ PERSONNEL_REGISTRY",
                                title: "Meet Independent\nIndian Artists",
                                link: "/artists",
                                btn: "Browse",
                                span: true,
                                icon: Palette
                            },
                        ].map((block, i) => (
                            <Link
                                key={i}
                                to={block.link}
                                className="relative flex-1 flex items-end p-12 no-underline group overflow-hidden border-none"


                            >
                                {/* Img Overlay */}
                                <div className="absolute inset-0 bg-neutral-black transition-all duration-500 overflow-hidden">
                                    <img
                                        src={block.img}
                                        alt=""
                                        className="w-full h-full object-cover scale-110 transition-all duration-700"
                                        onError={(e) => { (e.target as HTMLImageElement).src = i === 1 ? banners.heroBrowseArtists : banners.heroFreshDesigns; }}
                                    />
                                    {/* <div className="absolute inset-0 bg-gradient-to-t from-neutral-black via-transparent to-transparent opacity-80 group-hover:opacity-60 transition-opacity"></div> */}
                                </div>

                                <div className="relative z-10 w-full transform transition-all group-hover:-translate-y-2">
                                    <div className="font-display text-[32px] font-black text-white leading-[0.9] mb-2 whitespace-pre-line group-hover:italic transition-all uppercase italic [text-shadow:4px_4px_0px_rgba(0,0,0,1)]">

                                        {block.title}
                                    </div>

                                    <div className="inline-flex items-center gap-4 px-8 py-4 bg-white text-neutral-black font-display text-[13px] font-black uppercase tracking-[2px] rounded-[2px] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] group-hover:shadow-none group-hover:translate-x-[4px] group-hover:translate-y-[4px] transition-all">
                                        {block.btn} <ArrowRight className="w-5 h-5" />
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {/* ── SPECIAL OFFER ── */}
            {specialOffer?.isVisible && (
                <section className="bg-primary border-b-[3px] border-neutral-black py-10 px-4 md:px-16 overflow-hidden relative">
                    {/* Background Noise/Decal */}
                    <div className="absolute top-0 right-0 text-[300px] font-display font-black text-black opacity-10 select-none leading-none -z-0 pointer-events-none uppercase rotate-6">
                        {specialOffer.discountPercent}% OFF
                    </div>

                    <div className="relative z-10 flex flex-col gap-16">
                        {/* Header Banner */}
                        <div className="flex flex-col md:flex-row items-end justify-between gap-8 border-b-[3px] border-neutral-black pb-12">
                            <div className="md:w-2/3 space-y-6">
                                <div className="inline-flex items-center gap-2 bg-neutral-black text-white px-4 py-1.5 rounded-[4px] font-display text-[10px] font-black uppercase tracking-[2px]">
                                    <Sparkles className="w-4 h-4 text-primary" /> Active Broadcast
                                </div>
                                <h2 className="font-display text-[48px] md:text-[72px] font-black text-neutral-black leading-[0.9] tracking-light uppercase">
                                    {specialOffer.title}
                                </h2>
                                <p className="font-display text-[18px] md:text-[20px] font-bold text-neutral-black/80 uppercase tracking-[1px] leading-relaxed max-w-[600px]">
                                    {specialOffer.subtitle}
                                </p>
                            </div>

                            <div className="w-full md:w-auto flex flex-col items-start md:items-end gap-6 md:pl-8">
                                <div className="flex flex-col items-start md:items-end gap-2 text-left md:text-right">
                                    <span className="font-display text-[12px] md:text-[14px] font-black text-neutral-black/60 uppercase tracking-[2px]">Unlock Discount</span>
                                    <span className="font-display text-[32px] md:text-[48px] font-black bg-white text-neutral-black px-6 py-2 border-[3px] border-neutral-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rounded-[4px] rotate-[-2deg]">
                                        {specialOffer.discountPercent}% OFF
                                    </span>
                                </div>
                                <Link to={`/products?category=${encodeURIComponent(specialOffer.categoryName.toLowerCase())}`} className="group/btn w-full md:w-auto text-center px-10 py-5 bg-neutral-black text-white hover:bg-white hover:text-neutral-black font-display text-[16px] font-black uppercase tracking-[2px] rounded-[4px] transition-all duration-300 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.2)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[4px] hover:translate-y-[4px] no-underline flex items-center justify-center gap-4 border-[3px] border-neutral-black">
                                    {specialOffer.ctaText} <ArrowRight className="w-6 h-6 group-hover/btn:translate-x-2 transition-transform" />
                                </Link>
                            </div>
                        </div>

                        {/* Product Grid */}
                        <div className="w-full">
                            {offerProducts.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10">
                                    {offerProducts.map((product) => {
                                        const discountedPrice = Math.round(product.price * (1 - specialOffer.discountPercent / 100));
                                        return (
                                            <div key={product.id} className="group flex flex-col items-center">
                                                <div className="relative w-full aspect-[4/5] bg-white border-[3px] border-neutral-black rounded-[4px] overflow-hidden transition-all duration-300 group-hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] group-hover:translate-x-[-4px] group-hover:translate-y-[-4px]">
                                                    <Link to={`/products/${product.id}`} className="no-underline w-full h-full block">
                                                        {product.mockupImageUrl ? (
                                                            <img src={product.mockupImageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-[100px] opacity-10 grayscale uppercase font-black italic">ART</div>
                                                        )}
                                                    </Link>
                                                    <div className="absolute top-4 left-4 flex gap-2 pointer-events-none">
                                                        <span className="bg-neutral-black text-white px-3 py-1 font-display text-[12px] font-black uppercase tracking-[2px] rounded-[2px] border-[2px] border-neutral-black shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]">-{specialOffer.discountPercent}%</span>
                                                    </div>
                                                </div>
                                                <div className="w-full pt-6 flex flex-col items-center text-center">
                                                    <Link to={`/artist/${product.artist.id}`} className="font-display text-[12px] font-black tracking-[2px] uppercase text-neutral-black/60 hover:text-neutral-black transition-colors mb-2 no-underline">
                                                        {product.artist.name}
                                                    </Link>
                                                    <h4 className="font-display text-[22px] font-black text-neutral-black leading-tight uppercase tracking-tight mb-2 truncate max-w-full italic px-2">
                                                        {product.name}
                                                    </h4>
                                                    <div className="flex items-center gap-4 mb-5">
                                                        <span className="font-display text-[16px] font-black text-neutral-black/40 line-through">₹{product.price.toLocaleString('en-IN')}</span>
                                                        <span className="font-display text-[24px] font-black text-neutral-black">₹{discountedPrice.toLocaleString('en-IN')}</span>
                                                    </div>
                                                    <button
                                                        onClick={() => handleQuickAdd(product)}
                                                        className={`w-full py-4 font-display text-[14px] font-black tracking-[2px] uppercase rounded-[2px] border-[2.5px] border-neutral-black transition-all ${addedId === product.id ? 'bg-success text-white border-success' : 'bg-neutral-black text-white hover:bg-white hover:text-neutral-black shadow-[6px_6px_0px_0px_rgba(0,0,0,0.5)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1'}`}
                                                    >
                                                        {addedId === product.id ? '✓ Claimed' : 'Quick Add'}
                                                    </button>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            ) : (
                                <div className="w-full h-full min-h-[400px] border-[3px] border-neutral-black border-dashed flex items-center justify-center p-10 text-center bg-white/20 rounded-[4px]">
                                    <div className="font-display text-[24px] font-black uppercase text-neutral-black tracking-widest">
                                        RESTOCKING {specialOffer.categoryName} <br /> <span className="opacity-50 text-[14px]">SYNC IN PROGRESS...</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            )}

            {/* ── CATEGORY VIBES ── */}
            {config.showCategoriesSection && categories.length > 0 && (
                <section className="bg-neutral-black border-b-[3px] border-neutral-black py-20 px-4 md:px-16 overflow-hidden">
                    <div className="flex flex-col md:flex-row items-end justify-between gap-10 mb-16">
                        <div className="max-w-[600px] space-y-4">
                            <div className="inline-flex items-center gap-2 bg-primary text-neutral-black px-4 py-1 rounded-[4px] font-display text-[10px] font-black uppercase tracking-[2px]">
                                <Sparkles className="w-3.5 h-3.5" /> Discovery Node
                            </div>
                            <h2 className="font-display text-[48px] md:text-[64px] font-black text-white leading-none tracking-tight uppercase">
                                Decode Your <span className="text-primary italic">Vibe.</span>
                            </h2>
                            <p className="font-display text-[14px] font-bold text-white/40 uppercase tracking-[2px]">
                                Strategic categorization of wearable artifacts for optimal subject alignment.
                            </p>
                        </div>
                        <div className="flex gap-4">
                            <button onClick={() => scrollCat(-1)} className="w-14 h-14 border-[2px] border-white/20 rounded-[4px] bg-white/5 text-white flex items-center justify-center hover:bg-primary hover:border-primary hover:text-neutral-black transition-all group">
                                <ChevronLeft className="w-6 h-6 group-hover:scale-125 transition-transform" />
                            </button>
                            <button onClick={() => scrollCat(1)} className="w-14 h-14 border-[2px] border-white/20 rounded-[4px] bg-white/5 text-white flex items-center justify-center hover:bg-primary hover:border-primary hover:text-neutral-black transition-all group">
                                <ChevronRight className="w-6 h-6 group-hover:scale-125 transition-transform" />
                            </button>
                        </div>
                    </div>

                    {/* Category Tabs */}
                    <div className="flex items-center space-x-2 overflow-x-auto scrollbar-hide pb-8 mb-10 border-b border-white/5">
                        {catNames.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setActiveCat(cat)}
                                className={`px-8 py-3.5 whitespace-nowrap font-display text-[12px] font-black uppercase tracking-[2px] rounded-[4px] border-[2px] transition-all ${activeCat === cat ? "bg-primary border-primary text-neutral-black shadow-[4px_4px_0px_0px_rgba(255,222,0,0.3)]" : "bg-transparent border-white/10 text-white/40 hover:text-white hover:border-white/30"}`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    {/* Product Carousel */}
                    <div ref={catScrollRef} className="flex gap-8 overflow-x-auto scrollbar-hide snap-x snap-mandatory">
                        {isLoading ? (
                            <div className="flex items-center justify-center w-full py-20"><Loader className="w-32 h-32" /></div>
                        ) : filteredProducts.length === 0 ? (
                            <div className="py-24 text-center w-full bg-white/5 border border-white/10 rounded-[8px] dashed">
                                <p className="font-display text-[14px] font-black uppercase tracking-[2px] text-white/20">Accessing Node Inventory... No Data Found</p>
                            </div>
                        ) : (
                            filteredProducts.map((product) => (
                                <div key={product.id} className="min-w-[280px] md:min-w-[320px] snap-start group">
                                    <div className="relative aspect-[4/5] bg-neutral-g1 rounded-[8px] border-[2.5px] border-neutral-black overflow-hidden group-hover:bg-primary transition-all duration-500 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px]">
                                        <Link to={`/products/${product.id}`} className="no-underline">
                                            {product.mockupImageUrl ? (
                                                <img src={product.mockupImageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-[100px] opacity-10 uppercase font-black italic">TEE</div>
                                            )}
                                        </Link>

                                        <div className="absolute top-4 right-4 flex flex-col gap-2 scale-0 group-hover:scale-100 transition-all duration-300">
                                            <button
                                                onClick={() => handleQuickAdd(product)}
                                                className={`w-12 h-12 rounded-[4px] border-[2px] border-neutral-black flex items-center justify-center transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-1 ${addedId === product.id ? 'bg-success text-white' : 'bg-white text-neutral-black hover:bg-neutral-black hover:text-white'}`}
                                            >
                                                <ShoppingCart className="w-5 h-5" />
                                            </button>
                                        </div>

                                        <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-neutral-black to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                            <div className="font-display text-[10px] font-black text-primary uppercase tracking-[2px] mb-1">{product.artist.name}</div>
                                            <div className="font-display text-[20px] font-black text-white hover:text-primary transition-colors cursor-pointer truncate">{product.name}</div>
                                        </div>
                                    </div>
                                    <div className="py-5 flex items-center justify-between">
                                        <div className="font-display text-[24px] font-black text-white italic tracking-tighter">₹{product.price.toLocaleString('en-IN')}</div>
                                        <div className="font-display text-[10px] font-black text-white/40 uppercase tracking-[2px]">{product.category}</div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>
            )}

            {/* ── LATEST DROPS GRID ── */}
            {config.showFeaturedProducts && (
                <section className="py-24 px-4 md:px-16 bg-neutral-g1">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-10 mb-16 border-b-[3px] border-neutral-black pb-10">
                        <div className="space-y-3">
                            <h2 className="font-display text-[56px] md:text-[72px] font-black tracking-tight leading-none text-neutral-black uppercase">
                                Latest <span className="text-primary italic">Inventory</span>
                            </h2>
                            <p className="font-display text-[14px] font-bold text-neutral-g4 uppercase tracking-[2px]">Fresh designer synchronization complete.</p>
                        </div>
                        <Link to="/products" className="group flex items-center gap-4 bg-neutral-black text-white px-8 py-5 rounded-[4px] font-display text-[14px] font-black uppercase tracking-[2px] transition-all hover:bg-primary hover:text-neutral-black shadow-[8px_8px_0px_0px_rgba(0,0,0,0.2)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] no-underline">
                            Full Catalog <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                        </Link>
                    </div>

                    {isLoading ? (
                        <div className="flex justify-center py-20"><Loader className="w-32 h-32" /></div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
                            {featuredProducts.map((product) => (
                                <div key={product.id} className="group flex flex-col items-center">
                                    <div className="relative w-full aspect-[4/5] bg-white border-[3px] border-neutral-black rounded-[4px] overflow-hidden transition-all duration-300 group-hover:shadow-[12px_12px_0px_0px_rgba(255,222,0,1)] group-hover:translate-x-[-4px] group-hover:translate-y-[-4px]">
                                        <Link to={`/products/${product.id}`} className="no-underline">
                                            {product.mockupImageUrl ? (
                                                <img src={product.mockupImageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-[100px] opacity-10 grayscale uppercase font-black italic">ART</div>
                                            )}
                                        </Link>
                                        <div className="absolute bottom-4 left-4 flex gap-2">
                                            <span className="bg-neutral-black text-white px-3 py-1 font-display text-[9px] font-black uppercase tracking-[1px] rounded-[2px] border-[1px] border-white/20">NEW_DROP</span>
                                        </div>
                                    </div>
                                    <div className="w-full pt-6 flex flex-col items-center text-center">
                                        <Link to={`/artist/${product.artist.id}`} className="font-display text-[11px] font-black tracking-[2px] uppercase text-primary-dark hover:text-neutral-black transition-colors mb-2 no-underline">
                                            {product.artist.name}
                                        </Link>
                                        <h4 className="font-display text-[22px] font-black text-neutral-black leading-tight uppercase tracking-tight mb-2 truncate max-w-full italic px-4">
                                            {product.name}
                                        </h4>
                                        <div className="font-display text-[24px] font-black text-neutral-black mb-6">₹{product.price.toLocaleString('en-IN')}</div>
                                        <button
                                            onClick={() => handleQuickAdd(product)}
                                            className={`w-[80%] py-4 font-display text-[13px] font-black tracking-[2px] uppercase rounded-[4px] border-[2px] border-neutral-black transition-all ${addedId === product.id ? 'bg-success text-white border-success' : 'bg-primary text-neutral-black hover:bg-neutral-black hover:text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none active:translate-y-1'}`}
                                        >
                                            {addedId === product.id ? '✓ Synchronized' : 'Add To Terminal'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            )}

            {/* ── ARTIST FEATURE BAND ── */}
            {config.showTrendingArtists && (
                <section className="bg-neutral-black py-32 px-4 md:px-16 overflow-hidden relative">
                    <div className="absolute top-0 right-[-10%] text-[400px] font-display font-black text-white/[0.02] select-none leading-none -z-0 pointer-events-none uppercase">CREATOR</div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center relative z-10">
                        <div className="space-y-10">
                            <div className="inline-flex items-center gap-2 bg-primary text-neutral-black px-4 py-1 rounded-[4px] font-display text-[11px] font-black uppercase tracking-[3px]">
                                <Palette className="w-4 h-4" /> Global Personnel Registry
                            </div>
                            <h2 className="font-display text-[56px] md:text-[80px] font-black text-white leading-[0.85] tracking-tight uppercase">
                                Meet The <span className="text-primary italic">Mind</span> Behind The Art.
                            </h2>
                            <p className="font-display text-[16px] md:text-[18px] font-bold text-white/40 leading-relaxed max-w-[500px] uppercase tracking-wide">
                                Every TeeHive artifact traces back to a verified independent creator. We empower nodes, not factories. Join the movement of transparent creation.
                            </p>
                            <div className="flex flex-wrap gap-5">
                                <Link to="/artists" className="group/btn relative px-10 py-5 bg-primary text-neutral-black font-display text-[16px] font-black uppercase tracking-[2px] rounded-[4px] transition-all duration-300 shadow-[8px_8px_0px_0px_rgba(255,222,0,0.2)] hover:shadow-[4px_4px_0px_0px_rgba(255,222,0,1)] hover:translate-x-[4px] hover:translate-y-[4px] no-underline inline-flex items-center gap-4">
                                    Browse Directory <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-2 transition-transform" />
                                </Link>
                                <Link to="/login" className="px-10 py-5 bg-transparent text-white border-[2.5px] border-white/20 hover:border-primary hover:text-primary font-display text-[16px] font-black uppercase tracking-[2px] rounded-[4px] transition-all no-underline">
                                    Register Node
                                </Link>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                            {(artists.length > 0 ? artists.slice(0, 6) : Array.from({ length: 6 }, (_, i) => ({ id: String(i), name: `Node_${i + 1}`, styles: ["Art"], productCount: 0 }))).map((artist, idx) => (
                                <Link
                                    key={artist.id}
                                    to={`/artist/${artist.id}`}
                                    className={`bg-white/5 border-[2px] border-white/10 p-6 no-underline transition-all hover:bg-primary group rounded-[4px] flex flex-col justify-between aspect-square group ${idx % 2 === 0 ? 'translate-y-6' : '-translate-y-6'}`}
                                >
                                    <div className="w-12 h-12 rounded-[4px] bg-white text-neutral-black flex items-center justify-center font-display text-[22px] font-black group-hover:bg-neutral-black group-hover:text-primary transition-all rotate-[-4deg] group-hover:rotate-0">
                                        {artist.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="space-y-1">
                                        <div className="font-display text-[18px] font-black text-white group-hover:text-neutral-black truncate uppercase tracking-tighter">{artist.name}</div>
                                        <div className="font-display text-[10px] font-black text-primary group-hover:text-neutral-black/60 uppercase tracking-[2px]">{artist.styles?.[0] || 'GENERAL_ARTIST'}</div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* ── TRUST INFRASTRUCTURE ── */}
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 bg-neutral-black border-y-[3px] border-neutral-black text-white">
                {[
                    { icon: Truck, title: "LOGISTICS_FLOW", sub: "SYNCED ALL-INDIA TRANSPORT" },
                    { icon: Palette, title: "CREATOR_MODELS", sub: "100% INDEPENDENT NODES" },
                    { icon: ShieldCheck, title: "SECURE_PROTOCOL", sub: "7-DAY RECOVERY GUARANTEE" },
                    { icon: Star, title: "ASSET_QUALITY", sub: "PREMIUM 220GSM CHASSIS" },
                ].map((item, i) => (
                    <div key={i} className={`p-10 flex flex-col items-center text-center gap-6 group hover:bg-neutral-black/50 transition-all ${i < 3 ? 'lg:border-r-[2px] border-white/10' : ''}`}>
                        <div className="w-16 h-16 bg-primary text-neutral-black rounded-[4px] flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)] group-hover:shadow-[4px_4px_0px_0px_rgba(255,222,0,0.5)] group-hover:translate-x-[-2px] group-hover:translate-y-[-2px] transition-all rotate-[5deg] group-hover:rotate-0">
                            <item.icon className="w-8 h-8" />
                        </div>
                        <div className="space-y-2">
                            <div className="font-display text-[16px] font-black tracking-[2px] text-white uppercase">{item.title}</div>
                            <div className="font-display text-[10px] font-bold text-white/40 uppercase tracking-[1.5px] leading-relaxed">{item.sub}</div>
                        </div>
                    </div>
                ))}
            </section>
        </div>
    );
}

export default HomePage;
