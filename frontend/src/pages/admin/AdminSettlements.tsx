import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import { Loader2, Receipt, AlertCircle, ExternalLink } from "lucide-react";

interface SettlementRow {
    id: string;
    artistId: string;
    artistName: string;
    artistEmail: string;
    artistNumber: number | null;
    amount: number;
    currency: string;
    status: string;
    periodStart: string;
    periodEnd: string;
    bankReference: string | null;
    processedAt: string | null;
    createdAt: string;
    method: string;
    notes: string | null;
}

function formatPeriod(start: string) {
    try {
        return new Date(start).toLocaleDateString("en-IN", { month: "short", year: "numeric" });
    } catch {
        return start.slice(0, 10);
    }
}

function formatTs(iso: string | null | undefined) {
    if (!iso) return "—";
    try {
        return new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
    } catch {
        return iso;
    }
}

const statusClass = (status: string) => {
    const s = status?.toUpperCase();
    if (s === "PAID") return "bg-success/15 text-success border-success/40";
    if (s === "PENDING" || s === "APPROVED" || s === "PROCESSING") return "bg-primary/15 text-neutral-black border-primary/50";
    if (s === "FAILED" || s === "CANCELLED") return "bg-danger/10 text-danger border-danger/30";
    return "bg-neutral-g1 text-neutral-g4 border-neutral-black/20";
};

export default function AdminSettlements() {
    const [rows, setRows] = useState<SettlementRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [status, setStatus] = useState("");
    const [artistId, setArtistId] = useState("");
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");
    const [limit, setLimit] = useState("100");

    const fetchSettlements = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params: Record<string, string> = {};
            if (status) params.status = status;
            if (artistId.trim()) params.artistId = artistId.trim();
            if (from) params.from = from;
            if (to) params.to = to;
            if (limit) params.limit = limit;
            const res = await api.get("/api/admin/settlements", { params });
            setRows(res.data.data?.settlements || []);
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to load settlements.");
        } finally {
            setLoading(false);
        }
    }, [status, artistId, from, to, limit]);

    useEffect(() => {
        fetchSettlements();
    }, [fetchSettlements]);

    return (
        <div className="w-full min-h-screen bg-neutral-g1 p-6 sm:p-10">
            <div className="max-w-[1400px] mx-auto space-y-8">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div>
                        <h1 className="font-display text-[clamp(22px,3vw,32px)] font-black uppercase tracking-tight flex items-center gap-3">
                            <Receipt className="w-7 h-7 text-primary shrink-0" />
                            Settlements
                        </h1>
                        <p className="font-body text-[12px] text-neutral-g4 mt-2 max-w-xl leading-relaxed">
                            Read-only view of royalty settlement rows. Filter by status, artist UUID, or created date range.
                            Cleartext payout destinations are not shown here.
                        </p>
                    </div>
                </div>

                <div className="bg-white border-[3px] border-neutral-black rounded-[8px] p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                    <div className="flex flex-wrap items-end gap-4">
                        <div>
                            <label className="block font-display text-[9px] font-black uppercase tracking-wider text-neutral-g3 mb-1.5">
                                Status
                            </label>
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className="border-[2px] border-neutral-black rounded-[4px] px-3 py-2 font-display text-[11px] font-bold uppercase min-w-[160px]"
                            >
                                <option value="">All</option>
                                <option value="PENDING">Pending</option>
                                <option value="APPROVED">Approved</option>
                                <option value="PROCESSING">Processing</option>
                                <option value="PAID">Paid</option>
                                <option value="FAILED">Failed</option>
                                <option value="CANCELLED">Cancelled</option>
                            </select>
                        </div>
                        <div className="flex-1 min-w-[200px] max-w-md">
                            <label className="block font-display text-[9px] font-black uppercase tracking-wider text-neutral-g3 mb-1.5">
                                Artist ID (UUID)
                            </label>
                            <input
                                type="text"
                                value={artistId}
                                onChange={(e) => setArtistId(e.target.value)}
                                placeholder="Filter by artist…"
                                className="w-full border-[2px] border-neutral-black rounded-[4px] px-3 py-2 font-mono text-[11px]"
                            />
                        </div>
                        <div>
                            <label className="block font-display text-[9px] font-black uppercase tracking-wider text-neutral-g3 mb-1.5">
                                From (created)
                            </label>
                            <input
                                type="date"
                                value={from}
                                onChange={(e) => setFrom(e.target.value)}
                                className="border-[2px] border-neutral-black rounded-[4px] px-3 py-2 font-mono text-[11px]"
                            />
                        </div>
                        <div>
                            <label className="block font-display text-[9px] font-black uppercase tracking-wider text-neutral-g3 mb-1.5">
                                To (created)
                            </label>
                            <input
                                type="date"
                                value={to}
                                onChange={(e) => setTo(e.target.value)}
                                className="border-[2px] border-neutral-black rounded-[4px] px-3 py-2 font-mono text-[11px]"
                            />
                        </div>
                        <div>
                            <label className="block font-display text-[9px] font-black uppercase tracking-wider text-neutral-g3 mb-1.5">
                                Limit
                            </label>
                            <input
                                type="number"
                                min={1}
                                max={200}
                                value={limit}
                                onChange={(e) => setLimit(e.target.value)}
                                className="w-20 border-[2px] border-neutral-black rounded-[4px] px-3 py-2 font-mono text-[11px]"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={() => fetchSettlements()}
                            disabled={loading}
                            className="mt-auto px-5 py-2 bg-neutral-black text-white border-[2px] border-neutral-black rounded-[4px] font-display text-[10px] font-black uppercase tracking-[1px] hover:bg-primary hover:text-neutral-black transition-colors disabled:opacity-40"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Refresh"}
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="border-[2px] border-danger bg-danger/5 text-danger p-4 rounded-[4px] font-display text-[11px] font-black uppercase flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        {error}
                    </div>
                )}

                <div className="bg-white border-[3px] border-neutral-black rounded-[8px] overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-neutral-g1 border-b-[2px] border-neutral-black">
                                    {["Artist", "Period", "Amount", "Method", "Status", "Reference", "Notes", "Created", ""].map((h) => (
                                        <th
                                            key={h}
                                            className="font-display text-[9px] font-black uppercase tracking-wider text-neutral-g4 py-4 px-4 whitespace-nowrap"
                                        >
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {loading && rows.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="py-20 text-center">
                                            <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                                        </td>
                                    </tr>
                                ) : rows.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="py-20 text-center font-display text-[11px] font-black uppercase text-neutral-g3">
                                            No settlements match your filters.
                                        </td>
                                    </tr>
                                ) : (
                                    rows.map((r) => (
                                        <tr key={r.id} className="border-b border-neutral-black/10 hover:bg-primary/5">
                                            <td className="py-4 px-4 align-top">
                                                <div className="font-display text-[12px] font-black">{r.artistName}</div>
                                                <div className="font-mono text-[10px] text-neutral-g4 break-all">{r.artistEmail}</div>
                                                {r.artistNumber != null ? (
                                                    <div className="font-display text-[9px] text-neutral-g3 mt-1">#{r.artistNumber}</div>
                                                ) : null}
                                            </td>
                                            <td className="py-4 px-4 font-display text-[11px] font-bold uppercase whitespace-nowrap">
                                                {formatPeriod(r.periodStart)}
                                            </td>
                                            <td className="py-4 px-4 font-display text-[13px] font-black whitespace-nowrap">
                                                ₹{r.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="py-4 px-4 font-display text-[10px] font-bold text-neutral-g3 uppercase max-w-[140px] break-words">
                                                {r.method}
                                            </td>
                                            <td className="py-4 px-4">
                                                <span
                                                    className={`inline-block rounded-[3px] border px-2 py-0.5 font-display text-[9px] font-black uppercase ${statusClass(r.status)}`}
                                                >
                                                    {r.status}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4 font-mono text-[10px] break-all max-w-[120px]">
                                                {r.bankReference || "—"}
                                            </td>
                                            <td className="py-4 px-4 font-body text-[10px] text-neutral-g4 max-w-[200px] break-words">
                                                {r.notes || "—"}
                                            </td>
                                            <td className="py-4 px-4 font-body text-[10px] text-neutral-g4 whitespace-nowrap">
                                                {formatTs(r.createdAt)}
                                            </td>
                                            <td className="py-4 px-4">
                                                <Link
                                                    to={`/admin/artists/${r.artistId}`}
                                                    className="inline-flex items-center gap-1 text-primary hover:underline font-display text-[9px] font-black uppercase"
                                                >
                                                    Profile <ExternalLink className="w-3 h-3" />
                                                </Link>
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
