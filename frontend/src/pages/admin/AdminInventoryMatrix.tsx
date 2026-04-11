import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import {
    Package,
    Save,
    RefreshCw,
    AlertTriangle,
    CheckCircle,
    XCircle,
    LayoutGrid,
    Info,
} from "lucide-react";
import { PRODUCT_SIZES } from "../../constants/productSizes";
import { canonicalHex } from "../../utils/productMockup";
import { mergeGlobalInventoryMatrix, type GlobalMatrixStockStatus } from "../../utils/globalInventoryMatrix";

const SIZES = [...PRODUCT_SIZES];

type StockStatus = GlobalMatrixStockStatus;

interface GlobalStock {
    [colorHexKey: string]: {
        [size: string]: StockStatus;
    };
}

interface PaletteColor {
    id: string;
    name: string;
    hex: string;
}

export default function AdminInventoryMatrix() {
    const [matrix, setMatrix] = useState<GlobalStock>({});
    const [palette, setPalette] = useState<PaletteColor[]>([]);
    const [defaultProductStock, setDefaultProductStock] = useState(100);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const fetchGlobalInventory = useCallback(async () => {
        setLoading(true);
        try {
            const [colorsRes, invRes, defRes] = await Promise.all([
                api.get("/api/colors"),
                api.get("/api/config/global_inventory").catch(() => ({ data: { data: {} } })),
                api.get("/api/config/inventory_defaults").catch(() => null),
            ]);

            if (defRes?.data?.data?.config?.defaultProductStock != null) {
                const n = Number(defRes.data.data.config.defaultProductStock);
                if (Number.isFinite(n) && n >= 0) setDefaultProductStock(Math.floor(n));
            }

            const colors: PaletteColor[] = (colorsRes.data?.data?.colors ?? []).map((c: any) => ({
                id: c.id,
                name: c.name,
                hex: c.hex,
            }));
            setPalette(colors);

            const rawConfig = invRes.data?.data?.config;
            setMatrix(mergeGlobalInventoryMatrix(rawConfig, colors, SIZES));
        } catch (err: any) {
            console.error("Failed to fetch global inventory:", err);
            setPalette([]);
            setMatrix({});
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchGlobalInventory();
    }, [fetchGlobalInventory]);

    const updateStatus = (colorHexKey: string, size: string, status: StockStatus) => {
        setMatrix((prev) => ({
            ...prev,
            [colorHexKey]: {
                ...prev[colorHexKey],
                [size]: status,
            },
        }));
    };

    const handleSave = async () => {
        if (palette.length === 0) {
            setMessage({ type: "error", text: "Add at least one global color before saving the matrix." });
            return;
        }
        setSaving(true);
        setMessage(null);
        try {
            const payload = mergeGlobalInventoryMatrix(matrix, palette, SIZES);
            await api.put("/api/config/global_inventory", { value: payload });
            await api.put("/api/config/inventory_defaults", {
                value: { defaultProductStock: Math.max(0, Math.floor(Number(defaultProductStock) || 0)) },
            });
            setMatrix(payload);
            setMessage({
                type: "success",
                text: "Global inventory matrix saved. Rows follow your current global colors and catalog sizes.",
            });
            setTimeout(() => setMessage(null), 4000);
        } catch (err) {
            console.error("Failed to save global inventory:", err);
            setMessage({ type: "error", text: "Failed to save the matrix. Try again." });
        } finally {
            setSaving(false);
        }
    };

    const bulkUpdateColor = (hexKey: string, status: StockStatus) => {
        setMatrix((prev) => {
            const nextSizeMap: Record<string, StockStatus> = {};
            SIZES.forEach((s) => {
                nextSizeMap[s] = status;
            });
            return { ...prev, [hexKey]: nextSizeMap };
        });
    };

    const bulkUpdateSize = (size: string, status: StockStatus) => {
        setMatrix((prev) => {
            const next = { ...prev };
            palette.forEach((c) => {
                const key = canonicalHex(c.hex);
                next[key] = { ...next[key], [size]: status };
            });
            return next;
        });
    };

    return (
        <div className="w-full min-h-screen bg-neutral-g1 flex flex-col pt-4 pb-20 font-display">
            <div className="flex-1 px-4 sm:px-8 w-full max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 bg-neutral-black text-white px-3 py-1 rounded-[4px] font-display text-[10px] font-black uppercase tracking-[2px]">
                            <LayoutGrid className="w-3 h-3 text-primary" /> Global Protocol
                        </div>
                        <h1 className="text-[32px] font-black text-neutral-black leading-none uppercase tracking-tight">
                            Master <span className="text-primary italic">Stock Matrix</span>
                        </h1>
                        <p className="text-[14px] font-bold text-neutral-g4 uppercase tracking-wider max-w-xl">
                            One row per global fabric color ({palette.length} color{palette.length === 1 ? "" : "s"}) ×
                            all garment sizes. Defaults to in stock; out of stock blocks checkout; low stock shows a
                            warning only.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-4">
                        <button
                            type="button"
                            onClick={() => fetchGlobalInventory()}
                            disabled={loading || saving}
                            className="flex items-center gap-2 px-5 py-3 border-[2px] border-neutral-black rounded-[4px] text-[12px] font-black uppercase tracking-[1px] bg-white hover:bg-neutral-g1 transition-all disabled:opacity-50"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                            Reload
                        </button>
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={saving || loading || palette.length === 0}
                            className="flex items-center gap-3 px-8 py-3 bg-neutral-black text-white border-[2px] border-neutral-black rounded-[4px] text-[12px] font-black uppercase tracking-[1px] shadow-[6px_6px_0px_0px_rgba(255,222,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all disabled:opacity-50"
                        >
                            {saving ? (
                                <RefreshCw className="w-4 h-4 animate-spin text-primary" />
                            ) : (
                                <Save className="w-4 h-4 text-primary" />
                            )}
                            Commit Changes
                        </button>
                    </div>
                </div>

                {message && (
                    <div
                        className={`mb-8 p-4 rounded-[4px] border-[2px] flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 ${
                            message.type === "success"
                                ? "bg-success/10 border-success text-success"
                                : "bg-danger/10 border-danger text-danger"
                        }`}
                    >
                        {message.type === "success" ? (
                            <CheckCircle className="w-5 h-5" />
                        ) : (
                            <XCircle className="w-5 h-5" />
                        )}
                        <span className="text-[12px] font-black uppercase tracking-[1px]">{message.text}</span>
                    </div>
                )}

                {palette.length === 0 && !loading && (
                    <div className="mb-8 p-6 bg-white border-[3px] border-neutral-black rounded-[8px] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                        <p className="text-[14px] font-bold text-neutral-g4 uppercase tracking-wide mb-4">
                            No global colors yet. Add fabric colors first — they automatically appear here with every
                            size set to in stock.
                        </p>
                        <Link
                            to="/admin/colors"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-neutral-black border-[2px] border-neutral-black rounded-[4px] text-[12px] font-black uppercase no-underline hover:bg-white transition-colors"
                        >
                            Open global colors
                        </Link>
                    </div>
                )}

                <div className="bg-white border-[3px] border-neutral-black rounded-[8px] overflow-hidden shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] relative">
                    {loading && (
                        <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px] z-50 flex flex-col items-center justify-center gap-4">
                            <RefreshCw className="w-12 h-12 text-primary animate-spin" />
                            <p className="text-[11px] font-black uppercase tracking-[2px]">Loading colors & matrix…</p>
                        </div>
                    )}

                    <div className="p-6 bg-neutral-black text-white border-b-[3px] border-neutral-black flex flex-col gap-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-primary border-[2px] border-white rounded-[4px] flex items-center justify-center text-neutral-black">
                                    <Package className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-[16px] font-black uppercase tracking-tight">
                                        Global color × size grid
                                    </h3>
                                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                                        Source: /api/colors · sizes match storefront PDP
                                    </p>
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-4 text-[10px] font-black uppercase tracking-tighter opacity-80">
                                <span className="flex items-center gap-1.5">
                                    <span className="w-2.5 h-2.5 rounded-full bg-success border border-white" /> In
                                    stock
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <span className="w-2.5 h-2.5 rounded-full bg-primary border border-white" /> Low
                                    (label only)
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <span className="w-2.5 h-2.5 rounded-full bg-danger border border-white" /> Out
                                    (blocked)
                                </span>
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-8 border-t border-white/10 pt-4">
                            <label className="flex flex-col gap-2 max-w-xs">
                                <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                                    Legacy default product stock (units)
                                </span>
                                <span className="text-[9px] font-bold text-white/50 uppercase leading-snug">
                                    Numeric fallback for older flows. Storefront purchase blocking uses this matrix
                                    (out of stock) and per-product variants when present.
                                </span>
                                <input
                                    type="number"
                                    min={0}
                                    value={defaultProductStock}
                                    onChange={(e) => setDefaultProductStock(parseInt(e.target.value, 10) || 0)}
                                    className="mt-1 px-4 py-3 bg-white text-neutral-black border-[2px] border-white rounded-[4px] font-display text-[14px] font-black outline-none focus:border-primary"
                                />
                            </label>
                        </div>
                    </div>

                    {palette.length > 0 && (
                        <div className="overflow-x-auto p-8">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr>
                                        <th className="p-4 bg-neutral-g1 border-[2px] border-neutral-black text-left">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[10px] font-black uppercase text-neutral-g3 opacity-50 tracking-[2px]">
                                                    Global color
                                                </span>
                                                <span className="text-[12px] font-black uppercase">Color / size</span>
                                            </div>
                                        </th>
                                        {SIZES.map((size) => (
                                            <th
                                                key={size}
                                                className="p-3 bg-neutral-g1 border-[2px] border-neutral-black min-w-[96px] sm:min-w-[108px]"
                                            >
                                                <div className="flex flex-col items-center gap-2">
                                                    <span className="text-[14px] font-black uppercase tracking-[2px]">
                                                        {size}
                                                    </span>
                                                    <div className="flex flex-wrap justify-center gap-1 max-w-[100px]">
                                                        <button
                                                            type="button"
                                                            onClick={() => bulkUpdateSize(size, "IN_STOCK")}
                                                            className="w-5 h-5 bg-success/30 rounded-full hover:bg-success transition-all border border-neutral-black/10"
                                                            title="All colors in stock for this size"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => bulkUpdateSize(size, "LOW_STOCK")}
                                                            className="w-5 h-5 bg-primary/40 rounded-full hover:bg-primary transition-all border border-neutral-black/10"
                                                            title="Mark low stock (warning label only)"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => bulkUpdateSize(size, "OUT_OF_STOCK")}
                                                            className="w-5 h-5 bg-danger/30 rounded-full hover:bg-danger transition-all border border-neutral-black/10"
                                                            title="All colors out for this size"
                                                        />
                                                    </div>
                                                </div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {palette.map((color) => {
                                        const hexKey = canonicalHex(color.hex);
                                        return (
                                            <tr key={color.id} className="hover:bg-neutral-g1/30 transition-colors">
                                                <td className="p-4 border-[2px] border-neutral-black bg-white">
                                                    <div className="flex flex-col gap-3">
                                                        <div className="flex items-center gap-3">
                                                            <div
                                                                className="w-8 h-8 rounded-full border-[2px] border-neutral-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                                                                style={{ backgroundColor: hexKey }}
                                                            />
                                                            <div>
                                                                <span className="text-[13px] font-black uppercase tracking-tight block">
                                                                    {color.name}
                                                                </span>
                                                                <span className="text-[9px] font-bold text-neutral-g3 uppercase block opacity-60 tracking-tighter">
                                                                    {hexKey}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-wrap gap-1.5">
                                                            <button
                                                                type="button"
                                                                onClick={() => bulkUpdateColor(hexKey, "IN_STOCK")}
                                                                className="text-[8px] font-black uppercase px-2 py-0.5 border border-neutral-black rounded hover:bg-success hover:text-white transition-all"
                                                            >
                                                                All IN
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => bulkUpdateColor(hexKey, "LOW_STOCK")}
                                                                className="text-[8px] font-black uppercase px-2 py-0.5 border border-neutral-black rounded hover:bg-primary hover:text-neutral-black transition-all"
                                                            >
                                                                All LOW
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => bulkUpdateColor(hexKey, "OUT_OF_STOCK")}
                                                                className="text-[8px] font-black uppercase px-2 py-0.5 border border-neutral-black rounded hover:bg-danger hover:text-white transition-all"
                                                            >
                                                                All OUT
                                                            </button>
                                                        </div>
                                                    </div>
                                                </td>
                                                {SIZES.map((size) => {
                                                    const status = matrix[hexKey]?.[size] || "IN_STOCK";
                                                    return (
                                                        <td
                                                            key={size}
                                                            className="p-3 border-[2px] border-neutral-black bg-white group"
                                                        >
                                                            <div className="relative">
                                                                <select
                                                                    value={status}
                                                                    onChange={(e) =>
                                                                        updateStatus(
                                                                            hexKey,
                                                                            size,
                                                                            e.target.value as StockStatus
                                                                        )
                                                                    }
                                                                    className={`w-full px-4 py-3 border-[2px] rounded-[4px] text-[11px] font-black uppercase outline-none transition-all cursor-pointer appearance-none ${
                                                                        status === "IN_STOCK"
                                                                            ? "bg-success/5 border-success/30 text-success hover:bg-success/10"
                                                                            : status === "LOW_STOCK"
                                                                              ? "bg-primary/5 border-primary/40 text-neutral-black hover:bg-primary/10"
                                                                              : "bg-danger/5 border-danger/30 text-danger hover:bg-danger/10"
                                                                    }`}
                                                                >
                                                                    <option value="IN_STOCK">In Stock</option>
                                                                    <option value="LOW_STOCK">Low Stock</option>
                                                                    <option value="OUT_OF_STOCK">Out of Stock</option>
                                                                </select>
                                                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                                                                    <ChevronDown className="w-4 h-4" />
                                                                </div>
                                                                <div className="mt-2 flex justify-center">
                                                                    {status === "IN_STOCK" ? (
                                                                        <CheckCircle className="w-4 h-4 text-success" />
                                                                    ) : status === "LOW_STOCK" ? (
                                                                        <AlertTriangle className="w-4 h-4 text-primary" />
                                                                    ) : (
                                                                        <XCircle className="w-4 h-4 text-danger" />
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <div className="mt-12 bg-neutral-black border-[3px] border-neutral-black p-8 rounded-[8px] text-white shadow-[8px_8px_0px_0px_rgba(255,222,0,1)] flex items-start gap-6">
                    <div className="w-14 h-14 bg-primary text-neutral-black rounded-[4px] flex items-center justify-center shrink-0 border-[3px] border-white">
                        <Info className="w-8 h-8" />
                    </div>
                    <div className="space-y-2">
                        <h4 className="text-[18px] font-black uppercase tracking-tight text-primary">How it works</h4>
                        <p className="text-[13px] font-bold text-white/60 leading-relaxed uppercase tracking-wide">
                            Rows are driven by{" "}
                            <Link to="/admin/colors" className="text-primary underline font-black">
                                global colors
                            </Link>
                            . New colors get a full in-stock row when created.{" "}
                            <span className="text-danger font-black">Out of stock</span> blocks selection and checkout
                            for that fabric color and size everywhere.{" "}
                            <span className="text-primary font-black">Low stock</span> only shows a storefront label;
                            buyers can still purchase.
                        </p>
                    </div>
                </div>
            </div>

            <style>{`
                select {
                    -webkit-appearance: none;
                    -moz-appearance: none;
                    text-indent: 1px;
                    text-overflow: '';
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 8px;
                    height: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #f1f1f1;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #202020;
                    border-radius: 4px;
                }
            `}</style>
        </div>
    );
}

const ChevronDown = ({ className }: { className?: string }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="m6 9 6 6 6-6" />
    </svg>
);
