import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Palette, ExternalLink, ShoppingBag } from "lucide-react";
import api from "../../api/axios";
import ImageWithSkeleton from "../../components/shared/ImageWithSkeleton";
import Loader from "../../components/shared/Loader";
import ArtistRatingInline from "../../components/shared/ArtistRatingInline";
import { useCart } from "../../context/CartContext";
import {
    frontMockupUrl,
    backMockupUrl,
    STOREFRONT_TEE_MOCKUP_IMAGE_CLASS,
} from "../../utils/productMockup";

interface Product {
    id: string;
    name: string;
    price: number;
    compareAtPrice: number | null;
    isDiscounted?: boolean;
    discountPercent?: number;
    originalPrice?: number;
    mockupImageUrl: string;
    backMockupImageUrl?: string;
    primaryView?: "front" | "back";
    primaryColor?: string | null;
    tshirtColor: string;
    availableColors: string[];
    categories: string[];
    colorMockups?: Record<string, { front: string; back?: string }> | null;
}

interface Artist {
    id: string;
    name: string;
    displayName: string | null;
    artistSlug: string | null;
    displayPhotoUrl: string | null;
    coverPhotoUrl: string | null;
    bio: string | null;
    portfolioUrl: string | null;
    instagramUrl: string | null;
    twitterUrl: string | null;
    behanceUrl: string | null;
    dribbbleUrl: string | null;
    artistRating: number;
    reviewCount: number;
    products: Product[];
}

export default function ArtistStorefront() {
    const { artistHandle } = useParams<{ artistHandle: string }>();
    const [artist, setArtist] = useState<Artist | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { addItem } = useCart();
    const [addedId, setAddedId] = useState<string | null>(null);

    useEffect(() => {
        const fetchArtist = async () => {
            try {
                setIsLoading(true);
                const res = await api.get(
                    `/api/artists/${encodeURIComponent(artistHandle || "")}`
                );
                setArtist(res.data.data.artist);
            } catch (err: any) {
                setError(err.response?.status === 404 ? "Artist not found" : "Failed to load artist profile");
            } finally {
                setIsLoading(false);
            }
        };

        if (artistHandle) fetchArtist();
    }, [artistHandle]);

    const handleQuickAdd = (product: Product) => {
        const colors =
            product.availableColors?.length ? product.availableColors : [product.tshirtColor];
        const pickColor = product.primaryColor || product.tshirtColor;
        const baseMock = {
            mockupImageUrl: product.mockupImageUrl,
            backMockupImageUrl: product.backMockupImageUrl,
            colorMockups: product.colorMockups,
            primaryColor: product.primaryColor || undefined,
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
            primaryColor: product.primaryColor || undefined,
            primaryView: product.primaryView,
            mockupView: useBack ? "back" : "front",
            colorMockups: product.colorMockups ?? undefined,
            artistName: artist?.displayName || artist?.name || "Artist",
            availableColors: colors,
        });
        setAddedId(product.id);
        setTimeout(() => setAddedId(null), 2000);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-neutral-white flex items-center justify-center">
                <Loader className="w-16 h-16" />
            </div>
        );
    }

    if (error || !artist) {
        return (
            <div className="min-h-screen bg-neutral-g1 flex flex-col items-center justify-center px-6">
                <Palette className="w-16 h-16 text-neutral-g3 mb-4" />
                <h2 className="font-display text-2xl font-black text-neutral-black mb-4 uppercase">
                    {error || "Artist not found"}
                </h2>
                <Link
                    to="/artists"
                    className="text-primary font-display font-black uppercase tracking-wide no-underline flex items-center gap-2"
                >
                    <ArrowLeft className="w-4 h-4" /> Back to Artists
                </Link>
            </div>
        );
    }

    const socialLinks = [
        { key: "portfolio", url: artist.portfolioUrl, label: "Portfolio" },
        { key: "instagram", url: artist.instagramUrl, label: "Instagram" },
        { key: "twitter", url: artist.twitterUrl, label: "Twitter" },
        { key: "behance", url: artist.behanceUrl, label: "Behance" },
        { key: "dribbble", url: artist.dribbbleUrl, label: "Dribbble" },
    ].filter((link) => link.url);

    const hasCover = Boolean(artist.coverPhotoUrl);

    return (
        <div className="min-h-screen bg-neutral-white">
            <div className="relative bg-white border-b-[2.5px] border-neutral-black">
                <div
                    className={`h-56 md:h-72 w-full relative overflow-hidden border-b-[2px] border-neutral-black ${
                        hasCover ? "bg-neutral-black" : "bg-primary"
                    }`}
                >
                    {hasCover && (
                        <img
                            src={artist.coverPhotoUrl!}
                            alt=""
                            className="w-full h-full object-cover opacity-90"
                        />
                    )}
                    <div className="absolute top-4 left-4">
                        <Link
                            to="/artists"
                            className="bg-white border-[2px] border-neutral-black p-2 rounded-[4px] inline-flex hover:bg-primary transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="flex flex-col md:flex-row gap-6 md:items-start -mt-14 md:-mt-16 pb-8 md:pb-10 mb-2 bg-white border-[2.5px] border-neutral-black rounded-[4px] p-5 md:p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                        <div className="w-28 h-28 md:w-36 md:h-36 rounded-[4px] border-[3px] border-neutral-black overflow-hidden bg-primary shrink-0 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] mx-auto md:mx-0">
                            {artist.displayPhotoUrl ? (
                                <img
                                    src={artist.displayPhotoUrl}
                                    alt=""
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center font-display text-4xl font-black text-neutral-black">
                                    {(artist.displayName || artist.name).charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>

                        <div className="flex-1 space-y-3 pt-0 md:pt-1 min-w-0 text-center md:text-left">
                            <h1 className="font-display text-3xl md:text-4xl font-black text-neutral-black uppercase tracking-tight [text-wrap:balance]">
                                {artist.displayName || artist.name}
                            </h1>
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 font-display text-[12px] font-bold uppercase tracking-wide text-neutral-black">
                                <span className="inline-flex items-center gap-2">
                                    <ShoppingBag className="w-4 h-4 text-primary shrink-0" />
                                    {artist.products.length}{" "}
                                    {artist.products.length === 1 ? "design" : "designs"}
                                </span>
                                <ArtistRatingInline
                                    rating={artist.artistRating}
                                    reviewCount={artist.reviewCount}
                                />
                            </div>
                            {artist.bio && (
                                <p className="text-neutral-black/85 max-w-3xl mx-auto md:mx-0 leading-relaxed font-body font-medium text-[15px]">
                                    {artist.bio}
                                </p>
                            )}
                            {socialLinks.length > 0 && (
                                <div className="flex flex-wrap gap-2 pt-2 justify-center md:justify-start">
                                    {socialLinks.map((link) => (
                                        <a
                                            key={link.key}
                                            href={link.url as string}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-g1 text-neutral-black text-[11px] font-display font-black uppercase border-[1.5px] border-neutral-black rounded-[2px] hover:bg-primary transition-colors"
                                        >
                                            {link.label} <ExternalLink className="w-3.5 h-3.5" />
                                        </a>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <h2 className="font-display text-xl md:text-2xl font-black text-neutral-black uppercase tracking-tight flex items-center gap-2 mb-8">
                    <Palette className="w-6 h-6 text-primary shrink-0" />
                    Shop collection
                </h2>

                {artist.products.length === 0 ? (
                    <div className="text-center py-20 bg-neutral-g1 border-[2px] border-dashed border-neutral-black rounded-[4px]">
                        <Palette className="w-12 h-12 text-neutral-g3 mx-auto mb-3" />
                        <p className="font-display text-neutral-g4 font-bold uppercase tracking-wide">
                            No published designs yet.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-neutral-g2 border border-neutral-g2">
                        {artist.products.map((product) => {
                            const categoryLabel = product.categories?.[0] || "General";
                            const onFlash =
                                product.isDiscounted &&
                                (product.discountPercent ?? 0) > 0 &&
                                product.originalPrice != null &&
                                product.originalPrice > product.price;
                            const onCompareOnly =
                                !onFlash &&
                                product.compareAtPrice != null &&
                                product.compareAtPrice > product.price;
                            const strikePrice = onFlash
                                ? product.originalPrice!
                                : onCompareOnly
                                  ? product.compareAtPrice!
                                  : null;
                            const badgePct = onFlash
                                ? product.discountPercent!
                                : onCompareOnly
                                  ? Math.round(
                                        ((product.compareAtPrice! - product.price) /
                                            product.compareAtPrice!) *
                                            100
                                    )
                                  : 0;
                            return (
                                <div
                                    key={product.id}
                                    className="bg-white group cursor-pointer relative overflow-hidden transition-all hover:z-10 hover:shadow-[0_12px_48px_rgba(0,0,0,0.12)]"
                                >
                                    <Link to={`/products/${product.id}`} className="no-underline block">
                                        <div className="aspect-square bg-neutral-g1 flex items-center justify-center overflow-hidden relative group-hover:bg-neutral-g2 transition-colors">
                                            <ImageWithSkeleton
                                                src={
                                                    product.primaryView === "back"
                                                        ? product.backMockupImageUrl || product.mockupImageUrl
                                                        : product.mockupImageUrl
                                                }
                                                alt={product.name}
                                                className={`w-full h-full ${STOREFRONT_TEE_MOCKUP_IMAGE_CLASS} group-hover:scale-105 transition-transform duration-500`}
                                                wrapperClassName="w-full h-full"
                                            />
                                            {badgePct > 0 && (
                                                <div className="absolute top-4 left-4 bg-danger text-white font-display text-[10px] font-black px-2 py-1 uppercase tracking-[1px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-10">
                                                    -{badgePct}%
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-4 pt-5 pb-2">
                                            <div className="font-display text-[10px] font-bold tracking-[1.5px] uppercase text-primary mb-1 truncate">
                                                {artist.displayName || artist.name}
                                            </div>
                                            <h3 className="font-display text-[16px] font-bold text-neutral-black mb-3 leading-[1.2] tracking-[0.2px] truncate">
                                                {product.name}
                                            </h3>
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-baseline gap-2 flex-wrap">
                                                    <span className="font-display text-[18px] font-black text-neutral-black tabular-nums">
                                                        ₹{product.price.toLocaleString("en-IN")}
                                                    </span>
                                                    {strikePrice != null && (
                                                        <span className="font-display text-[12px] font-bold text-neutral-g3 line-through tabular-nums">
                                                            ₹{strikePrice.toLocaleString("en-IN")}
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="font-display text-[9px] font-bold tracking-[1px] uppercase text-neutral-g3 bg-neutral-g1 px-1.5 py-0.5 rounded-[2px] shrink-0 max-w-[40%] truncate">
                                                    {categoryLabel}
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                    <button
                                        type="button"
                                        onClick={() => handleQuickAdd(product)}
                                        className={`w-full py-3 font-display text-[12px] font-extrabold tracking-[1px] uppercase rounded-[3px] border-[1.5px] transition-all ${
                                            addedId === product.id
                                                ? "bg-success text-white border-success"
                                                : "bg-primary text-neutral-black border-primary hover:bg-neutral-black hover:text-white hover:border-neutral-black"
                                        }`}
                                    >
                                        {addedId === product.id ? "✓ Added!" : "Add to Cart"}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
