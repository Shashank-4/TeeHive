import { useState, useEffect } from "react";
import {
    Search,
    ShoppingCart,
} from "lucide-react";
import Loader from "../../components/shared/Loader";
import api from "../../api/axios";

const statusPillClass = (status: string) => {
    const s = status?.toUpperCase();
    if (s === "DELIVERED") return "bg-success text-white border-neutral-black";
    if (s === "PAID") return "bg-primary text-neutral-black border-neutral-black";
    if (s === "RECEIVED") return "bg-blue-500 text-white border-neutral-black";
    if (s === "PROCESSING") return "bg-amber-500 text-white border-neutral-black";
    if (s === "SHIPPED") return "bg-neutral-black text-white border-neutral-black";
    if (s === "OUT_FOR_DELIVERY") return "bg-indigo-500 text-white border-neutral-black";
    if (s === "CANCELLED") return "bg-danger text-white border-neutral-black";
    return "bg-white text-neutral-black border-neutral-black"; // PENDING
};

const ORDER_STATUSES = [
    "ALL",
    "PENDING",
    "PAID",
    "RECEIVED",
    "PROCESSING",
    "SHIPPED",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
    "CANCELLED"
];

export default function ArtistOrders() {
    const [orders, setOrders] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("ALL");
    const [searchTerm, setSearchTerm] = useState("");

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const res = await api.get("/api/artist/orders");
            setOrders(res.data.data.orders);
            const statsRes = await api.get("/api/artist/stats");
            setStats(statsRes.data.data.stats);
        } catch (error) {
            console.error("Failed to fetch artist orders:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const filteredOrders = orders.filter(order => {
        const matchesFilter = filter === "ALL" || order.status?.toUpperCase() === filter;
        const matchesSearch =
            order.orderId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.productName?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const statsData = [
        { label: "Total Orders", value: stats?.totalSales || 0, color: "bg-primary/20", emoji: "🛍️" },
        { label: "Delivered", value: orders.filter(o => o.status === "DELIVERED").length, color: "bg-success/20", emoji: "✅" },
        { label: "Shipped", value: orders.filter(o => o.status === "SHIPPED").length, color: "bg-info/20", emoji: "🚚" },
        { label: "Processing", value: orders.filter(o => ["RECEIVED", "PROCESSING"].includes(o.status)).length, color: "bg-amber-500/20", emoji: "⚙️" },
    ];

    return (
        <div className="w-full min-h-screen bg-neutral-g1 flex flex-col pt-4">
            <div className="flex-1 px-4 sm:px-8 pb-12 w-full">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
                    <div className="relative w-full md:w-[320px]">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-black" />
                        <input
                            type="text"
                            placeholder="SEARCH BY ID OR DROP..."
                            className="w-full pl-11 pr-4 py-3 bg-white border-[2px] border-neutral-black rounded-[4px] font-display text-[11px] font-black uppercase tracking-[1px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:translate-x-[2px] focus:translate-y-[2px] focus:shadow-none outline-none transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 mb-10">
                    {statsData.map((stat, i) => (
                        <div key={i} className="bg-white border-[2px] border-neutral-black rounded-[6px] p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all">
                            <div className={`w-12 h-12 rounded-[2px] border-[2px] border-neutral-black flex items-center justify-center text-[20px] mb-6 ${stat.color}`}>
                                {stat.emoji}
                            </div>
                            <div className="space-y-1">
                                <div className="font-display text-[32px] font-black text-neutral-black leading-none tracking-tight">
                                    {loading ? "..." : stat.value}
                                </div>
                                <div className="font-display text-[10px] font-black uppercase tracking-[1px] text-neutral-g3">
                                    {stat.label}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-3 mb-8">
                    {ORDER_STATUSES.map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-5 py-2.5 border-[2px] border-neutral-black font-display text-[10px] font-black uppercase tracking-[1.5px] rounded-[4px] transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none whitespace-nowrap ${filter === f
                                ? "bg-primary text-neutral-black translate-x-[2px] translate-y-[2px] shadow-none"
                                : "bg-white text-neutral-black hover:bg-primary/10"
                                }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>

                {/* Orders Table */}
                <div className="bg-white border-[2px] border-neutral-black rounded-[6px] overflow-hidden shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-neutral-black text-white">
                                    {["Order ID", "Product", "Customer", "Date", "Earnings", "Status", "Action"].map(h => (
                                        <th key={h} className="font-display text-[10px] font-black tracking-[2px] uppercase py-5 px-6 text-left whitespace-nowrap">
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={7} className="py-24 text-center text-neutral-black">
                                            <div className="flex flex-col items-center gap-4">
                                                <Loader size="w-12 h-12" />
                                                <span className="font-display text-[11px] font-black uppercase tracking-[2px]">Scanning Hive Data...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredOrders.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="py-24 text-center">
                                            <div className="flex flex-col items-center gap-6 opacity-30">
                                                <div className="w-20 h-20 bg-neutral-g1 rounded-full border-[2px] border-neutral-black flex items-center justify-center">
                                                    <ShoppingCart className="w-10 h-10" />
                                                </div>
                                                <div className="space-y-1">
                                                    <h3 className="font-display text-[16px] font-black uppercase">No Orders Found</h3>
                                                    <p className="font-display text-[11px] font-bold uppercase tracking-wide">The Hive is quiet... for now.</p>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredOrders.map((order, i) => (
                                        <tr key={i} className="border-b-[1px] border-neutral-black/5 hover:bg-primary/5 transition-colors">
                                            <td className="py-5 px-6 font-display text-[13px] font-black text-neutral-black uppercase tracking-tighter">#{order.orderId?.slice(-8).toUpperCase()}</td>
                                            <td className="py-5 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-neutral-g1 border-[1px] border-neutral-black rounded-[2px] overflow-hidden">
                                                        <img src={order.productImage} className="w-full h-full object-cover" />
                                                    </div>
                                                    <span className="font-display text-[13px] font-black text-neutral-black max-w-[150px] truncate">{order.productName}</span>
                                                </div>
                                            </td>
                                            <td className="py-5 px-6 font-display text-[12px] font-bold text-neutral-g4 uppercase">Verified Customer</td>
                                            <td className="py-5 px-6 font-display text-[11px] font-bold text-neutral-g3 uppercase">{new Date(order.date).toLocaleDateString()}</td>
                                            <td className="py-5 px-6">
                                                <span className="font-display text-[14px] font-black text-neutral-black">₹{order.artistEarning?.toLocaleString('en-IN')}</span>
                                            </td>
                                            <td className="py-5 px-6">
                                                <span className={`px-2 py-1 rounded-[2px] border-[1px] border-neutral-black font-display text-[8px] font-black uppercase tracking-[1px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] whitespace-nowrap ${statusPillClass(order.status)}`}>
                                                    {order.status?.replace(/_/g, " ")}
                                                </span>
                                            </td>
                                            <td className="py-5 px-6">
                                                <button className="px-4 py-2 bg-white border-[1px] border-neutral-black rounded-[2px] font-display text-[10px] font-black uppercase hover:bg-neutral-black hover:text-white transition-all">
                                                    Details
                                                </button>
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
