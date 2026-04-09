import { useState, useEffect, useRef } from "react";
import {
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Star,
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import Loader from "../../components/shared/Loader";
import ImageWithSkeleton from "../../components/shared/ImageWithSkeleton";
import api from "../../api/axios";
import { useCart } from "../../context/CartContext";
import { BEE_BADGE } from "../../constants/brand";
import { artistPublicPath } from "../../utils/artistRoutes";
import { frontMockupUrl, backMockupUrl } from "../../utils/productMockup";
import ArtistRatingInline from "../../components/shared/ArtistRatingInline";
import BannerTeehiveMarquee from "../../components/shared/BannerTeehiveMarquee";

interface Product {
    id: string;
    name: string;
    price: number;
    originalPrice?: number;
    isDiscounted?: boolean;
    discountPercent?: number;
    compareAtPrice?: number;
    category: string;
    tshirtColor: string;
    primaryColor?: string;
    availableColors?: string[];
    colorMockups?: Record<string, { front: string; back?: string }> | null;
    mockupImageUrl: string;
    backMockupImageUrl?: string;
    primaryView?: "front" | "back";
    artist: {
        id: string;
        name: string;
        artistSlug?: string | null;
        artistRating?: number;
        reviewCount?: number;
    };
}

interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export default function BrowseProducts() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [sortBy, setSortBy] = useState(searchParams.get("sort") || "newest");
    const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "all");

    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<string[]>(["all"]);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [addedId, setAddedId] = useState<string | null>(null);
    const { addItem } = useCart();
    const shopCategoryScrollRef = useRef<HTMLDivElement>(null);

    const canonicalCategory = (value: string | null, list: string[]) => {
        if (!value) return "all";
        const trimmed = value.trim();
        if (!trimmed || trimmed.toLowerCase() === "all") return "all";
        const match = list.find((c) => c.toLowerCase() === trimmed.toLowerCase());
        return match || trimmed;
    };

    const scrollShopCategories = (dir: number) => {
        const el = shopCategoryScrollRef.current;
        if (!el) return;
        el.scrollBy({ left: dir * 220, behavior: "smooth" });
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const catRes = await api.get("/api/categories");
                const catNames = catRes.data.data.categories.map((c: any) => c.name);
                setCategories(["all", ...catNames]);
            } catch (err) {
                console.error("Failed to fetch categories:", err);
            }
        };
        fetchData();
    }, []);

    const categoryParam = searchParams.get("category");
    const sortParam = searchParams.get("sort");

    useEffect(() => {
        setSelectedCategory(canonicalCategory(categoryParam, categories));
        if (sortParam) setSortBy(sortParam);
    }, [categoryParam, sortParam, categories]);

    useEffect(() => {
        fetchProducts();
    }, [selectedCategory, sortBy, page, searchParams]);

    const fetchProducts = async () => {
        try {
            setIsLoading(true);
            const params = new URLSearchParams();
            const cat = canonicalCategory(searchParams.get("category") || selectedCategory, categories);
            const sort = searchParams.get("sort") || sortBy;
            const q = searchParams.get("search") || "";

            if (cat !== "all") params.set("category", cat);
            if (sort) params.set("sort", sort);
            if (q) params.set("search", q);
            params.set("page", page.toString());
            params.set("limit", "12");

            const res = await api.get(`/api/products?${params.toString()}`);
            setProducts(res.data.data.products);
            setPagination(res.data.data.pagination);
        } catch (error) {
            console.error("Failed to fetch products:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCategoryChange = (cat: string) => {
        setSelectedCategory(cat);
        setPage(1);
        const newParams = new URLSearchParams(searchParams);
        if (cat !== "all") newParams.set("category", cat);
        else newParams.delete("category");
        setSearchParams(newParams);
    };

    const handleQuickAdd = (product: Product) => {
        const colors =
            product.availableColors?.length ? product.availableColors : [product.tshirtColor];
        const pickColor = product.primaryColor || product.tshirtColor;
        const baseMock = {
            mockupImageUrl: product.mockupImageUrl,
            backMockupImageUrl: product.backMockupImageUrl,
            colorMockups: product.colorMockups,
            primaryColor: product.primaryColor,
            tshirtColor: product.tshirtColor,
        };
        const useBack = product.primaryView === "back";
        const img = useBack ? backMockupUrl(baseMock, pickColor) : frontMockupUrl(baseMock, pickColor);
        addItem({
            productId: product.id,
            name: product.name,
            price: product.price,
            quantity: 1,
            size: "M",
            color: pickColor,
            image: img,
            mockupImageUrl: product.mockupImageUrl,
            backMockupImageUrl: product.backMockupImageUrl,
            defaultProductColor: product.tshirtColor,
            primaryColor: product.primaryColor,
            primaryView: product.primaryView,
            mockupView: useBack ? "back" : "front",
            colorMockups: product.colorMockups ?? undefined,
            artistName: product.artist.name,
            availableColors: colors,
        });
        setAddedId(product.id);
        setTimeout(() => setAddedId(null), 2000);
    };

    return (
        <div className="bg-neutral-white min-h-screen">
            {/* ── HEADER ── */}
            <div className="relative overflow-hidden bg-neutral-black border-b-[1.5px] border-neutral-black py-10 md:py-12 px-6 sm:px-8">
                <BannerTeehiveMarquee />
                <div className="relative z-10 max-w-[1600px] mx-auto text-left">
                    <div className="font-display text-[11px] font-extrabold tracking-[4px] uppercase text-primary mb-3 flex items-center gap-2">
                        <span aria-hidden>{BEE_BADGE}</span>
                        Design Discovery
                    </div>
                    <h1 className="font-display text-[clamp(32px,5vw,64px)] font-black text-white leading-none tracking-[1px] mb-4">
                        EXPLORE THE <span className="text-primary italic">HIVE</span>
                    </h1>
                    <p className="text-[clamp(14px,1.2vw,17px)] text-white/65 leading-relaxed max-w-xl">
                        From minimal icons to abstract masterpieces. Support independent creators with every piece you wear.
                    </p>
                </div>
            </div>

            <div className="px-8 py-10">
                {(searchParams.get("latestDrops") === "true" || searchParams.get("latestDrops") === "1") && (
                    <div className="flex flex-wrap items-center gap-3 mb-6 px-4 py-3 bg-primary/20 border-[1.5px] border-neutral-black rounded-[4px]">
                        <Star className="w-4 h-4 fill-primary text-neutral-black shrink-0" />
                        <span className="font-display text-[11px] font-black uppercase tracking-[1px] text-neutral-black">
                            Latest drops · Newest first
                        </span>
                        <button
                            type="button"
                            onClick={() => {
                                const next = new URLSearchParams(searchParams);
                                next.delete("latestDrops");
                                setSearchParams(next);
                                setPage(1);
                            }}
                            className="ml-auto font-display text-[10px] font-black uppercase underline underline-offset-2 hover:text-primary"
                        >
                            Show all
                        </button>
                    </div>
                )}
                {/* ── TOOLBAR ── */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10 pb-6 border-b-[1.5px] border-neutral-g2">
                    {/* Category Selector — scroll + arrows */}
                    <div className="flex items-center gap-2 min-w-0 flex-1 pb-2 lg:pb-0">
                        <button
                            type="button"
                            onClick={() => scrollShopCategories(-1)}
                            className="shrink-0 w-10 h-10 md:w-11 md:h-11 border-[1.5px] border-neutral-g2 rounded-[4px] bg-white text-neutral-black flex items-center justify-center hover:bg-primary hover:border-neutral-black transition-all"
                            aria-label="Scroll categories left"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <div
                            ref={shopCategoryScrollRef}
                            className="flex flex-1 min-w-0 items-center gap-2 overflow-x-auto scrollbar-hide"
                        >
                            {categories.map((category) => (
                                <button
                                    key={category}
                                    type="button"
                                    onClick={() => handleCategoryChange(category)}
                                    className={`shrink-0 px-5 py-2.5 rounded-[3px] font-display text-[11px] font-extrabold tracking-[1px] uppercase border-[1.5px] transition-all whitespace-nowrap ${selectedCategory === category
                                        ? "bg-neutral-black text-primary border-neutral-black"
                                        : "bg-transparent border-neutral-g2 text-neutral-g4 hover:border-neutral-black hover:text-neutral-black"
                                        }`}
                                >
                                    {category}
                                </button>
                            ))}
                        </div>
                        <button
                            type="button"
                            onClick={() => scrollShopCategories(1)}
                            className="shrink-0 w-10 h-10 md:w-11 md:h-11 border-[1.5px] border-neutral-g2 rounded-[4px] bg-white text-neutral-black flex items-center justify-center hover:bg-primary hover:border-neutral-black transition-all"
                            aria-label="Scroll categories right"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                        <div className="relative group">
                            <select
                                value={sortBy}
                                onChange={(e) => {
                                    setSortBy(e.target.value);
                                    setPage(1);
                                    const newParams = new URLSearchParams(searchParams);
                                    newParams.set("sort", e.target.value);
                                    setSearchParams(newParams);
                                }}
                                className="appearance-none bg-white border-[1.5px] border-neutral-g2 rounded-[4px] px-5 pr-10 py-2.5 font-display text-[11px] font-extrabold tracking-[1px] uppercase text-neutral-black outline-none cursor-pointer focus:border-neutral-black transition-colors"
                            >
                                <option value="newest">Newest First</option>
                                <option value="popular">Most Popular</option>
                                <option value="price-low">Price: Low to High</option>
                                <option value="price-high">Price: High to Low</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-neutral-g3 pointer-events-none" />
                        </div>

                    </div>
                </div>

                {/* ── PRODUCTS LISTING ── */}
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-96">
                        <Loader size="w-16 h-16" />
                    </div>
                ) : products.length === 0 ? (
                    <div className="text-center py-24">
                        <div className="text-[64px] mb-4 opacity-20">🔎</div>
                        <h3 className="font-display text-[20px] font-black tracking-[0.5px] text-neutral-black mb-2 uppercase">No designs found</h3>
                        <p className="text-neutral-g4 text-[14px] mb-8">Try adjusting your filters or search terms.</p>
                        <button onClick={() => { setSelectedCategory("all"); setSearchParams(new URLSearchParams()); }} className="bg-neutral-black text-white px-8 py-3.5 font-display text-[13px] font-extrabold tracking-[1px] uppercase rounded-[4px] hover:bg-primary hover:text-neutral-black transition-colors">
                            Clear all filters
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                        {products.map((product) => (
                            <div
                                key={product.id}
                                className="bg-white border-[1.5px] border-neutral-g2 rounded-[4px] overflow-hidden group transition-all hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)] hover:border-neutral-black"
                            >
                                <Link to={`/products/${product.id}`} className="block aspect-square overflow-hidden bg-neutral-g1 relative">
                                    <ImageWithSkeleton
                                        src={
                                            product.primaryView === "back"
                                                ? product.backMockupImageUrl || product.mockupImageUrl
                                                : product.mockupImageUrl
                                        }
                                        alt={product.name}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                        wrapperClassName="w-full h-full"
                                    />
                                    {product.isDiscounted && (
                                        <div className="absolute top-3 left-3 bg-danger text-white font-display text-[10px] font-black px-2 py-1 uppercase tracking-[1px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-10">
                                            -{product.discountPercent}%
                                        </div>
                                    )}
                                </Link>

                                <div className="p-4">
                                    <Link
                                        to={artistPublicPath(product.artist)}
                                        className="font-display text-[10px] font-bold tracking-[1.5px] uppercase text-neutral-g4 mb-1 block hover:text-neutral-black transition-colors no-underline"
                                    >
                                        {product.artist.name}
                                    </Link>
                                    <div className="mb-2">
                                        <ArtistRatingInline
                                            rating={product.artist.artistRating ?? 0}
                                            reviewCount={product.artist.reviewCount ?? 0}
                                            compact
                                        />
                                    </div>
                                    <Link to={`/products/${product.id}`} className="no-underline block">
                                        <h3 className="font-display text-[15px] font-bold text-neutral-black mb-3 truncate hover:text-primary transition-colors">
                                            {product.name}
                                        </h3>
                                    </Link>
                                    <div className="flex items-center justify-between mb-4 gap-2">
                                        <div className="flex items-baseline gap-2 min-w-0">
                                            <span className="font-display text-[16px] font-black text-neutral-black shrink-0">
                                                ₹{product.price.toLocaleString("en-IN")}
                                            </span>
                                            {product.isDiscounted && (
                                                <span className="font-display text-[11px] font-bold text-neutral-g3 line-through truncate">
                                                    ₹{product.originalPrice?.toLocaleString("en-IN")}
                                                </span>
                                            )}
                                        </div>
                                        <span className="font-display text-[9px] font-bold tracking-[1px] uppercase text-neutral-g3 bg-neutral-g1 px-1.5 py-0.5 shrink-0">
                                            {product.category}
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleQuickAdd(product)}
                                        className={`w-full py-2.5 font-display text-[11px] font-extrabold tracking-[1px] uppercase rounded-[3px] transition-all border-[1.5px] ${
                                            addedId === product.id
                                                ? "bg-success text-white border-success"
                                                : "bg-neutral-black text-white border-neutral-black hover:bg-primary hover:text-neutral-black hover:border-primary"
                                        }`}
                                    >
                                        {addedId === product.id ? "Added!" : "+ Add to Cart"}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                    <div className="flex justify-center items-center gap-4 mt-20">
                        <button
                            onClick={() => { setPage(Math.max(1, page - 1)); window.scrollTo(0, 400); }}
                            disabled={page === 1}
                            className="bg-white border-[1.5px] border-neutral-black rounded-[4px] px-8 py-3.5 font-display text-[12px] font-black tracking-[1px] uppercase transition-all hover:bg-primary disabled:opacity-30 disabled:hover:bg-white"
                        >
                            Previous
                        </button>
                        <div className="font-display text-[11px] font-bold tracking-[1px] text-neutral-g4 uppercase">
                            PAGE {pagination.page} / {pagination.totalPages}
                        </div>
                        <button
                            onClick={() => { setPage(Math.min(pagination.totalPages, page + 1)); window.scrollTo(0, 400); }}
                            disabled={page === pagination.totalPages}
                            className="bg-white border-[1.5px] border-neutral-black rounded-[4px] px-8 py-3.5 font-display text-[12px] font-black tracking-[1px] uppercase transition-all hover:bg-primary disabled:opacity-30 disabled:hover:bg-white"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
