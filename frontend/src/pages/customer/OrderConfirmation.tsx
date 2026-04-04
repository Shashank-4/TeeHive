import { useLocation, Link } from "react-router-dom";
import { CheckCircle, Package, ArrowRight, ShoppingBag, Receipt, Zap, ShieldCheck, Clock3, AlertTriangle } from "lucide-react";
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
    const titleAccent = isSuccess ? "SUCCESSFUL" : paymentStatus === "failed" ? "FAILED" : "PENDING";
    const titleLead = isSuccess ? "PAYMENT" : paymentStatus === "failed" ? "PAYMENT" : "ORDER";
    const statusIcon = isSuccess ? (
        <CheckCircle className="w-14 h-14 text-neutral-black" />
    ) : paymentStatus === "failed" ? (
        <AlertTriangle className="w-14 h-14 text-neutral-black" />
    ) : (
        <Clock3 className="w-14 h-14 text-neutral-black" />
    );
    const helperCopy = isSuccess
        ? "Payment verified. Your order is confirmed and queued for fulfillment."
        : paymentStatus === "failed"
          ? "Your payment did not complete. No fulfillment will start until a successful payment is recorded."
          : "Your order reference was created. Payment confirmation may still be syncing.";

    return (
        <div className="min-h-screen bg-neutral-g1 flex items-center justify-center px-6 py-24 relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 text-[350px] font-display font-black text-neutral-black/[0.02] select-none leading-none -z-0 pointer-events-none uppercase italic">SUCCESS</div>

            <div className="max-w-2xl w-full relative z-10 text-center">
                {/* Success Tactical Area */}
                <div className="relative inline-block mb-10 group">
                    <div className="w-28 h-28 bg-primary border-[3px] border-neutral-black rounded-[4px] flex items-center justify-center mx-auto shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] relative z-10 transition-transform group-hover:rotate-[-4deg]">
                        {statusIcon}
                    </div>
                    <div className="absolute -top-3 -right-3 w-10 h-10 bg-white border-[2.5px] border-neutral-black rounded-full flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-20 animate-bounce">
                        <Zap className="w-5 h-5 text-primary" fill="currentColor" />
                    </div>
                </div>

                <h1 className="font-display text-[clamp(42px,6vw,72px)] font-black text-neutral-black leading-[0.85] uppercase tracking-tight mb-6">
                    {titleLead} <br />
                    <span className="text-primary italic">{titleAccent}</span>
                </h1>

                <div className="max-w-[480px] mx-auto mb-16 space-y-4">
                    <p className="font-display text-[15px] font-bold text-neutral-black/60 uppercase tracking-[2px] leading-relaxed">
                        {helperCopy}
                    </p>
                    <div className="flex items-center justify-center gap-6 opacity-40">
                        <div className="flex items-center gap-2 font-display text-[9px] font-black uppercase tracking-[3px]">
                            <ShieldCheck className="w-3.5 h-3.5 text-success" /> SECURED_CHANNEL
                        </div>
                        <div className="flex items-center gap-2 font-display text-[9px] font-black uppercase tracking-[3px]">
                            <ShoppingBag className="w-3.5 h-3.5 text-primary" /> AUTH_ORIGIN
                        </div>
                    </div>
                </div>

                {/* Order Summary Tactical Board */}
                {state?.orderId && (
                    <div className="bg-white border-[3.5px] border-neutral-black rounded-[4px] p-10 mb-16 text-left shadow-[14px_14px_0px_0px_rgba(255,222,0,1)] relative overflow-hidden group hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all duration-300">
                        <div className="absolute top-[-20%] right-[-10%] p-4 opacity-[0.03] transition-transform group-hover:scale-110">
                            <Receipt className="w-64 h-64" />
                        </div>

                        <div className="flex items-center gap-4 mb-10 pb-6 border-b-[2px] border-neutral-black/5">
                            <div className="w-10 h-10 bg-neutral-black text-primary rounded-[4px] flex items-center justify-center">
                                <Package className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-display text-[18px] font-black text-neutral-black uppercase tracking-tight leading-none">Logistics Manifest</h3>
                                <p className="font-display text-[9px] font-bold text-neutral-black/30 uppercase tracking-[2px] mt-1">Order Summary Data</p>
                            </div>
                        </div>

                        <div className="space-y-6 relative z-10">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                                <span className="font-display text-[11px] font-black text-neutral-black/20 uppercase tracking-[2px]">ORDER_REF:</span>
                                <span className="font-display text-[16px] font-black text-neutral-black tracking-[4px] uppercase bg-neutral-g1 border-[2px] border-neutral-black px-4 py-1.5 rounded-[2px] italic">
                                    #{state.orderId.slice(-12).toUpperCase()}
                                </span>
                            </div>

                            {state.paymentId && (
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                                    <span className="font-display text-[11px] font-black text-neutral-black/20 uppercase tracking-[2px]">PAYMENT_REF:</span>
                                    <span className="font-display text-[13px] font-black text-neutral-black tracking-[2px] uppercase bg-neutral-g1 border-[2px] border-neutral-black px-4 py-1.5 rounded-[2px]">
                                        {state.paymentId}
                                    </span>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-8 pt-4 border-t-[1.5px] border-neutral-black/5">
                                <div>
                                    <span className="font-display text-[11px] font-black text-neutral-black/20 uppercase tracking-[2px]">PAYMENT_TOTAL:</span>
                                    <div className="font-display text-[28px] font-black text-neutral-black italic">₹{state.total?.toLocaleString('en-IN')}</div>
                                </div>
                                <div>
                                    <span className="font-display text-[11px] font-black text-neutral-black/20 uppercase tracking-[2px]">SYNC_QTY:</span>
                                    <div className="font-display text-[28px] font-black text-neutral-black italic">{state.items?.length || 0} <span className="text-[12px] not-italic opacity-30">UNITS</span></div>
                                </div>
                            </div>

                            {state.shippingAddress && (
                                <div className="pt-6 border-t-[1.5px] border-neutral-black/5">
                                    <span className="font-display text-[11px] font-black text-neutral-black/20 uppercase tracking-[2px] block mb-3">DESTINATION_HUB:</span>
                                    <div className="font-display text-[13px] font-bold text-neutral-black uppercase leading-relaxed p-4 bg-neutral-g1/50 border-l-[4px] border-primary">
                                        {state.shippingAddress.name || `${state.shippingAddress.firstName || ""} ${state.shippingAddress.lastName || ""}`.trim()}<br />
                                        {state.shippingAddress.city}, {state.shippingAddress.state} - INDIA
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <ReturnPolicyNote className="mb-12 text-left" />

                {/* Tactical Actions */}
                <div className="flex flex-col sm:flex-row gap-8 justify-center items-center">
                    <Link to="/orders" className="w-full sm:w-auto no-underline">
                        <Button variant="dark" size="lg" className="w-full">
                            {isSuccess ? "Track Order" : "View Orders"} <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>
                    </Link>
                    <Link to="/products" className="w-full sm:w-auto no-underline">
                        <Button variant="outline" size="lg" className="w-full">
                            Continue Shopping
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
