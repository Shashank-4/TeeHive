import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Sparkles, Palette, ChevronLeft, ChevronRight, ShoppingCart, Truck, ShieldCheck, Star } from "lucide-react";
import Loader from "../components/shared/Loader";
import ImageWithSkeleton from "../components/shared/ImageWithSkeleton";
import api from "../api/axios";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import LatestDropsShowcase from "../components/home/LatestDropsShowcase";

interface Product {
    id: string;
    name: string;
    price: number;
    compareAtPrice: number | null;
    mockupImageUrl: string;
    backMockupImageUrl?: string;
    primaryView?: "front" | "back";
    tshirtColor: string;
    availableColors?: string[];
    categories?: string[];
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
    displayName?: string | null;
    displayPhotoUrl?: string | null;
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

function ArtistHomeTilePhoto({
    photoUrl,
    initial,
}: {
    photoUrl: string | null | undefined;
    initial: string;
}) {
    const [failed, setFailed] = useState(false);
    const showPhoto = Boolean(photoUrl && !failed);
    return (
        <div className="w-full aspect-square max-h-[120px] sm:max-h-[140px] shrink-0 rounded-[4px] overflow-hidden border-[2px] border-white/15 mb-4 rotate-[-2deg] group-hover:rotate-0 transition-transform">
            {showPhoto ? (
                <ImageWithSkeleton
                    src={photoUrl!}
                    alt=""
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    wrapperClassName="w-full h-full"
                    onError={() => setFailed(true)}
                />
            ) : (
                <div className="w-full h-full flex items-center justify-center bg-white text-neutral-black font-display text-[clamp(28px,8vw,40px)] font-black group-hover:bg-neutral-black group-hover:text-primary transition-colors">
                    {initial}
                </div>
            )}
        </div>
    );
}

function HomePage() {
    const navigate = useNavigate();
    const { isAuthenticated, user, signOut } = useAuth();
    const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
    const [latestDropProducts, setLatestDropProducts] = useState<Product[]>([]);
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
    const [showArtistSwitchModal, setShowArtistSwitchModal] = useState(false);
    const catScrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [productsRes, latestRes, categoriesRes, configRes, bannersRes, artistsRes, offerRes] = await Promise.allSettled([
                    api.get("/api/products?limit=24&sort=newest"),
                    api.get("/api/products?latestDrops=true&limit=10"),
                    api.get("/api/categories"),
                    api.get("/api/config/customer_home"),
                    api.get("/api/config/site_banners"),
                    api.get("/api/artists?limit=8"),
                    api.get("/api/promotions/special-offer")
                ]);
                if (productsRes.status === "fulfilled") setFeaturedProducts(productsRes.value.data.data.products || []);
                if (latestRes.status === "fulfilled") {
                    const curated = latestRes.value.data.data.products || [];
                    if (curated.length > 0) {
                        setLatestDropProducts(curated);
                    } else if (productsRes.status === "fulfilled") {
                        setLatestDropProducts((productsRes.value.data.data.products || []).slice(0, 10));
                    } else {
                        setLatestDropProducts([]);
                    }
                } else if (productsRes.status === "fulfilled") {
                    setLatestDropProducts((productsRes.value.data.data.products || []).slice(0, 10));
                }
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
        const colors =
            product.availableColors?.length ? product.availableColors : [product.tshirtColor];
        const displayImage =
            product.primaryView === "back"
                ? product.backMockupImageUrl || product.mockupImageUrl
                : product.mockupImageUrl;
        addItem({
            productId: product.id,
            name: product.name,
            price: product.price,
            quantity: 1,
            size: "M",
            color: product.tshirtColor,
            image: displayImage,
            artistName: product.artist.name,
            availableColors: colors,
        });
        setAddedId(product.id);
        setTimeout(() => setAddedId(null), 2000);
    };

    const filteredProducts =
        activeCat === "All"
            ? featuredProducts
            : featuredProducts.filter((p: any) =>
                  Array.isArray(p.categories)
                      ? p.categories.some((c: string) => c?.toLowerCase() === activeCat.toLowerCase())
                      : (p.category || "").toLowerCase() === activeCat.toLowerCase()
              );
    const catNames = ["All", ...Array.from(new Set(categories.map(c => c.name)))];

    const scrollCat = (dir: number) => {
        if (catScrollRef.current) catScrollRef.current.scrollBy({ left: dir * 300, behavior: "smooth" });
    };

    const routeArtistUser = () => {
        if (!user) return;
        if (user.verificationStatus === "VERIFIED") navigate("/artist/dashboard");
        else if (user.verificationStatus === "PENDING_VERIFICATION") navigate("/artist/verification-status");
        else navigate("/artist/setup-profile");
    };

    const handleRegisterNode = () => {
        if (!isAuthenticated || !user) {
            navigate("/login?type=artist&mode=signup");
            return;
        }
        if (user.isArtist) {
            routeArtistUser();
            return;
        }
        setShowArtistSwitchModal(true);
    };

    const confirmBecomeArtist = async () => {
        await signOut();
        setShowArtistSwitchModal(false);
        navigate("/login?type=artist&mode=signup");
    };

    return (
        <div className="bg-white overflow-hidden">
            {/* ── TOPBAR ── */}            

            {/* ── HERO ── */}
            {config.showHeroSection && (
                <section className="grid grid-cols-1 lg:grid-cols-2 min-h-[600px] border-b-[3px] border-neutral-black relative overflow-hidden">
                    {/* Left – Main Hero */}
                    <div className="bg-white flex relative overflow-hidden group">
                        {/* Background Decoration */}
                        {banners.heroBgImage ? (
                            <ImageWithSkeleton
                                src={banners.heroBgImage}
                                wrapperLayout="absolute-fill"
                                className="h-full w-full object-cover object-center select-none"
                                alt=""
                                loading="eager"
                                fetchPriority="high"
                                wrapperClassName="-z-0 pointer-events-none overflow-hidden"
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
                                link: "/products?latestDrops=true&sort=newest",
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
                                    <ImageWithSkeleton
                                        src={block.img}
                                        alt=""
                                        className="w-full h-full object-cover scale-110 transition-all duration-700"
                                        loading="eager"
                                        fetchPriority="high"
                                        wrapperClassName="w-full h-full"
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
                                                            <ImageWithSkeleton
                                                                src={
                                                                    product.primaryView === "back"
                                                                        ? product.backMockupImageUrl || product.mockupImageUrl
                                                                        : product.mockupImageUrl
                                                                }
                                                                alt={product.name}
                                                                className="absolute inset-0 h-full w-full object-cover object-[50%_36%] origin-[50%_38%] scale-[1.2] transition-transform duration-500 group-hover:scale-[1.28]"
                                                                wrapperClassName="h-full w-full overflow-hidden"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-[100px] opacity-10 grayscale uppercase font-black italic">ART</div>
                                                        )}
                                                    </Link>
                                                    <div className="absolute top-4 left-4 flex gap-2 pointer-events-none">
                                                        <span className="bg-neutral-black text-white px-3 py-1 font-display text-[12px] font-black uppercase tracking-[2px] rounded-[2px] border-[2px] border-neutral-black shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]">-{specialOffer.discountPercent}%</span>
                                                    </div>
                                                </div>
                                                <div className="w-full pt-6 flex flex-col items-center text-center">
                                                    <Link to={`/artists/${product.artist.id}`} className="font-display text-[12px] font-black tracking-[2px] uppercase text-neutral-black/60 hover:text-neutral-black transition-colors mb-2 no-underline">
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
                        <div className="flex flex-wrap items-center justify-end gap-4">
                            <Link
                                to={
                                    activeCat === "All"
                                        ? "/products"
                                        : `/products?category=${encodeURIComponent(activeCat)}`
                                }
                                className="group/shop inline-flex items-center gap-3 bg-primary text-neutral-black px-8 py-4 rounded-[4px] font-display text-[12px] font-black uppercase tracking-[2px] no-underline transition-all hover:shadow-[6px_6px_0px_0px_rgba(255,255,255,0.15)] hover:translate-x-[2px] hover:translate-y-[2px]"
                            >
                                {activeCat === "All" ? "Shop all" : `Shop ${activeCat}`}
                                <ArrowRight className="w-5 h-5 group-hover/shop:translate-x-1 transition-transform" />
                            </Link>
                            <button type="button" onClick={() => scrollCat(-1)} className="w-14 h-14 border-[2px] border-white/20 rounded-[4px] bg-white/5 text-white flex items-center justify-center hover:bg-primary hover:border-primary hover:text-neutral-black transition-all group">
                                <ChevronLeft className="w-6 h-6 group-hover:scale-125 transition-transform" />
                            </button>
                            <button type="button" onClick={() => scrollCat(1)} className="w-14 h-14 border-[2px] border-white/20 rounded-[4px] bg-white/5 text-white flex items-center justify-center hover:bg-primary hover:border-primary hover:text-neutral-black transition-all group">
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

                    {/* Product Carousel — fixed card width so items never stretch full-row */}
                        <div
                            ref={catScrollRef}
                            className={`flex gap-8 overflow-x-auto scrollbar-hide snap-x snap-mandatory ${
                                filteredProducts.length === 1 ? "justify-center" : "justify-start"
                            }`}
                        >
                        {isLoading ? (
                            <div className="flex items-center justify-center w-full py-20"><Loader className="w-32 h-32" /></div>
                        ) : filteredProducts.length === 0 ? (
                            <div className="py-24 text-center w-full bg-white/5 border border-white/10 rounded-[8px] dashed">
                                <p className="font-display text-[14px] font-black uppercase tracking-[2px] text-white/20">Accessing Node Inventory... No Data Found</p>
                            </div>
                        ) : (
                            filteredProducts.map((product) => (
                                <div
                                    key={product.id}
                                    className="w-[280px] max-w-[92vw] md:w-[320px] shrink-0 snap-start group"
                                >
                                    <div className="relative aspect-[4/5] bg-neutral-g1 rounded-[8px] border-[2.5px] border-neutral-black overflow-hidden group-hover:bg-primary transition-all duration-500 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px]">
                                        <Link to={`/products/${product.id}`} className="no-underline w-full h-full block">
                                            {product.mockupImageUrl ? (
                                                <ImageWithSkeleton
                                                    src={
                                                        product.primaryView === "back"
                                                            ? product.backMockupImageUrl || product.mockupImageUrl
                                                            : product.mockupImageUrl
                                                    }
                                                    alt={product.name}
                                                    className="absolute inset-0 h-full w-full object-cover object-[50%_36%] origin-[50%_38%] scale-[1.2] transition-transform duration-500 group-hover:scale-[1.3]"
                                                    wrapperClassName="h-full w-full overflow-hidden"
                                                />
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

            {config.showFeaturedProducts && (
                <LatestDropsShowcase products={latestDropProducts} isLoading={isLoading} />
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
                                <button
                                    onClick={handleRegisterNode}
                                    className="px-10 py-5 bg-transparent text-white border-[2.5px] border-white/20 hover:border-primary hover:text-primary font-display text-[16px] font-black uppercase tracking-[2px] rounded-[4px] transition-all"
                                >
                                    Register Node
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                            {(artists.length > 0 ? artists.slice(0, 6) : Array.from({ length: 6 }, (_, i) => ({ id: String(i), name: `Node_${i + 1}`, styles: ["Art"], productCount: 0 } as ArtistSummary))).map((artist, idx) => {
                                const label = (artist.displayName || artist.name || "?").trim();
                                const initial = (label.charAt(0) || "?").toUpperCase();
                                const photo = artist.displayPhotoUrl;
                                return (
                                    <Link
                                        key={artist.id}
                                        to={`/artists/${artist.id}`}
                                        className={`bg-white/5 border-[2px] border-white/10 p-5 no-underline transition-all hover:bg-primary group rounded-[4px] flex flex-col min-h-[200px] sm:min-h-[220px] group ${idx % 2 === 0 ? "translate-y-6" : "-translate-y-6"}`}
                                    >
                                        <ArtistHomeTilePhoto photoUrl={photo} initial={initial} />
                                        <div className="space-y-1 mt-auto">
                                            <div className="font-display text-[16px] sm:text-[18px] font-black text-white group-hover:text-neutral-black truncate uppercase tracking-tighter">
                                                {label}
                                            </div>
                                            <div className="font-display text-[10px] font-black text-primary group-hover:text-neutral-black/60 uppercase tracking-[2px]">
                                                {artist.styles?.[0] || "GENERAL_ARTIST"}
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
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

            {showArtistSwitchModal && (
                <div className="fixed inset-0 z-[220] bg-neutral-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="w-full max-w-xl bg-white border-[3px] border-neutral-black rounded-[8px] shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                        <div className="bg-neutral-black text-white p-6 border-b-[3px] border-neutral-black">
                            <h3 className="font-display text-[26px] font-black uppercase leading-none">
                                Turn Your Art Into <span className="text-primary italic">Income</span>
                            </h3>
                            <p className="font-display text-[11px] font-bold uppercase tracking-[1.2px] text-white/60 mt-2">
                                You are currently signed in as a customer node.
                            </p>
                        </div>
                        <div className="p-6 space-y-5">
                            <p className="font-display text-[12px] font-black uppercase tracking-[1.1px] text-neutral-g4">
                                Switch to artist mode in 3 simple steps:
                            </p>
                            <div className="space-y-3">
                                {[
                                    "Create your artist account profile",
                                    "Upload designs and build your product lineup",
                                    "Get paid on every sale from your storefront",
                                ].map((s, i) => (
                                    <div key={s} className="flex items-start gap-3">
                                        <div className="w-6 h-6 rounded-[2px] bg-primary border-[2px] border-neutral-black font-display text-[11px] font-black flex items-center justify-center shrink-0">
                                            {i + 1}
                                        </div>
                                        <p className="font-display text-[13px] font-black uppercase tracking-[0.6px] leading-snug">
                                            {s}
                                        </p>
                                    </div>
                                ))}
                            </div>
                            <p className="font-display text-[11px] font-bold uppercase tracking-[1px] text-neutral-g3">
                                To continue, we will securely sign you out and open artist onboarding.
                            </p>
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setShowArtistSwitchModal(false)}
                                    className="flex-1 py-3 bg-white border-[2px] border-neutral-black rounded-[4px] font-display text-[11px] font-black uppercase tracking-[1.2px] hover:bg-neutral-g1 transition-all"
                                >
                                    Stay in Customer Mode
                                </button>
                                <button
                                    onClick={confirmBecomeArtist}
                                    className="flex-1 py-3 bg-primary border-[2px] border-neutral-black rounded-[4px] font-display text-[11px] font-black uppercase tracking-[1.2px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
                                >
                                    Logout & Become Artist
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default HomePage;
