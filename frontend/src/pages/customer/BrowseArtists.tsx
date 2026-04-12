import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Palette, ShoppingBag, Globe, Instagram, Twitter, Verified } from "lucide-react";
import Loader from "../../components/shared/Loader";
import ImageWithSkeleton from "../../components/shared/ImageWithSkeleton";
import api from "../../api/axios";
import { BEE_BADGE } from "../../constants/brand";
import { artistPublicPath } from "../../utils/artistRoutes";
import ArtistRatingInline from "../../components/shared/ArtistRatingInline";
import BannerTeehiveMarquee from "../../components/shared/BannerTeehiveMarquee";

interface Artist {
    id: string;
    name: string;
    displayName: string | null;
    artistSlug: string | null;
    displayPhotoUrl: string | null;
    coverPhotoUrl: string | null;
    bio: string | null;
    productCount: number;
    verificationStatus?: string;
    artistRating?: number;
    reviewCount?: number;
}

interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

const SORT_OPTIONS: { value: string; label: string; title?: string }[] = [
    { value: "ratings", label: "HIGHEST RATED" },
    { value: "sales", label: "MOST SALES" },
    { value: "newest", label: "NEW ARTISTS" },
    { value: "alpha", label: "A–Z", title: "Alphabetical by display name (falls back to account name if unset)" },
];

export default function BrowseArtists() {
    const [searchParams, setSearchParams] = useSearchParams();
    const sortFromUrl = searchParams.get("sort") || "ratings";
    const sort = SORT_OPTIONS.some((o) => o.value === sortFromUrl) ? sortFromUrl : "ratings";

    const [artists, setArtists] = useState<Artist[]>([]);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);

    useEffect(() => {
        fetchArtists();
    }, [page, sort]);

    const setSort = (next: string) => {
        setSearchParams((prev) => {
            const p = new URLSearchParams(prev);
            if (next && next !== "ratings") p.set("sort", next);
            else p.delete("sort");
            return p;
        });
        setPage(1);
    };

    const fetchArtists = async () => {
        try {
            setIsLoading(true);
            const params = new URLSearchParams();
            params.set("page", page.toString());
            params.set("limit", "12");
            params.set("sort", sort);

            const res = await api.get(`/api/artists?${params.toString()}`);
            setArtists(res.data.data.artists);
            setPagination(res.data.data.pagination);
        } catch (error) {
            console.error("Failed to fetch artists:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-neutral-white">
            {/* ── HERO ── */}
            <div className="relative overflow-hidden bg-neutral-black border-b-[1.5px] border-neutral-black py-10 md:py-12 px-6 sm:px-8">
                <BannerTeehiveMarquee />
                <div className="relative z-10 max-w-[1600px] mx-auto text-left w-full">
                    <div className="font-display text-[11px] font-extrabold tracking-[4px] uppercase text-primary mb-3 flex items-center gap-2">
                        <span aria-hidden>{BEE_BADGE}</span>
                        Design Collective
                    </div>
                    <h1 className="font-display text-[clamp(32px,5vw,72px)] font-black text-white leading-none tracking-[-1px] mb-4 uppercase">
                        OUR <span className="text-primary italic">ARTISTS</span>
                    </h1>
                    <p className="text-[clamp(14px,1.2vw,18px)] text-white/65 leading-relaxed max-w-xl font-medium">
                        The independent visionaries fueling the culture. Discover the minds behind your favorite designs and support human creativity.
                    </p>
                </div>
            </div>

            {/* ── CONTENT ── */}
            <div className="w-full px-4 sm:px-8 py-10 sm:py-10">
                <div className="max-w-[1600px] mx-auto mb-8">
                    <p className="font-display text-[10px] font-black uppercase tracking-[3px] text-neutral-g3 mb-3">
                        Sort directory
                    </p>
                    <div
                        className="flex flex-wrap gap-2"
                        role="group"
                        aria-label="Sort artists"
                    >
                        {SORT_OPTIONS.map((o) => {
                            const active = sort === o.value;
                            return (
                                <button
                                    key={o.value}
                                    type="button"
                                    title={o.title}
                                    onClick={() => setSort(o.value)}
                                    className={`font-display text-[10px] sm:text-[11px] font-black uppercase tracking-[1px] px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-[4px] border-[2px] border-neutral-black transition-all ${
                                        active
                                            ? "bg-primary text-neutral-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                                            : "bg-white text-neutral-black hover:bg-neutral-g1"
                                    }`}
                                >
                                    {o.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-40">
                        <Loader size="w-16 h-16 border-[3px]" />
                        <span className="font-display text-[11px] font-black uppercase tracking-[2px] mt-6 text-neutral-g3 animate-pulse">Syncing Artists...</span>
                    </div>
                ) : artists.length === 0 ? (
                    <div className="text-center py-32 bg-neutral-g1 border-[1.5px] border-neutral-black rounded-[4px] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-3xl mx-auto">
                        <Palette className="w-20 h-20 text-neutral-g3 mx-auto mb-6 opacity-40" />
                        <h2 className="font-display text-[28px] font-black text-neutral-black mb-3 uppercase">No artists yet</h2>
                        <p className="font-display text-[13px] font-bold text-neutral-g4 mb-10 max-w-sm mx-auto uppercase tracking-[0.5px]">
                            The collective is currently empty. Check back soon for new arrivals.
                        </p>
                        <button
                            type="button"
                            onClick={() => setPage(1)}
                            className="bg-primary text-neutral-black px-10 py-4 font-display text-[12px] font-black uppercase tracking-[1.5px] border-[1.5px] border-neutral-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all"
                        >
                            Refresh
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-12 max-w-[1600px] mx-auto">
                            {artists.map((artist) => (
                                <Link
                                    key={artist.id}
                                    to={artistPublicPath(artist)}
                                    className="group no-underline relative bg-white border-[1.5px] border-neutral-black rounded-[2px] overflow-hidden transition-all hover:-translate-y-2 hover:shadow-[12px_12px_0px_0px_rgba(250,204,21,1)] flex flex-col"
                                >
                                    {/* Cover */}
                                    <div className="h-32 bg-neutral-black relative overflow-hidden border-b-[1.5px] border-neutral-black">
                                        {artist.coverPhotoUrl ? (
                                            <ImageWithSkeleton
                                                src={artist.coverPhotoUrl}
                                                alt=""
                                                className="w-full h-full object-cover grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-80 transition-all duration-700"
                                                wrapperClassName="w-full h-full"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center font-display text-[30px] font-black tracking-widest text-white/5 select-none">
                                                TEEHIVE
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-neutral-black/10 group-hover:bg-transparent transition-colors"></div>
                                    </div>

                                    {/* Avatar + Info */}
                                    <div className="px-6 pb-8 -mt-10 relative flex-1 flex flex-col items-center text-center">
                                        <div className="w-20 h-20 rounded-full border-[1.5px] border-neutral-black overflow-hidden bg-primary flex items-center justify-center mb-5 z-10 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] group-hover:shadow-none group-hover:scale-105 transition-all">
                                            {artist.displayPhotoUrl ? (
                                                <ImageWithSkeleton
                                                    src={artist.displayPhotoUrl}
                                                    alt={artist.displayName || artist.name}
                                                    className="w-full h-full object-cover"
                                                    wrapperClassName="w-full h-full rounded-full"
                                                />
                                            ) : (
                                                <span className="text-3xl font-black text-neutral-black">
                                                    {(artist.displayName || artist.name).charAt(0).toUpperCase()}
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-center justify-center gap-2 mb-2">
                                            <h3 className="font-display text-[20px] font-black text-neutral-black leading-tight uppercase tracking-[-0.3px]">
                                                {artist.displayName || artist.name}
                                            </h3>
                                            {artist.verificationStatus === "VERIFIED" && (
                                                <Verified className="w-4 h-4 text-primary fill-neutral-black shrink-0" aria-hidden />
                                            )}
                                        </div>

                                        <p className="font-display text-[10px] font-black text-neutral-g3 uppercase tracking-[1.5px] mb-2">
                                            Digital Artisan
                                        </p>
                                        <div className="mb-4">
                                            <ArtistRatingInline
                                                rating={artist.artistRating ?? 0}
                                                reviewCount={artist.reviewCount ?? 0}
                                                compact
                                            />
                                        </div>

                                        <div className="border-t-[1.5px] border-neutral-g1 pt-5 w-full">
                                            <div className="flex items-center justify-center gap-1.5 text-neutral-black font-display text-[11px] font-black uppercase tracking-[0.5px]">
                                                <ShoppingBag className="w-3.5 h-3.5" />
                                                <span>{artist.productCount} Designs Published</span>
                                            </div>
                                        </div>

                                        <div className="mt-6 flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity translate-y-4 group-hover:translate-y-0 transition-transform">
                                            <Instagram className="w-4 h-4 text-neutral-g3 hover:text-primary transition-colors cursor-pointer" />
                                            <Twitter className="w-4 h-4 text-neutral-g3 hover:text-primary transition-colors cursor-pointer" />
                                            <Globe className="w-4 h-4 text-neutral-g3 hover:text-primary transition-colors cursor-pointer" />
                                        </div>
                                    </div>

                                    <div className="bg-neutral-black h-1 w-full scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
                                </Link>
                            ))}
                        </div>

                        {/* Pagination */}
                        {pagination && pagination.totalPages > 1 && (
                            <div className="flex justify-center items-center gap-4 mt-24">
                                <button
                                    onClick={() => { setPage(Math.max(1, page - 1)); window.scrollTo(0, 400); }}
                                    disabled={page === 1}
                                    className="bg-white border-[1.5px] border-neutral-black rounded-[4px] px-8 py-3.5 font-display text-[11px] font-black tracking-[1.5px] uppercase transition-all hover:bg-primary disabled:opacity-30 disabled:border-neutral-g2"
                                >
                                    Previous
                                </button>

                                <span className="font-display text-[11px] font-black text-neutral-black uppercase tracking-[2px]">
                                    {page} / {pagination.totalPages}
                                </span>

                                <button
                                    onClick={() => { setPage(Math.min(pagination.totalPages, page + 1)); window.scrollTo(0, 400); }}
                                    disabled={page === pagination.totalPages}
                                    className="bg-white border-[1.5px] border-neutral-black rounded-[4px] px-8 py-3.5 font-display text-[11px] font-black tracking-[1.5px] uppercase transition-all hover:bg-primary disabled:opacity-30 disabled:border-neutral-g2"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
