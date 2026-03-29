import { useState, useEffect, useCallback } from "react";
import api from "../../api/axios";
import {
    Package,
    Save,
    RefreshCw,
    AlertTriangle,
    CheckCircle,
    XCircle,
    LayoutGrid,
    Info
} from "lucide-react";

const COLORS = [
    { name: "Black", hex: "#202020" },
    { name: "White", hex: "#ffffff" },
    { name: "Grey", hex: "#afafaf" },
    { name: "Navy Blue", hex: "#032d49" },
    { name: "Maroon", hex: "#650c17" },
];

const SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

type StockStatus = "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";

interface GlobalStock {
    [colorSuffix: string]: {
        [size: string]: StockStatus;
    };
}

export default function AdminInventoryMatrix() {
    const [matrix, setMatrix] = useState<GlobalStock>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const fetchGlobalInventory = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get("/api/config/global_inventory");
            if (res.data.data?.config) {
                setMatrix(res.data.data.config);
            } else {
                // Initialize default matrix
                const initial: GlobalStock = {};
                COLORS.forEach(c => {
                    initial[c.hex] = {};
                    SIZES.forEach(s => {
                        initial[c.hex][s] = "IN_STOCK";
                    });
                });
                setMatrix(initial);
            }
        } catch (err: any) {
            console.error("Failed to fetch global inventory:", err);
            // If 404, it means config doesn't exist yet, initialize it
            const initial: GlobalStock = {};
            COLORS.forEach(c => {
                initial[c.hex] = {};
                SIZES.forEach(s => {
                    initial[c.hex][s] = "IN_STOCK";
                });
            });
            setMatrix(initial);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchGlobalInventory(); }, [fetchGlobalInventory]);

    const updateStatus = (colorHex: string, size: string, status: StockStatus) => {
        setMatrix(prev => ({
            ...prev,
            [colorHex]: {
                ...prev[colorHex],
                [size]: status
            }
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);
        try {
            await api.put("/api/config/global_inventory", { value: matrix });
            setMessage({ type: 'success', text: 'Global inventory matrix synchronized successfully!' });
            setTimeout(() => setMessage(null), 3000);
        } catch (err) {
            console.error("Failed to save global inventory:", err);
            setMessage({ type: 'error', text: 'Failed to synchronize matrix protocols.' });
        } finally {
            setSaving(false);
        }
    };

    const bulkUpdateColor = (colorHex: string, status: StockStatus) => {
        setMatrix(prev => {
            const newColorMap: any = {};
            SIZES.forEach(s => { newColorMap[s] = status; });
            return { ...prev, [colorHex]: newColorMap };
        });
    };

    const bulkUpdateSize = (size: string, status: StockStatus) => {
        setMatrix(prev => {
            const newMatrix = { ...prev };
            COLORS.forEach(c => {
                newMatrix[c.hex] = { ...newMatrix[c.hex], [size]: status };
            });
            return newMatrix;
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
                        <p className="text-[14px] font-bold text-neutral-g4 uppercase tracking-wider">
                            Manage base t-shirt availability across all platform nodes.
                        </p>
                    </div>

                    <div className="flex gap-4">
                        <button 
                            onClick={handleSave}
                            disabled={saving || loading}
                            className="flex items-center gap-3 px-8 py-3 bg-neutral-black text-white border-[2px] border-neutral-black rounded-[4px] text-[12px] font-black uppercase tracking-[1px] shadow-[6px_6px_0px_0px_rgba(255,222,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all disabled:opacity-50"
                        >
                            {saving ? <RefreshCw className="w-4 h-4 animate-spin text-primary" /> : <Save className="w-4 h-4 text-primary" />}
                            Commit Changes
                        </button>
                    </div>
                </div>

                {message && (
                    <div className={`mb-8 p-4 rounded-[4px] border-[2px] flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 ${message.type === 'success' ? 'bg-success/10 border-success text-success' : 'bg-danger/10 border-danger text-danger'}`}>
                        {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                        <span className="text-[12px] font-black uppercase tracking-[1px]">{message.text}</span>
                    </div>
                )}

                <div className="bg-white border-[3px] border-neutral-black rounded-[8px] overflow-hidden shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] relative">
                    {loading && (
                        <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px] z-50 flex flex-col items-center justify-center gap-4">
                            <RefreshCw className="w-12 h-12 text-primary animate-spin" />
                            <p className="text-[11px] font-black uppercase tracking-[2px]">Syncing Matrix State...</p>
                        </div>
                    )}

                    <div className="p-6 bg-neutral-black text-white border-b-[3px] border-neutral-black flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-primary border-[2px] border-white rounded-[4px] flex items-center justify-center text-neutral-black">
                                <Package className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-[16px] font-black uppercase tracking-tight">Base Inventory Grid</h3>
                                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Global Constraints Protocol</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-success rounded-full border border-white" />
                                <span className="text-[10px] font-black uppercase tracking-tighter opacity-70 italic">Verified Stable</span>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto p-8">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr>
                                    <th className="p-4 bg-neutral-g1 border-[2px] border-neutral-black text-left">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[10px] font-black uppercase text-neutral-g3 opacity-50 tracking-[2px]">Mapping</span>
                                            <span className="text-[12px] font-black uppercase">Color / Size</span>
                                        </div>
                                    </th>
                                    {SIZES.map(size => (
                                        <th key={size} className="p-4 bg-neutral-g1 border-[2px] border-neutral-black min-w-[140px]">
                                            <div className="flex flex-col items-center gap-2">
                                                <span className="text-[14px] font-black uppercase tracking-[2px]">{size}</span>
                                                <div className="flex gap-1">
                                                    <button onClick={() => bulkUpdateSize(size, "IN_STOCK")} className="w-5 h-5 bg-success/20 rounded-full hover:bg-success transition-all border border-neutral-black/10" title="All In Stock" />
                                                    <button onClick={() => bulkUpdateSize(size, "OUT_OF_STOCK")} className="w-5 h-5 bg-danger/20 rounded-full hover:bg-danger transition-all border border-neutral-black/10" title="All Out" />
                                                </div>
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {COLORS.map(color => (
                                    <tr key={color.hex} className="hover:bg-neutral-g1/30 transition-colors">
                                        <td className="p-4 border-[2px] border-neutral-black bg-white">
                                            <div className="flex flex-col gap-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full border-[2px] border-neutral-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" style={{ backgroundColor: color.hex }}></div>
                                                    <div>
                                                        <span className="text-[13px] font-black uppercase tracking-tight block">{color.name}</span>
                                                        <span className="text-[9px] font-bold text-neutral-g3 uppercase block opacity-60 tracking-tighter">{color.hex}</span>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button onClick={() => bulkUpdateColor(color.hex, "IN_STOCK")} className="text-[8px] font-black uppercase px-2 py-0.5 border border-neutral-black rounded hover:bg-success hover:text-white transition-all">All IN</button>
                                                    <button onClick={() => bulkUpdateColor(color.hex, "OUT_OF_STOCK")} className="text-[8px] font-black uppercase px-2 py-0.5 border border-neutral-black rounded hover:bg-danger hover:text-white transition-all">All OUT</button>
                                                </div>
                                            </div>
                                        </td>
                                        {SIZES.map(size => {
                                            const status = matrix[color.hex]?.[size] || "IN_STOCK";
                                            return (
                                                <td key={size} className="p-3 border-[2px] border-neutral-black bg-white group">
                                                    <div className="relative">
                                                        <select
                                                            value={status}
                                                            onChange={(e) => updateStatus(color.hex, size, e.target.value as StockStatus)}
                                                            className={`w-full px-4 py-3 border-[2px] rounded-[4px] text-[11px] font-black uppercase outline-none transition-all cursor-pointer appearance-none ${
                                                                status === "IN_STOCK" ? "bg-success/5 border-success/30 text-success hover:bg-success/10" :
                                                                status === "LOW_STOCK" ? "bg-primary/5 border-primary/40 text-neutral-black hover:bg-primary/10" :
                                                                "bg-danger/5 border-danger/30 text-danger hover:bg-danger/10"
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
                                                            {status === "IN_STOCK" ? <CheckCircle className="w-4 h-4 text-success" /> :
                                                             status === "LOW_STOCK" ? <AlertTriangle className="w-4 h-4 text-primary" /> :
                                                             <XCircle className="w-4 h-4 text-danger" />}
                                                        </div>
                                                    </div>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="mt-12 bg-neutral-black border-[3px] border-neutral-black p-8 rounded-[8px] text-white shadow-[8px_8px_0px_0px_rgba(255,222,0,1)] flex items-start gap-6">
                    <div className="w-14 h-14 bg-primary text-neutral-black rounded-[4px] flex items-center justify-center shrink-0 border-[3px] border-white">
                        <Info className="w-8 h-8" />
                    </div>
                    <div className="space-y-2">
                        <h4 className="text-[18px] font-black uppercase tracking-tight text-primary">Deployment Instruction</h4>
                        <p className="text-[13px] font-bold text-white/60 leading-relaxed uppercase tracking-wide">
                            Synchronizing this matrix overrides the global base stock constraints. Customers on the front-end will be prevented from selecting combinations marked as <span className="text-danger font-black">OUT_OF_STOCK</span> across all catalog entries.
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
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m6 9 6 6 6-6"/></svg>
);
