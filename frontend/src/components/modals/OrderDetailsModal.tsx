import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { X, Loader2, Package, User, MapPin, Truck, AlertCircle, Phone, ExternalLink } from "lucide-react";
import api from "../../api/axios";
import ReturnPolicyNote from "../shared/ReturnPolicyNote";

interface OrderDetailsModalProps {
    orderId: string;
    onClose: () => void;
}

export default function OrderDetailsModal({ orderId, onClose }: OrderDetailsModalProps) {
    const [loading, setLoading] = useState(true);
    const [details, setDetails] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
    const [claimStatus, setClaimStatus] = useState("UNDER_REVIEW");
    const [claimReviewNote, setClaimReviewNote] = useState("");
    const [claimSaving, setClaimSaving] = useState(false);
    const [claimFeedback, setClaimFeedback] = useState<string | null>(null);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const res = await api.get(`/api/admin/orders/${orderId}`);
                setDetails(res.data.data);
                if (res.data.data?.returnClaim) {
                    setClaimStatus(
                        res.data.data.returnClaim.status === "OPEN"
                            ? "UNDER_REVIEW"
                            : res.data.data.returnClaim.status
                    );
                    setClaimReviewNote(res.data.data.returnClaim.reviewNote || "");
                }
            } catch (err) {
                console.error(err);
                setError("Failed to load order details");
            } finally {
                setLoading(false);
            }
        };

        fetchDetails();
    }, [orderId]);

    useEffect(() => {
        if (!imagePreviewUrl) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setImagePreviewUrl(null);
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [imagePreviewUrl]);

    const updateReturnClaim = async () => {
        if (!details?.returnClaim) return;
        try {
            setClaimSaving(true);
            setClaimFeedback(null);
            const res = await api.patch(`/api/admin/orders/${orderId}/return-claim`, {
                status: claimStatus,
                reviewNote: claimReviewNote,
            });
            setDetails((prev: any) => ({
                ...prev,
                returnClaim: res.data.data.claim,
            }));
            setClaimFeedback("Return claim updated.");
        } catch (err: any) {
            console.error(err);
            setClaimFeedback(err.response?.data?.message || "Failed to update return claim.");
        } finally {
            setClaimSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-neutral-black/80 backdrop-blur-sm">
            <div className="bg-white border-[2px] border-neutral-black rounded-[6px] w-full max-w-[900px] max-h-[90vh] flex flex-col shadow-[16px_16px_0px_0px_rgba(255,107,0,1)] animate-in fade-in zoom-in duration-200">
                
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b-[2px] border-neutral-black bg-neutral-g1">
                    <div>
                        <div className="inline-flex items-center gap-2 bg-neutral-black text-white px-2 py-1 rounded-[4px] font-display text-[9px] font-black uppercase tracking-[2px] mb-2">
                            <Package className="w-3 h-3 text-primary" /> Logistics Trace
                        </div>
                        <h2 className="font-display text-[24px] font-black uppercase leading-tight tracking-tight">
                            Order <span className="text-primary italic">#{orderId.slice(-6).toUpperCase()}</span>
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-3 bg-white border-[2px] border-neutral-black rounded-full hover:bg-danger hover:text-white transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 text-neutral-black">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 opacity-50">
                            <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                            <p className="font-display text-[10px] font-black uppercase tracking-[2px]">Decrypting transaction...</p>
                        </div>
                    ) : error ? (
                        <div className="bg-red-50 border-[2px] border-red-500 p-6 rounded-[4px] flex items-center gap-4 text-red-500">
                            <AlertCircle className="w-8 h-8" />
                            <div>
                                <p className="font-display text-[12px] font-black uppercase tracking-[1px]">{error}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            
                            {/* Grid: Customer & Meta */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-neutral-g1 p-5 rounded-[4px] border-[2px] border-neutral-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                    <div className="flex items-center gap-2 mb-4 whitespace-nowrap">
                                        <User className="w-4 h-4 text-primary" />
                                        <h3 className="font-display text-[13px] font-black uppercase tracking-[1px]">Customer Intel</h3>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="font-display text-[14px] font-black uppercase break-words">{details.customerName}</p>
                                        <p className="font-display text-[11px] font-bold text-neutral-g4 uppercase break-words">{details.customerEmail}</p>
                                        <p className="font-display text-[11px] font-bold text-neutral-g4 flex items-center gap-2 break-words">
                                            <Phone className="w-3.5 h-3.5 text-primary shrink-0" />
                                            <span>{details.customerPhone?.trim() || "—"}</span>
                                        </p>
                                        <p className="font-display text-[10px] font-bold text-neutral-g4 uppercase pt-2 border-t-[1px] border-neutral-black/10 break-words mt-2">Tx ID: {details.paymentIntentId || "N/A"}</p>
                                        <p className="font-display text-[10px] font-bold text-neutral-g4 uppercase break-words">Date: {new Date(details.date).toLocaleString('en-GB')}</p>
                                    </div>
                                </div>

                                <div className="bg-neutral-g1 p-5 rounded-[4px] border-[2px] border-neutral-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                    <div className="flex items-center gap-2 mb-4 whitespace-nowrap">
                                        <MapPin className="w-4 h-4 text-primary" />
                                        <h3 className="font-display text-[13px] font-black uppercase tracking-[1px]">Fulfillment Coordinates</h3>
                                    </div>
                                    {details.shippingAddress ? (
                                        <div className="space-y-1">
                                            <p className="font-display text-[12px] font-black uppercase break-words">{details.shippingAddress.name}</p>
                                            <p className="font-display text-[11px] font-bold text-neutral-g4 uppercase break-words">{details.shippingAddress.line1}</p>
                                            {details.shippingAddress.line2 && <p className="font-display text-[11px] font-bold text-neutral-g4 uppercase break-words">{details.shippingAddress.line2}</p>}
                                            <p className="font-display text-[11px] font-bold text-neutral-g4 uppercase break-words">{details.shippingAddress.city}, {details.shippingAddress.state} {details.shippingAddress.postalCode}</p>
                                            <p className="font-display text-[11px] font-bold text-neutral-g4 uppercase break-words">{details.shippingAddress.country}</p>
                                        </div>
                                    ) : (
                                        <p className="font-display text-[11px] font-bold text-neutral-g4 uppercase italic">No coordinates provided</p>
                                    )}
                                </div>
                            </div>

                            {/* Line Items */}
                            <div>
                                <h3 className="font-display text-[14px] font-black uppercase border-b-[2px] border-neutral-black pb-2 mb-4 tracking-[1px]">
                                    Line Items (Vendor Routing)
                                </h3>
                                <div className="space-y-4">
                                    {details.items.map((item: any) => (
                                        <div key={item.id} className="flex gap-4 p-4 border-[2px] border-neutral-black bg-white group hover:bg-neutral-g1 transition-colors relative shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]">
                                            {/* Thumbnail */}
                                            <div className="w-20 h-20 bg-neutral-black border-[2px] border-neutral-black flex-shrink-0 overflow-hidden">
                                                {item.mockupImageUrl ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => setImagePreviewUrl(item.mockupImageUrl)}
                                                        className="w-full h-full p-0 block cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
                                                        title="View full size"
                                                    >
                                                        <img src={item.mockupImageUrl} alt={item.productName} className="w-full h-full object-cover" />
                                                    </button>
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center opacity-30">
                                                        <Package className="w-8 h-8 text-white" />
                                                    </div>
                                                )}
                                            </div>
                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-col sm:flex-row justify-between gap-2 items-start">
                                                    <div>
                                                        <h4 className="font-display text-[14px] font-black uppercase truncate">{item.productName}</h4>
                                                        {item.productId && (
                                                            <Link
                                                                to={`/products/${item.productId}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="mt-1 inline-flex items-center gap-1 font-display text-[10px] font-black uppercase text-primary underline underline-offset-2 decoration-2 decoration-primary hover:text-neutral-black hover:decoration-neutral-black"
                                                            >
                                                                <ExternalLink className="w-3 h-3 shrink-0" aria-hidden />
                                                                Storefront product
                                                            </Link>
                                                        )}
                                                        <p className="font-display text-[11px] font-bold text-neutral-g4 uppercase mt-1">Var: {item.variant}</p>
                                                        {Array.isArray(item.designCodesLabeled) && item.designCodesLabeled.length > 0 ? (
                                                            <div className="mt-2 space-y-1">
                                                                <p className="font-display text-[9px] font-black text-neutral-g3 uppercase tracking-wider">
                                                                    Design codes
                                                                </p>
                                                                {item.designCodesLabeled.map(
                                                                    (row: { side: string; code: string }, idx: number) => (
                                                                        <p
                                                                            key={`${row.side}-${row.code}-${idx}`}
                                                                            className="font-display text-[10px] font-black text-neutral-black uppercase tracking-wide"
                                                                        >
                                                                            {row.side === "back" ? "Back" : "Front"}:{" "}
                                                                            <span className="text-primary not-italic">{row.code}</span>
                                                                        </p>
                                                                    )
                                                                )}
                                                            </div>
                                                        ) : Array.isArray(item.designCodes) && item.designCodes.length > 0 ? (
                                                            <p className="font-display text-[10px] font-black text-neutral-black uppercase mt-2 tracking-wide">
                                                                Design code{item.designCodes.length > 1 ? "s" : ""}:{" "}
                                                                <span className="text-primary not-italic">{item.designCodes.join(" · ")}</span>
                                                            </p>
                                                        ) : null}
                                                    </div>
                                                    <div className="text-left sm:text-right">
                                                        <p className="font-display text-[14px] font-black italic">₹{item.totalPrice.toLocaleString('en-IN')}</p>
                                                        <p className="font-display text-[10px] font-bold text-neutral-g4 uppercase mt-1">{item.quantity} × ₹{item.unitPrice.toLocaleString('en-IN')}</p>
                                                    </div>
                                                </div>
                                                
                                                {/* Artist Matrix */}
                                                <div className="mt-4 flex items-center justify-between border-t-[1px] border-neutral-black/10 pt-3">
                                                    <div className="font-display text-[10px] font-black uppercase">
                                                        Artist: <span className="text-primary italic">{item.artistName}</span>
                                                    </div>
                                                    <div className="font-display text-[10px] font-black uppercase text-success flex items-center gap-1 bg-success/10 px-2 py-1 border-[1px] border-success/30 rounded-[2px]">
                                                        Commission (25%): <span className="font-bold">₹{item.commission.toLocaleString('en-IN')}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Financial Breakdown */}
                            <div className="bg-neutral-black text-white p-6 border-[2px] border-neutral-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
                                <Truck className="absolute -bottom-4 -right-4 w-32 h-32 opacity-5 pointer-events-none" />
                                <h3 className="font-display text-[16px] font-black uppercase tracking-[2px] text-primary mb-6 border-b-[1px] border-white/20 pb-3">
                                    Financial Split Protocol
                                </h3>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                                    {/* Left: General */}
                                    <div className="space-y-3">
                                        <div className="flex justify-between font-display text-[11px] font-bold uppercase tracking-wider text-neutral-g4">
                                            <span>Subtotal</span>
                                            <span>₹{details.breakdown.subtotal.toLocaleString('en-IN')}</span>
                                        </div>
                                        <div className="flex justify-between font-display text-[11px] font-bold uppercase tracking-wider text-neutral-g4">
                                            <span>Shipping</span>
                                            <span className="text-success border-[1px] border-success px-1">₹{details.breakdown.shippingFee.toLocaleString('en-IN')}</span>
                                        </div>
                                        {details.breakdown.discount > 0 && (
                                            <div className="flex justify-between font-display text-[11px] font-bold uppercase tracking-wider text-white">
                                                <span>Discount Code</span>
                                                <span className="text-primary">-₹{details.breakdown.discount.toLocaleString('en-IN')}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between font-display text-[16px] font-black uppercase pt-4 border-t-[1px] border-white/20 mt-2">
                                            <span>Customer Paid</span>
                                            <span className="text-primary">₹{details.breakdown.customerTotal.toLocaleString('en-IN')}</span>
                                        </div>
                                    </div>

                                    {/* Right: Revenue Split */}
                                    <div className="space-y-4">
                                        <h4 className="font-display text-[10px] font-black text-white/50 uppercase tracking-[2px]">Vendor Payouts (25% Retail)</h4>
                                        <div className="space-y-2">
                                            {details.breakdown.artistPayouts.map((payout: any) => (
                                                <div key={payout.artistId} className="flex justify-between font-display text-[12px] font-bold uppercase bg-white/5 p-2 border-[1px] border-white/10 rounded-[2px]">
                                                    <span className="text-primary italic">{payout.artistName} <span className="text-white/40 text-[9px] not-italic ml-1">({payout.itemCount} items)</span></span>
                                                    <span className="font-black text-success">₹{payout.amount.toLocaleString('en-IN')}</span>
                                                </div>
                                            ))}
                                            {details.breakdown.artistPayouts.length === 0 && (
                                                <div className="font-display text-[10px] text-danger uppercase opacity-80">No vendor payouts detected</div>
                                            )}
                                        </div>
                                        
                                        <div className="flex justify-between font-display text-[14px] font-black uppercase pt-4 border-t-[1px] border-white/20">
                                            <span className="text-neutral-g4">TeeHive Platform Margin</span>
                                            <span className="text-white">₹{details.breakdown.platformMargin.toLocaleString('en-IN')}</span>
                                        </div>
                                        <p className="font-display text-[8px] text-neutral-g4 uppercase opacity-50 block mt-1 leading-tight">
                                            * Platform Margin represents total remaining revenue after deducting all combined artist payouts and applicable discounts. Operational/manufacturing fees are deducted from this margin.
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <ReturnPolicyNote variant="admin" />

                            {details.returnClaim && (
                                <div className="bg-white border-[2px] border-neutral-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                                    <h3 className="font-display text-[16px] font-black uppercase tracking-[2px] text-primary mb-6 border-b-[1px] border-neutral-black/10 pb-3">
                                        Return Claim Review
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                            <div className="font-display text-[11px] font-black uppercase">
                                                Reason: {details.returnClaim.reason.replaceAll("_", " ")}
                                            </div>
                                            <div className="font-display text-[10px] font-black uppercase text-neutral-g4">
                                                Submitted: {new Date(details.returnClaim.requestedAt).toLocaleString("en-GB")}
                                            </div>
                                        </div>
                                        <p className="font-display text-[11px] font-bold uppercase text-neutral-black leading-relaxed">
                                            {details.returnClaim.description}
                                        </p>
                                        {details.returnClaim.evidenceUrls?.length ? (
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                                {details.returnClaim.evidenceUrls.map((url: string) => (
                                                    <button
                                                        key={url}
                                                        type="button"
                                                        onClick={() => setImagePreviewUrl(url)}
                                                        className="border-[2px] border-neutral-black rounded-[2px] overflow-hidden bg-neutral-g1"
                                                    >
                                                        <img src={url} alt="" className="w-full h-28 object-cover" />
                                                    </button>
                                                ))}
                                            </div>
                                        ) : null}
                                        <div className="grid grid-cols-1 gap-4 pt-2">
                                            <select
                                                value={claimStatus}
                                                onChange={(e) => setClaimStatus(e.target.value)}
                                                className="w-full px-4 py-3 border-[2px] border-neutral-black rounded-[4px] bg-neutral-g1 font-display text-[11px] font-black uppercase"
                                            >
                                                {["UNDER_REVIEW", "APPROVED", "REJECTED", "REFUNDED"].map((status) => (
                                                    <option key={status} value={status}>
                                                        {status.replaceAll("_", " ")}
                                                    </option>
                                                ))}
                                            </select>
                                            <textarea
                                                value={claimReviewNote}
                                                onChange={(e) => setClaimReviewNote(e.target.value)}
                                                placeholder="Add review note for the customer or ops team..."
                                                className="w-full min-h-[110px] px-4 py-3 border-[2px] border-neutral-black rounded-[4px] bg-white font-display text-[11px] font-black uppercase"
                                            />
                                            {claimFeedback && (
                                                <div className="font-display text-[10px] font-black uppercase text-neutral-g4">
                                                    {claimFeedback}
                                                </div>
                                            )}
                                            <button
                                                type="button"
                                                onClick={updateReturnClaim}
                                                disabled={claimSaving}
                                                className="w-full py-3 bg-primary border-[2px] border-neutral-black rounded-[4px] font-display text-[11px] font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] disabled:opacity-40"
                                            >
                                                {claimSaving ? "Saving..." : "Update Return Claim"}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                        </div>
                    )}
                </div>
            </div>

            {imagePreviewUrl && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-label="Product image preview"
                    className="fixed inset-0 z-[110] flex items-center justify-center bg-neutral-black/95 p-4 sm:p-8"
                    onClick={() => setImagePreviewUrl(null)}
                >
                    <button
                        type="button"
                        onClick={() => setImagePreviewUrl(null)}
                        className="absolute top-4 right-4 p-3 bg-white border-[2px] border-neutral-black rounded-full hover:bg-danger hover:text-white transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] z-[120]"
                        aria-label="Close preview"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    <img
                        src={imagePreviewUrl}
                        alt=""
                        className="max-w-full max-h-[min(92vh,100%)] w-auto h-auto object-contain border-[2px] border-white/20 shadow-[8px_8px_0px_0px_rgba(255,107,0,0.5)]"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </div>
    );
}
