import {
    Star,
    Instagram,
    Twitter,
    Globe,
    CheckCircle,
    ShoppingCart,
    Edit3
} from "lucide-react";
import Loader from "../../components/shared/Loader";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

export default function ArtistProfile() {
    const { artistId } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [artist, setArtist] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const isOwnProfile = !artistId || artistId === user?.id;

    useEffect(() => {
        const fetchArtist = async () => {
            try {
                const targetId = artistId || user?.id;
                if (!targetId) { setLoading(false); return; }

                if (!artistId && user?.verificationStatus !== 'VERIFIED') {
                    navigate('/artist/setup-profile', { replace: true });
                    return;
                }

                const res = await api.get(`/api/artists/${targetId}`);
                setArtist(res.data.data.artist);
            } catch (error) {
                console.error("Failed to fetch artist profile:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchArtist();
    }, [artistId, user?.id, user?.verificationStatus, navigate]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader size="w-12 h-12" />
            </div>
        );
    }

    if (!artist) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="font-display text-[15px] font-extrabold text-neutral-g4">Artist not found</div>
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen bg-neutral-g1">
            {/* Cover Photo - Kinetic Banner */}
            <div className="relative h-[280px] md:h-[350px] overflow-hidden bg-neutral-black">
                {artist.coverPhotoUrl ? (
                    <img src={artist.coverPhotoUrl} alt="Cover" className="w-full h-full object-cover opacity-60" />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center opacity-10">
                        <div className="font-display text-[clamp(100px,15vw,300px)] font-black tracking-[-0.05em] text-white leading-none select-none">
                            {artist.displayName || artist.name}
                        </div>
                    </div>
                )}
                {/* Visual Accent */}
                <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-neutral-black/80 to-transparent" />

                {/* Edit Button for own profile */}
                {isOwnProfile && user?.verificationStatus === 'VERIFIED' && (
                    <button
                        onClick={() => navigate('/artist/edit-profile')}
                        className="absolute top-6 right-6 z-20 flex items-center gap-2 px-5 py-2.5 bg-white border-[2px] border-neutral-black rounded-[4px] font-display text-[11px] font-black uppercase tracking-[1px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
                    >
                        <Edit3 className="w-4 h-4" /> Edit Profile
                    </button>
                )}
            </div>

            <div className="max-w-[1600px] mx-auto px-4 sm:px-8 pb-20">
                {/* Profile Information Overlay */}
                <div className="relative -mt-24 md:-mt-32 z-10 flex flex-col lg:flex-row gap-8 items-start">

                    {/* Floating Profile Card */}
                    <div className="w-full lg:w-[420px] shrink-0 bg-white border-[2px] border-neutral-black rounded-[6px] shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] p-8">
                        <div className="flex flex-col items-center text-center space-y-6">
                            {/* Avatar with Ring */}
                            <div className="relative">
                                <div className="w-32 h-32 rounded-[4px] border-[3px] border-neutral-black shadow-[6px_6px_0px_0px_rgba(255,222,0,1)] overflow-hidden bg-primary p-1">
                                    <div className="w-full h-full rounded-[2px] overflow-hidden border-[1px] border-neutral-black/20">
                                        {artist.displayPhotoUrl ? (
                                            <img src={artist.displayPhotoUrl} alt={artist.displayName} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center font-display text-[48px] font-black text-neutral-black bg-primary">
                                                {(artist.displayName || artist.name || "A").charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {artist.verificationStatus === 'VERIFIED' && (
                                    <div className="absolute -bottom-2 -right-2 bg-success text-white p-1.5 rounded-full border-[2px] border-neutral-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                                        <CheckCircle className="w-4 h-4" />
                                    </div>
                                )}
                            </div>

                            {/* Info */}
                            <div className="space-y-2">
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-neutral-black text-primary font-display text-[9px] font-black uppercase tracking-[2px] rounded-[2px] mb-2">
                                    Verified Resident
                                </div>
                                <h1 className="font-display text-[32px] font-black text-neutral-black leading-tight uppercase tracking-tight">
                                    {artist.displayName || artist.name}
                                </h1>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-2 w-full border-y-[2px] border-neutral-black py-6 gap-4">
                                <div className="space-y-1">
                                    <div className="font-display text-[22px] font-black text-neutral-black leading-none">
                                        {artist.products?.length || 0}
                                    </div>
                                    <div className="font-display text-[9px] font-black text-neutral-g3 uppercase tracking-[1px]">
                                        Published products
                                    </div>
                                </div>
                                <div className="space-y-1 border-l-[2px] border-neutral-black/10 pl-4">
                                    <div className="font-display text-[22px] font-black text-neutral-black leading-none flex items-center justify-center gap-1.5">
                                        <Star className="w-5 h-5 fill-primary text-primary shrink-0" />
                                        {(Number(artist.reviewCount) || 0) > 0
                                            ? (Number(artist.artistRating) || 0).toFixed(1)
                                            : "—"}
                                    </div>
                                    <div className="font-display text-[9px] font-black text-neutral-g3 uppercase tracking-[1px] text-center">
                                        Avg rating ({Number(artist.reviewCount) || 0} review
                                        {(Number(artist.reviewCount) || 0) === 1 ? "" : "s"})
                                    </div>
                                </div>
                            </div>

                            {/* Actions & Bio */}
                            <div className="w-full space-y-4">
                                {artist.bio?.trim() ? (
                                    <p className="font-body text-[14px] font-bold text-neutral-black leading-relaxed text-left w-full">
                                        {artist.bio.trim()}
                                    </p>
                                ) : null}

                                <div className="flex flex-wrap justify-center gap-3 pt-4">
                                    {[
                                        { icon: Instagram, url: artist.instagramUrl, color: "hover:bg-[#E1306C]" },
                                        { icon: Twitter, url: artist.twitterUrl, color: "hover:bg-[#1DA1F2]" },
                                        { icon: Globe, url: artist.portfolioUrl, color: "hover:bg-primary" }
                                    ].filter(s => s.url).map((social, i) => (
                                        <a
                                            key={i}
                                            href={social.url}
                                            target="_blank"
                                            className={`w-10 h-10 flex items-center justify-center border-[2px] border-neutral-black rounded-[4px] bg-white text-neutral-black ${social.color} hover:text-white transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none`}
                                        >
                                            <social.icon className="w-5 h-5" />
                                        </a>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="flex-1 space-y-12 w-full">
                        {/* Collection Header */}
                        <div className="flex flex-col md:flex-row md:items-end justify-between border-b-[4px] border-neutral-black pb-4 gap-4">
                            <h2 className="font-display text-[32px] md:text-[42px] font-black text-neutral-black uppercase leading-none italic">
                                Original <span className="text-primary not-italic">Drops</span>
                            </h2>
                            <div className="font-display text-[12px] font-black text-neutral-g3 uppercase tracking-[2px]">
                                Total Items: <span className="text-neutral-black">{artist.products?.length || 0}</span>
                            </div>
                        </div>

                        {/* Product Grid */}
                        {artist.products && artist.products.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-8 md:gap-10">
                                {artist.products.map((product: any, index: number) => (
                                    <Link
                                        to={`/products/${product.id}`}
                                        key={index}
                                        className="group bg-white border-[2px] border-neutral-black rounded-[6px] overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all duration-300"
                                    >
                                        <div className="aspect-[4/5] overflow-hidden bg-neutral-g1 relative">
                                            <img
                                                src={product.mockupImageUrl}
                                                alt={product.name}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                            />
                                            {/* Price Badge */}
                                            <div className="absolute top-4 right-4 bg-primary px-3 py-1 border-[2px] border-neutral-black font-display text-[14px] font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                                ₹{product.price}
                                            </div>
                                        </div>
                                        <div className="p-6 space-y-4">
                                            <div className="space-y-1">
                                                <h3 className="font-display text-[18px] font-black text-neutral-black uppercase tracking-tight group-hover:text-primary transition-colors truncate">
                                                    {product.name}
                                                </h3>
                                                {product.categories?.length ? (
                                                    <p className="font-display text-[10px] font-bold text-neutral-g3 uppercase tracking-[1px] truncate">
                                                        {product.categories.slice(0, 2).join(" · ")}
                                                    </p>
                                                ) : null}
                                            </div>
                                            <div className="w-full py-3 bg-neutral-black text-white font-display text-[11px] font-black uppercase tracking-[2px] text-center rounded-[2px] group-hover:bg-primary group-hover:text-neutral-black transition-colors">
                                                Buy Item
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="py-24 flex flex-col items-center justify-center border-[2px] border-neutral-black border-dashed rounded-[8px] bg-white space-y-4">
                                <div className="p-6 bg-neutral-g1 rounded-full border-[2px] border-neutral-black">
                                    <ShoppingCart className="w-12 h-12 text-neutral-g3" />
                                </div>
                                <div className="text-center space-y-1">
                                    <h3 className="font-display text-[18px] font-black text-neutral-black uppercase">No drops yet</h3>
                                    <p className="font-display text-[12px] font-bold text-neutral-g3 uppercase tracking-wider">Checkout back later for the next release.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
