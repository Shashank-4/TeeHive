import { useLocation, Link } from "react-router-dom";
import {
    CheckCircle,
    Package,
    ArrowRight,
    ShoppingBag,
    Receipt,
    ShieldCheck,
    Clock3,
    AlertTriangle,
} from "lucide-react";
import { Button } from "../../components/ui/Button";
import ReturnPolicyNote from "../../components/shared/ReturnPolicyNote";

export default function OrderConfirmation() {
    const location = useLocation();
    const state = location.state as {
        orderId?: string;
        total?: number;
        items?: any[];
        shippingAddress?: any;
        paymentStatus?: "success" | "pending" | "failed";
        paymentId?: string;
    } | null;

    const paymentStatus = state?.paymentStatus || "pending";
    const isSuccess = paymentStatus === "success";
    const isFailed = paymentStatus === "failed";
    const isPending = paymentStatus === "pending";
    const titleAccent = isSuccess ? "SUCCESSFUL" : isFailed ? "FAILED" : "PENDING";

    const accentShadowClass = isSuccess
        ? "text-primary italic [text-shadow:0.08em_0.08em_0_rgb(10,10,10),0_0.04em_0_rgb(10,10,10),0_0.35em_0.65em_rgba(0,0,0,0.22),0_0_1.1em_rgba(34,197,94,0.48)]"
        : isFailed
          ? "text-danger italic [text-shadow:0.08em_0.08em_0_rgb(10,10,10),0_0.04em_0_rgb(10,10,10),0_0.35em_0.65em_rgba(0,0,0,0.25),0_0_1.1em_rgba(229,57,53,0.52)]"
          : isPending
            ? "text-primary italic [text-shadow:0.08em_0.08em_0_rgb(10,10,10),0_0.04em_0_rgb(10,10,10),0_0.35em_0.65em_rgba(0,0,0,0.22),0_0_1.1em_rgba(255,222,0,0.45)]"
            : "text-primary italic";
    const titleLead = isSuccess ? "PAYMENT" : isFailed ? "PAYMENT" : "ORDER";
    const statusIcon = isSuccess ? (
        <CheckCircle className="w-9 h-9 text-neutral-black stroke-[2]" />
    ) : isFailed ? (
        <AlertTriangle className="w-9 h-9 text-neutral-black stroke-[2]" />
    ) : (
        <Clock3 className="w-9 h-9 text-neutral-black stroke-[2]" />
    );
    const helperCopy = isSuccess
        ? "Payment verified. Your order is confirmed and queued for fulfillment."
        : isFailed
          ? "Your payment did not complete. No fulfillment will start until a successful payment is recorded."
          : "Your order reference was created. Payment confirmation may still be syncing.";

    const summaryCard =
        state?.orderId ? (
            <div className="bg-white border-[3px] border-neutral-black rounded-[4px] p-5 sm:p-6 text-left shadow-[6px_6px_0px_0px_rgba(255,222,0,1)] relative overflow-hidden group hover:shadow-[4px_4px_0px_0px_rgba(255,222,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 transition-all duration-300">
                <div className="absolute top-0 right-0 p-3 opacity-[0.04] pointer-events-none">
                    <Receipt className="w-32 h-32" />
                </div>

                <div className="flex items-center gap-3 mb-4 pb-4 border-b-[2px] border-neutral-black/8 relative z-10">
                    <div className="w-9 h-9 bg-neutral-black text-primary rounded-[4px] flex items-center justify-center shrink-0 border-[2px] border-neutral-black">
                        <Package className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                        <h3 className="font-display text-[14px] sm:text-[15px] font-black text-neutral-black uppercase tracking-tight leading-none">
                            Order summary
                        </h3>
                        <p className="font-display text-[8px] font-bold text-neutral-black/35 uppercase tracking-[2px] mt-1">
                            Reference & totals
                        </p>
                    </div>
                </div>

                <div className="space-y-3.5 relative z-10">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-display text-[9px] font-black text-neutral-black/35 uppercase tracking-[2px] shrink-0">
                            Order ref
                        </span>
                        <span className="font-display text-[12px] sm:text-[13px] font-black text-neutral-black tracking-[2px] uppercase bg-neutral-g1 border-[2px] border-neutral-black px-2.5 py-1 rounded-[2px] truncate max-w-full">
                            #{state.orderId.slice(-12).toUpperCase()}
                        </span>
                    </div>

                    {state.paymentId && (
                        <div className="flex flex-wrap items-start justify-between gap-2">
                            <span className="font-display text-[9px] font-black text-neutral-black/35 uppercase tracking-[2px] shrink-0 pt-0.5">
                                Payment ref
                            </span>
                            <span className="font-display text-[10px] sm:text-[11px] font-black text-neutral-black tracking-wide uppercase bg-neutral-g1 border-[2px] border-neutral-black px-2.5 py-1 rounded-[2px] break-all text-right max-w-[min(100%,220px)]">
                                {state.paymentId}
                            </span>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 pt-3 border-t border-neutral-black/8">
                        <div>
                            <span className="font-display text-[9px] font-black text-neutral-black/35 uppercase tracking-[2px] block mb-1">
                                Total
                            </span>
                            <div className="font-display text-[22px] sm:text-[24px] font-black text-neutral-black italic leading-none">
                                ₹{state.total?.toLocaleString("en-IN")}
                            </div>
                        </div>
                        <div>
                            <span className="font-display text-[9px] font-black text-neutral-black/35 uppercase tracking-[2px] block mb-1">
                                Items
                            </span>
                            <div className="font-display text-[22px] sm:text-[24px] font-black text-neutral-black italic leading-none">
                                {state.items?.length || 0}
                                <span className="text-[10px] not-italic opacity-40 font-black ml-1 uppercase">units</span>
                            </div>
                        </div>
                    </div>

                    {state.shippingAddress && (
                        <div className="pt-3 border-t border-neutral-black/8">
                            <span className="font-display text-[9px] font-black text-neutral-black/35 uppercase tracking-[2px] block mb-2">
                                Ship to
                            </span>
                            <div className="font-display text-[11px] font-bold text-neutral-black uppercase leading-snug p-3 bg-neutral-g1/80 border-l-[3px] border-primary rounded-[2px]">
                                {state.shippingAddress.name ||
                                    `${state.shippingAddress.firstName || ""} ${state.shippingAddress.lastName || ""}`.trim()}
                                <br />
                                {state.shippingAddress.city}, {state.shippingAddress.state} — India
                            </div>
                        </div>
                    )}
                </div>
            </div>
        ) : null;

    return (
        <div className="bg-neutral-g1 text-neutral-black font-body min-h-[calc(100dvh-4.25rem)] sm:min-h-[calc(100dvh-4.75rem)] flex flex-col justify-center py-4 sm:py-6 px-4 sm:px-6 overflow-x-hidden relative">
            <div className="absolute top-2 right-2 sm:top-4 sm:right-6 text-[clamp(80px,18vw,160px)] font-display font-black text-neutral-black/[0.03] select-none leading-none pointer-events-none uppercase italic">
                ok
            </div>

            <div className="w-full max-w-5xl mx-auto relative z-10 flex flex-col justify-center min-h-0">
                <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] gap-6 lg:gap-8 items-center">
                    {/* Status + actions */}
                    <div className="text-center lg:text-left flex flex-col items-center lg:items-start gap-4 lg:gap-5">
                        <div className="w-[4.5rem] h-[4.5rem] sm:w-20 sm:h-20 bg-primary border-[3px] border-neutral-black rounded-[4px] flex items-center justify-center shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] shrink-0">
                            {statusIcon}
                        </div>

                        <div>
                            <h1 className="font-display text-[clamp(26px,6vw,44px)] font-black text-neutral-black leading-[0.95] uppercase tracking-tight">
                                {titleLead}{" "}
                                <span className={accentShadowClass}>{titleAccent}</span>
                            </h1>
                            <p className="font-display text-[11px] sm:text-[12px] font-bold text-neutral-black/55 uppercase tracking-[1.5px] leading-snug mt-3 max-w-md mx-auto lg:mx-0">
                                {helperCopy}
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-5 gap-y-2 opacity-50">
                            <div className="flex items-center gap-1.5 font-display text-[8px] font-black uppercase tracking-[2px]">
                                <ShieldCheck className="w-3 h-3 text-success shrink-0" /> Secured
                            </div>
                            <div className="flex items-center gap-1.5 font-display text-[8px] font-black uppercase tracking-[2px]">
                                <ShoppingBag className="w-3 h-3 text-primary shrink-0" /> TeeHive
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md lg:max-w-none pt-1">
                            <Link to="/orders" className="flex-1 no-underline min-w-0">
                                <Button variant="dark" size="lg" className="w-full text-[11px] sm:text-xs">
                                    {isSuccess ? "Track order" : "View orders"}{" "}
                                    <ArrowRight className="w-4 h-4 ml-1.5 inline" />
                                </Button>
                            </Link>
                            <Link to="/products" className="flex-1 no-underline min-w-0">
                                <Button variant="outline" size="lg" className="w-full text-[11px] sm:text-xs">
                                    Continue shopping
                                </Button>
                            </Link>
                        </div>
                    </div>

                    {/* Summary + policy */}
                    <div className="flex flex-col gap-4 min-h-0 w-full max-w-md mx-auto lg:max-w-none lg:mx-0">
                        {summaryCard}
                        <ReturnPolicyNote className="text-left p-3 [&_p]:text-[9px] [&_div]:text-[9px]" />
                    </div>
                </div>

                {!state?.orderId && (
                    <p className="font-display text-[10px] font-bold uppercase tracking-[2px] text-neutral-black/40 text-center mt-6">
                        No order details in session — open this page from checkout or view orders in your account.
                    </p>
                )}
            </div>
        </div>
    );
}
