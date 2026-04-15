import { useState, useEffect } from "react";
import {
    IndianRupee,
    Download,
    History,
    HelpCircle,
    Loader2,
    CheckCircle2,
    Clock,
    XCircle,
} from "lucide-react";
import Loader from "../../components/shared/Loader";
import api from "../../api/axios";
import { useNavigate } from "react-router-dom";

type SummaryCard = {
    label: string;
    value: number;
    color: string;
    emoji: string;
    isCount?: boolean;
    sub?: string;
};

interface Settlement {
    id: string;
    amount: number;
    currency: string;
    status: string;
    periodStart: string;
    periodEnd: string;
    bankReference?: string | null;
    processedAt?: string | null;
    createdAt: string;
    method: string;
}

function formatPeriod(start: string, end: string) {
    try {
        const d = new Date(start);
        return d.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
    } catch {
        return `${start.slice(0, 10)} – ${end.slice(0, 10)}`;
    }
}

function csvEscapeCell(value: unknown): string {
    const s = String(value ?? "");
    if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
}

function buildSettlementsCsv(rows: Settlement[]): string {
    const header = [
        "Period label",
        "Period start (ISO)",
        "Period end (ISO)",
        "Amount (INR)",
        "Currency",
        "Method (masked)",
        "Status",
        "Bank reference",
        "Created (ISO)",
    ];
    const lines = [header.map(csvEscapeCell).join(",")];
    for (const s of rows) {
        lines.push(
            [
                formatPeriod(s.periodStart, s.periodEnd),
                s.periodStart,
                s.periodEnd,
                s.amount,
                s.currency,
                s.method,
                s.status,
                s.bankReference ?? "",
                s.createdAt,
            ]
                .map(csvEscapeCell)
                .join(",")
        );
    }
    return lines.join("\r\n");
}

function triggerCsvDownload(filename: string, body: string) {
    const blob = new Blob(["\uFEFF", body], { type: "text/csv;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
}

const statusPillClass = (status: string) => {
    const s = status?.toLowerCase();
    if (s === "paid" || s === "completed" || s === "fulfilled") return "bg-success text-white border-neutral-black";
    if (s === "pending" || s === "processing" || s === "approved") return "bg-primary text-neutral-black border-neutral-black";
    if (s === "cancelled" || s === "failed") return "bg-neutral-r1 text-danger border-neutral-black";
    return "bg-neutral-g2 text-neutral-g4 border-neutral-black";
};

const statusIcon = (status: string) => {
    const s = status?.toLowerCase();
    if (s === "paid") return <CheckCircle2 className="w-3.5 h-3.5" />;
    if (s === "pending" || s === "processing" || s === "approved") return <Clock className="w-3.5 h-3.5" />;
    if (s === "failed" || s === "cancelled") return <XCircle className="w-3.5 h-3.5" />;
    return null;
};

export default function ArtistEarnings() {
    const navigate = useNavigate();
    const [stats, setStats] = useState<any>(null);
    const [settlements, setSettlements] = useState<Settlement[]>([]);
    const [loading, setLoading] = useState(true);
    const [csvDownloading, setCsvDownloading] = useState(false);
    const [payoutCsvDownloading, setPayoutCsvDownloading] = useState(false);

    useEffect(() => {
        const fetchEarningsData = async () => {
            try {
                setLoading(true);
                const [statsRes, settlementsRes] = await Promise.all([
                    api.get("/api/artist/stats"),
                    api.get("/api/artist/settlements"),
                ]);
                setStats(statsRes.data.data.stats);
                setSettlements(settlementsRes.data.data?.settlements || []);
            } catch (error) {
                console.error("Failed to fetch earnings data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchEarningsData();
    }, []);

    const handleDownloadCsv = async () => {
        try {
            setCsvDownloading(true);
            const res = await api.get("/api/artist/earnings/csv", { responseType: "blob" });
            const ct = (res.headers["content-type"] || "").toLowerCase();
            if (!ct.includes("csv") && !ct.includes("text/plain")) {
                const text = await (res.data as Blob).text();
                console.error("Unexpected CSV response:", text.slice(0, 200));
                alert("Could not download the report (unexpected response). Please try again.");
                return;
            }
            const disposition = res.headers["content-disposition"] as string | undefined;
            const match = disposition?.match(/filename="?([^";]+)"?/i);
            const filename = match?.[1] || `tehive-artist-earnings-${new Date().toISOString().slice(0, 10)}.csv`;
            const blob = new Blob([res.data], { type: "text/csv;charset=utf-8" });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = filename;
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (e) {
            console.error("CSV download failed:", e);
            alert("Could not download the report. Please try again.");
        } finally {
            setCsvDownloading(false);
        }
    };

    const handleDownloadPayoutHistoryCsv = () => {
        if (settlements.length === 0) return;
        try {
            setPayoutCsvDownloading(true);
            const csv = buildSettlementsCsv(settlements);
            const filename = `tehive-payout-history-${new Date().toISOString().slice(0, 10)}.csv`;
            triggerCsvDownload(filename, csv);
        } finally {
            setPayoutCsvDownloading(false);
        }
    };

    const summaryCards: SummaryCard[] = [
        { label: "Total Earned", value: stats?.totalEarnings || 0, color: "bg-primary/20", emoji: "₹" },
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
                    <div className="space-y-2">
                        <h1 className="font-display text-[clamp(26px,4vw,40px)] font-black text-neutral-black uppercase tracking-tight leading-none">
                            Earnings <span className="text-primary italic">ledger</span>
                        </h1>
                        <p className="font-display text-[12px] font-bold text-neutral-g4 uppercase tracking-wider max-w-lg">
                            Summary totals and a downloadable CSV of every paid order line attributed to you.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={handleDownloadCsv}
                        disabled={csvDownloading}
                        className="flex items-center justify-center gap-3 px-6 py-3 bg-white border-[2px] border-neutral-black rounded-[4px] font-display text-[13px] font-black uppercase tracking-[1px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all disabled:opacity-50 shrink-0"
                    >
                        {csvDownloading ? (
                            <Loader2 className="w-4 h-4 text-primary animate-spin" />
                        ) : (
                            <Download className="w-4 h-4 text-primary" />
                        )}
                        Download Earnings report
                    </button>
                </div>

                {/* Quick Summary Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mb-12">
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
                        <div className="bg-neutral-black p-4 flex flex-wrap items-center justify-between gap-3 text-white">
                            <div className="flex items-center gap-3">
                                <History className="w-5 h-5 text-primary" />
                                <h2 className="font-display text-[14px] font-black uppercase tracking-[1px]">Payout History</h2>
                            </div>
                            <button
                                type="button"
                                onClick={handleDownloadPayoutHistoryCsv}
                                disabled={settlements.length === 0 || payoutCsvDownloading}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-white text-neutral-black border-[2px] border-neutral-black rounded-[4px] font-display text-[10px] font-black uppercase tracking-[1px] shadow-[3px_3px_0px_0px_rgba(255,222,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all disabled:opacity-40 disabled:shadow-none disabled:translate-x-0 disabled:translate-y-0"
                            >
                                {payoutCsvDownloading ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                    <Download className="w-3.5 h-3.5" />
                                )}
                                Export CSV
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-neutral-g1/50 border-b-[2px] border-neutral-black">
                                        {["Period", "Amount", "Method", "Status", "Reference"].map(h => (
                                            <th key={h} className="font-display text-[10px] font-black tracking-[2px] uppercase text-neutral-g4 py-5 px-6 text-left whitespace-nowrap">
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {settlements.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="py-24 text-center">
                                                <div className="flex flex-col items-center gap-3 opacity-20">
                                                    <History className="w-12 h-12" />
                                                    <span className="font-display text-[11px] font-black uppercase tracking-[2px]">No payouts yet</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        settlements.map((s) => (
                                            <tr key={s.id} className="border-b-[1px] border-neutral-black/5 hover:bg-primary/5 transition-colors">
                                                <td className="py-5 px-6 font-display text-[12px] font-bold text-neutral-black uppercase">
                                                    {formatPeriod(s.periodStart, s.periodEnd)}
                                                </td>
                                                <td className="py-5 px-6">
                                                    <span className="font-display text-[14px] font-black text-neutral-black">
                                                        ₹{s.amount?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                                    </span>
                                                </td>
                                                <td className="py-5 px-6 font-display text-[11px] font-black text-neutral-g3 uppercase">
                                                    {s.method}
                                                </td>
                                                <td className="py-5 px-6">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[2px] border-[1px] border-neutral-black font-display text-[9px] font-black uppercase tracking-[1px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${statusPillClass(s.status)}`}>
                                                        {statusIcon(s.status)}
                                                        {s.status}
                                                    </span>
                                                </td>
                                                <td className="py-5 px-6">
                                                    {s.status === "PAID" && s.bankReference ? (
                                                        <span className="font-mono text-[11px] font-semibold text-neutral-black break-all">
                                                            {s.bankReference}
                                                        </span>
                                                    ) : s.status === "PAID" ? (
                                                        <span className="font-display text-[10px] text-neutral-g4 uppercase">Settled</span>
                                                    ) : (
                                                        <span className="font-display text-[10px] text-neutral-g4 uppercase">—</span>
                                                    )}
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
                                    { t: "The Cut", d: "You get 25% of the final line total (including discounts) on every paid order line for your products." },
                                    { t: "Royalty Cycle", d: "Royalties for the previous month's paid sales are typically settled on the 10th of the current month after reconciliation." },
                                    { t: "CSV reports", d: "Download CSV report exports every paid order line and your share. Export CSV on Payout History downloads settlement rows (period, amount, status, reference)." },
                                    { t: "Payout details", d: "Keep your UPI or bank details accurate on the Payout page so transfers are not delayed." },
                                    { t: "TDS/Tax", d: "Tax treatment follows your agreement and applicable law; consult a professional for filing." },
                                ].map((item, i) => (
                                    <li key={i} className="space-y-1">
                                        <div className="font-display text-[10px] font-black uppercase tracking-[1px]">{item.t}</div>
                                        <p className="font-body text-[12px] font-bold text-neutral-black/60 leading-snug">{item.d}</p>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <button
                            type="button"
                            onClick={() => navigate("/artist/payout")}
                            className="w-full text-left bg-white border-[2px] border-neutral-black rounded-[6px] p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex items-center gap-4 group cursor-pointer hover:bg-neutral-black hover:text-white transition-all"
                        >
                            <div className="w-10 h-10 shrink-0 bg-neutral-g1 border-[2px] border-neutral-black flex items-center justify-center group-hover:bg-primary group-hover:border-white transition-all">
                                <IndianRupee className="w-5 h-5 group-hover:text-neutral-black" />
                            </div>
                            <div className="flex-1">
                                <div className="font-display text-[11px] font-black uppercase tracking-[1.5px]">Payout Settings</div>
                                <div className="text-[10px] font-bold opacity-40 uppercase">Update UPI/Bank Info</div>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
