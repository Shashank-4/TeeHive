import { useState, useEffect, useMemo } from "react";
import {
    ShoppingCart,
    Minus,
    Plus,
    Truck,
    Shield,
    RotateCcw,
    ChevronRight,
    Check,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../../api/axios";
import { useCart } from "../../context/CartContext";
import Loader from "../../components/shared/Loader";
import StockStatusPill from "../../components/shared/StockStatusPill";
import ImageWithSkeleton from "../../components/shared/ImageWithSkeleton";
import SizeGuideModal from "../../components/shared/SizeGuideModal";
import { PRODUCT_SIZES } from "../../constants/productSizes";
import GstInclusiveNote from "../../components/shared/GstInclusiveNote";
import ReturnPolicyNote from "../../components/shared/ReturnPolicyNote";
import { BEE_BADGE } from "../../constants/brand";
import { artistPublicPath, artistPublicDisplayName } from "../../utils/artistRoutes";
import {
    STOREFRONT_TEE_MOCKUP_IMAGE_CLASS,
    frontMockupUrl,
    backMockupUrl,
} from "../../utils/productMockup";
import ArtistRatingInline from "../../components/shared/ArtistRatingInline";

interface Product {
    id: string;
    name: string;
    description?: string;
    price: number;
    originalPrice?: number;
    isDiscounted?: boolean;
    discountPercent?: number;
    compareAtPrice?: number;
    categories?: string[];
    tshirtColor: string;
    availableColors: string[];
    primaryColor?: string;
    primaryView?: string;
    stock: number;
    stockStatus?: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";
    mockupImageUrl: string;
    backMockupImageUrl?: string;
    colorMockups?: Record<string, { front: string; back?: string }> | null;
    design: {
        id: string;
        title: string;
        imageUrl: string;
    };
    artist: {
        id: string;
        name: string;
        displayName?: string | null;
        email: string;
        artistRating: number;
        reviewCount: number;
        artistSlug?: string | null;
    };
    variants?: Array<{
        id: string;
        color: string;
        size: string;
        stockStatus: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";
    }>;
}

/** Listing shape from `/api/products` for related picks + shop-style cards */
interface RelatedListingProduct {
    id: string;
    name: string;
    price: number;
    originalPrice?: number;
    isDiscounted?: boolean;
    discountPercent?: number;
    compareAtPrice?: number;
    categories?: string[];
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
        displayName?: string | null;
        artistSlug?: string | null;
        artistRating: number;
        reviewCount: number;
    };
}

export default function ProductDetails() {
    const { productId } = useParams<{ productId: string }>();
    const navigate = useNavigate();
    const [product, setProduct] = useState<Product | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedSize, setSelectedSize] = useState("M");
    const [selectedColor, setSelectedColor] = useState<string>("");
    const [currentView, setCurrentView] = useState<"front" | "back">("front");
    const [quantity, setQuantity] = useState(1);
    const [addedToCart, setAddedToCart] = useState(false);
    const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
    const [relatedProducts, setRelatedProducts] = useState<RelatedListingProduct[]>([]);
    const [relatedLoading, setRelatedLoading] = useState(false);
    const [relatedAddedId, setRelatedAddedId] = useState<string | null>(null);
    const { addItem, items } = useCart();

    const sizes = PRODUCT_SIZES;

    const [matrix, setMatrix] = useState<Record<string, Record<string, string>> | null>(null);

    useEffect(() => {
        const fetchGlobalInventory = async () => {
            try {
                const res = await api.get("/api/config/global_inventory");
                if (res.data.data?.config) {
                    const raw = res.data.data.config;
                    const normalized: Record<string, Record<string, string>> = {};
                    Object.keys(raw || {}).forEach((k) => {
                        normalized[(k || "").trim().toLowerCase()] = raw[k];
                    });
                    setMatrix(normalized);
                }
            } catch (err) {
                console.error("Failed to fetch global inventory:", err);
            }
        };
        fetchGlobalInventory();
    }, []);

    const canonicalHex = (hex: string) => {
        const s = (hex || "").trim().toLowerCase().replace(/^#/, "").replace(/[^0-9a-f]/g, "");
        return s ? `#${s}` : "#ffffff";
    };

    const variantForSelection = useMemo(() => {
        if (!product?.variants?.length) return null;
        const selectedHex = canonicalHex(selectedColor || product.primaryColor || product.tshirtColor);
        return (
            product.variants.find(
                (variant) =>
                    canonicalHex(variant.color) === selectedHex && variant.size === selectedSize
            ) || null
        );
    }, [product, selectedColor, selectedSize]);

    const resolveMatrixRowKey = (colorHex: string): string | null => {
        if (!matrix) return null;
        const want = canonicalHex(colorHex);
        for (const k of Object.keys(matrix)) {
            const nk = k.trim().toLowerCase();
            const nkCanon = canonicalHex(nk.startsWith("#") ? nk : `#${nk}`);
            if (nkCanon === want) return k;
        }
        return null;
    };

    /** Global matrix only blocks explicit OUT_OF_STOCK; missing cells = sellable (same as admin UI default). */
    const isGloballyUnavailable = (colorHex: string, size: string) => {
        if (!matrix) return false;
        const rowKey = resolveMatrixRowKey(colorHex);
        if (!rowKey) return false;
        const status = matrix[rowKey]?.[size];
        return status === "OUT_OF_STOCK";
    };

    const hasVariantInventory = Boolean(product?.variants?.length);
    const isVariantUnavailable = (colorHex: string, size: string) => {
        if (!product?.variants?.length) return false;
        const colorKey = canonicalHex(colorHex);
        const variant = product.variants.find(
            (entry) => canonicalHex(entry.color) === colorKey && entry.size === size
        );
        if (!variant) return true;
        return variant.stockStatus === "OUT_OF_STOCK";
    };

    const getEffectiveStockStatus = (): "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK" => {
        if (!product) return "OUT_OF_STOCK";
        if (selectedColor && selectedSize) {
            if (isGloballyUnavailable(selectedColor, selectedSize)) {
                return "OUT_OF_STOCK";
            }
        }
        
        let status: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK" = "IN_STOCK";
        
        if (variantForSelection) {
            status = variantForSelection.stockStatus;
        } else if (hasVariantInventory) {
            status = "OUT_OF_STOCK";
        } else {
            status = product.stockStatus || "IN_STOCK";
        }

        // Global LOW_STOCK overrides IN_STOCK
        if (status === "IN_STOCK" && selectedColor && selectedSize && matrix) {
            const rowKey = resolveMatrixRowKey(selectedColor);
            if (rowKey && matrix[rowKey]?.[selectedSize] === "LOW_STOCK") {
                return "LOW_STOCK";
            }
        }

        return status;
    };

    const displayMockups = useMemo(() => {
        if (!product) return { front: "", back: "" as string | undefined };
        const map = product.colorMockups;
        const colorRef = selectedColor || product.primaryColor || product.tshirtColor;
        const c = canonicalHex(colorRef);
        let entry: { front: string; back?: string } | null = null;
        if (map && typeof map === "object") {
            const direct = map[c] ?? map[colorRef];
            if (direct?.front) entry = direct;
            else {
                for (const k of Object.keys(map)) {
                    if (canonicalHex(k) === c) {
                        entry = map[k];
                        break;
                    }
                }
            }
        }
        return {
            front: entry?.front || product.mockupImageUrl,
            back: entry?.back || product.backMockupImageUrl,
        };
    }, [product, selectedColor]);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                setIsLoading(true);
                const res = await api.get(`/api/products/${productId}`);
                const productData = res.data.data.product;
                setProduct(productData);
                setSelectedColor(productData.primaryColor || productData.tshirtColor);
                setCurrentView(productData.primaryView === "back" ? "back" : "front");
            } catch (err: any) {
                setError(err.response?.status === 404 ? "Product not found" : "Failed to load product");
            } finally {
                setIsLoading(false);
            }
        };

        if (productId) fetchProduct();
    }, [productId]);

    useEffect(() => {
        if (!product) {
            setRelatedProducts([]);
            return;
        }
        const loadRelated = async () => {
            setRelatedLoading(true);
            try {
                const res = await api.get("/api/products?limit=48&sort=popular");
                const list: RelatedListingProduct[] = res.data?.data?.products ?? [];
                const curCats = new Set(
                    (product.categories || []).map((c) => String(c).toLowerCase().trim()).filter(Boolean)
                );
                const scored = list
                    .filter((p) => p.id !== product.id)
                    .map((p) => {
                        let score = 0;
                        if (p.artist?.id === product.artist.id) score += 4;
                        for (const c of p.categories || []) {
                            if (curCats.has(String(c).toLowerCase().trim())) {
                                score += 2;
                                break;
                            }
                        }
                        return { p, score };
                    })
                    .sort((a, b) => b.score - a.score)
                    .map(({ p }) => p)
                    .slice(0, 8);
                setRelatedProducts(scored);
            } catch {
                setRelatedProducts([]);
            } finally {
                setRelatedLoading(false);
            }
        };
        loadRelated();
    }, [product]);

    const handleRelatedQuickAdd = (p: RelatedListingProduct) => {
        const colors = p.availableColors?.length ? p.availableColors : [p.tshirtColor];
        const pickColor = p.primaryColor || p.tshirtColor;
        const baseMock = {
            mockupImageUrl: p.mockupImageUrl,
            backMockupImageUrl: p.backMockupImageUrl,
            colorMockups: p.colorMockups,
            primaryColor: p.primaryColor,
            tshirtColor: p.tshirtColor,
        };
        const useBack = p.primaryView === "back";
        const img = useBack ? backMockupUrl(baseMock, pickColor) : frontMockupUrl(baseMock, pickColor);
        addItem({
            productId: p.id,
            name: p.name,
            price: p.price,
            quantity: 1,
            size: "M",
            color: canonicalHex(pickColor),
            image: img,
            mockupImageUrl: p.mockupImageUrl,
            backMockupImageUrl: p.backMockupImageUrl,
            defaultProductColor: p.tshirtColor,
            primaryColor: p.primaryColor,
            primaryView: p.primaryView,
            mockupView: useBack ? "back" : "front",
            colorMockups: p.colorMockups ?? undefined,
            artistName: artistPublicDisplayName(p.artist),
            availableColors: colors,
        });
        setRelatedAddedId(p.id);
        setTimeout(() => setRelatedAddedId(null), 2000);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <Loader size="w-16 h-16" />
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center px-8">
                <div className="text-[64px] mb-6 grayscale opacity-20">🔎</div>
                <h2 className="font-display text-[24px] font-black text-neutral-black mb-4 uppercase tracking-[0.5px]">
                    {error || "Product not found"}
                </h2>
                <Link
                    to="/products"
                    className="bg-neutral-black text-white px-8 py-3.5 font-display text-[12px] font-black uppercase tracking-[1px] rounded-[4px] hover:bg-primary hover:text-neutral-black transition-all no-underline"
                >
                    ← Back to Hive
                </Link>
            </div>
        );
    }

    const discount = product.compareAtPrice ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100) : null;
    const currentStockStatus = getEffectiveStockStatus();
    const isOutOfStock = currentStockStatus === "OUT_OF_STOCK";
    const mainImageSrc =
        currentView === "front"
            ? displayMockups.front
            : displayMockups.back || displayMockups.front;

    const hasBackView = Boolean(displayMockups.back || product.backMockupImageUrl);

    const addCurrentToCart = () => {
        if (!product || isOutOfStock) return;
        const color = canonicalHex(selectedColor || product.tshirtColor);
        addItem({
            productId: product.id,
            name: product.name,
            price: product.price,
            quantity,
            size: selectedSize,
            color,
            image: mainImageSrc,
            mockupImageUrl: product.mockupImageUrl,
            backMockupImageUrl: product.backMockupImageUrl,
            defaultProductColor: product.tshirtColor,
            primaryColor: product.primaryColor,
            primaryView: product.primaryView === "back" ? "back" : "front",
            mockupView: currentView === "back" ? "back" : "front",
            colorMockups: product.colorMockups ?? undefined,
            artistName: artistPublicDisplayName(product.artist),
            availableColors:
                product.availableColors?.length ? product.availableColors : [product.tshirtColor],
        });
    };

    return (
        <div className="min-h-screen bg-neutral-white">
            <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 lg:py-6 w-full max-w-[1600px] mx-auto">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-[10px] font-display font-bold tracking-[1.5px] uppercase text-neutral-g3 mb-4 sm:mb-5 overflow-x-auto whitespace-nowrap scrollbar-hide">
                    <Link to="/" className="hover:text-neutral-black no-underline">Home</Link>
                    <ChevronRight className="w-3 h-3 shrink-0" />
                    <Link to="/products" className="hover:text-neutral-black no-underline">Shop</Link>
                    <ChevronRight className="w-3 h-3 shrink-0" />
                    <span className="text-primary font-black truncate">{product.name}</span>
                </div>

                <div className="grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] gap-6 lg:gap-8 xl:gap-10 items-start lg:items-stretch lg:min-h-[calc(100dvh-7rem)]">
                    {/* LEFT: Thumbnails + main image (viewport-conscious height) */}
                    <div className="flex gap-3 sm:gap-4 min-h-0">
                        {hasBackView && (
                            <div className="flex flex-col gap-2 sm:gap-2.5 shrink-0 w-[56px] sm:w-[64px] lg:w-[72px]" role="tablist" aria-label="Product view">
                                <button
                                    type="button"
                                    role="tab"
                                    aria-selected={currentView === "front"}
                                    aria-pressed={currentView === "front"}
                                    onClick={() => setCurrentView("front")}
                                    className={`group relative rounded-[2px] overflow-hidden border-[1.5px] p-0.5 transition-all aspect-square w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-black focus-visible:ring-offset-2 ${currentView === "front" ? "border-neutral-black bg-primary/25 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" : "border-neutral-g2 bg-white hover:border-neutral-black"}`}
                                >
                                    <ImageWithSkeleton
                                        key={displayMockups.front}
                                        src={displayMockups.front}
                                        alt="Front view"
                                        className={`w-full h-full ${STOREFRONT_TEE_MOCKUP_IMAGE_CLASS} rounded-[1px]`}
                                        wrapperClassName="w-full h-full aspect-square"
                                    />
                                    <span className="absolute bottom-0 inset-x-0 bg-neutral-black/85 text-white font-display text-[8px] font-black uppercase tracking-wider py-0.5 text-center pointer-events-none">
                                        Front
                                    </span>
                                </button>
                                <button
                                    type="button"
                                    role="tab"
                                    aria-selected={currentView === "back"}
                                    aria-pressed={currentView === "back"}
                                    onClick={() => setCurrentView("back")}
                                    className={`group relative rounded-[2px] overflow-hidden border-[1.5px] p-0.5 transition-all aspect-square w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-black focus-visible:ring-offset-2 ${currentView === "back" ? "border-neutral-black bg-primary/25 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" : "border-neutral-g2 bg-white hover:border-neutral-black"}`}
                                >
                                    <ImageWithSkeleton
                                        key={displayMockups.back || displayMockups.front}
                                        src={displayMockups.back || displayMockups.front}
                                        alt="Back view"
                                        className={`w-full h-full ${STOREFRONT_TEE_MOCKUP_IMAGE_CLASS} rounded-[1px]`}
                                        wrapperClassName="w-full h-full aspect-square"
                                    />
                                    <span className="absolute bottom-0 inset-x-0 bg-neutral-black/85 text-white font-display text-[8px] font-black uppercase tracking-wider py-0.5 text-center pointer-events-none">
                                        Back
                                    </span>
                                </button>
                            </div>
                        )}

                        <div className="flex-1 min-w-0 flex items-start justify-center lg:justify-start lg:h-full lg:min-h-0">
                            <div className="relative w-full max-h-[min(68vh,560px)] sm:max-h-[min(72vh,600px)] aspect-[4/5] max-w-full lg:max-h-[min(76vh,640px)] rounded-[2px] overflow-hidden bg-white border-[1.5px] border-neutral-black group mx-auto lg:mx-0 lg:w-full">
                                <ImageWithSkeleton
                                    key={mainImageSrc}
                                    src={mainImageSrc}
                                    alt={product.name}
                                    className={`w-full h-full ${STOREFRONT_TEE_MOCKUP_IMAGE_CLASS} group-hover:scale-[1.02] transition-transform duration-700`}
                                    loading="eager"
                                    fetchPriority="high"
                                    wrapperClassName="w-full h-full"
                                />

                                {product.isDiscounted && (
                                    <div className="absolute top-3 left-3 sm:top-4 sm:left-4 bg-danger text-white font-display text-[10px] sm:text-[11px] font-black px-2.5 py-0.5 sm:px-3 sm:py-1 uppercase tracking-[1px] transform -rotate-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                        {product.discountPercent}% OFF
                                    </div>
                                )}
                                {!product.isDiscounted && discount && (
                                    <div className="absolute top-3 left-3 sm:top-4 sm:left-4 bg-danger text-white font-display text-[10px] sm:text-[11px] font-black px-2.5 py-0.5 sm:px-3 sm:py-1 uppercase tracking-[1px] transform -rotate-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                        {discount}% OFF
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: Product Info — tighter vertical rhythm for first-screen fit */}
                    <div className="space-y-5 sm:space-y-5 lg:space-y-4 pb-2">
                        <div>
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                                <StockStatusPill stockStatus={currentStockStatus} />
                                <span className="font-display text-[10px] font-bold tracking-[1.5px] uppercase text-neutral-g3 bg-neutral-g1 px-2 py-0.5 rounded-[2px] border border-neutral-g2">
                                    <span aria-hidden>{BEE_BADGE}</span> {product.categories?.[0] || "General"}
                                </span>
                            </div>

                            <h1 className="font-display text-[clamp(24px,3.2vw,42px)] font-black text-neutral-black leading-[1.08] tracking-[-0.5px] mb-3">
                                {product.name}
                            </h1>

                            <div className="flex items-center gap-3 p-3 bg-neutral-g1 border-[1.5px] border-neutral-black rounded-[2px]">
                                <div className="w-10 h-10 sm:w-11 sm:h-11 bg-primary border border-neutral-black rounded-full flex items-center justify-center font-display text-[16px] font-black text-neutral-black shrink-0">
                                    {artistPublicDisplayName(product.artist).charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="font-display text-[9px] font-extrabold tracking-[1px] uppercase text-neutral-g3 leading-none mb-0.5">
                                        Artist
                                    </div>
                                    <Link
                                        to={artistPublicPath({
                                            id: product.artist.id,
                                            artistSlug: product.artist.artistSlug,
                                        })}
                                        className="font-display text-[16px] sm:text-[17px] font-black text-neutral-black tracking-tight hover:text-primary transition-colors no-underline block truncate"
                                    >
                                        {artistPublicDisplayName(product.artist)}
                                    </Link>
                                    <div className="font-display text-[12px] font-bold text-neutral-g3 tracking-tight flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                                        <span className="lowercase">
                                            @
                                            {artistPublicDisplayName(product.artist).replace(/\s+/g, "")}
                                        </span>
                                        <ArtistRatingInline
                                            rating={product.artist.artistRating}
                                            reviewCount={product.artist.reviewCount}
                                            compact
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-baseline gap-3">
                            <span className="font-display text-[clamp(28px,5vw,38px)] font-black text-neutral-black leading-none tracking-[-1px]">
                                ₹{product.price.toLocaleString('en-IN')}
                            </span>
                            {product.isDiscounted ? (
                                <span className="font-display text-[18px] font-bold text-neutral-g3 line-through">
                                    ₹{product.originalPrice?.toLocaleString('en-IN')}
                                </span>
                            ) : product.compareAtPrice && (
                                <span className="font-display text-[18px] font-bold text-neutral-g3 line-through">
                                    ₹{product.compareAtPrice.toLocaleString('en-IN')}
                                </span>
                            )}
                        </div>
                        <GstInclusiveNote className="mt-0 max-w-xl font-display text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.08em] text-neutral-g4" />

                        {product.description && (
                            <p className="text-[13px] sm:text-[14px] text-neutral-g4 leading-snug font-body font-medium max-w-xl line-clamp-4 lg:line-clamp-3">
                                {product.description}
                            </p>
                        )}

                        <div className="space-y-4 sm:space-y-5">
                            {/* Color Selector */}
                            <div className="space-y-2.5">
                                <h3 className="font-display text-[11px] font-black tracking-[1.5px] uppercase text-neutral-black">
                                    Select Fabric Color
                                </h3>
                                <div className="flex flex-wrap ml-1 gap-2.5 sm:gap-3">
                                    {(product.availableColors?.length ? product.availableColors : [product.tshirtColor]).map((colorHex) => (
                                        <button
                                            key={colorHex}
                                            onClick={() => setSelectedColor(colorHex)}
                                            className={`w-11 h-11 rounded-full border-[1.5px] transition-all hover:scale-110 shadow-sm relative flex items-center justify-center ${selectedColor === colorHex ? "border-neutral-black ring-4 ring-primary/20 scale-110" : "border-neutral-g2 hover:border-neutral-black"}`}
                                            style={{ backgroundColor: colorHex }}
                                            title={colorHex}
                                        >
                                            {selectedColor === colorHex && <Check className={`w-5 h-5 ${colorHex.toLowerCase() === '#ffffff' ? 'text-black' : 'text-white shadow-sm'}`} />}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Size selection */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between max-w-sm">
                                    <h3 className="font-display text-[11px] font-black tracking-[1.5px] uppercase text-neutral-black">Select Size</h3>
                                    <button
                                        type="button"
                                        onClick={() => setSizeGuideOpen(true)}
                                        className="text-[10px] font-bold text-neutral-g4 underline uppercase hover:text-neutral-black transition-colors"
                                    >
                                        Size Guide
                                    </button>
                                </div>
                                <div className="flex flex-wrap ml-1 gap-2">
                                    {sizes.map((size) => {
                                        const soldOut = isGloballyUnavailable(selectedColor, size) || (hasVariantInventory && isVariantUnavailable(selectedColor, size));
                                        return (
                                            <button
                                                key={size}
                                                type="button"
                                                disabled={soldOut}
                                                onClick={() => setSelectedSize(size)}
                                                className={`min-w-[46px] h-[44px] px-1.5 sm:min-w-[52px] sm:h-[48px] rounded-[2px] border-[1.5px] font-display text-[11px] sm:text-[12px] font-black transition-all ${selectedSize === size
                                                    ? "border-neutral-black bg-primary text-neutral-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] -translate-x-0.5 -translate-y-0.5"
                                                    : soldOut
                                                        ? "border-neutral-g1 bg-neutral-g1 text-neutral-g2 opacity-50 cursor-not-allowed line-through shadow-none"
                                                        : "border-neutral-black bg-white text-neutral-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
                                                    }`}
                                            >
                                                {size}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Quantity */}
                            <div className="space-y-2">
                                <h3 className="font-display text-[11px] font-black tracking-[1.5px] uppercase text-neutral-black">Quantity</h3>
                                <div className="flex items-center border-[1.5px] border-neutral-black rounded-[4px] w-fit overflow-hidden bg-white">
                                    <button
                                        type="button"
                                        disabled={isOutOfStock}
                                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                        className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center hover:bg-neutral-g1 border-r border-neutral-black transition-colors disabled:opacity-30"
                                    >
                                        <Minus className="w-4 h-4" />
                                    </button>
                                    <span className="w-12 sm:w-14 text-center font-display text-[15px] font-black">{isOutOfStock ? 0 : quantity}</span>
                                    <button
                                        type="button"
                                        disabled={isOutOfStock || quantity >= 10}
                                        onClick={() => setQuantity(Math.min(10, quantity + 1))}
                                        className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center hover:bg-neutral-g1 border-l border-neutral-black transition-colors disabled:opacity-30"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="pt-3 flex flex-col sm:flex-row flex-wrap gap-3">
                            <button
                                type="button"
                                disabled={isOutOfStock}
                                onClick={() => {
                                    addCurrentToCart();
                                    setAddedToCart(true);
                                    setTimeout(() => setAddedToCart(false), 2000);
                                }}
                                className={`flex-1 min-w-[min(100%,200px)] min-h-[52px] h-[52px] sm:min-h-[56px] sm:h-[56px] rounded-[4px] border-[1.5px] border-neutral-black font-display text-[13px] sm:text-[14px] font-black uppercase tracking-[0.08em] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center justify-center gap-2 px-2 ${addedToCart
                                    ? "bg-success text-white border-success"
                                    : isOutOfStock ? "bg-neutral-g1 text-neutral-g4 border-neutral-g2 cursor-not-allowed" : "bg-primary hover:bg-white text-neutral-black"
                                    }`}
                            >
                                {addedToCart ? (
                                    <>✓ Added to Hive Bag</>
                                ) : (
                                    <>
                                        <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                                        {isOutOfStock ? "Out of Stock" : `Add to Bag — ₹${(product.price * quantity).toLocaleString('en-IN')}`}
                                    </>
                                )}
                            </button>
                            <button
                                type="button"
                                disabled={isOutOfStock}
                                onClick={() => {
                                    if (product) {
                                        const color = canonicalHex(selectedColor || product.tshirtColor);
                                        const alreadyInCart = items.some(
                                            (i) => i.productId === product.id && i.size === selectedSize && i.color === color
                                        );
                                        if (!alreadyInCart) {
                                            addCurrentToCart();
                                        }
                                    }
                                    navigate("/order/checkout");
                                }}
                                className={`flex-1 min-w-[min(100%,200px)] min-h-[52px] h-[52px] sm:min-h-[56px] sm:h-[56px] rounded-[4px] border-[1.5px] border-neutral-black font-display text-[13px] sm:text-[14px] font-black uppercase tracking-[0.08em] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center justify-center gap-2 px-2 ${isOutOfStock
                                    ? "bg-neutral-g1 text-neutral-g4 border-neutral-g2 cursor-not-allowed"
                                    : "bg-neutral-black text-white hover:bg-primary hover:text-neutral-black"
                                    }`}
                            >
                                Buy now — ₹{(product.price * quantity).toLocaleString("en-IN")}
                            </button>
                        </div>

                        {/* Trust Badges */}
                        <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-4 border-t border-neutral-g2">
                            <div className="flex items-center gap-2 text-neutral-g4 font-display text-[9px] sm:text-[10px] font-extrabold uppercase tracking-[0.04em]">
                                <div className="w-8 h-8 sm:w-9 sm:h-9 bg-neutral-g1 border border-neutral-g2 rounded-full flex items-center justify-center shrink-0">
                                    <Truck className="w-3.5 h-3.5 text-primary" />
                                </div>
                                <span className="leading-tight">5-7 Days<br />Delivery</span>
                            </div>
                            <div className="flex items-center gap-2 text-neutral-g4 font-display text-[9px] sm:text-[10px] font-extrabold uppercase tracking-[0.04em]">
                                <div className="w-8 h-8 sm:w-9 sm:h-9 bg-neutral-g1 border border-neutral-g2 rounded-full flex items-center justify-center shrink-0">
                                    <Shield className="w-3.5 h-3.5 text-primary" />
                                </div>
                                <span className="leading-tight">Premium 180<br />GSM Cotton</span>
                            </div>
                            <div className="flex items-center gap-2 text-neutral-g4 font-display text-[9px] sm:text-[10px] font-extrabold uppercase tracking-[0.04em]">
                                <div className="w-8 h-8 sm:w-9 sm:h-9 bg-neutral-g1 border border-neutral-g2 rounded-full flex items-center justify-center shrink-0">
                                    <RotateCcw className="w-3.5 h-3.5 text-primary" />
                                </div>
                                <span className="leading-tight">5-Day Issue<br />Claims</span>
                            </div>
                        </div>
                        <ReturnPolicyNote className="mt-3" />
                    </div>
                </div>

                {/* Related — same category / same artist first, shop-style cards */}
                {(relatedLoading || relatedProducts.length > 0) && (
                    <section className="mt-14 sm:mt-20 pt-10 sm:pt-12 border-t-[1.5px] border-neutral-g2">
                        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
                            <div>
                                <p className="font-display text-[10px] font-extrabold tracking-[2px] uppercase text-neutral-g3 mb-2">
                                    <span aria-hidden>{BEE_BADGE}</span> More from the hive
                                </p>
                                <h2 className="font-display text-[clamp(22px,3vw,32px)] font-black text-neutral-black uppercase tracking-tight">
                                    You may also like
                                </h2>
                            </div>
                            <Link
                                to="/products"
                                className="font-display text-[11px] font-black uppercase tracking-wide text-neutral-black underline underline-offset-2 decoration-2 hover:text-primary transition-colors shrink-0"
                            >
                                View all products
                            </Link>
                        </div>
                        {relatedLoading ? (
                            <div className="flex justify-center py-16">
                                <Loader size="w-12 h-12" />
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                                {relatedProducts.map((rp) => (
                                    <div
                                        key={rp.id}
                                        className="bg-white border-[1.5px] border-neutral-g2 rounded-[4px] overflow-hidden group/card transition-all hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)] hover:border-neutral-black"
                                    >
                                        <Link to={`/products/${rp.id}`} className="block aspect-square overflow-hidden bg-neutral-g1 relative">
                                            <ImageWithSkeleton
                                                src={
                                                    rp.primaryView === "back"
                                                        ? rp.backMockupImageUrl || rp.mockupImageUrl
                                                        : rp.mockupImageUrl
                                                }
                                                alt={rp.name}
                                                className={`w-full h-full ${STOREFRONT_TEE_MOCKUP_IMAGE_CLASS} group-hover/card:scale-105 transition-transform`}
                                                wrapperClassName="w-full h-full"
                                            />
                                            {rp.isDiscounted && (rp.discountPercent ?? 0) > 0 && (
                                                <div className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-danger text-white font-display text-[9px] sm:text-[10px] font-black px-1.5 py-0.5 sm:px-2 sm:py-1 uppercase tracking-[1px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-10">
                                                    -{rp.discountPercent}%
                                                </div>
                                            )}
                                        </Link>
                                        <div className="p-3 sm:p-4">
                                            <Link
                                                to={artistPublicPath(rp.artist)}
                                                className="font-display text-[9px] sm:text-[10px] font-bold tracking-[1.5px] uppercase text-neutral-g4 mb-1 block hover:text-neutral-black transition-colors no-underline truncate"
                                            >
                                                {artistPublicDisplayName(rp.artist)}
                                            </Link>
                                            <div className="mb-1.5">
                                                <ArtistRatingInline
                                                    rating={rp.artist.artistRating ?? 0}
                                                    reviewCount={rp.artist.reviewCount ?? 0}
                                                    compact
                                                />
                                            </div>
                                            <Link to={`/products/${rp.id}`} className="no-underline block">
                                                <h3 className="font-display text-[13px] sm:text-[15px] font-bold text-neutral-black mb-2 truncate hover:text-primary transition-colors">
                                                    {rp.name}
                                                </h3>
                                            </Link>
                                            <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
                                                <div className="flex items-baseline gap-2 min-w-0">
                                                    <span className="font-display text-[14px] sm:text-[16px] font-black text-neutral-black shrink-0">
                                                        ₹{rp.price.toLocaleString("en-IN")}
                                                    </span>
                                                    {rp.isDiscounted && (
                                                        <span className="font-display text-[10px] sm:text-[11px] font-bold text-neutral-g3 line-through truncate">
                                                            ₹{rp.originalPrice?.toLocaleString("en-IN")}
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="font-display text-[8px] sm:text-[9px] font-bold tracking-[1px] uppercase text-neutral-g3 bg-neutral-g1 px-1.5 py-0.5 shrink-0 max-w-[100px] truncate">
                                                    {(rp.categories?.[0] || "Design").toString()}
                                                </span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleRelatedQuickAdd(rp)}
                                                className={`w-full py-2 sm:py-2.5 font-display text-[10px] sm:text-[11px] font-extrabold tracking-[1px] uppercase rounded-[3px] transition-all border-[1.5px] ${
                                                    relatedAddedId === rp.id
                                                        ? "bg-success text-white border-success"
                                                        : "bg-neutral-black text-white border-neutral-black hover:bg-primary hover:text-neutral-black hover:border-primary"
                                                }`}
                                            >
                                                {relatedAddedId === rp.id ? "Added!" : "+ Add to cart"}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                )}
            </div>

            <SizeGuideModal open={sizeGuideOpen} onClose={() => setSizeGuideOpen(false)} />
        </div>
    );
}
