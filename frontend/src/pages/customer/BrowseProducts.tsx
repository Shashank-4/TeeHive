import { useState, useEffect } from "react";
import {
    Search,
    Heart,
    Grid,
    List,
    ChevronDown,
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import Loader from "../../components/shared/Loader";
import api from "../../api/axios";
import { useCart } from "../../context/CartContext";

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
    mockupImageUrl: string;
    artist: {
        id: string;
        name: string;
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
    const [viewMode, setViewMode] = useState("grid");
    const [sortBy, setSortBy] = useState(searchParams.get("sort") || "newest");
    const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
    const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "all");

    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<string[]>(["all"]);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [addedId, setAddedId] = useState<string | null>(null);
    const [bannerUrl, setBannerUrl] = useState("/assets/banners/shop_banner.jpg");
    const { addItem } = useCart();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [catRes, configRes] = await Promise.allSettled([
                    api.get("/api/categories"),
                    api.get("/api/config/site_banners")
                ]);

                if (catRes.status === "fulfilled") {
                    const catNames = catRes.value.data.data.categories.map((c: any) => c.name);
                    setCategories(["all", ...catNames]);
                }

                if (configRes.status === "fulfilled" && configRes.value.data?.data?.config?.shopBanner) {
                    setBannerUrl(configRes.value.data.data.config.shopBanner);
                }
            } catch (err) {
                console.error("Failed to fetch initial shop data:", err);
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        fetchProducts();
    }, [selectedCategory, sortBy, page, searchParams]);

    const fetchProducts = async () => {
        try {
            setIsLoading(true);
            const params = new URLSearchParams();
            const cat = searchParams.get("category") || selectedCategory;
            const sort = searchParams.get("sort") || sortBy;
            const q = searchParams.get("search") || searchQuery;

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

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        const newParams = new URLSearchParams(searchParams);
        if (searchQuery) newParams.set("search", searchQuery);
        else newParams.delete("search");
        setSearchParams(newParams);
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
        addItem({
            productId: product.id,
            name: product.name,
            price: product.price,
            quantity: 1,
            size: "M",
            color: product.tshirtColor,
            image: product.mockupImageUrl,
            artistName: product.artist.name,
        });
        setAddedId(product.id);
        setTimeout(() => setAddedId(null), 2000);
    };

    return (
        <div className="bg-neutral-white min-h-screen">
            {/* ── HEADER ── */}
            <div className="bg-neutral-black border-b-[1.5px] border-neutral-black py-16 px-8 relative overflow-hidden min-h-[400px] flex items-center">
                {/* Background Banner */}
                <div className="absolute inset-0">
                    <img src={bannerUrl} alt="" className="w-full h-full object-cover opacity-40" />
                    <div className="absolute inset-0 bg-gradient-to-t from-neutral-black via-neutral-black/40 to-transparent"></div>
                </div>

                <div className="absolute inset-0 flex items-center justify-center text-[18vw] font-display font-black text-white/[0.03] tracking-[-5px] select-none whitespace-nowrap">
                    COLLECTIONS COLLECTIONS
                </div>
                <div className="relative z-10 max-w-4xl mx-auto text-center">
                    <div className="font-display text-[11px] font-extrabold tracking-[4px] uppercase text-primary mb-4 flex items-center justify-center gap-2">
                        <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                        Design Discovery
                    </div>
                    <h1 className="font-display text-[clamp(40px,6vw,80px)] font-black text-white leading-none tracking-[1px] mb-6">
                        EXPLORE THE <span className="text-primary italic">HIVE</span>
                    </h1>
                    <p className="text-[clamp(14px,1.2vw,16px)] text-white/70 leading-[1.6] max-w-xl mx-auto mb-10">
                        From minimal icons to abstract masterpieces. Support independent creators with every piece you wear.
                    </p>

                    {/* Search */}
                    <form onSubmit={handleSearch} className="max-w-xl mx-auto relative group">
                        <div className="flex items-center gap-0 border-2 border-white/20 bg-white/5 rounded-[4px] focus-within:border-primary transition-all overflow-hidden backdrop-blur-sm">
                            <div className="pl-5 pr-3">
                                <Search className="w-5 h-5 text-white/30 group-focus-within:text-primary transition-colors" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search products, artists, or vibes..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="flex-1 bg-transparent border-none outline-none py-4 text-white font-body placeholder:text-white/20 text-[15px]"
                            />
                            <button type="submit" className="bg-primary hover:bg-white text-neutral-black font-display font-black text-[12px] tracking-[1px] uppercase px-8 py-4 transition-colors shrink-0">
                                Search
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <div className="px-8 py-10">
                {/* ── TOOLBAR ── */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10 pb-6 border-b-[1.5px] border-neutral-g2">
                    {/* Category Selector */}
                    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2 lg:pb-0">
                        {categories.map((category) => (
                            <button
                                key={category}
                                onClick={() => handleCategoryChange(category)}
                                className={`px-5 py-2.5 rounded-[3px] font-display text-[11px] font-extrabold tracking-[1px] uppercase border-[1.5px] transition-all whitespace-nowrap ${selectedCategory === category
                                    ? "bg-neutral-black text-primary border-neutral-black"
                                    : "bg-transparent border-neutral-g2 text-neutral-g4 hover:border-neutral-black hover:text-neutral-black"
                                    }`}
                            >
                                {category}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="hidden sm:block text-[12px] font-display font-bold text-neutral-g3 tracking-[0.5px] mr-4 uppercase">
                            {pagination ? pagination.total : 0} DESIGNS FOUND
                        </div>

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

                        <div className="flex items-center bg-white border-[1.5px] border-neutral-g2 rounded-[4px] p-1 gap-1">
                            <button
                                onClick={() => setViewMode("grid")}
                                className={`w-9 h-9 flex items-center justify-center rounded-[2px] transition-colors ${viewMode === "grid" ? "bg-primary text-neutral-black" : "text-neutral-g3 hover:bg-neutral-g1"
                                    }`}
                            >
                                <Grid className="w-4.5 h-4.5" />
                            </button>
                            <button
                                onClick={() => setViewMode("list")}
                                className={`w-9 h-9 flex items-center justify-center rounded-[2px] transition-colors ${viewMode === "list" ? "bg-primary text-neutral-black" : "text-neutral-g3 hover:bg-neutral-g1"
                                    }`}
                            >
                                <List className="w-4.5 h-4.5" />
                            </button>
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
                        <button onClick={() => { setSearchQuery(""); setSelectedCategory("all"); setSearchParams(new URLSearchParams()); }} className="bg-neutral-black text-white px-8 py-3.5 font-display text-[13px] font-extrabold tracking-[1px] uppercase rounded-[4px] hover:bg-primary hover:text-neutral-black transition-colors">
                            Clear all filters
                        </button>
                    </div>
                ) : viewMode === "grid" ? (
                    /* Products Grid */
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-neutral-g2 border border-neutral-g2">
                        {products.map((product) => (
                            <div key={product.id} className="bg-white group cursor-pointer relative overflow-hidden transition-all hover:z-10 hover:shadow-[0_12px_48px_rgba(0,0,0,0.12)]">
                                <Link to={`/products/${product.id}`} className="no-underline block">
                                    <div className="aspect-square bg-neutral-g1 flex items-center justify-center overflow-hidden relative group-hover:bg-neutral-g2 transition-colors">
                                        <img
                                            src={product.mockupImageUrl}
                                            alt={product.name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                        {product.isDiscounted && (
                                            <div className="absolute top-4 left-4 bg-danger text-white font-display text-[10px] font-black px-2 py-1 uppercase tracking-[1px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-10">
                                                -{product.discountPercent}%
                                            </div>
                                        )}
                                        <div className="absolute top-4 right-4 translate-x-12 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all">
                                            <button className="w-10 h-10 bg-white border border-neutral-g2 rounded-[4px] flex items-center justify-center hover:bg-danger hover:text-white transition-colors" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                                                <Heart className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="p-4 pt-5 pb-2">
                                        <div className="font-display text-[10px] font-bold tracking-[1.5px] uppercase text-primary mb-1">{product.artist.name}</div>
                                        <h3 className="font-display text-[16px] font-bold text-neutral-black mb-3 leading-[1.2] tracking-[0.2px] truncate">{product.name}</h3>
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-baseline gap-2">
                                                <span className="font-display text-[18px] font-black text-neutral-black">₹{product.price.toLocaleString('en-IN')}</span>
                                                {product.isDiscounted && (
                                                    <span className="font-display text-[12px] font-bold text-neutral-g3 line-through">₹{product.originalPrice?.toLocaleString('en-IN')}</span>
                                                )}
                                            </div>
                                            <span className="font-display text-[9px] font-bold tracking-[1px] uppercase text-neutral-g3 bg-neutral-g1 px-1.5 py-0.5 rounded-[2px]">{product.category}</span>
                                        </div>
                                    </div>
                                </Link>
                                <button
                                    onClick={() => handleQuickAdd(product)}
                                    className={`w-full py-3 font-display text-[12px] font-extrabold tracking-[1px] uppercase rounded-[3px] border-[1.5px] transition-all ${addedId === product.id ? "bg-success text-white border-success" : "bg-primary text-neutral-black border-primary hover:bg-neutral-black hover:text-white hover:border-neutral-black"}`}
                                >
                                    {addedId === product.id ? "✓ Added!" : "Add to Cart"}
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    /* List View */
                    <div className="space-y-4">
                        {products.map((product) => (
                            <div key={product.id} className="bg-white border-[1.5px] border-neutral-g2 rounded-[4px] p-5 hover:border-neutral-black transition-all group overflow-hidden relative">
                                <div className="flex flex-col sm:flex-row items-center gap-8">
                                    <Link to={`/products/${product.id}`} className="block w-40 h-40 bg-neutral-g1 flex items-center justify-center shrink-0 rounded-[4px] overflow-hidden">
                                        <img
                                            src={product.mockupImageUrl}
                                            alt={product.name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                        />
                                    </Link>
                                    <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-6 w-full">
                                        <div>
                                            <div className="font-display text-[11px] font-bold tracking-[2px] uppercase text-primary mb-1">{product.artist.name}</div>
                                            <Link to={`/products/${product.id}`} className="no-underline">
                                                <h3 className="font-display text-[22px] font-black text-neutral-black mb-2 hover:underline tracking-[0.5px]">{product.name}</h3>
                                            </Link>
                                            <p className="text-[13px] text-neutral-g4 line-clamp-2 max-w-lg">Designed by our independent creator for the {product.category} collection.</p>
                                        </div>
                                        <div className="flex flex-col items-start sm:items-end gap-5 shrink-0">
                                            <div className="text-right">
                                                <div className="font-display text-[24px] font-black text-neutral-black">₹{product.price.toLocaleString('en-IN')}</div>
                                                {product.isDiscounted ? (
                                                    <div className="text-[14px] font-bold text-neutral-g3 line-through">₹{product.originalPrice?.toLocaleString('en-IN')}</div>
                                                ) : product.compareAtPrice && (
                                                    <div className="text-[13px] text-neutral-g3 line-through">₹{product.compareAtPrice.toLocaleString('en-IN')}</div>
                                                )}
                                            </div>
                                            <div className="flex gap-2 w-full sm:w-auto">
                                                <button onClick={() => handleQuickAdd(product)} className={`flex-1 sm:flex-none px-8 py-3 font-display text-[12px] font-extrabold tracking-[1px] uppercase border-[1.5px] rounded-[3px] transition-all ${addedId === product.id ? "bg-success text-white border-success" : "bg-neutral-black text-white border-neutral-black hover:bg-primary hover:text-neutral-black hover:border-primary"}`}>
                                                    {addedId === product.id ? "✓ Added!" : "Add to Cart"}
                                                </button>
                                                <button className="w-11 h-11 flex items-center justify-center border-[1.5px] border-neutral-g2 rounded-[4px] text-neutral-g3 hover:bg-danger-light hover:text-danger hover:border-danger transition-all">
                                                    <Heart className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
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
        </div >
    );
}
