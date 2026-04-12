import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    Package,
    Truck,
    CheckCircle,
    Clock,
    XCircle,
    ChevronDown,
    ChevronUp,
    ShoppingBag,
    Zap,
    ArrowRight,
    Shield,
    Box,
    TruckIcon,
    MapPin,
} from "lucide-react";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import Loader from "../../components/shared/Loader";
import { Button } from "../../components/ui/Button";
import ReturnPolicyNote from "../../components/shared/ReturnPolicyNote";
import Toast from "../../components/shared/Toast";
import { STOREFRONT_TEE_MOCKUP_IMAGE_CLASS } from "../../utils/productMockup";

interface OrderItem {
    id: string;
    quantity: number;
    price: number;
    size: string;
    color: string;
    product: {
        id: string;
        name: string;
        mockupImageUrl: string;
        artist: { id: string; name: string };
    };
}

interface Order {
    id: string;
    totalAmount: number;
    status: string;
    createdAt: string;
    items: OrderItem[];
    shippingAddress: {
        name: string;
        line1: string;
        city: string;
        state: string;
        postalCode: string;
        country: string;
    } | null;
    returnClaim: {
        id: string;
        reason: string;
        status: string;
        description: string;
        evidenceUrls: string[];
        requestedAt: string;
        reviewedAt: string | null;
        reviewNote: string | null;
    } | null;
    returnClaimEligibility: {
        eligible: boolean;
        message: string;
        deadline: string | null;
        policyWindowDays: number;
    };
}

interface ClaimFormState {
    reason: string;
    description: string;
    evidence: File[];
}

const RETURN_CLAIM_REASON_OPTIONS = [
    { value: "DAMAGED_GOODS", label: "Damaged goods" },
    { value: "WRONG_PRODUCT", label: "Wrong product delivered" },
    { value: "WRONG_SIZE", label: "Wrong size delivered" },
    { value: "WRONG_COLOR", label: "Wrong color delivered" },
    { value: "OTHER_ELIGIBLE_ISSUE", label: "Other eligible issue" },
];

export default function CustomerOrders() {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
    const [claimFormOpenOrder, setClaimFormOpenOrder] = useState<string | null>(null);
    const [claimForms, setClaimForms] = useState<Record<string, ClaimFormState>>({});
    const [claimSubmitting, setClaimSubmitting] = useState<Record<string, boolean>>({});
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

    useEffect(() => {
        if (!isAuthenticated) {
            navigate("/login");
            return;
        }
        fetchOrders();
    }, [isAuthenticated, navigate]);

    const fetchOrders = async () => {
        try {
            setIsLoading(true);
            const res = await api.get("/api/orders/my-orders");
            setOrders(res.data.data.orders);
        } catch (error) {
            console.error("Failed to fetch orders:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const getClaimForm = (orderId: string): ClaimFormState =>
        claimForms[orderId] || {
            reason: "DAMAGED_GOODS",
            description: "",
            evidence: [],
        };

    const handleClaimFieldChange = (
        orderId: string,
        field: keyof ClaimFormState,
        value: string | File[]
    ) => {
        setClaimForms((prev) => ({
            ...prev,
            [orderId]: {
                ...getClaimForm(orderId),
                [field]: value,
            },
        }));
    };

    const submitReturnClaim = async (orderId: string) => {
        const form = getClaimForm(orderId);
        if (form.description.trim().length < 20) {
            setToast({
                message: "Please describe the issue in at least 20 characters.",
                type: "error",
            });
            return;
        }

        try {
            setClaimSubmitting((prev) => ({ ...prev, [orderId]: true }));
            const payload = new FormData();
            payload.append("reason", form.reason);
            payload.append("description", form.description.trim());
            form.evidence.slice(0, 3).forEach((file) => payload.append("evidence", file));

            await api.post(`/api/orders/${orderId}/return-claim`, payload, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            setToast({
                message: "Return claim submitted for review.",
                type: "success",
            });
            setClaimFormOpenOrder(null);
            await fetchOrders();
        } catch (error: any) {
            setToast({
                message:
                    error.response?.data?.message || "Failed to submit the return claim.",
                type: "error",
            });
        } finally {
            setClaimSubmitting((prev) => ({ ...prev, [orderId]: false }));
        }
    };

    const returnClaimStatusClass = (status: string) => {
        const s = status?.toUpperCase();
        if (s === "OPEN" || s === "UNDER_REVIEW") return "bg-primary/10 text-neutral-black border-primary";
        if (s === "APPROVED" || s === "REFUNDED") return "bg-success/10 text-success border-success";
        if (s === "REJECTED") return "bg-danger/10 text-danger border-danger";
        return "bg-neutral-g2 text-neutral-g4 border-neutral-g3";
    };

    const getStatusStyles = (status: string) => {
        const s = status?.toUpperCase();
        switch (s) {
            case "PENDING":
                return { icon: Clock, bg: "bg-warning/10", text: "text-warning", border: "border-warning", label: "Payment pending" };
            case "PAID":
                return { icon: CheckCircle, bg: "bg-primary/10", text: "text-primary-dark", border: "border-primary", label: "Order confirmed" };
            case "RECEIVED":
                return { icon: Box, bg: "bg-blue-500/10", text: "text-blue-500", border: "border-blue-500", label: "Received at studio" };
            case "PROCESSING":
                return { icon: Zap, bg: "bg-amber-500/10", text: "text-amber-600", border: "border-amber-500", label: "In production" };
            case "SHIPPED":
                return { icon: TruckIcon, bg: "bg-neutral-black/10", text: "text-neutral-black", border: "border-neutral-black", label: "Shipped" };
            case "OUT_FOR_DELIVERY":
                return { icon: MapPin, bg: "bg-indigo-500/10", text: "text-indigo-600", border: "border-indigo-500", label: "Out for delivery" };
            case "DELIVERED":
                return { icon: CheckCircle, bg: "bg-success/10", text: "text-success", border: "border-success", label: "Delivered" };
            case "CANCELLED":
                return { icon: XCircle, bg: "bg-danger/10", text: "text-danger", border: "border-danger", label: "Cancelled" };
            default:
                return { icon: Package, bg: "bg-neutral-g2", text: "text-neutral-g4", border: "border-neutral-g3", label: "Status updating" };
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-[50vh] bg-neutral-g1 flex items-center justify-center">
                <Loader />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-g1 py-10 sm:py-14 px-4 md:px-10 lg:px-16 relative overflow-hidden">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            <div className="absolute top-4 right-4 md:right-10 text-[clamp(72px,14vw,200px)] font-display font-black text-neutral-black/[0.03] select-none leading-none pointer-events-none uppercase">
                orders
            </div>

            <div className="max-w-5xl mx-auto relative z-10">
                <header className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 mb-10 pb-8 border-b-[3px] border-neutral-black">
                    <div className="space-y-4 max-w-2xl">
                        <Link
                            to="/user/profile"
                            className="inline-flex items-center gap-2 text-neutral-black/45 hover:text-neutral-black font-display text-[10px] font-black uppercase tracking-[2px] no-underline group transition-colors"
                        >
                            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
                            Back to profile
                        </Link>
                        <h1 className="font-display text-[clamp(32px,5vw,52px)] font-black text-neutral-black leading-[0.95] tracking-tight uppercase">
                            My <span className="text-primary italic">Orders</span>
                        </h1>
                        <p className="font-body text-[14px] sm:text-[15px] text-neutral-black/60 leading-relaxed uppercase tracking-normal">
                            Track every TeeHive purchase in one place: artist-designed tees and apparel, payment status, production updates, and delivery across India.
                        </p>
                    </div>

                    <div className="flex items-center gap-5 bg-white border-[3px] border-neutral-black p-4 rounded-[4px] shadow-[6px_6px_0px_0px_rgba(255,222,0,1)] shrink-0 self-start lg:self-auto">
                        <div className="text-right">
                            <div className="font-display text-[22px] font-black text-neutral-black leading-none">{orders.length}</div>
                            <div className="font-display text-[9px] font-black text-neutral-black/40 uppercase tracking-[2px] mt-1">
                                {orders.length === 1 ? "Order" : "Orders"}
                            </div>
                        </div>
                        <div className="w-px h-10 bg-neutral-black/15" />
                        <Package className="w-8 h-8 text-primary shrink-0" aria-hidden />
                    </div>
                </header>

                {/* ── ORDERS LIST ── */}
                {orders.length === 0 ? (
                    <div className="bg-white border-[3px] border-neutral-black border-dashed rounded-[4px] p-10 sm:p-16 text-center space-y-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.06)]">
                        <div className="w-20 h-20 bg-primary/15 border-[3px] border-neutral-black rounded-[4px] flex items-center justify-center mx-auto">
                            <ShoppingBag className="w-9 h-9 text-neutral-black/50" aria-hidden />
                        </div>
                        <div className="space-y-3 max-w-md mx-auto">
                            <h2 className="font-display text-[26px] sm:text-[30px] font-black text-neutral-black uppercase tracking-tight">
                                No orders yet
                            </h2>
                            <p className="font-body text-[14px] text-neutral-black/55 leading-relaxed uppercase">
                                Shop independent artist merch on TeeHive—your order history, tracking, and receipts will appear here after checkout.
                            </p>
                        </div>
                        <Link to="/products" className="inline-block no-underline">
                            <Button variant="primary" className="px-8 sm:px-10">
                                Browse products <ArrowRight className="w-4 h-4" />
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {orders.map((order) => {
                            const status = getStatusStyles(order.status);
                            const StatusIcon = status.icon;
                            const isExpanded = expandedOrder === order.id;

                            return (
                                <div
                                    key={order.id}
                                    className={`bg-white border-[3px] border-neutral-black rounded-[4px] transition-all duration-300 ${isExpanded ? "shadow-[4px_4px_0px_0px_rgba(255,222,0,0.35)]" : "shadow-[8px_8px_0px_0px_rgba(255,222,0,1)]"}`}
                                >
                                    {/* Order Row Header */}
                                    <button
                                        onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                                        className="w-full text-left p-6 sm:p-8 md:p-9 flex flex-col md:flex-row md:items-center justify-between gap-8 hover:bg-neutral-g1/80 transition-colors group"
                                    >
                                        <div className="flex items-center gap-8">
                                            <div className={`w-16 h-16 ${status.bg} ${status.text} border-[2.5px] ${status.border} rounded-[4px] flex items-center justify-center rotate-[-4deg] group-hover:rotate-0 transition-all`}>
                                                <StatusIcon className="w-8 h-8" />
                                            </div>
                                            <div className="space-y-1">
                                                <div className="font-display text-[10px] font-black text-neutral-black/40 uppercase tracking-[2px]">
                                                    Ordered{" "}
                                                    {new Date(order.createdAt).toLocaleDateString("en-IN", {
                                                        day: "2-digit",
                                                        month: "short",
                                                        year: "numeric",
                                                    })}
                                                </div>
                                                <div className="font-display text-[22px] sm:text-[24px] font-black text-neutral-black uppercase tracking-tight leading-none group-hover:text-primary transition-colors">
                                                    Order #{order.id.slice(-8).toUpperCase()}
                                                </div>
                                                <div className={`inline-flex items-center gap-2 font-display text-[10px] font-black uppercase tracking-[1.5px] ${status.text}`}>
                                                    <span className={`inline-block w-1.5 h-1.5 rounded-full ${status.bg.replace("/10", "/40")}`} aria-hidden />
                                                    <span className="normal-case tracking-normal font-bold">{status.label}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between md:justify-end gap-12 w-full md:w-auto">
                                            <div className="text-right">
                                                <div className="font-display text-[28px] font-black text-neutral-black italic">₹{order.totalAmount.toLocaleString('en-IN')}</div>
                                                <div className="font-display text-[10px] font-black text-neutral-black/30 uppercase tracking-[2px] mt-1">
                                                    Total
                                                </div>
                                            </div>
                                            <div className="w-10 h-10 border-[2.5px] border-neutral-black rounded-full flex items-center justify-center group-hover:bg-primary transition-all">
                                                {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                            </div>
                                        </div>
                                    </button>

                                    {/* Data Reveal */}
                                    {isExpanded && (
                                        <div className="border-t-[3px] border-neutral-black p-6 sm:p-8 md:p-10 animate-in slide-in-from-top-2 duration-300">
                                            <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-10">
                                                <div className="space-y-6">
                                                    <h4 className="font-display text-[11px] font-black uppercase tracking-[2.5px] text-neutral-black flex items-center gap-2 mb-4">
                                                        <Zap className="w-4 h-4 text-primary shrink-0" aria-hidden />
                                                        Order items
                                                    </h4>
                                                    <div className="space-y-6">
                                                        {order.items.map((item) => (
                                                            <div key={item.id} className="flex gap-8 group/item">
                                                                <Link to={`/products/${item.product.id}`} className="shrink-0 relative">
                                                                    <img
                                                                        src={item.product.mockupImageUrl}
                                                                        alt={item.product.name}
                                                                        className={`w-24 h-24 rounded-[4px] border-[2.5px] border-neutral-black ${STOREFRONT_TEE_MOCKUP_IMAGE_CLASS} hover:rotate-2 transition-transform shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] group-hover/item:shadow-none`}
                                                                    />
                                                                    <div className="absolute -top-2 -left-2 bg-neutral-black text-white w-8 h-8 rounded-full border-[1.5px] border-white flex items-center justify-center font-display text-[12px] font-black italic shadow-lg">
                                                                        x{item.quantity}
                                                                    </div>
                                                                </Link>
                                                                <div className="flex-1 flex flex-col justify-center gap-1">
                                                                    <Link
                                                                        to={`/products/${item.product.id}`}
                                                                        className="font-display text-[20px] font-black text-neutral-black hover:text-primary transition-colors no-underline uppercase leading-none tracking-tight"
                                                                    >
                                                                        {item.product.name}
                                                                    </Link>
                                                                    <div className="font-display text-[10px] font-black text-neutral-black/35 uppercase tracking-[1.5px] mt-1">
                                                                        Artist: {item.product.artist.name}
                                                                    </div>
                                                                    <div className="pt-2 flex gap-3">
                                                                        <span className="bg-neutral-g2 px-2 py-0.5 rounded-[2px] font-display text-[9px] font-black uppercase tracking-[1px]">{item.color}</span>
                                                                        <span className="bg-neutral-g2 px-2 py-0.5 rounded-[2px] font-display text-[9px] font-black uppercase tracking-[1px]">{item.size}</span>
                                                                    </div>
                                                                </div>
                                                                <div className="text-right self-center">
                                                                    <div className="font-display text-[20px] font-black text-neutral-black italic leading-none">₹{(item.price * item.quantity).toLocaleString('en-IN')}</div>
                                                                    <div className="font-display text-[9px] font-black text-neutral-black/25 uppercase tracking-[2px] mt-1">
                                                                        Subtotal
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Shipping Details */}
                                                <div className="bg-neutral-g1 p-6 sm:p-7 rounded-[4px] border-[3px] border-neutral-black border-dashed h-fit space-y-5">
                                                    <h4 className="font-display text-[11px] font-black uppercase tracking-[2.5px] text-neutral-black flex items-center gap-2">
                                                        <Truck className="w-4 h-4 shrink-0" aria-hidden />
                                                        Ship to
                                                    </h4>
                                                    {order.shippingAddress ? (
                                                        <div className="space-y-3">
                                                            <div className="font-display text-[10px] font-black text-neutral-black/35 uppercase tracking-[2px]">
                                                                Delivery address
                                                            </div>
                                                            <div className="font-display text-[13px] font-bold text-neutral-black leading-relaxed space-y-1">
                                                                <p>{order.shippingAddress.name.toUpperCase()}</p>
                                                                <p className="opacity-60">{order.shippingAddress.line1.toUpperCase()}</p>
                                                                <p className="opacity-60">{order.shippingAddress.city.toUpperCase()}, {order.shippingAddress.state.toUpperCase()} {order.shippingAddress.postalCode}</p>
                                                                <p className="opacity-60">{order.shippingAddress.country.toUpperCase()}</p>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <p className="font-display text-[11px] font-bold text-danger uppercase tracking-[1.5px] leading-snug">
                                                            Shipping address unavailable for this order. Contact support if you need help.
                                                        </p>
                                                    )}

                                                    <div className="pt-4 border-t border-neutral-black/5 space-y-3">
                                                        <div className="flex items-center justify-between font-display text-[10px] font-black uppercase tracking-[2px]">
                                                            <span className="text-neutral-black/40">Checkout</span>
                                                            <span className="text-success flex items-center gap-1.5">
                                                                <Shield className="w-3 h-3 shrink-0" aria-hidden />
                                                                Secured
                                                            </span>
                                                        </div>
                                                        <ReturnPolicyNote />
                                                        {order.returnClaim ? (
                                                            <div className="border-[2px] border-neutral-black rounded-[4px] bg-white p-4 space-y-3">
                                                                <div className="flex items-center justify-between gap-3">
                                                                    <div className="font-display text-[10px] font-black uppercase tracking-[2px]">
                                                                        Return Claim
                                                                    </div>
                                                                    <span className={`px-2 py-1 border rounded-[2px] font-display text-[9px] font-black uppercase tracking-[1px] ${returnClaimStatusClass(order.returnClaim.status)}`}>
                                                                        {order.returnClaim.status.replaceAll("_", " ")}
                                                                    </span>
                                                                </div>
                                                                <div className="font-display text-[10px] font-bold uppercase text-neutral-g4">
                                                                    Reason: {order.returnClaim.reason.replaceAll("_", " ")}
                                                                </div>
                                                                <p className="font-display text-[10px] font-bold text-neutral-black uppercase leading-relaxed">
                                                                    {order.returnClaim.description}
                                                                </p>
                                                                {order.returnClaim.evidenceUrls?.length ? (
                                                                    <div className="grid grid-cols-3 gap-2">
                                                                        {order.returnClaim.evidenceUrls.map((url) => (
                                                                            <a key={url} href={url} target="_blank" rel="noreferrer" className="block border-[2px] border-neutral-black rounded-[2px] overflow-hidden bg-white">
                                                                                <img src={url} alt="" className="w-full h-20 object-cover" />
                                                                            </a>
                                                                        ))}
                                                                    </div>
                                                                ) : null}
                                                                {order.returnClaim.reviewNote ? (
                                                                    <div className="font-display text-[10px] font-bold uppercase text-neutral-g4 border-t border-neutral-black/10 pt-3">
                                                                        Finance note: {order.returnClaim.reviewNote}
                                                                    </div>
                                                                ) : null}
                                                            </div>
                                                        ) : order.returnClaimEligibility?.eligible ? (
                                                            <div className="border-[2px] border-neutral-black rounded-[4px] bg-white p-4 space-y-4">
                                                                <div className="space-y-2">
                                                                    <div className="font-display text-[10px] font-black uppercase tracking-[2px]">
                                                                        Report Delivery Issue
                                                                    </div>
                                                                    <p className="font-display text-[10px] font-bold uppercase text-neutral-g4 leading-relaxed">
                                                                        {order.returnClaimEligibility.message}
                                                                    </p>
                                                                </div>
                                                                {claimFormOpenOrder === order.id ? (
                                                                    <div className="space-y-3">
                                                                        <select
                                                                            value={getClaimForm(order.id).reason}
                                                                            onChange={(e) =>
                                                                                handleClaimFieldChange(order.id, "reason", e.target.value)
                                                                            }
                                                                            className="w-full px-4 py-3 border-[2px] border-neutral-black rounded-[4px] bg-neutral-g1 font-display text-[11px] font-black uppercase"
                                                                        >
                                                                            {RETURN_CLAIM_REASON_OPTIONS.map((option) => (
                                                                                <option key={option.value} value={option.value}>
                                                                                    {option.label}
                                                                                </option>
                                                                            ))}
                                                                        </select>
                                                                        <textarea
                                                                            value={getClaimForm(order.id).description}
                                                                            onChange={(e) =>
                                                                                handleClaimFieldChange(order.id, "description", e.target.value)
                                                                            }
                                                                            placeholder="Describe the issue, what was expected, and what was delivered..."
                                                                            className="w-full min-h-[110px] px-4 py-3 border-[2px] border-neutral-black rounded-[4px] bg-white font-display text-[11px] font-black uppercase"
                                                                        />
                                                                        <input
                                                                            type="file"
                                                                            accept="image/*"
                                                                            multiple
                                                                            onChange={(e) =>
                                                                                handleClaimFieldChange(
                                                                                    order.id,
                                                                                    "evidence",
                                                                                    Array.from(e.target.files || []).slice(0, 3)
                                                                                )
                                                                            }
                                                                            className="block w-full font-display text-[10px] font-black uppercase"
                                                                        />
                                                                        <p className="font-display text-[9px] font-bold uppercase text-neutral-g4">
                                                                            Upload up to 3 photos showing the damaged or incorrect delivery.
                                                                        </p>
                                                                        <div className="grid grid-cols-1 gap-3">
                                                                            <button
                                                                                onClick={() => submitReturnClaim(order.id)}
                                                                                disabled={claimSubmitting[order.id]}
                                                                                className="w-full py-3 bg-primary border-[2px] border-neutral-black rounded-[4px] font-display text-[11px] font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] disabled:opacity-40"
                                                                            >
                                                                                {claimSubmitting[order.id] ? "Submitting..." : "Submit Return Claim"}
                                                                            </button>
                                                                            <button
                                                                                onClick={() => setClaimFormOpenOrder(null)}
                                                                                className="w-full py-3 bg-white border-[2px] border-neutral-black rounded-[4px] font-display text-[11px] font-black uppercase"
                                                                            >
                                                                                Cancel
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <button
                                                                        onClick={() => setClaimFormOpenOrder(order.id)}
                                                                        className="w-full py-3 bg-white border-[2px] border-neutral-black rounded-[4px] font-display text-[11px] font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                                                                    >
                                                                        Report Damaged / Wrong Item
                                                                    </button>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <div className="font-display text-[10px] font-bold uppercase text-neutral-g4 border-[2px] border-dashed border-neutral-black/20 rounded-[4px] p-4 leading-relaxed">
                                                                {order.returnClaimEligibility?.message}
                                                            </div>
                                                        )}
                                                        {order.status === "DELIVERED" && (
                                                            <div className="pt-4 text-center">
                                                                <Link 
                                                                    to={`/orders/${order.id}/rate`}
                                                                    className="inline-block w-full py-3 bg-primary text-neutral-black border-[2px] border-neutral-black rounded-[2px] font-display text-[12px] font-black uppercase tracking-[2px] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-none hover:bg-primary-dark transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] no-underline"
                                                                >
                                                                    Rate Your Purchase
                                                                </Link>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
