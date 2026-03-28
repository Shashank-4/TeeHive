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
}

export default function CustomerOrders() {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

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

    const getStatusStyles = (status: string) => {
        const s = status?.toUpperCase();
        switch (s) {
            case "PENDING":
                return { icon: Clock, bg: "bg-warning/10", text: "text-warning", border: "border-warning", label: "AWAITING_PAYMENT" };
            case "PAID":
                return { icon: CheckCircle, bg: "bg-primary/10", text: "text-primary-dark", border: "border-primary", label: "NODE_CONFIRMED" };
            case "RECEIVED":
                return { icon: Box, bg: "bg-blue-500/10", text: "text-blue-500", border: "border-blue-500", label: "SIGNAL_RECEIVED" };
            case "PROCESSING":
                return { icon: Zap, bg: "bg-amber-500/10", text: "text-amber-600", border: "border-amber-500", label: "SYNTHESIZING_DROP" };
            case "SHIPPED":
                return { icon: TruckIcon, bg: "bg-neutral-black/10", text: "text-neutral-black", border: "border-neutral-black", label: "IN_TRANSIT_MODE" };
            case "OUT_FOR_DELIVERY":
                return { icon: MapPin, bg: "bg-indigo-500/10", text: "text-indigo-600", border: "border-indigo-500", label: "LAST_MILE_PROTOCOL" };
            case "DELIVERED":
                return { icon: CheckCircle, bg: "bg-success/10", text: "text-success", border: "border-success", label: "DELIVERY_COMPLETE" };
            case "CANCELLED":
                return { icon: XCircle, bg: "bg-danger/10", text: "text-danger", border: "border-danger", label: "PROTOCOL_ABORTED" };
            default:
                return { icon: Package, bg: "bg-neutral-g2", text: "text-neutral-g4", border: "border-neutral-g3", label: "UNKNOWN_STATE" };
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <Loader />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-g1 py-20 px-4 md:px-16 relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 left-[-10%] text-[400px] font-display font-black text-neutral-black/[0.02] select-none leading-none -z-0 pointer-events-none uppercase">LOGS</div>

            <div className="max-w-5xl mx-auto relative z-10">
                {/* ── HEADER ── */}
                <div className="flex flex-col md:flex-row items-end justify-between gap-8 mb-12 border-b-[3px] border-neutral-black pb-10">
                    <div className="space-y-4">
                        <Link to="/user/profile" className="inline-flex items-center gap-2 text-neutral-black/40 hover:text-neutral-black font-display text-[10px] font-black uppercase tracking-[2px] mb-2 no-underline group transition-all">
                            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1" /> RETURN_TO_TERMINAL
                        </Link>
                        <h1 className="font-display text-[48px] md:text-[64px] font-black text-neutral-black leading-none tracking-tight uppercase italic">
                            Asset <span className="text-primary not-italic">Logs</span>
                        </h1>
                        <p className="font-display text-[14px] font-bold text-neutral-black/40 uppercase tracking-[2px]">
                            Review your historically synchronized designer artifacts.
                        </p>
                    </div>

                    <div className="flex items-center gap-6 bg-white border-[2.5px] border-neutral-black p-4 rounded-[4px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        <div className="text-right">
                            <div className="font-display text-[20px] font-black text-neutral-black leading-none">{orders.length}</div>
                            <div className="font-display text-[9px] font-black text-neutral-black/40 uppercase tracking-[2px] mt-1">TOTAL_RECORDS</div>
                        </div>
                        <div className="w-[1.5px] h-10 bg-neutral-black/10" />
                        <Package className="w-8 h-8 text-primary" />
                    </div>
                </div>

                {/* ── ORDERS LIST ── */}
                {orders.length === 0 ? (
                    <div className="bg-white border-[3px] border-neutral-black border-dashed rounded-[4px] p-24 text-center space-y-8">
                        <div className="w-24 h-24 bg-neutral-g1 rounded-full flex items-center justify-center mx-auto grayscale opacity-30">
                            <ShoppingBag className="w-12 h-12" />
                        </div>
                        <div className="space-y-3">
                            <h2 className="font-display text-[32px] font-black text-neutral-black uppercase tracking-tight">Vault_Empty</h2>
                            <p className="font-display text-[12px] font-bold text-neutral-black/40 uppercase tracking-[2px] max-w-sm mx-auto">
                                No artifact synchronizations detected in your global session history.
                            </p>
                        </div>
                        <Link to="/products" className="inline-block no-underline">
                            <Button variant="primary" className="px-10">Browse Inventory <ArrowRight className="w-4 h-4" /></Button>
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
                                    className={`bg-white border-[3px] border-neutral-black rounded-[4px] transition-all duration-300 ${isExpanded ? 'shadow-none' : 'shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]'}`}
                                >
                                    {/* Order Row Header */}
                                    <button
                                        onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                                        className="w-full text-left p-8 md:p-10 flex flex-col md:flex-row md:items-center justify-between gap-10 hover:bg-neutral-g1 transition-colors group"
                                    >
                                        <div className="flex items-center gap-8">
                                            <div className={`w-16 h-16 ${status.bg} ${status.text} border-[2.5px] ${status.border} rounded-[4px] flex items-center justify-center rotate-[-4deg] group-hover:rotate-0 transition-all`}>
                                                <StatusIcon className="w-8 h-8" />
                                            </div>
                                            <div className="space-y-1">
                                                <div className="font-display text-[11px] font-black text-neutral-black/40 uppercase tracking-[2px]">
                                                    SYNC_DATE: {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase()}
                                                </div>
                                                <div className="font-display text-[24px] font-black text-neutral-black uppercase tracking-tight leading-none group-hover:text-primary transition-all">
                                                    RECORD_#{order.id.slice(-8).toUpperCase()}
                                                </div>
                                                <div className={`inline-flex items-center gap-2 font-display text-[10px] font-black uppercase tracking-[2px] ${status.text}`}>
                                                    <div className={`w-1.5 h-1.5 rounded-full ${status.bg.replace('/10', '')} animate-pulse`} /> {status.label}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between md:justify-end gap-12 w-full md:w-auto">
                                            <div className="text-right">
                                                <div className="font-display text-[28px] font-black text-neutral-black italic">₹{order.totalAmount.toLocaleString('en-IN')}</div>
                                                <div className="font-display text-[10px] font-black text-neutral-black/30 uppercase tracking-[2px] mt-1">TOTAL_OBLIGATION</div>
                                            </div>
                                            <div className="w-10 h-10 border-[2.5px] border-neutral-black rounded-full flex items-center justify-center group-hover:bg-primary transition-all">
                                                {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                            </div>
                                        </div>
                                    </button>

                                    {/* Data Reveal */}
                                    {isExpanded && (
                                        <div className="border-t-[3.5px] border-neutral-black p-8 md:p-12 animate-in slide-in-from-top-2 duration-300">
                                            <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-12">
                                                <div className="space-y-8">
                                                    <h4 className="font-display text-[12px] font-black uppercase tracking-[3px] text-neutral-black flex items-center gap-3 italic mb-6">
                                                        <Zap className="w-4 h-4 text-primary" /> ARTIFACT_MANIFEST
                                                    </h4>
                                                    <div className="space-y-6">
                                                        {order.items.map((item) => (
                                                            <div key={item.id} className="flex gap-8 group/item">
                                                                <Link to={`/products/${item.product.id}`} className="shrink-0 relative">
                                                                    <img
                                                                        src={item.product.mockupImageUrl}
                                                                        alt={item.product.name}
                                                                        className="w-24 h-24 rounded-[4px] border-[2.5px] border-neutral-black object-cover hover:rotate-2 transition-transform shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] group-hover/item:shadow-none"
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
                                                                    <div className="font-display text-[10px] font-black text-neutral-black/30 uppercase tracking-[2px] mt-1">CREATOR: {item.product.artist.name}</div>
                                                                    <div className="pt-2 flex gap-3">
                                                                        <span className="bg-neutral-g2 px-2 py-0.5 rounded-[2px] font-display text-[9px] font-black uppercase tracking-[1px]">{item.color}</span>
                                                                        <span className="bg-neutral-g2 px-2 py-0.5 rounded-[2px] font-display text-[9px] font-black uppercase tracking-[1px]">{item.size}</span>
                                                                    </div>
                                                                </div>
                                                                <div className="text-right self-center">
                                                                    <div className="font-display text-[20px] font-black text-neutral-black italic leading-none">₹{(item.price * item.quantity).toLocaleString('en-IN')}</div>
                                                                    <div className="font-display text-[9px] font-black text-neutral-black/20 uppercase tracking-[2px] mt-1">UNIT_SUM</div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Shipping Details */}
                                                <div className="bg-neutral-g1 p-8 rounded-[4px] border-[2.5px] border-neutral-black border-dashed h-fit space-y-6">
                                                    <h4 className="font-display text-[12px] font-black uppercase tracking-[3px] text-neutral-black flex items-center gap-3">
                                                        <Truck className="w-4 h-4" /> COORDINATE_LOGS
                                                    </h4>
                                                    {order.shippingAddress ? (
                                                        <div className="space-y-4">
                                                            <div className="font-display text-[11px] font-black text-neutral-black/20 uppercase tracking-[2px]">NODE_ADDRESS:</div>
                                                            <div className="font-display text-[13px] font-bold text-neutral-black leading-relaxed space-y-1">
                                                                <p>{order.shippingAddress.name.toUpperCase()}</p>
                                                                <p className="opacity-60">{order.shippingAddress.line1.toUpperCase()}</p>
                                                                <p className="opacity-60">{order.shippingAddress.city.toUpperCase()}, {order.shippingAddress.state.toUpperCase()} {order.shippingAddress.postalCode}</p>
                                                                <p className="opacity-60">{order.shippingAddress.country.toUpperCase()}</p>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <p className="font-display text-[11px] font-black text-danger uppercase tracking-[2px]">ADDRESS_DATA_CORRUPTED</p>
                                                    )}

                                                    <div className="pt-4 border-t border-neutral-black/5 space-y-3">
                                                        <div className="flex items-center justify-between font-display text-[10px] font-black uppercase tracking-[2px]">
                                                            <span className="opacity-40 italic">PROTOCOL_AUTH</span>
                                                            <span className="text-success flex items-center gap-1.5"><Shield className="w-3 h-3" /> VERIFIED</span>
                                                        </div>
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
