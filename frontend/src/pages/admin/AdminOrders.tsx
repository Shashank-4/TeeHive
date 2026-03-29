import React, { useState, useEffect } from "react";
import {
    Search,
    Eye,
    ChevronLeft,
    ChevronRight,
    Loader2,
    Package,
    ShoppingCart,
    Filter,
    Calendar
} from "lucide-react";
import api from "../../api/axios";
import Toast from "../../components/shared/Toast";
import OrderDetailsModal from "../../components/modals/OrderDetailsModal";

interface AdminOrder {
    id: string;
    customer: string;
    customerEmail: string;
    date: string;
    total: number;
    fulfillmentStatus: string;
    paymentStatus: string;
    items: number;
    artistsInvolved: string;
}

interface PaginationData {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

const ORDER_STATUSES = [
    { value: "RECEIVED", label: "Received" },
    { value: "PROCESSING", label: "Processing" },
    { value: "SHIPPED", label: "Shipped" },
    { value: "IN_TRANSIT", label: "In-transit" },
    { value: "OUT_FOR_DELIVERY", label: "Out for delivery" },
    { value: "UNDELIVERED_1", label: "Undelivered - 1st Attempt" },
    { value: "UNDELIVERED_2", label: "Undelivered - 2nd Attempt" },
    { value: "UNDELIVERED_3", label: "Undelivered - 3rd Attempt" },
    { value: "DELIVERED", label: "Delivered" },
    { value: "PENDING", label: "Pending" },
    { value: "PAID", label: "Paid" },
    { value: "CANCELLED", label: "Cancelled" },
];

const PAYMENT_STATUSES = [
    { value: "PAID", label: "Paid" },
    { value: "PENDING", label: "Pending" },
    { value: "CANCELLED", label: "Cancelled" },
    { value: "REFUNDED", label: "Refunded" },
    { value: "SUCCEEDED", label: "Succeeded" },
    { value: "FAILED", label: "Failed" }
];

const statusSelectClass = (status: string) => {
    const s = status?.toUpperCase();
    if (s === "DELIVERED") return "bg-success text-white border-neutral-black";
    if (s === "PAID") return "bg-primary text-neutral-black border-neutral-black";
    if (s === "RECEIVED") return "bg-blue-500 text-white border-neutral-black";
    if (s === "PROCESSING") return "bg-amber-500 text-white border-neutral-black";
    if (s === "SHIPPED") return "bg-neutral-black text-white border-neutral-black";
    if (s === "OUT_FOR_DELIVERY") return "bg-indigo-500 text-white border-neutral-black";
    if (s === "CANCELLED") return "bg-danger-light text-danger border-danger";
    return "bg-white text-neutral-black border-neutral-black"; // PENDING default
};

const statusLabel = (status: string) => {
    return ORDER_STATUSES.find(s => s.value === status)?.label || status;
};

export default function AdminOrders() {
    const [orders, setOrders] = useState<AdminOrder[]>([]);
    const [pagination, setPagination] = useState<PaginationData>({ page: 1, limit: 10, total: 0, totalPages: 1 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

    const fetchOrders = async (page = 1, search = searchQuery, statusType = statusFilter) => {
        setLoading(true);
        try {
            const res = await api.get(`/api/admin/orders`, { params: { page, limit: 10, search, status: statusType } });
            setOrders(res.data.data.orders);
            setPagination(res.data.data.pagination);
            setError(null);
        } catch (err) {
            console.error("Failed to load orders", err);
            setError("Failed to load orders. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchOrders(); }, []);

    const handleSearch = (e: React.FormEvent) => { e.preventDefault(); fetchOrders(1, searchQuery, statusFilter); };
    const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => { const v = e.target.value; setStatusFilter(v); fetchOrders(1, searchQuery, v); };

    const handleStatusChange = async (orderId: string, newStatus: string) => {
        setActionLoading({ ...actionLoading, [orderId]: true });
        try {
            await api.patch(`/api/admin/orders/${orderId}/status`, { status: newStatus });
            setOrders(orders.map(o => o.id === orderId ? { ...o, fulfillmentStatus: newStatus } : o));
            setToast({ message: `Fulfillment status updated format ${statusLabel(newStatus)}`, type: "success" });
        } catch (err) {
            console.error("Failed to update status", err);
            setToast({ message: "Failed to update fulfillment status", type: "error" });
        } finally {
            setActionLoading({ ...actionLoading, [orderId]: false });
        }
    };

    const handlePaymentChange = async (orderId: string, newStatus: string) => {
        setActionLoading({ ...actionLoading, [orderId]: true });
        try {
            await api.patch(`/api/admin/orders/${orderId}/payment`, { status: newStatus });
            setOrders(orders.map(o => o.id === orderId ? { ...o, paymentStatus: newStatus } : o));
            setToast({ message: `Payment status updated`, type: "success" });
        } catch (err) {
            console.error("Failed to update payment status", err);
            setToast({ message: "Failed to update payment status", type: "error" });
        } finally {
            setActionLoading({ ...actionLoading, [orderId]: false });
        }
    };

    return (
        <div className="w-full min-h-screen bg-neutral-g1 flex flex-col pt-4 text-neutral-black">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            {selectedOrderId && (
                <OrderDetailsModal 
                    orderId={selectedOrderId} 
                    onClose={() => setSelectedOrderId(null)} 
                />
            )}
            <div className="flex-1 px-4 sm:px-8 pb-12 w-full">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 bg-neutral-black text-white px-3 py-1 rounded-[4px] font-display text-[10px] font-black uppercase tracking-[2px]">
                            <ShoppingCart className="w-3 h-3 text-primary" /> Logistics Node
                        </div>
                        <h1 className="font-display text-[ clamp(32px,5vw,48px) ] font-black text-neutral-black leading-none uppercase tracking-tight">
                            Order <span className="text-primary italic">Ledger</span>
                        </h1>
                        <p className="font-display text-[14px] font-bold text-neutral-g4 uppercase tracking-wider">
                            Monitor and authorize global transaction fulfillment states.
                        </p>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 border-[2px] border-red-500 p-6 rounded-[4px] mb-8 flex items-center gap-4 animate-bounce">
                        <Package className="text-red-500 w-8 h-8" />
                        <div>
                            <h4 className="font-display text-[12px] font-black uppercase text-red-500 tracking-[1px]">Data Stream Interruption</h4>
                            <p className="font-display text-[11px] font-bold text-red-400 uppercase">{error}</p>
                        </div>
                    </div>
                )}

                {/* Toolbar */}
                <form onSubmit={handleSearch} className="flex flex-col xl:flex-row items-stretch xl:items-center gap-6 mb-8">
                    <div className="relative flex-1 min-w-[300px]">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-black" />
                        <input
                            type="text"
                            placeholder="SEARCH BY ORDER ID OR CUSTOMER IDENTITY..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-4 py-4 bg-white border-[2px] border-neutral-black rounded-[4px] font-display text-[11px] font-black uppercase tracking-[1px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:translate-x-[1px] focus:translate-y-[1px] focus:shadow-none outline-none transition-all"
                        />
                    </div>

                    <div className="flex gap-4">
                        <div className="relative group">
                            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-black pointer-events-none" />
                            <select
                                value={statusFilter}
                                onChange={handleStatusFilterChange}
                                className="pl-11 pr-10 py-4 bg-white border-[2px] border-neutral-black rounded-[4px] font-display text-[11px] font-black uppercase tracking-[1px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] outline-none cursor-pointer hover:bg-primary transition-all appearance-none"
                            >
                                <option value="all">All Statuses</option>
                                {ORDER_STATUSES.map(s => (
                                    <option key={s.value} value={s.value}>{s.label}</option>
                                ))}
                            </select>
                        </div>
                        <button type="submit" className="px-8 py-4 bg-primary border-[2px] border-neutral-black rounded-[4px] font-display text-[12px] font-black uppercase tracking-[2px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all">
                            Filter
                        </button>
                    </div>
                </form>

                {/* Table Container */}
                <div className="bg-white border-[2px] border-neutral-black rounded-[6px] shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-neutral-black text-white">
                                    {["Order ID", "Date", "Customer", "Artists Involved", "Total", "Payment", "Fulfillment", "Actions"].map(h => (
                                        <th key={h} className="font-display text-[10px] font-black tracking-[2px] uppercase py-5 px-6 text-left whitespace-nowrap">
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y-[1px] divide-neutral-black/10">
                                {loading && orders.length === 0 ? (
                                    <tr><td colSpan={7} className="py-24 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <Loader2 className="w-12 h-12 text-primary animate-spin" />
                                            <p className="font-display text-[10px] font-black uppercase tracking-[2px]">Syncing Logistics Feed...</p>
                                        </div>
                                    </td></tr>
                                ) : orders.length === 0 ? (
                                    <tr><td colSpan={7} className="py-24 text-center">
                                        <div className="flex flex-col items-center gap-4 opacity-30">
                                            <Package className="w-16 h-16" />
                                            <p className="font-display text-[12px] font-black uppercase tracking-[2px]">No orders found</p>
                                        </div>
                                    </td></tr>
                                ) : (
                                    orders.map((order) => (
                                    <tr key={order.id} className="hover:bg-primary/5 transition-colors group">
                                            <td className="py-5 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 border-[1px] border-neutral-black bg-neutral-g1 rounded-[2px] flex items-center justify-center group-hover:bg-primary transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] group-hover:shadow-none translate-x-[-1px] group-hover:translate-x-0 group-hover:translate-y-0">
                                                        <Package className="w-4 h-4" />
                                                    </div>
                                                    <span className="font-display text-[14px] font-black text-neutral-black uppercase italic tracking-tight">#{order.id.slice(-6).toUpperCase()}</span>
                                                </div>
                                            </td>
                                            <td className="py-5 px-6 font-display text-[11px] font-bold text-neutral-g4 uppercase">
                                                <div className="flex items-center gap-2"><Calendar className="w-3 h-3" /> {new Date(order.date).toLocaleDateString('en-GB')}</div>
                                            </td>
                                            <td className="py-5 px-6 font-display text-[13px] font-black text-neutral-black uppercase tracking-tight">
                                                {order.customer}
                                                <div className="text-[9px] font-bold text-neutral-g4 lowercase mt-1 tracking-normal">{order.customerEmail}</div>
                                            </td>
                                            <td className="py-5 px-6 font-display text-[11px] font-bold text-neutral-black break-words line-clamp-2 w-32 uppercase">
                                                {order.artistsInvolved}
                                            </td>
                                            <td className="py-5 px-6 font-display text-[16px] font-black text-neutral-black italic tracking-tight">₹{order.total.toLocaleString('en-IN')}</td>
                                            <td className="py-5 px-6">
                                                <div className="relative group/sel">
                                                    <select
                                                        value={order.paymentStatus}
                                                        onChange={(e) => handlePaymentChange(order.id, e.target.value)}
                                                        disabled={actionLoading[order.id]}
                                                        className={`appearance-none px-4 py-2 pr-8 rounded-[2px] font-display text-[9px] font-black tracking-[1.5px] uppercase border-[2px] focus:outline-none cursor-pointer transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none translate-x-[-1px] translate-y-[-1px] hover:translate-x-0 hover:translate-y-0 text-white ${['PAID', 'SUCCEEDED'].includes(order.paymentStatus) ? "bg-success border-neutral-black" : "bg-neutral-black border-neutral-black"} ${actionLoading[order.id] ? "opacity-50 cursor-wait" : ""}`}
                                                    >
                                                        {PAYMENT_STATUSES.map(s => (
                                                            <option key={s.value} value={s.value}>{s.label}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </td>
                                            <td className="py-5 px-6">
                                                <div className="relative group/sel">
                                                    <select
                                                        value={order.fulfillmentStatus}
                                                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                                                        disabled={actionLoading[order.id]}
                                                        className={`appearance-none px-4 py-2 pr-8 rounded-[2px] font-display text-[9px] font-black tracking-[1.5px] uppercase border-[2px] focus:outline-none cursor-pointer transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none translate-x-[-1px] translate-y-[-1px] hover:translate-x-0 hover:translate-y-0 ${statusSelectClass(order.fulfillmentStatus)} ${actionLoading[order.id] ? "opacity-50 cursor-wait" : ""}`}
                                                    >
                                                        {ORDER_STATUSES.map(s => (
                                                            <option key={s.value} value={s.value}>{s.label}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </td>
                                            <td className="py-5 px-6 text-right">
                                                <button 
                                                    onClick={() => setSelectedOrderId(order.id)}
                                                    className="p-3 bg-white border-[2px] border-neutral-black rounded-[4px] hover:bg-neutral-black hover:text-white transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none inline-flex items-center gap-2">
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {!loading && orders.length > 0 && (
                        <div className="bg-neutral-black px-8 py-5 flex items-center justify-between">
                            <span className="font-display text-[10px] font-black text-primary uppercase tracking-[2px]">
                                Page {pagination.page} / {pagination.totalPages} — Total: {pagination.total} Orders
                            </span>
                            <div className="flex items-center gap-4">
                                <button onClick={() => fetchOrders(pagination.page - 1)} disabled={pagination.page === 1}
                                    className="w-10 h-10 bg-white border-[2px] border-neutral-black rounded-[2px] flex items-center justify-center hover:bg-primary transition-all disabled:opacity-20 shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)]">
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <button onClick={() => fetchOrders(pagination.page + 1)} disabled={pagination.page === pagination.totalPages}
                                    className="w-10 h-10 bg-white border-[2px] border-neutral-black rounded-[2px] flex items-center justify-center hover:bg-primary transition-all disabled:opacity-20 shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)]">
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
