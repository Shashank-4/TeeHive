import { useState, useEffect } from "react";
import {
    Eye,
    Loader2,
    TrendingUp,
    Users,
    ShoppingCart,
    Palette,
    AlertCircle,
    ArrowRight,
    Zap,
    ShieldAlert
} from "lucide-react";
import { Link } from "react-router-dom";
import api from "../../api/axios";

interface DashboardStats {
    stats: {
        totalUsers: number;
        totalOrders: number;
        totalActiveArtists: number;
        totalRevenue: number;
    };
    recentOrders: Array<{
        id: string;
        customer: string;
        amount: number;
        status: string;
        createdAt: string;
    }>;
    pendingDesignsCount: number;
    topArtists: Array<{
        id: string;
        name: string;
        image: string;
        rating: number;
    }>;
}

const statusPillClass = (status: string) => {
    const s = status?.toUpperCase();
    if (["DELIVERED", "COMPLETED", "PAID"].includes(s)) return "bg-success text-white border-neutral-black";
    if (["PROCESSING", "SHIPPED"].includes(s)) return "bg-primary text-neutral-black border-neutral-black";
    if (s === "PENDING") return "bg-white text-neutral-black border-neutral-black";
    if (s === "CANCELLED") return "bg-neutral-g2 text-neutral-g4 border-neutral-g3";
    return "bg-neutral-g2 text-neutral-g4 border-neutral-g3";
};

export default function AdminDashboard() {
    const [data, setData] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await api.get("/api/admin/dashboard/stats");
                setData(response.data.data);
            } catch (err) {
                console.error("Failed to load dashboard stats", err);
                setError("Failed to load dashboard stats.");
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
                <p className="font-display text-[10px] font-black uppercase tracking-[2px] animate-pulse">Initializing Administrative Node...</p>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-6">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-red-500">
                    <AlertCircle className="w-8 h-8" />
                </div>
                <div className="text-center">
                    <h3 className="font-display text-[20px] font-black uppercase text-neutral-black mb-2">Internal Node Failure</h3>
                    <p className="font-display text-[11px] font-bold text-neutral-g4 uppercase tracking-wider">{error || "Data stream interrupted."}</p>
                </div>
            </div>
        );
    }

    const { stats, recentOrders, pendingDesignsCount, topArtists } = data;

    return (
        <div className="w-full min-h-screen bg-neutral-g1 flex flex-col pt-4">
            <div className="flex-1 px-4 sm:px-8 pb-12 w-full">
                {/* Admin Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 bg-neutral-black text-white px-3 py-1 rounded-[4px] font-display text-[10px] font-black uppercase tracking-[2px]">
                            <Zap className="w-3 h-3 text-primary" /> Central Intelligence
                        </div>
                        <h1 className="font-display text-[ clamp(32px,5vw,48px) ] font-black text-neutral-black leading-none uppercase tracking-tight">
                            Command <span className="text-primary italic">Center</span>
                        </h1>
                        <p className="font-display text-[14px] font-bold text-neutral-g4 uppercase tracking-wider">
                            Real-time platform metrics and global operation monitoring.
                        </p>
                    </div>

                    <div className="flex gap-4">
                        <div className="bg-white border-[2px] border-neutral-black px-6 py-4 rounded-[4px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                            <p className="font-display text-[9px] font-black uppercase text-neutral-g3 tracking-[1px] mb-1">Session Protocol</p>
                            <p className="font-display text-[13px] font-black text-neutral-black uppercase tracking-[1px] flex items-center gap-2">
                                <span className="w-2 h-2 bg-success rounded-full animate-ping" /> Root Administrator
                            </p>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
                    {[
                        { label: "Gross Revenue", value: `₹${stats.totalRevenue.toLocaleString()}`, icon: TrendingUp, color: "bg-success", shadow: "shadow-[8px_8px_0px_0px_rgba(34,197,94,1)]" },
                        { label: "Active Orders", value: stats.totalOrders.toLocaleString(), icon: ShoppingCart, color: "bg-primary", shadow: "shadow-[8px_8px_0px_0px_rgba(255,222,0,1)]" },
                        { label: "Citizen Count", value: stats.totalUsers.toLocaleString(), icon: Users, color: "bg-white", shadow: "shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]" },
                        { label: "Verified Artists", value: stats.totalActiveArtists.toLocaleString(), icon: Palette, color: "bg-neutral-black", textColor: "text-white", shadow: "shadow-[8px_8px_0px_0px_rgba(0,0,0,0.2)]" }
                    ].map((s, i) => (
                        <div key={i} className={`bg-white border-[2px] border-neutral-black rounded-[6px] p-6 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all ${s.shadow}`}>
                            <div className={`w-12 h-12 rounded-[4px] border-[2px] border-neutral-black ${s.color} flex items-center justify-center mb-6`}>
                                <s.icon className={`w-6 h-6 ${s.textColor || 'text-neutral-black'}`} />
                            </div>
                            <p className="font-display text-[10px] font-black uppercase text-neutral-g3 tracking-[2px] mb-1">{s.label}</p>
                            <h2 className="font-display text-[32px] font-black text-neutral-black italic tracking-tighter leading-none">{s.value}</h2>
                        </div>
                    ))}
                </div>

                {/* Action Banners */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
                    <div className={`bg-white border-[2px] border-neutral-black rounded-[6px] p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,0.05)] relative overflow-hidden group ${pendingDesignsCount > 0 ? 'ring-2 ring-primary ring-offset-4' : ''}`}>
                        <div className="absolute top-0 right-0 w-32 h-full bg-primary/5 -skew-x-12 translate-x-16 pointer-events-none transition-transform group-hover:translate-x-12" />
                        <div className="flex items-start justify-between relative z-10 mb-8">
                            <div className="space-y-2">
                                <h3 className="font-display text-[18px] font-black uppercase tracking-[1px]">Design Verification</h3>
                                <p className="font-display text-[11px] font-bold text-neutral-g4 uppercase tracking-wider">{pendingDesignsCount} designs awaiting review</p>
                            </div>
                            <div className={`w-12 h-12 rounded-full border-[2px] border-neutral-black flex items-center justify-center ${pendingDesignsCount > 0 ? 'bg-primary animate-bounce' : 'bg-neutral-g1'}`}>
                                <Palette className="w-5 h-5 text-neutral-black" />
                            </div>
                        </div>
                        <Link to="/admin/designs">
                            <button className="w-full py-4 bg-primary border-[2px] border-neutral-black rounded-[4px] font-display text-[13px] font-black uppercase tracking-[2px] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all flex items-center justify-center gap-3">
                                {pendingDesignsCount > 0 ? "Review Submissions" : "Manage Designs"} <ArrowRight className="w-4 h-4" />
                            </button>
                        </Link>
                    </div>

                    <div className="bg-white border-[2px] border-neutral-black rounded-[6px] p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,0.05)] relative overflow-hidden opacity-80 filter grayscale hover:grayscale-0 transition-all group">
                        <div className="absolute top-0 right-0 w-32 h-full bg-neutral-black/5 -skew-x-12 translate-x-16 pointer-events-none" />
                        <div className="flex items-start justify-between relative z-10 mb-8">
                            <div className="space-y-2">
                                <h3 className="font-display text-[18px] font-black uppercase tracking-[1px]">Policy & Violations</h3>
                                <p className="font-display text-[11px] font-bold text-neutral-g4 uppercase tracking-wider">0 active product disputes detected</p>
                            </div>
                            <div className="w-12 h-12 rounded-full border-[2px] border-neutral-black flex items-center justify-center bg-neutral-g1">
                                <ShieldAlert className="w-5 h-5 text-neutral-black" />
                            </div>
                        </div>
                        <button disabled className="w-full py-4 bg-neutral-g2 border-[2px] border-neutral-black rounded-[4px] font-display text-[13px] font-black uppercase tracking-[2px] cursor-not-allowed text-neutral-g4">
                            Protocol Locked
                        </button>
                    </div>
                </div>

                {/* Data Tables */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    {/* Recent Orders List */}
                    <div className="bg-white border-[2px] border-neutral-black rounded-[6px] shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                        <div className="bg-neutral-black px-6 py-5 flex items-center justify-between border-b-[2px] border-neutral-black">
                            <h3 className="font-display text-[14px] font-black text-white uppercase tracking-[2px] flex items-center gap-3">
                                <ShoppingCart className="w-4 h-4 text-primary" /> Traffic stream
                            </h3>
                            <Link to="/admin/orders" className="font-display text-[9px] font-black uppercase text-primary underline underline-offset-4 decoration-[2px] tracking-[1px]">Full Ledger</Link>
                        </div>
                        <div className="divide-y-[1px] divide-neutral-black/10">
                            {recentOrders.length === 0 ? (
                                <div className="p-12 text-center">
                                    <p className="font-display text-[11px] font-black text-neutral-g2 uppercase tracking-[2px]">No active transmissions detected.</p>
                                </div>
                            ) : (
                                recentOrders.map((order: any) => (
                                    <div key={order.id} className="flex items-center justify-between px-6 py-5 hover:bg-primary/5 transition-colors group">
                                        <div className="space-y-1">
                                            <div className="font-display text-[14px] font-black text-neutral-black uppercase italic">#{order.id.slice(-6).toUpperCase()}</div>
                                            <div className="font-display text-[10px] font-bold text-neutral-g4 uppercase">{order.customer}</div>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <span className="font-display text-[18px] font-black text-neutral-black italic">₹{order.amount.toFixed(0)}</span>
                                            <span className={`font-display text-[9px] font-black tracking-[1px] uppercase px-3 py-1.5 border-[1px] rounded-[2px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${statusPillClass(order.status)}`}>
                                                {order.status}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Top Artists List */}
                    <div className="bg-white border-[2px] border-neutral-black rounded-[6px] shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                        <div className="bg-neutral-black px-6 py-5 flex items-center justify-between border-b-[2px] border-neutral-black">
                            <h3 className="font-display text-[14px] font-black text-white uppercase tracking-[2px] flex items-center gap-3">
                                <Palette className="w-4 h-4 text-primary" /> Artist Vault
                            </h3>
                            <Link to="/admin/artists" className="font-display text-[9px] font-black uppercase text-primary underline underline-offset-4 decoration-[2px] tracking-[1px]">Directory</Link>
                        </div>
                        <div className="divide-y-[1px] divide-neutral-black/10">
                            {topArtists.length === 0 ? (
                                <div className="p-12 text-center">
                                    <p className="font-display text-[11px] font-black text-neutral-g2 uppercase tracking-[2px]">No verified subjects found.</p>
                                </div>
                            ) : (
                                topArtists.map((artist: any) => (
                                    <div key={artist.id} className="flex items-center justify-between px-6 py-5 hover:bg-primary/5 transition-colors group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-[4px] border-[1px] border-neutral-black bg-neutral-g1 overflow-hidden relative group-hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all">
                                                {artist.image ? (
                                                    <img src={artist.image} alt={artist.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center font-display text-[18px] font-black text-neutral-g3">{(artist.name || "A").charAt(0).toUpperCase()}</div>
                                                )}
                                            </div>
                                            <div className="space-y-1">
                                                <div className="font-display text-[15px] font-black text-neutral-black uppercase tracking-tight">{artist.name}</div>
                                                <div className="font-display text-[9px] font-extrabold text-success uppercase tracking-[1px]">● Verified Active</div>
                                            </div>
                                        </div>
                                        <Link to="/admin/artists" className="p-3 bg-white border-[1px] border-neutral-black rounded-[4px] hover:bg-neutral-black hover:text-white transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] group-hover:shadow-none translate-x-[-2px] translate-y-[-2px] group-hover:translate-x-0 group-hover:translate-y-0">
                                            <Eye className="w-4 h-4" />
                                        </Link>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
