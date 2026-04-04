import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search, Palette, ShoppingBag, Globe, Instagram, Twitter, Verified } from "lucide-react";
import Loader from "../../components/shared/Loader";
import ImageWithSkeleton from "../../components/shared/ImageWithSkeleton";
import api from "../../api/axios";

interface Artist {
    id: string;
    name: string;
    displayName: string | null;
    displayPhotoUrl: string | null;
    coverPhotoUrl: string | null;
    bio: string | null;
    productCount: number;
    verificationStatus?: string;
}

interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export default function BrowseArtists() {
    const [artists, setArtists] = useState<Artist[]>([]);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [page, setPage] = useState(1);
    const [bannerUrl, setBannerUrl] = useState("/assets/banners/artists_list_banner.jpg");

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const res = await api.get("/api/config/site_banners");
                if (res.data?.data?.config?.artistsListBanner) {
                    setBannerUrl(res.data.data.config.artistsListBanner);
                }
            } catch (err) {
                console.error("Failed to fetch banners:", err);
            }
        };
        fetchConfig();
    }, []);

    useEffect(() => {
        fetchArtists();
    }, [page, searchQuery]);

    const fetchArtists = async () => {
        try {
            setIsLoading(true);
            const params = new URLSearchParams();
            if (searchQuery) params.set("search", searchQuery);
            params.set("page", page.toString());
            params.set("limit", "12");

            const res = await api.get(`/api/artists?${params.toString()}`);
            setArtists(res.data.data.artists);
            setPagination(res.data.data.pagination);
        } catch (error) {
            console.error("Failed to fetch artists:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        fetchArtists();
    };

    return (
        <div className="min-h-screen bg-neutral-white">
            {/* ── HERO ── */}
            <div className="bg-neutral-black relative overflow-hidden py-24 px-8 border-b-[1.5px] border-neutral-black min-h-[440px] flex items-center">
                {/* Background Banner */}
                <div className="absolute inset-0">
                    <ImageWithSkeleton
                        src={bannerUrl}
                        alt=""
                        className="w-full h-full object-cover opacity-30 grayscale"
                        loading="eager"
                        fetchPriority="high"
                        wrapperClassName="w-full h-full"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-neutral-black via-neutral-black/40 to-transparent"></div>
                </div>

                <div className="absolute inset-0 flex items-center justify-center text-[18vw] font-display font-black text-white/[0.02] tracking-[-5px] select-none whitespace-nowrap">
                    CREATORS CREATORS
                </div>

                <div className="relative z-10 max-w-[1600px] mx-auto text-center w-full">
                    <div className="font-display text-[11px] font-extrabold tracking-[4px] uppercase text-primary mb-5 flex items-center justify-center gap-3">
                        <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
                        Design Collective
                    </div>
                    <h1 className="font-display text-[clamp(44px,7vw,94px)] font-black text-white leading-none tracking-[-1px] mb-8 uppercase">
                        OUR <span className="text-primary italic">ARTISTS</span>
                    </h1>
                    <p className="text-[clamp(14px,1.2vw,18px)] text-white/60 leading-[1.6] max-w-2xl mx-auto mb-12 font-medium">
                        The independent visionaries fueling the culture. Discover the minds behind your favorite designs and support human creativity.
                    </p>

                    {/* Search */}
                    <form onSubmit={handleSearch} className="max-w-xl mx-auto relative group">
                        <div className="flex items-center gap-0 border-[2px] border-white/10 bg-white/5 rounded-[4px] focus-within:border-primary focus-within:bg-white/10 transition-all overflow-hidden backdrop-blur-md shadow-[0_0_40px_rgba(0,0,0,0.3)]">
                            <div className="pl-6">
                                <Search className="w-5 h-5 text-white/30 group-focus-within:text-primary transition-colors" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search by name, style or vibe..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="flex-1 bg-transparent border-none outline-none py-5 px-4 text-white font-display font-bold placeholder:text-white/20 text-[15px]"
                            />
                            <button type="submit" className="bg-primary hover:bg-white text-neutral-black font-display font-black text-[12px] tracking-[1.5px] uppercase px-10 py-5 transition-all outline-none shrink-0 border-l-[1.5px] border-white/10">
                                Discover
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* ── CONTENT ── */}
            <div className="w-full px-8 py-16">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-40">
                        <Loader size="w-16 h-16 border-[3px]" />
                        <span className="font-display text-[11px] font-black uppercase tracking-[2px] mt-6 text-neutral-g3 animate-pulse">Syncing Artists...</span>
                    </div>
                ) : artists.length === 0 ? (
                    <div className="text-center py-32 bg-neutral-g1 border-[1.5px] border-neutral-black rounded-[4px] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-3xl mx-auto">
                        <Palette className="w-20 h-20 text-neutral-g3 mx-auto mb-6 opacity-40" />
                        <h2 className="font-display text-[28px] font-black text-neutral-black mb-3 uppercase">No matching artists</h2>
                        <p className="font-display text-[13px] font-bold text-neutral-g4 mb-10 max-w-sm mx-auto uppercase tracking-[0.5px]">
                            {searchQuery ? `We couldn't find any creators matching "${searchQuery}"` : "The collective is currently empty. Check back soon for new arrivals."}
                        </p>
                        <button
                            onClick={() => { setSearchQuery(""); setPage(1); }}
                            className="bg-primary text-neutral-black px-10 py-4 font-display text-[12px] font-black uppercase tracking-[1.5px] border-[1.5px] border-neutral-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all"
                        >
                            Reset Search
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-12 max-w-[1600px] mx-auto">
                            {artists.map((artist) => (
                                <Link
                                    key={artist.id}
                                    to={`/artists/${artist.id}`}
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

                                        <div className="flex items-center gap-2 mb-2">
                                            <h3 className="font-display text-[20px] font-black text-neutral-black leading-tight uppercase tracking-[-0.3px]">
                                                {artist.displayName || artist.name}
                                            </h3>
                                            <Verified className="w-4 h-4 text-primary fill-neutral-black" />
                                        </div>

                                        <p className="font-display text-[10px] font-black text-neutral-g3 uppercase tracking-[1.5px] mb-4">
                                            Digital Artisan
                                        </p>

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
