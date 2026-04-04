import { useState, useEffect } from "react";
import {
    IndianRupee,
    Download,
    History,
    HelpCircle
} from "lucide-react";
import Loader from "../../components/shared/Loader";
import api from "../../api/axios";

type SummaryCard = {
    label: string;
    value: number;
    color: string;
    emoji: string;
    isCount?: boolean;
    sub?: string;
};

const statusPillClass = (status: string) => {
    const s = status?.toLowerCase();
    if (s === "paid" || s === "completed" || s === "fulfilled") return "bg-success text-white border-neutral-black";
    if (s === "pending" || s === "processing") return "bg-primary text-neutral-black border-neutral-black";
    if (s === "cancelled" || s === "failed") return "bg-neutral-r1 text-danger border-neutral-black";
    return "bg-neutral-g2 text-neutral-g4 border-neutral-black";
};

export default function ArtistEarnings() {
    const [stats, setStats] = useState<any>(null);
    const [payouts, setPayouts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEarningsData = async () => {
            try {
                setLoading(true);
                const statsRes = await api.get("/api/artist/stats");

                setStats(statsRes.data.data.stats);
                setPayouts([]);
            } catch (error) {
                console.error("Failed to fetch earnings data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchEarningsData();
    }, []);

    const summaryCards: SummaryCard[] = [
        { label: "Total Earned", value: stats?.totalEarnings || 0, color: "bg-primary/20", emoji: "₹" },
        { label: "Gross Revenue", value: stats?.totalRevenue || 0, color: "bg-success/20", emoji: "💰" },
        { label: "Units Sold", value: stats?.totalSales || 0, color: "bg-info/20", emoji: "✅", isCount: true },
        { label: "Paid Orders", value: stats?.totalOrders || 0, color: "bg-neutral-g2/50", emoji: "🛍️", isCount: true },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader size="w-12 h-12" />
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen bg-neutral-g1 flex flex-col pt-4">
            <div className="flex-1 px-4 sm:px-8 pb-12 w-full">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
                    <button className="flex items-center gap-3 px-6 py-3 bg-white border-[2px] border-neutral-black rounded-[4px] font-display text-[13px] font-black uppercase tracking-[1px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all">
                        <Download className="w-4 h-4 text-primary" /> Download Report
                    </button>
                </div>

                {/* Quick Summary Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 mb-12">
                    {summaryCards.map((card, i) => (
                        <div key={i} className="bg-white border-[2px] border-neutral-black rounded-[6px] p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] group hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all">
                            <div className={`w-12 h-12 rounded-[2px] border-[2px] border-neutral-black flex items-center justify-center text-[20px] mb-6 ${card.color}`}>
                                {card.emoji}
                            </div>
                            <div className="space-y-1">
                                <div className="font-display text-[32px] font-black text-neutral-black leading-none tracking-tight">
                                    {card.isCount ? card.value?.toLocaleString('en-IN') : `₹${card.value?.toLocaleString('en-IN')}`}
                                </div>
                                <div className="font-display text-[10px] font-black uppercase tracking-[1px] text-neutral-g3">
                                    {card.label}
                                </div>
                            </div>
                            {card.sub && (
                                <div className="mt-4 pt-4 border-t-[1px] border-neutral-black/5 font-display text-[9px] font-black text-success uppercase tracking-[1px]">
                                    ● {card.sub}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
                    {/* Payout History Table */}
                    <div className="bg-white border-[2px] border-neutral-black rounded-[6px] overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col">
                        <div className="bg-neutral-black p-4 flex items-center justify-between text-white">
                            <div className="flex items-center gap-3">
                                <History className="w-5 h-5 text-primary" />
                                <h2 className="font-display text-[14px] font-black uppercase tracking-[1px]">Payout History</h2>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-neutral-g1/50 border-b-[2px] border-neutral-black">
                                        {["Payout ID", "Period", "Amount", "Method", "Status"].map(h => (
                                            <th key={h} className="font-display text-[10px] font-black tracking-[2px] uppercase text-neutral-g4 py-5 px-6 text-left whitespace-nowrap">
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {payouts.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="py-24 text-center">
                                                <div className="flex flex-col items-center gap-3 opacity-20">
                                                    <History className="w-12 h-12" />
                                                    <span className="font-display text-[11px] font-black uppercase tracking-[2px]">Your history is currently empty</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        payouts.map((payout, i) => (
                                            <tr key={i} className="border-b-[1px] border-neutral-black/5 hover:bg-primary/5 transition-colors">
                                                <td className="py-5 px-6 font-display text-[13px] font-black text-neutral-black">{payout.id}</td>
                                                <td className="py-5 px-6 font-display text-[11px] font-bold text-neutral-g4 uppercase">{payout.period}</td>
                                                <td className="py-5 px-6">
                                                    <span className="font-display text-[14px] font-black text-neutral-black">₹{payout.amount?.toLocaleString('en-IN')}</span>
                                                </td>
                                                <td className="py-5 px-6 font-display text-[11px] font-black text-neutral-g3 uppercase">{payout.method}</td>
                                                <td className="py-5 px-6">
                                                    <span className={`px-2 py-1 rounded-[2px] border-[1px] border-neutral-black font-display text-[9px] font-black uppercase tracking-[1px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${statusPillClass(payout.status)}`}>
                                                        {payout.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* How it Works Sidebar */}
                    <div className="space-y-6">
                        <div className="bg-primary border-[2px] border-neutral-black rounded-[6px] p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                            <div className="flex items-center gap-3 mb-4">
                                <HelpCircle className="w-5 h-5 text-neutral-black" />
                                <h3 className="font-display text-[14px] font-black uppercase tracking-[1px]">Treasury Rules</h3>
                            </div>
                            <ul className="space-y-4">
                                {[
                                    { t: "The Cut", d: "You get 25% of the final unit sale price (including discounts) on every verified sale." },
                                    { t: "Royalty Cycle", d: "Royalties for the previous month's verified sales are settled manually on the 10th day of the current month after reconciliation." },
                                    { t: "Settlement Review", d: "Finance only steps in when payout validation fails, mismatches the beneficiary name, or needs resubmission." },
                                    { t: "Payout Method", d: "Keep your UPI or bank details accurate so settlements are not delayed." },
                                    { t: "TDS/Tax", d: "All payouts are inclusive of applicable taxes for Indian artists." }
                                ].map((item, i) => (
                                    <li key={i} className="space-y-1">
                                        <div className="font-display text-[10px] font-black uppercase tracking-[1px]">{item.t}</div>
                                        <p className="font-body text-[12px] font-bold text-neutral-black/60 leading-snug">{item.d}</p>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="bg-white border-[2px] border-neutral-black rounded-[6px] p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex items-center gap-4 group cursor-pointer hover:bg-neutral-black hover:text-white transition-all">
                            <div className="w-10 h-10 shrink-0 bg-neutral-g1 border-[2px] border-neutral-black flex items-center justify-center group-hover:bg-primary group-hover:border-white transition-all">
                                <IndianRupee className="w-5 h-5 group-hover:text-neutral-black" />
                            </div>
                            <div className="flex-1">
                                <div className="font-display text-[11px] font-black uppercase tracking-[1.5px]">Payout Settings</div>
                                <div className="text-[10px] font-bold opacity-40 uppercase">Update UPI/Bank Info</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
