import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Star, Loader2, MessageSquare, CheckCircle } from "lucide-react";
import api from "../../api/axios";
import { STOREFRONT_TEE_MOCKUP_IMAGE_CLASS } from "../../utils/productMockup";

interface ReviewableProduct {
    id: string;
    name: string;
    mockupImageUrl: string;
    artist: { id: string; displayName: string | null; name: string };
}

export default function RatePurchase() {
    const { orderId } = useParams<{ orderId: string }>();
    const navigate = useNavigate();
    const [products, setProducts] = useState<ReviewableProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // State for the reviews being formed
    const [reviews, setReviews] = useState<Record<string, { productRating: number; artistRating: number; feedback: string }>>({});

    useEffect(() => {
        const fetchItems = async () => {
            try {
                const res = await api.get(`/api/reviews/order/${orderId}/reviewable`);
                const items = res.data.data.products;
                if (items.length === 0) {
                    setError("All items in this order have already been reviewed or the order is not yet delivered.");
                } else {
                    setProducts(items);
                    const initialReviews: Record<string, { productRating: number; artistRating: number; feedback: string }> = {};
                    items.forEach((p: ReviewableProduct) => {
                        initialReviews[p.id] = { productRating: 0, artistRating: 0, feedback: "" };
                    });
                    setReviews(initialReviews);
                }
            } catch (err: unknown) {
                const message = (err as any).response?.data?.message || "Failed to load reviewable items.";
                setError(message);
            } finally {
                setLoading(false);
            }
        };
        fetchItems();
    }, [orderId]);

    const handleRatingSelect = (productId: string, type: 'productRating' | 'artistRating', value: number) => {
        setReviews(prev => ({
            ...prev,
            [productId]: { ...prev[productId], [type]: value }
        }));
    };

    const handleFeedbackChange = (productId: string, value: string) => {
        setReviews(prev => ({
            ...prev,
            [productId]: { ...prev[productId], feedback: value }
        }));
    };

    const handleSubmit = async () => {
        // Validation: At least artistRating and productRating must be > 0
        const reviewData = products.map(p => ({
            productId: p.id,
            artistId: p.artist.id,
            productRating: reviews[p.id].productRating,
            artistRating: reviews[p.id].artistRating,
            feedback: reviews[p.id].feedback
        }));

        const isInvalid = reviewData.some(r => r.productRating === 0 || r.artistRating === 0);
        if (isInvalid) {
            alert("Please provide both Product Quality and Artist Design ratings for all items.");
            return;
        }

        try {
            setSubmitting(true);
            await api.post(`/api/reviews/order/${orderId}`, { reviews: reviewData });
            setSuccess(true);
            setTimeout(() => {
                navigate("/orders");
            }, 3000);
        } catch (err: unknown) {
            const message = (err as any).response?.data?.message || "Failed to submit reviews.";
            alert(message);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-neutral-g1 flex items-center justify-center pt-24">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (success) {
        return (
            <div className="min-h-[80vh] bg-neutral-g1 flex flex-col items-center justify-center p-8 text-center pt-24">
                <CheckCircle className="w-16 h-16 text-success mb-6" />
                <h1 className="font-display text-[24px] font-black uppercase tracking-[2px] text-neutral-black mb-2">
                    Feedback Received
                </h1>
                <p className="font-display text-[12px] font-bold text-neutral-g4 uppercase">
                    Thank you for helping our artists and improving TeeHive! Redirecting back to your orders...
                </p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-[80vh] bg-neutral-g1 flex flex-col items-center justify-center p-8 text-center pt-24">
                <h1 className="font-display text-[20px] font-black uppercase tracking-[2px] text-danger mb-4">
                    {error}
                </h1>
                <button
                    onClick={() => navigate("/orders")}
                    className="px-6 py-3 bg-white border-[2px] border-neutral-black font-display text-[12px] font-black uppercase tracking-[2px] hover:bg-neutral-g1 transition-colors rounded-[2px]"
                >
                    Back to Orders
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-g1 pt-24 pb-12">
            <div className="max-w-3xl mx-auto px-4 sm:px-6">
                <div className="mb-8 border-b-[2px] border-neutral-black pb-4 text-center">
                    <h1 className="font-display text-[28px] sm:text-[36px] font-black uppercase tracking-[2px] text-neutral-black">
                        Rate Your Purchase
                    </h1>
                    <p className="font-display text-[12px] sm:text-[14px] font-bold uppercase tracking-[1px] text-neutral-g4 mt-2">
                        Help our independent artists grow with your feedback.
                    </p>
                </div>

                <div className="space-y-8">
                    {products.map((product) => (
                        <div key={product.id} className="bg-white border-[2px] border-neutral-black rounded-[4px] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 md:p-8 flex flex-col md:flex-row gap-8 items-start">
                            {/* Product Info */}
                            <div className="w-full md:w-1/3 flex flex-col items-center text-center space-y-4">
                                <div className="w-full aspect-[4/5] bg-neutral-g1 border-[2px] border-neutral-black rounded-[2px] overflow-hidden">
                                    <img
                                        src={product.mockupImageUrl}
                                        alt={product.name}
                                        className={`w-full h-full ${STOREFRONT_TEE_MOCKUP_IMAGE_CLASS}`}
                                    />
                                </div>
                                <div>
                                    <h3 className="font-display text-[14px] font-black uppercase text-neutral-black tracking-[1px] mb-1">
                                        {product.name}
                                    </h3>
                                    <p className="font-display text-[10px] font-bold text-neutral-g4 tracking-[1px] uppercase">
                                        by {product.artist.displayName || product.artist.name}
                                    </p>
                                </div>
                            </div>

                            {/* Ratings Form */}
                            <div className="w-full md:flex-1 space-y-8">
                                {/* Artist Rating (Public) */}
                                <div>
                                    <label className="block font-display text-[12px] font-black uppercase tracking-[1.5px] text-neutral-black mb-3">
                                        Artist Design Rating <span className="text-danger">*</span>
                                    </label>
                                    <p className="font-display text-[10px] font-bold text-neutral-g3 uppercase mb-4 leading-tight">
                                        How much did you love the art? This helps the artist build their reputation.
                                    </p>
                                    <div className="flex gap-2">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                type="button"
                                                onClick={() => handleRatingSelect(product.id, 'artistRating', star)}
                                                className={`p-1 transition-transform hover:scale-110 ${reviews[product.id].artistRating >= star ? 'text-primary' : 'text-neutral-g2'}`}
                                            >
                                                <Star className="w-8 h-8 md:w-10 md:h-10 fill-current" />
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Product Rating (Internal) */}
                                <div className="pt-6 border-t-[1.5px] border-neutral-g2 border-dashed">
                                    <label className="block font-display text-[12px] font-black uppercase tracking-[1.5px] text-neutral-black mb-3">
                                        Product Quality Rating <span className="text-danger">*</span>
                                    </label>
                                    <p className="font-display text-[10px] font-bold text-neutral-g3 uppercase mb-4 leading-tight">
                                        How was the fabric and print quality?
                                    </p>
                                    <div className="flex gap-2">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                type="button"
                                                onClick={() => handleRatingSelect(product.id, 'productRating', star)}
                                                className={`p-1 transition-transform hover:scale-110 ${reviews[product.id].productRating >= star ? 'text-neutral-black' : 'text-neutral-g2'}`}
                                            >
                                                <Star className="w-8 h-8 md:w-10 md:h-10 fill-current" />
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Feedback */}
                                <div className="pt-6 border-t-[1.5px] border-neutral-g2 border-dashed">
                                    <label className="block font-display text-[12px] font-black uppercase tracking-[1.5px] text-neutral-black mb-3">
                                        Written Feedback (Optional)
                                    </label>
                                    <div className="relative">
                                        <MessageSquare className="absolute top-4 left-4 w-5 h-5 text-neutral-g4" />
                                        <textarea
                                            rows={4}
                                            value={reviews[product.id].feedback}
                                            onChange={(e) => handleFeedbackChange(product.id, e.target.value)}
                                            placeholder="Tell the artist what you loved..."
                                            className="w-full p-4 pl-12 bg-neutral-g1 border-[2px] border-neutral-black rounded-[2px] font-body text-[14px] focus:outline-none focus:bg-white resize-none transition-colors"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    <div className="pt-8 flex justify-end">
                        <button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="px-10 py-5 bg-primary text-neutral-black border-[2px] border-neutral-black rounded-[2px] font-display text-[14px] font-black uppercase tracking-[2px] flex items-center justify-center gap-3 disabled:opacity-70 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[4px] hover:translate-x-[4px] transition-all"
                        >
                            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Submit All Reviews"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
