import { useState, useEffect } from "react";
import { Star, Palette, Loader2, MessageSquare } from "lucide-react";
import api from "../../api/axios";
import ImageWithSkeleton from "../../components/shared/ImageWithSkeleton";

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
            } catch {
                setError("Failed to fetch admin reviews");
            } finally {
                setLoading(false);
            }
        };

        fetchReviews();
    }, []);

    if (loading) {
        return (
            <div className="w-full min-h-screen bg-neutral-g1 flex items-center justify-center pt-4">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full min-h-screen bg-neutral-g1 flex flex-col pt-4 px-4 sm:px-8 pb-12">
                <div className="bg-white border-[2px] border-danger rounded-[6px] p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.08)]">
                    <p className="font-display text-[12px] font-black uppercase text-danger tracking-wide">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen bg-neutral-g1 flex flex-col pt-4 text-neutral-black">
            <div className="flex-1 px-4 sm:px-8 pb-12 w-full">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 bg-neutral-black text-white px-3 py-1 rounded-[4px] font-display text-[10px] font-black uppercase tracking-[2px]">
                            <MessageSquare className="w-3 h-3 text-primary" />
                            Feedbacks Node
                        </div>
                        <h1 className="font-display text-[clamp(28px,4vw,44px)] font-black text-neutral-black leading-none uppercase tracking-tight">
                            Review <span className="text-primary italic">Ledger</span>
                        </h1>
                        <p className="font-display text-[13px] font-bold text-neutral-g4 uppercase tracking-wider max-w-xl">
                            Product and artist ratings submitted by customers after purchase.
                        </p>
                    </div>
                    <div className="bg-white border-[2px] border-neutral-black rounded-[4px] px-5 py-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-display shrink-0">
                        <p className="text-[9px] font-black uppercase tracking-[2px] text-neutral-g3">Total records</p>
                        <p className="text-[28px] font-black leading-none mt-1">{reviews.length}</p>
                    </div>
                </div>

                <div className="bg-white border-[2px] border-neutral-black rounded-[6px] shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse min-w-[900px]">
                            <thead>
                                <tr className="bg-neutral-black text-white">
                                    {[
                                        "Customer",
                                        "Order / Product",
                                        "Artist",
                                        "Artist rating",
                                        "Product rating",
                                        "Feedback",
                                        "Date",
                                    ].map((h) => (
                                        <th
                                            key={h}
                                            className="font-display text-[10px] font-black tracking-[2px] uppercase py-5 px-5 text-left whitespace-nowrap"
                                        >
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y-[1px] divide-neutral-black/10">
                                {reviews.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-16 text-center">
                                            <Palette className="w-12 h-12 text-neutral-g3 mx-auto mb-3" />
                                            <p className="font-display text-[12px] font-black uppercase text-neutral-g4 tracking-wide">
                                                No reviews in the system yet.
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    reviews.map((review) => (
                                        <tr key={review.id} className="hover:bg-neutral-g1/40 transition-colors">
                                            <td className="py-4 px-5 align-top">
                                                <div className="font-display text-[13px] font-black text-neutral-black">
                                                    {review.customer.name}
                                                </div>
                                                <div className="font-display text-[10px] font-bold text-neutral-g4 uppercase mt-1 truncate max-w-[180px]">
                                                    {review.customer.email}
                                                </div>
                                            </td>
                                            <td className="py-4 px-5 align-top">
                                                <div className="flex items-start gap-3">
                                                    <div className="w-11 h-11 border-[2px] border-neutral-black rounded-[4px] overflow-hidden bg-neutral-g1 shrink-0">
                                                        <ImageWithSkeleton
                                                            src={review.product.mockupImageUrl}
                                                            alt=""
                                                            className="w-full h-full object-cover"
                                                            wrapperClassName="w-full h-full"
                                                        />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div
                                                            className="font-display text-[12px] font-black text-neutral-black truncate max-w-[200px]"
                                                            title={review.product.name}
                                                        >
                                                            {review.product.name}
                                                        </div>
                                                        <div className="font-display text-[10px] font-bold text-neutral-g4 uppercase mt-1">
                                                            #{review.order.id.slice(0, 8)}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-5 align-top">
                                                <div className="font-display text-[12px] font-black text-neutral-black">
                                                    {review.artist.displayName || review.artist.name}
                                                </div>
                                                <div className="font-display text-[10px] font-bold text-neutral-g4 uppercase mt-1">
                                                    ID {review.artist.id.slice(0, 8)}
                                                </div>
                                            </td>
                                            <td className="py-4 px-5 align-top">
                                                <span className="inline-flex items-center gap-1 font-display text-[11px] font-black uppercase bg-primary border-[2px] border-neutral-black px-2.5 py-1 rounded-[4px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                                    <Star className="w-3.5 h-3.5 fill-neutral-black" />
                                                    {review.artistRating}
                                                </span>
                                            </td>
                                            <td className="py-4 px-5 align-top">
                                                <span className="inline-flex items-center gap-1 font-display text-[11px] font-black uppercase bg-neutral-g1 border-[2px] border-neutral-black px-2.5 py-1 rounded-[4px]">
                                                    <Palette className="w-3.5 h-3.5" />
                                                    {review.productRating}
                                                </span>
                                            </td>
                                            <td className="py-4 px-5 align-top max-w-[240px]">
                                                {review.feedback ? (
                                                    <p
                                                        className="font-body text-[13px] font-medium text-neutral-g4 leading-snug line-clamp-3"
                                                        title={review.feedback}
                                                    >
                                                        {review.feedback}
                                                    </p>
                                                ) : (
                                                    <span className="font-display text-[10px] font-bold uppercase text-neutral-g3">—</span>
                                                )}
                                            </td>
                                            <td className="py-4 px-5 align-top font-display text-[11px] font-bold text-neutral-g4 uppercase whitespace-nowrap">
                                                {new Date(review.createdAt).toLocaleDateString("en-GB", {
                                                    day: "numeric",
                                                    month: "short",
                                                    year: "numeric",
                                                })}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
