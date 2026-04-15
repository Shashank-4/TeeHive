import { useState, useEffect } from "react";
import {
    TrendingUp,
    Upload,
    Edit,
    Eye,
    BookOpen,
    Wallet,
} from "lucide-react";
import Loader from "../../components/shared/Loader";
import { useNavigate, Link } from "react-router-dom";
import api from "../../api/axios";
import RevenueChart from "../../components/artist/RevenueChart";

interface ArtistDashboardConfig {
    showAnnouncement: boolean;
    announcementText: string;
}

const DEFAULT_ARTIST_CONFIG: ArtistDashboardConfig = {
    showAnnouncement: true,
    announcementText: "Welcome to TeeHive! Upload at least 3 designs to submit your profile for verification and start selling.",
};

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

export default function ArtistDashboard() {
    const navigate = useNavigate();
    const [stats, setStats] = useState<any>(null);
    const [recentOrders, setRecentOrders] = useState<any[]>([]);
    const [recentProducts, setRecentProducts] = useState<any[]>([]);
    const [config, setConfig] = useState<ArtistDashboardConfig>(DEFAULT_ARTIST_CONFIG);
    const [statsLoading, setStatsLoading] = useState(true);
    const [revRange, setRevRange] = useState<"7d" | "30d" | "365d">("30d");
    const [revPoints, setRevPoints] = useState<{ label: string; earnings: number }[]>([]);
    const [revLoading, setRevLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [statsRes, ordersRes, productsRes, configRes] = await Promise.allSettled([
                    api.get("/api/artist/stats"),
                    api.get("/api/orders/artist/recent"),
                    api.get("/api/artist/products?limit=6"),
                    api.get("/api/artist/dashboard")
                ]);

                if (statsRes.status === "fulfilled") setStats(statsRes.value.data.data.stats);
                if (ordersRes.status === "fulfilled") setRecentOrders(ordersRes.value.data.data.orders);
                if (productsRes.status === "fulfilled") setRecentProducts(productsRes.value.data.data.products);

                if (configRes.status === "fulfilled" && configRes.value.data?.data?.config) {
                    setConfig({ ...DEFAULT_ARTIST_CONFIG, ...configRes.value.data.data.config });
                }
            } catch (error) {
                console.error("Failed to fetch dashboard data:", error);
            } finally {
                setStatsLoading(false);
            }
        };
        fetchDashboardData();
    }, []);

    useEffect(() => {
        let cancelled = false;
        const loadSeries = async () => {
            setRevLoading(true);
            try {
                const res = await api.get("/api/artist/stats/revenue-series", {
                    params: { range: revRange },
                });
                if (!cancelled) {
                    setRevPoints(res.data?.data?.points ?? []);
                }
            } catch (e) {
                console.error("Failed to load revenue series:", e);
                if (!cancelled) setRevPoints([]);
            } finally {
                if (!cancelled) setRevLoading(false);
            }
        };
        loadSeries();
        return () => {
            cancelled = true;
        };
    }, [revRange]);

    return (
        <div className="w-full min-h-screen bg-neutral-g1 flex flex-col pt-4">
            <div className="flex-1 px-4 sm:px-8 pb-12 w-full">
                {/* Header & Announcement */}
                <div className="flex flex-col gap-8 mb-12">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="flex gap-4">
                            <button
                                onClick={() => navigate("/artist/manage-designs")}
                                className="flex items-center gap-3 px-6 py-3 bg-primary border-[2px] border-neutral-black rounded-[4px] font-display text-[13px] font-black uppercase tracking-[1px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
                            >
                                <Upload className="w-4 h-4" /> Drop New Art
                            </button>
                        </div>
                    </div>

                    {config.showAnnouncement && (
                        <div className="bg-neutral-black border-[2px] border-neutral-black rounded-[6px] p-6 shadow-[8px_8px_0px_0px_rgba(255,222,0,1)] flex items-start gap-5 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-full bg-primary/10 -skew-x-12 translate-x-16 group-hover:translate-x-12 transition-transform" />
                            <div className="text-[32px] shrink-0 transform group-hover:scale-110 transition-transform">⭐</div>
                            <div className="relative z-10">
                                <div className="font-display text-[14px] font-black text-primary uppercase tracking-[2px] mb-2">
                                    Hive Transmission Incoming
                                </div>
                                <p className="font-display text-[18px] font-bold text-white leading-tight max-w-[800px]">
                                    {config.announcementText}
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 normal-case">
                        <Link
                            to="/artist-content-guidelines"
                            className="group flex items-start gap-4 p-5 bg-white border-[2px] border-neutral-black rounded-[6px] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all no-underline text-neutral-black"
                        >
                            <div className="w-11 h-11 rounded-[4px] border-[2px] border-neutral-black bg-primary/20 flex items-center justify-center shrink-0">
                                <BookOpen className="w-5 h-5 text-neutral-black" />
                            </div>
                            <div>
                                <div className="font-display text-[12px] font-black uppercase tracking-[0.15em] text-neutral-g3 mb-1">
                                    Policies
                                </div>
                                <div className="font-display text-[16px] font-black text-neutral-black group-hover:text-primary transition-colors">
                                    Artist Content Guidelines
                                </div>
                                <p className="font-body text-[13px] text-neutral-g4 mt-1 leading-snug">
                                    What you can upload, fan art, and quality rules.
                                </p>
                            </div>
                        </Link>
                        <Link
                            to="/artist-tax-payout-policy"
                            className="group flex items-start gap-4 p-5 bg-white border-[2px] border-neutral-black rounded-[6px] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all no-underline text-neutral-black"
                        >
                            <div className="w-11 h-11 rounded-[4px] border-[2px] border-neutral-black bg-primary/20 flex items-center justify-center shrink-0">
                                <Wallet className="w-5 h-5 text-neutral-black" />
                            </div>
                            <div>
                                <div className="font-display text-[12px] font-black uppercase tracking-[0.15em] text-neutral-g3 mb-1">
                                    Policies
                                </div>
                                <div className="font-display text-[16px] font-black text-neutral-black group-hover:text-primary transition-colors">
                                    Tax &amp; Payout Policy
                                </div>
                                <p className="font-body text-[13px] text-neutral-g4 mt-1 leading-snug">
                                    Commission, TDS, payout dates, and disputes.
                                </p>
                            </div>
                        </Link>
                    </div>
                </div>

                {/* Main Stats Grid — first card matches Earnings ledger “Total Earned” */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 mb-12">
                    {[
                        {
                            label: "Total Earned",
                            value: stats?.totalEarnings ?? 0,
                            color: "bg-primary/20",
                            emoji: "₹",
                            isCount: false,
                            sub: "25% artist share from paid orders",
                        },
                        {
                            label: "Orders Fulfilled",
                            value: stats?.totalSales ?? 0,
                            color: "bg-info/20",
                            emoji: "✅",
                            isCount: true,
                            sub: "Verified Hive Sales",
                        },
                        {
                            label: "Live Products",
                            value: stats?.publishedProducts ?? 0,
                            color: "bg-success/20",
                            emoji: "📦",
                            isCount: true,
                            sub: `${stats?.draftProducts ?? 0} Drafts in Lab`,
                        },
                        {
                            label: "Designs Uploaded",
                            value: stats?.totalDesigns ?? 0,
                            color: "bg-neutral-g2/50",
                            emoji: "🎨",
                            isCount: true,
                            sub: "Source Graphics",
                        },
                    ].map((card, i) => (
                        <div
                            key={i}
                            className="bg-white border-[2px] border-neutral-black rounded-[6px] p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] group hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
                        >
                            <div
                                className={`w-12 h-12 rounded-[2px] border-[2px] border-neutral-black flex items-center justify-center text-[20px] mb-6 ${card.color}`}
                            >
                                {card.emoji}
                            </div>
                            <div className="space-y-1">
                                <div className="font-display text-[32px] font-black text-neutral-black leading-none tracking-tight">
                                    {statsLoading ? (
                                        <Loader size="w-6 h-6" />
                                    ) : card.isCount ? (
                                        card.value?.toLocaleString("en-IN")
                                    ) : (
                                        `₹${Number(card.value).toLocaleString("en-IN")}`
                                    )}
                                </div>
                                <div className="font-display text-[10px] font-black uppercase tracking-[1px] text-neutral-g3">
                                    {card.label}
                                </div>
                            </div>
                            {card.sub ? (
                                <div className="mt-4 pt-4 border-t-[1px] border-neutral-black/5 font-display text-[9px] font-black text-neutral-g4 uppercase tracking-[1px]">
                                    ● {card.sub}
                                </div>
                            ) : null}
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
                    <div className="space-y-8">
                        {/* Revenue Placeholder */}
                        <div className="bg-white border-[2px] border-neutral-black rounded-[6px] overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                            <div className="bg-neutral-black p-4 flex flex-wrap items-center justify-between gap-3 text-white">
                                <div className="flex items-center gap-3">
                                    <TrendingUp className="w-5 h-5 text-primary" />
                                    <div>
                                        <h2 className="font-display text-[14px] font-black uppercase tracking-[1px]">Your revenue</h2>
                                        <p className="font-display text-[9px] font-bold text-white/50 uppercase tracking-wide mt-0.5">
                                            Artist share (25%) from paid orders
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-1 border border-white/20 rounded-[4px] p-0.5">
                                    {(
                                        [
                                            { key: "7d" as const, label: "7D" },
                                            { key: "30d" as const, label: "30D" },
                                            { key: "365d" as const, label: "1Y" },
                                        ]
                                    ).map(({ key, label }) => (
                                        <button
                                            key={key}
                                            type="button"
                                            onClick={() => setRevRange(key)}
                                            className={`px-3 py-1.5 font-display text-[9px] font-black rounded-[2px] transition-colors ${
                                                revRange === key
                                                    ? "bg-primary text-neutral-black"
                                                    : "text-neutral-g3 hover:text-white"
                                            }`}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <RevenueChart points={revPoints} loading={revLoading} />
                        </div>

                        {/* Recent Orders */}
                        <div className="bg-white border-[2px] border-neutral-black rounded-[6px] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col">
                            <div className="p-4 border-b-[2px] border-neutral-black flex items-center justify-between bg-white">
                                <h2 className="font-display text-[14px] font-black uppercase tracking-[1px]">Recent Manifestations</h2>
                                <button onClick={() => navigate("/artist/orders")} className="font-display text-[10px] font-black uppercase text-primary-dark underline underline-offset-4">View Records</button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <tbody className="divide-y-[1px] divide-neutral-black/5">
                                        {recentOrders.length === 0 ? (
                                            <tr><td className="p-12 text-center opacity-30 font-display text-[10px] font-black uppercase italic">The void is silent...</td></tr>
                                        ) : recentOrders.map((order, i) => (
                                            <tr key={i} className="hover:bg-primary/5 transition-colors">
                                                <td className="p-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 bg-neutral-g1 border-[1px] border-neutral-black rounded-[2px] overflow-hidden">
                                                            <img src={order.productImage} className="w-full h-full object-cover" />
                                                        </div>
                                                        <div>
                                                            <div className="font-display text-[12px] font-black text-neutral-black uppercase">{order.product}</div>
                                                            <div className="text-[10px] font-bold text-neutral-g4 uppercase">#{order.id.slice(-8).toUpperCase()}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <div className="font-display text-[14px] font-black text-neutral-black mb-1">{order.amount}</div>
                                                    <span className={`px-2 py-0.5 rounded-[2px] border-[1px] border-neutral-black font-display text-[8px] font-black uppercase tracking-[1px] shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] whitespace-nowrap ${statusPillClass(order.status)}`}>
                                                        {order.status?.replace(/_/g, " ")}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Right Sidebar */}
                    <div className="space-y-8">
                        {/* Quick Navigation */}
                        <div className="bg-primary border-[2px] border-neutral-black rounded-[6px] p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                            <h3 className="font-display text-[14px] font-black uppercase tracking-[1px] mb-6">Hive Nodes</h3>
                            <div className="grid grid-cols-1 gap-3">
                                {[
                                    { label: "Design Lab", path: "/artist/manage-designs", icon: "🎨" },
                                    { label: "Mockup Forge", path: "/artist/create-mockup", icon: "⚒️" },
                                    { label: "Treasury Hub", path: "/artist/earnings", icon: "🏦" },
                                    { label: "Hive Profile", path: "/artist/profile", icon: "👤" }
                                ].map((node, i) => (
                                    <button
                                        key={i}
                                        onClick={() => navigate(node.path)}
                                        className="flex items-center gap-4 p-3 bg-white border-[2px] border-neutral-black rounded-[4px] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                                    >
                                        <span className="text-[18px]">{node.icon}</span>
                                        <span className="font-display text-[11px] font-black uppercase tracking-[1px] text-neutral-black">{node.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Recent Products Row */}
                        <div className="bg-white border-[2px] border-neutral-black rounded-[6px] p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="font-display text-[14px] font-black uppercase tracking-[1px]">Latest Drops</h3>
                                <button onClick={() => navigate("/artist/manage-products")} className="text-primary-dark"><Eye className="w-5 h-5" /></button>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                {recentProducts.length === 0 ? (
                                    <div className="col-span-2 py-4 text-center border-[2px] border-dashed border-neutral-black/10 rounded-[4px] font-display text-[9px] font-black uppercase text-neutral-g3 tracking-[1px]">No live gear</div>
                                ) : recentProducts.map((p, i) => (
                                    <div key={i} className="group relative aspect-square bg-neutral-g1 border-[2px] border-neutral-black rounded-[2px] overflow-hidden">
                                        <img src={p.mockupImageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                        <div className="absolute inset-0 bg-neutral-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <button onClick={() => navigate(`/artist/manage-products`)} className="p-2 bg-primary border-[1px] border-neutral-black rounded-full"><Edit className="w-4 h-4" /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
