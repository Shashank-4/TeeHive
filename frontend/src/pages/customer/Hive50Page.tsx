import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Loader from "../../components/shared/Loader";
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
    compareAtPrice: number | null;
    mockupImageUrl: string;
    backMockupImageUrl?: string;
    primaryView?: "front" | "back";
    tshirtColor: string;
    primaryColor?: string;
    availableColors?: string[];
    colorMockups?: Record<string, { front: string; back?: string }> | null;
    category: string;
    artist: {
        id: string;
        name: string;
        artistSlug?: string | null;
        artistRating?: number;
        reviewCount?: number;
    };
}

export default function Hive50Page() {
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { addItem } = useCart();
    const [addedId, setAddedId] = useState<string | null>(null);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                setIsLoading(true);
                const productsRes = await api.get("/api/products?limit=50&sort=popular");
                setProducts(productsRes.data.data.products || []);
            } catch (err) {
                console.error("Failed to fetch Hive50 data:", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchInitialData();
    }, []);

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

    const mockupSrc = (product: Product) =>
        product.primaryView === "back"
            ? product.backMockupImageUrl || product.mockupImageUrl
            : product.mockupImageUrl;

    const top5 = products.slice(0, 5);
    const rest = products.slice(5);

    return (
        <div className="bg-neutral-white min-h-screen">
            <div className="relative overflow-hidden bg-neutral-black border-b-[1.5px] border-neutral-black py-10 md:py-12 px-6 sm:px-8">
                <BannerTeehiveMarquee />
                <div className="relative z-10 max-w-[1600px] mx-auto text-left">
                    <div className="font-display text-[11px] font-extrabold tracking-[3px] uppercase text-primary mb-3 flex items-center gap-2">
                        <span aria-hidden>{BEE_BADGE}</span>
                        TeeHive Exclusive
                    </div>
                    <h1 className="font-display text-[clamp(36px,6vw,80px)] font-black text-white leading-none tracking-[1px] mb-4">
                        HIVE<span className="text-primary italic">50</span>
                    </h1>
                    <p className="text-[clamp(14px,1.3vw,18px)] text-white/65 leading-relaxed max-w-xl">
                        Fifty standout designs on TeeHive right now — surfaced by popularity. Refresh the list anytime you shop.
                    </p>
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-24 bg-neutral-g1">
                    <Loader size="w-16 h-16" />
                </div>
            ) : (
                <>
                    {/* ── Top 5 — large #1–#5, primary / yellow pops on hover ── */}
                    <section className="bg-neutral-black py-12 px-6 sm:px-8 border-b-[1.5px] border-neutral-black overflow-hidden">
                        <div className="max-w-[1600px] mx-auto">
                            <div className="font-display text-[11px] font-extrabold tracking-[3px] uppercase text-white/20 mb-8 flex items-center gap-3">
                                <span aria-hidden className="text-primary/80">
                                    {BEE_BADGE}
                                </span>
                                Top 5 This Week
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                                {top5.map((product, i) => (
                                    <div
                                        key={product.id}
                                        className="group bg-white/[0.05] border-[1.5px] border-white/10 p-6 rounded-[4px] relative transition-all hover:bg-white/[0.08] hover:border-primary"
                                    >
                                        <div className="absolute top-4 left-4 font-display text-[48px] font-black italic leading-none opacity-20 text-primary group-hover:opacity-100 transition-opacity">
                                            #{i + 1}
                                        </div>
                                        <div className="absolute top-6 right-6 font-display text-[9px] font-black tracking-[1.5px] uppercase text-primary bg-primary/10 px-2 py-1 rounded-[2px] opacity-0 group-hover:opacity-100 transition-opacity border border-primary/30">
                                            #{i + 1} All Time
                                        </div>

                                        <Link to={`/products/${product.id}`} className="block mb-6 mt-8">
                                            <div className="aspect-square bg-white/[0.03] rounded-[4px] overflow-hidden flex items-center justify-center">
                                                <img
                                                    src={mockupSrc(product)}
                                                    alt={product.name}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                                />
                                            </div>
                                        </Link>

                                        <div className="text-center">
                                            <Link
                                                to={artistPublicPath(product.artist)}
                                                className="font-display text-[11px] font-bold tracking-[1.5px] uppercase text-primary mb-1 inline-block hover:text-white transition-colors no-underline"
                                            >
                                                {product.artist.name}
                                            </Link>
                                            <div className="flex justify-center mb-1 [&_span]:text-white/85 [&_span]:text-[10px]">
                                                <ArtistRatingInline
                                                    rating={product.artist.artistRating ?? 0}
                                                    reviewCount={product.artist.reviewCount ?? 0}
                                                    compact
                                                />
                                            </div>
                                            <h3 className="font-display text-[18px] font-bold text-white tracking-[0.3px] mb-2 truncate">
                                                {product.name}
                                            </h3>
                                            <div className="font-display text-[20px] font-black text-white mb-6">
                                                ₹{product.price.toLocaleString("en-IN")}
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => handleQuickAdd(product)}
                                                className={`w-full py-3 font-display text-[13px] font-extrabold tracking-[1.5px] uppercase rounded-[3px] transition-all border-[1.5px] ${
                                                    addedId === product.id
                                                        ? "bg-success text-white border-success"
                                                        : "bg-white text-neutral-black border-white hover:bg-primary hover:border-primary"
                                                }`}
                                            >
                                                {addedId === product.id ? "Added!" : "+ Add to Cart"}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* ── Ranks 6–50 ── */}
                    <section className="bg-neutral-g1 py-12 px-6 sm:px-8 border-b-[1.5px] border-neutral-black/10">
                        <div className="max-w-[1600px] mx-auto">
                            <div className="font-display text-[11px] font-extrabold tracking-[3px] uppercase text-neutral-g4 mb-8 flex items-center gap-3">
                                <ArrowRight className="w-3 h-3" /> Ranks 6 — 50
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                                {rest.map((product, i) => (
                                    <div
                                        key={product.id}
                                        className="bg-white border-[1.5px] border-neutral-g2 rounded-[4px] overflow-hidden group transition-all hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)] hover:border-neutral-black"
                                    >
                                        <div className="p-3 bg-neutral-g2 flex items-center justify-between border-b border-neutral-g2">
                                            <div className="font-display text-[18px] font-black italic text-neutral-black opacity-40 group-hover:opacity-100 group-hover:text-primary transition-all">
                                                #{i + 6}
                                            </div>
                                            <span
                                                className={`font-display text-[9px] font-bold tracking-[1px] uppercase px-2 py-0.5 rounded-[2px] ${
                                                    i < 10 ? "bg-danger text-white" : "bg-info text-white"
                                                }`}
                                            >
                                                {i < 10 ? "🔥 Hot" : "✦ New"}
                                            </span>
                                        </div>

                                        <Link to={`/products/${product.id}`} className="block aspect-square overflow-hidden bg-neutral-g1">
                                            <img
                                                src={mockupSrc(product)}
                                                alt={product.name}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                            />
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
                                            <h4 className="font-display text-[15px] font-bold text-neutral-black mb-3 truncate">
                                                {product.name}
                                            </h4>
                                            <div className="flex items-center justify-between mb-4">
                                                <span className="font-display text-[16px] font-black text-neutral-black">
                                                    ₹{product.price.toLocaleString("en-IN")}
                                                </span>
                                                <span className="font-display text-[9px] font-bold tracking-[1px] uppercase text-neutral-g3 bg-neutral-g1 px-1.5 py-0.5">
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
                        </div>
                    </section>
                </>
            )}
        </div>
    );
}
