import { useState, useEffect } from "react";
import {
    ArrowLeft,
    Heart,
    ShoppingCart,
    Minus,
    Plus,
    Truck,
    Shield,
    RotateCcw,
    Share2,
    ChevronRight,
    Check,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import api from "../../api/axios";
import { useCart } from "../../context/CartContext";
import Loader from "../../components/shared/Loader";
import StockStatusPill from "../../components/shared/StockStatusPill";

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
    mockupImageUrl: string;
    backMockupImageUrl?: string;
    design: {
        id: string;
        title: string;
        imageUrl: string;
    };
    artist: {
        id: string;
        name: string;
        email: string;
    };
}

export default function ProductDetails() {
    const { productId } = useParams<{ productId: string }>();
    const [product, setProduct] = useState<Product | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedSize, setSelectedSize] = useState("M");
    const [selectedColor, setSelectedColor] = useState<string>("");
    const [currentView, setCurrentView] = useState<"front" | "back">("front");
    const [quantity, setQuantity] = useState(1);
    const [addedToCart, setAddedToCart] = useState(false);
    const { addItem } = useCart();

    const sizes = ["XS", "S", "M", "L", "XL", "XXL"];

    const [matrix, setMatrix] = useState<any>(null);

    useEffect(() => {
        const fetchGlobalInventory = async () => {
            try {
                const res = await api.get("/api/config/global_inventory");
                if (res.data.data?.config) {
                setMatrix(res.data.data.config);
                }
            } catch (err) {
                console.error("Failed to fetch global inventory:", err);
            }
        };
        fetchGlobalInventory();
    }, []);

    const isOutOfStock = (colorHex: string, size: string) => {
        if (!matrix) return false;
        // Check global stock first
        const globalStatus = matrix[colorHex]?.[size];
        if (globalStatus === "OUT_OF_STOCK") return true;
        return false;
    };

    const getGeneralStockStatus = () => {
        if (!selectedColor || !selectedSize) return product?.stock || 0;
        if (isOutOfStock(selectedColor, selectedSize)) return 0;
        return product?.stock || 0;
    };

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
    const currentStock = getGeneralStockStatus();

    return (
        <div className="min-h-screen bg-neutral-white">
            {/* Header / Sub Nav */}
            <nav className="bg-white border-b-[1.5px] border-neutral-black sticky top-[64px] z-40 px-8">
                <div className="flex justify-between items-center h-16">
                    <Link to="/products" className="flex items-center gap-2 text-neutral-g4 hover:text-neutral-black transition-colors no-underline">
                        <ArrowLeft className="w-5 h-5" />
                        <span className="font-display text-[11px] font-extrabold uppercase tracking-[1px]">Back to Collections</span>
                    </Link>
                    <div className="flex items-center gap-4">
                        <button className="p-2 text-neutral-g3 hover:text-danger transition-colors">
                            <Heart className="w-5 h-5" />
                        </button>
                        <button className="p-2 text-neutral-g3 hover:text-neutral-black transition-colors">
                            <Share2 className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </nav>

            <div className="px-8 py-10 w-full">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-[10px] font-display font-bold tracking-[1.5px] uppercase text-neutral-g3 mb-10 overflow-x-auto whitespace-nowrap scrollbar-hide">
                    <Link to="/" className="hover:text-neutral-black no-underline">Home</Link>
                    <ChevronRight className="w-3 h-3" />
                    <Link to="/products" className="hover:text-neutral-black no-underline">Shop</Link>
                    <ChevronRight className="w-3 h-3" />
                    <span className="text-primary font-black">{product.name}</span>
                </div>

                <div className="grid lg:grid-cols-[1.1fr_1fr] gap-16 items-start">
                    {/* LEFT: Images */}
                    <div className="space-y-6">
                        <div className="aspect-[4/5] rounded-[2px] overflow-hidden bg-neutral-g1 border-[1.5px] border-neutral-black relative group">
                            <img
                                src={currentView === "front" ? product.mockupImageUrl : (product.backMockupImageUrl || product.mockupImageUrl)}
                                alt={product.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
                            />
                            {product.isDiscounted && (
                                <div className="absolute top-6 left-6 bg-danger text-white font-display text-[11px] font-black px-3 py-1 uppercase tracking-[1px] transform -rotate-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                    {product.discountPercent}% OFF
                                </div>
                            )}
                            {!product.isDiscounted && discount && (
                                <div className="absolute top-6 left-6 bg-danger text-white font-display text-[11px] font-black px-3 py-1 uppercase tracking-[1px] transform -rotate-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                    {discount}% OFF
                                </div>
                            )}
                        </div>
                        {product.backMockupImageUrl && (
                            <div className="flex gap-4">
                                <button
                                    onClick={() => setCurrentView("front")}
                                    className={`w-28 h-28 rounded-[2px] overflow-hidden border-[1.5px] p-1 transition-all ${currentView === "front" ? "border-neutral-black bg-primary/20" : "border-neutral-g2 bg-white hover:border-neutral-black"}`}
                                >
                                    <img src={product.mockupImageUrl} alt="Front View" className="w-full h-full object-cover" />
                                </button>
                                <button
                                    onClick={() => setCurrentView("back")}
                                    className={`w-28 h-28 rounded-[2px] overflow-hidden border-[1.5px] p-1 transition-all ${currentView === "back" ? "border-neutral-black bg-primary/20" : "border-neutral-g2 bg-white hover:border-neutral-black"}`}
                                >
                                    <img src={product.backMockupImageUrl} alt="Back View" className="w-full h-full object-cover" />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* RIGHT: Product Info */}
                    <div className="space-y-10 lg:sticky lg:top-[160px]">
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <StockStatusPill stock={currentStock} showCount />
                                <span className="font-display text-[10px] font-bold tracking-[1.5px] uppercase text-neutral-g3 bg-neutral-g1 px-2.5 py-1 rounded-[2px] border border-neutral-g2">
                                    {product.categories?.[0] || "General"}
                                </span>
                            </div>

                            <h1 className="font-display text-[clamp(32px,4vw,52px)] font-black text-neutral-black leading-[1.05] tracking-[-0.5px] mb-4">
                                {product.name}
                            </h1>

                            <div className="flex items-center gap-4 p-4 bg-neutral-g1 border-[1.5px] border-neutral-black rounded-[2px]">
                                <div className="w-12 h-12 bg-primary border border-neutral-black rounded-full flex items-center justify-center font-display text-[18px] font-black text-neutral-black">
                                    {product.artist.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <div className="font-display text-[10px] font-extrabold tracking-[1px] uppercase text-neutral-g3 leading-none mb-1">Created By Artist</div>
                                    <div className="font-display text-[17px] font-black text-neutral-black lowercase tracking-tight">@{product.artist.name.replace(/\s+/g, '')}</div>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-baseline gap-5">
                            <span className="font-display text-[44px] font-black text-neutral-black leading-none tracking-[-1px]">
                                ₹{product.price.toLocaleString('en-IN')}
                            </span>
                            {product.isDiscounted ? (
                                <span className="font-display text-[22px] font-bold text-neutral-g3 line-through">
                                    ₹{product.originalPrice?.toLocaleString('en-IN')}
                                </span>
                            ) : product.compareAtPrice && (
                                <span className="font-display text-[22px] font-bold text-neutral-g3 line-through">
                                    ₹{product.compareAtPrice.toLocaleString('en-IN')}
                                </span>
                            )}
                        </div>

                        {product.description && (
                            <p className="text-[15px] text-neutral-g4 leading-relaxed font-body font-medium max-w-xl">
                                {product.description}
                            </p>
                        )}

                        <div className="space-y-8">
                            {/* Color Selector */}
                            <div className="space-y-4">
                                <h3 className="font-display text-[12px] font-black tracking-[1.5px] uppercase text-neutral-black">
                                    Select Fabric Color
                                </h3>
                                <div className="flex flex-wrap gap-4">
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
                            <div className="space-y-4">
                                <div className="flex items-center justify-between max-w-sm">
                                    <h3 className="font-display text-[12px] font-black tracking-[1.5px] uppercase text-neutral-black">Select Size</h3>
                                    <button className="text-[11px] font-bold text-neutral-g4 underline uppercase hover:text-neutral-black transition-colors">Size Guide</button>
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    {sizes.map((size) => {
                                        const soldOut = isOutOfStock(selectedColor, size);
                                        return (
                                            <button
                                                key={size}
                                                disabled={soldOut}
                                                onClick={() => setSelectedSize(size)}
                                                className={`w-[68px] h-[52px] rounded-[2px] border-[1.5px] font-display text-[14px] font-black transition-all ${selectedSize === size
                                                    ? "border-neutral-black bg-primary text-neutral-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] -translate-x-1 -translate-y-1"
                                                    : soldOut ? "border-neutral-g1 bg-neutral-g1 text-neutral-g2 opacity-50 cursor-not-allowed line-through" : "border-neutral-g2 text-neutral-g3 hover:border-neutral-black hover:text-neutral-black"
                                                    }`}
                                            >
                                                {size}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Quantity */}
                            <div className="space-y-4">
                                <h3 className="font-display text-[12px] font-black tracking-[1.5px] uppercase text-neutral-black">Quantity</h3>
                                <div className="flex items-center border-[1.5px] border-neutral-black rounded-[4px] w-fit overflow-hidden bg-white">
                                    <button
                                        disabled={currentStock === 0}
                                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                        className="w-12 h-12 flex items-center justify-center hover:bg-neutral-g1 border-r border-neutral-black transition-colors disabled:opacity-30"
                                    >
                                        <Minus className="w-4 h-4" />
                                    </button>
                                    <span className="w-14 text-center font-display text-[16px] font-black">{currentStock === 0 ? 0 : quantity}</span>
                                    <button
                                        disabled={currentStock === 0 || quantity >= currentStock}
                                        onClick={() => setQuantity(Math.min(currentStock, quantity + 1))}
                                        className="w-12 h-12 flex items-center justify-center hover:bg-neutral-g1 border-l border-neutral-black transition-colors disabled:opacity-30"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="pt-6 flex gap-4">
                            <button
                                disabled={currentStock === 0}
                                onClick={() => {
                                    addItem({
                                        productId: product.id,
                                        name: product.name,
                                        price: product.price,
                                        quantity,
                                        size: selectedSize,
                                        color: selectedColor || product.tshirtColor,
                                        image: product.mockupImageUrl,
                                        artistName: product.artist.name,
                                    });
                                    setAddedToCart(true);
                                    setTimeout(() => setAddedToCart(false), 2000);
                                }}
                                className={`flex-1 h-[64px] rounded-[4px] border-[1.5px] border-neutral-black font-display text-[16px] font-black uppercase tracking-[1px] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all flex items-center justify-center gap-3 ${addedToCart
                                    ? "bg-success text-white border-success"
                                    : currentStock === 0 ? "bg-neutral-g1 text-neutral-g4 border-neutral-g2 cursor-not-allowed" : "bg-primary hover:bg-white text-neutral-black"
                                    }`}
                            >
                                {addedToCart ? (
                                    <>✓ Added to Hive Bag</>
                                ) : (
                                    <>
                                        <ShoppingCart className="w-5 h-5" />
                                        {currentStock === 0 ? "Out of Stock" : `Add to Bag — ₹${(product.price * quantity).toLocaleString('en-IN')}`}
                                    </>
                                )}
                            </button>
                            <button className="w-[64px] h-[64px] flex items-center justify-center border-[1.5px] border-neutral-black rounded-[4px] hover:bg-danger-light hover:text-danger hover:border-danger transition-all shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1">
                                <Heart className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Trust Badges */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-10 border-t border-neutral-g2">
                            <div className="flex items-center gap-4 text-neutral-g4 font-display text-[11px] font-extrabold uppercase tracking-[0.5px]">
                                <div className="w-10 h-10 bg-neutral-g1 border border-neutral-g2 rounded-full flex items-center justify-center shrink-0">
                                    <Truck className="w-4 h-4 text-primary" />
                                </div>
                                <span className="leading-tight">Free 48hr<br />Shipping</span>
                            </div>
                            <div className="flex items-center gap-4 text-neutral-g4 font-display text-[11px] font-extrabold uppercase tracking-[0.5px]">
                                <div className="w-10 h-10 bg-neutral-g1 border border-neutral-g2 rounded-full flex items-center justify-center shrink-0">
                                    <Shield className="w-4 h-4 text-primary" />
                                </div>
                                <span className="leading-tight">Premium 220<br />GSM Cotton</span>
                            </div>
                            <div className="flex items-center gap-4 text-neutral-g4 font-display text-[11px] font-extrabold uppercase tracking-[0.5px]">
                                <div className="w-10 h-10 bg-neutral-g1 border border-neutral-g2 rounded-full flex items-center justify-center shrink-0">
                                    <RotateCcw className="w-4 h-4 text-primary" />
                                </div>
                                <span className="leading-tight">Easy 7-Day<br />Returns</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
