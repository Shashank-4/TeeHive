import { useState, useEffect } from "react";
import { Star, Palette, Loader2 } from "lucide-react";
import api from "../../api/axios";

interface AdminReview {
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
    artist: {
        id: string;
        name: string;
        displayName: string | null;
    };
    customer: {
        id: string;
        name: string;
        email: string;
    };
    order: {
        id: string;
        createdAt: string;
    };
}

export default function AdminReviews() {
    const [reviews, setReviews] = useState<AdminReview[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchReviews = async () => {
            try {
                const res = await api.get("/api/reviews/admin");
                setReviews(res.data.data.reviews);
            } catch (err: any) {
                setError("Failed to fetch admin reviews");
            } finally {
                setLoading(false);
            }
        };

        fetchReviews();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 text-center bg-white rounded-xl shadow-sm border border-danger/20">
                <p className="text-danger font-medium">{error}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-black tracking-tight">Review Management</h1>
                    <p className="text-sm text-neutral-g4 mt-1">Monitor product quality and artist feedback globally.</p>
                </div>
                <div className="bg-white border-[1.5px] border-neutral-g2 px-4 py-2 rounded-lg flex gap-4 text-sm font-semibold">
                    <span>Total Reviews: {reviews.length}</span>
                </div>
            </div>

            <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-neutral-g1 border-b text-neutral-g4 uppercase font-bold text-xs">
                            <tr>
                                <th className="px-6 py-4">Customer</th>
                                <th className="px-6 py-4">Order / Product</th>
                                <th className="px-6 py-4">Artist Info</th>
                                <th className="px-6 py-4 text-center">Design Rating</th>
                                <th className="px-6 py-4 text-center">Quality Rating</th>
                                <th className="px-6 py-4">Feedback</th>
                                <th className="px-6 py-4">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-g2">
                            {reviews.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-neutral-g4">
                                        No reviews found in the system.
                                    </td>
                                </tr>
                            ) : (
                                reviews.map((review) => (
                                    <tr key={review.id} className="hover:bg-neutral-g1/50">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-neutral-black">{review.customer.name}</div>
                                            <div className="text-xs text-neutral-g4">{review.customer.email}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-neutral-g1 rounded overflow-hidden">
                                                    <img src={review.product.mockupImageUrl} alt="" className="w-full h-full object-cover mix-blend-multiply" />
                                                </div>
                                                <div>
                                                    <div className="font-medium text-neutral-black max-w-[150px] truncate" title={review.product.name}>
                                                        {review.product.name}
                                                    </div>
                                                    <div className="text-xs text-neutral-g4 font-mono mt-0.5">#{review.order.id.slice(0, 8)}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-neutral-black">{review.artist.displayName || review.artist.name}</div>
                                            <div className="text-xs text-neutral-g4">ID: {review.artist.id.slice(0, 8)}</div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="inline-flex items-center gap-1 font-bold text-yellow-600 bg-yellow-50 px-2 py-1 rounded">
                                                <Star className="w-3.5 h-3.5 fill-current" /> {review.artistRating}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="inline-flex items-center gap-1 font-bold text-neutral-black bg-neutral-g1 px-2 py-1 rounded">
                                                <Palette className="w-3.5 h-3.5" /> {review.productRating}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 max-w-[250px]">
                                            {review.feedback ? (
                                                <div className="truncate text-xs italic text-neutral-g4 bg-neutral-g1 p-2 rounded" title={review.feedback}>
                                                    "{review.feedback}"
                                                </div>
                                            ) : (
                                                <span className="text-neutral-g3 text-xs">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-neutral-g4 text-xs">
                                            {new Date(review.createdAt).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
