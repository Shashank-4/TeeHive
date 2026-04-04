import { useState, useEffect } from "react";
import { Star, MessageSquareIcon, Palette, Loader2 } from "lucide-react";
import api from "../../api/axios";

interface Review {
    id: string;
    productRating: number;
    artistRating: number;
    feedback: string | null;
    createdAt: string;
    product: {
        id: string;
        name: string;
        mockupImageUrl: string;
    };
    customer: {
        name: string;
    };
}

export default function ArtistReviews() {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchReviews = async () => {
            try {
                const res = await api.get("/api/reviews/artist");
                setReviews(res.data.data.reviews);
            } catch (err: any) {
                setError(err.response?.data?.message || "Failed to fetch reviews");
            } finally {
                setLoading(false);
            }
        };

        fetchReviews();
    }, []);

    // Derived aggregate
    const totalReviews = reviews.length;
    const avgArtistRating = totalReviews > 0
        ? (reviews.reduce((acc, curr) => acc + curr.artistRating, 0) / totalReviews).toFixed(1)
        : "0.0";

    const avgProductRating = totalReviews > 0
        ? (reviews.reduce((acc, curr) => acc + curr.productRating, 0) / totalReviews).toFixed(1)
        : "0.0";

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 text-center bg-white rounded-xl shadow-sm border border-red-100">
                <p className="text-red-600 font-medium">Failed to load reviews. Please try again later.</p>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="p-4 bg-yellow-50 text-yellow-600 rounded-xl">
                        <Star className="w-7 h-7 fill-current" />
                    </div>
                    <div>
                        <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Your Design Rating</div>
                        <div className="text-3xl font-black text-gray-900">{avgArtistRating} <span className="text-lg font-medium text-gray-400">/ 5.0</span></div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="p-4 bg-gray-50 text-gray-600 rounded-xl">
                        <Palette className="w-7 h-7" />
                    </div>
                    <div>
                        <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Product Quality</div>
                        <div className="text-3xl font-black text-gray-900">{avgProductRating} <span className="text-lg font-medium text-gray-400">/ 5.0</span></div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="p-4 bg-blue-50 text-blue-600 rounded-xl">
                        <MessageSquareIcon className="w-7 h-7" />
                    </div>
                    <div>
                        <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Total Reviews</div>
                        <div className="text-3xl font-black text-gray-900">{totalReviews}</div>
                    </div>
                </div>
            </div>

            {/* Reviews List */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                    <h2 className="text-lg font-bold text-gray-900 text-center md:text-left">Recent Feedback</h2>
                </div>
                
                {reviews.length === 0 ? (
                    <div className="p-16 text-center">
                        <Star className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-900 mb-2">No reviews yet</h3>
                        <p className="text-gray-500 max-w-sm mx-auto">Customers haven't left any feedback for your designs yet. Check back later once orders are delivered!</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {reviews.map((review) => (
                            <div key={review.id} className="p-6 md:p-8 hover:bg-gray-50/50 transition-colors flex flex-col md:flex-row gap-8 items-start">
                                {/* Product summary */}
                                <div className="flex gap-4 items-center md:w-1/3 shrink-0 bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                                    <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                                        <img src={review.product.mockupImageUrl} alt={review.product.name} className="w-full h-full object-cover mix-blend-multiply" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900 leading-tight mb-1">{review.product.name}</h4>
                                        <div className="text-sm font-medium text-gray-500">By {review.customer.name}</div>
                                        <div className="text-xs text-gray-400 mt-1">{new Date(review.createdAt).toLocaleDateString()}</div>
                                    </div>
                                </div>

                                {/* Ratings & Feedback */}
                                <div className="flex-1 space-y-4">
                                    <div className="flex flex-col sm:flex-row gap-6">
                                        {/* Artist Rating */}
                                        <div className="space-y-1 bg-yellow-50/50 px-4 py-2 rounded-lg border border-yellow-100/50">
                                            <div className="text-xs font-bold text-yellow-800 uppercase tracking-widest">Design Rating</div>
                                            <div className="flex gap-1">
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <Star key={star} className={`w-4 h-4 ${review.artistRating >= star ? 'text-yellow-500 fill-current' : 'text-yellow-200'}`} />
                                                ))}
                                            </div>
                                        </div>
                                        
                                        {/* Product Rating */}
                                        <div className="space-y-1 bg-gray-50 px-4 py-2 rounded-lg border border-gray-100">
                                            <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">Quality Rating</div>
                                            <div className="flex gap-1">
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <Star key={star} className={`w-4 h-4 ${review.productRating >= star ? 'text-gray-900 fill-current' : 'text-gray-200'}`} />
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {review.feedback ? (
                                        <div className="relative">
                                            <MessageSquareIcon className="w-5 h-5 absolute top-3 left-3 text-gray-300" />
                                            <p className="bg-gray-50 text-gray-700 italic border border-gray-100 rounded-xl p-4 pl-10 text-sm leading-relaxed">
                                                "{review.feedback}"
                                            </p>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-400 italic">No written feedback provided.</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
