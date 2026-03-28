import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import {
    ArrowLeft,
    Share2,
    Palette,
    ExternalLink,
    ShoppingBag,
    Loader2
} from "lucide-react";
import api from "../../api/axios";

interface Product {
    id: string;
    name: string;
    price: number;
    compareAtPrice: number | null;
    mockupImageUrl: string;
    tshirtColor: string;
    categories: string[];
}

interface Artist {
    id: string;
    name: string;
    displayName: string | null;
    displayPhotoUrl: string | null;
    coverPhotoUrl: string | null;
    bio: string | null;
    portfolioUrl: string | null;
    instagramUrl: string | null;
    twitterUrl: string | null;
    behanceUrl: string | null;
    dribbbleUrl: string | null;
    products: Product[];
}

export default function ArtistStorefront() {
    const { artistId } = useParams<{ artistId: string }>();
    const [artist, setArtist] = useState<Artist | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchArtist = async () => {
            try {
                setIsLoading(true);
                const res = await api.get(`/api/artists/${artistId}`);
                setArtist(res.data.data.artist);
            } catch (err: any) {
                setError(err.response?.status === 404 ? "Artist not found" : "Failed to load artist profile");
            } finally {
                setIsLoading(false);
            }
        };

        if (artistId) fetchArtist();
    }, [artistId]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
            </div>
        );
    }

    if (error || !artist) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
                <Palette className="w-16 h-16 text-gray-300 mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    {error || "Artist not found"}
                </h2>
                <Link to="/artists" className="text-yellow-600 hover:text-yellow-700 font-medium flex items-center gap-2">
                    <ArrowLeft className="w-4 h-4" /> Back to Artists
                </Link>
            </div>
        );
    }

    // Prepare links
    const socialLinks = [
        { key: "portfolio", url: artist.portfolioUrl, label: "Portfolio" },
        { key: "instagram", url: artist.instagramUrl, label: "Instagram" },
        { key: "twitter", url: artist.twitterUrl, label: "Twitter" },
        { key: "behance", url: artist.behanceUrl, label: "Behance" },
        { key: "dribbble", url: artist.dribbbleUrl, label: "Dribbble" },
    ].filter(link => link.url);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header / Cover */}
            <div className="relative bg-white border-b border-gray-200">
                <div className="h-64 md:h-80 w-full bg-gradient-to-br from-yellow-100 via-yellow-200 to-amber-200 relative overflow-hidden">
                    {artist.coverPhotoUrl && (
                        <img
                            src={artist.coverPhotoUrl}
                            alt={`${artist.displayName || artist.name} cover`}
                            className="w-full h-full object-cover"
                        />
                    )}
                    <div className="absolute top-4 left-4">
                        <Link to="/artists" className="bg-white/80 backdrop-blur text-gray-800 p-2 rounded-full inline-flex hover:bg-white transition-colors">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                    <div className="flex flex-col md:flex-row gap-6 md:items-end -mt-16 pb-8 md:pb-12">
                        {/* Avatar */}
                        <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white overflow-hidden bg-white shrink-0 shadow-md">
                            {artist.displayPhotoUrl ? (
                                <img
                                    src={artist.displayPhotoUrl}
                                    alt={`${artist.displayName || artist.name} avatar`}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full bg-yellow-100 flex items-center justify-center">
                                    <span className="text-4xl font-black text-yellow-600">
                                        {(artist.displayName || artist.name).charAt(0).toUpperCase()}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 space-y-3 pt-4 md:pt-0">
                            <div>
                                <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900">
                                    {artist.displayName || artist.name}
                                </h1>
                                <p className="text-gray-500 flex items-center gap-2 mt-1">
                                    <ShoppingBag className="w-4 h-4" />
                                    {artist.products.length} {artist.products.length === 1 ? 'Design Available' : 'Designs Available'}
                                </p>
                            </div>

                            {artist.bio && (
                                <p className="text-gray-600 max-w-3xl leading-relaxed">
                                    {artist.bio}
                                </p>
                            )}

                            {socialLinks.length > 0 && (
                                <div className="flex flex-wrap gap-3 pt-2">
                                    {socialLinks.map((link) => (
                                        <a
                                            key={link.key}
                                            href={link.url as string}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
                                        >
                                            {link.label} <ExternalLink className="w-3.5 h-3.5" />
                                        </a>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Actions (Share) */}
                        <div className="flex gap-3 md:self-end">
                            <button className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors w-full md:w-auto">
                                <Share2 className="w-4 h-4" /> Share
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Products Grid */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center gap-2">
                    <Palette className="w-6 h-6 text-yellow-500" />
                    Shop {artist.displayName || artist.name}'s Collection
                </h2>

                {artist.products.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
                        <Palette className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">This artist hasn't published any designs yet.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {artist.products.map(product => (
                            <Link
                                key={product.id}
                                to={`/products/${product.id}`}
                                className="group bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 block"
                            >
                                <div className="aspect-[4/5] bg-gray-50 relative overflow-hidden">
                                    <img
                                        src={product.mockupImageUrl}
                                        alt={product.name}
                                        className="w-full h-full object-cover mix-blend-multiply group-hover:scale-105 transition-transform duration-500"
                                    />
                                    {product.compareAtPrice && product.compareAtPrice > product.price && (
                                        <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-md">
                                            SALE
                                        </div>
                                    )}
                                </div>
                                <div className="p-4">
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-widest mb-1 truncate">
                                        {product.categories?.[0] || 'Uncategorized'}
                                    </p>
                                    <h3 className="text-lg font-bold text-gray-900 mb-2 truncate group-hover:text-yellow-600 transition-colors">
                                        {product.name}
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg font-black text-gray-900">
                                            ${product.price.toFixed(2)}
                                        </span>
                                        {product.compareAtPrice && product.compareAtPrice > product.price && (
                                            <span className="text-sm font-medium text-gray-400 line-through">
                                                ${product.compareAtPrice.toFixed(2)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
