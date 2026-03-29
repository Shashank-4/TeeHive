import { useState, useEffect } from "react";
import { X, Loader2, Save } from "lucide-react";
import api from "../../api/axios";

interface ProductVariantsModalProps {
    isOpen: boolean;
    onClose: () => void;
    productId: string | null;
    productTitle: string;
    onSaveSuccess: (newTotalStock: number) => void;
}

interface Variant {
    color: string;
    size: string;
    stock: number;
}

const SIZES = ["S", "M", "L", "XL", "2XL"];

export default function ProductVariantsModal({ isOpen, onClose, productId, productTitle, onSaveSuccess }: ProductVariantsModalProps) {
    const [variants, setVariants] = useState<Variant[]>([]);
    const [availableColors, setAvailableColors] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && productId) {
            fetchVariants();
        }
    }, [isOpen, productId]);

    const fetchVariants = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.get(`/api/admin/products/${productId}/variants`);
            const colors = res.data.data.availableColors || [];
            const existingVariants: any[] = res.data.data.variants || [];
            
            setAvailableColors(colors);

            // Build grid matrix based on availableColors X sizes
            const grid: Variant[] = [];
            for (const color of colors) {
                for (const size of SIZES) {
                    const match = existingVariants.find(v => v.color === color && v.size === size);
                    grid.push({
                        color,
                        size,
                        stock: match ? match.stock : 0
                    });
                }
            }
            setVariants(grid);
        } catch (err) {
            console.error("Failed to load variants", err);
            setError("Failed to load variants.");
        } finally {
            setLoading(false);
        }
    };

    const handleStockChange = (color: string, size: string, value: string) => {
        const val = parseInt(value) || 0;
        setVariants(variants.map(v => (v.color === color && v.size === size) ? { ...v, stock: Math.max(0, val) } : v));
    };

    const handleSave = async () => {
        if (!productId) return;
        setSaving(true);
        setError(null);
        try {
            const res = await api.patch(`/api/admin/products/${productId}/variants`, { variants });
            const totalStock = res.data.data?.totalStock || 0;
            onSaveSuccess(totalStock);
            onClose();
        } catch (err) {
            console.error("Failed to save variants", err);
            setError("Failed to save variant inventory.");
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-neutral-black/80 backdrop-blur-sm" onClick={onClose} />
            <div className="bg-white border-[3px] border-neutral-black rounded-[8px] p-6 w-full max-w-4xl relative shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] flex flex-col max-h-[90vh]">
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center border-[2px] border-neutral-black rounded-[4px] hover:bg-danger hover:text-white transition-all active:translate-y-[2px]"
                >
                    <X className="w-5 h-5" />
                </button>

                <h2 className="font-display text-[24px] font-black uppercase text-neutral-black">Variants & Inventory</h2>
                <p className="font-display text-[12px] font-bold text-neutral-g4 uppercase mb-6 truncate max-w-[80%]">SKU: {productTitle}</p>

                {error && <div className="text-danger font-bold text-[12px] mb-4 uppercase">{error}</div>}

                <div className="flex-1 overflow-auto border-[2px] border-neutral-black rounded-[4px] bg-neutral-g1">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-48 space-y-4">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            <span className="font-display text-[11px] font-black uppercase tracking-[2px]">Loading Matrix...</span>
                        </div>
                    ) : availableColors.length === 0 ? (
                        <div className="p-8 text-center font-display text-[11px] font-black uppercase text-neutral-g4">No available colors found for this product.</div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-neutral-black text-white">
                                    <th className="p-3 font-display text-[10px] font-black uppercase border-b-[2px] border-r-[2px] border-neutral-black sticky top-0 bg-neutral-black z-10 w-32">Color</th>
                                    {SIZES.map(size => (
                                        <th key={size} className="p-3 font-display text-[10px] font-black uppercase border-b-[2px] border-r-[2px] border-neutral-black text-center sticky top-0 bg-neutral-black z-10">{size}</th>
                                    ))}
                                    <th className="p-3 font-display text-[10px] font-black uppercase border-b-[2px] border-neutral-black text-right sticky top-0 bg-neutral-black z-10">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {availableColors.map((color, idx) => {
                                    const rowVariants = variants.filter(v => v.color === color);
                                    const rowTotal = rowVariants.reduce((sum, v) => sum + v.stock, 0);
                                    return (
                                        <tr key={color} className={`bg-white ${idx !== availableColors.length - 1 ? 'border-b-[2px] border-neutral-g2' : ''}`}>
                                            <td className="p-3 font-display text-[11px] font-black uppercase border-r-[2px] border-neutral-g2">
                                                <div className="flex items-center gap-2">
                                                    {/* We can show a simple color circle if it matches basic CSS colors */}
                                                    <div className="w-3 h-3 rounded-full border border-neutral-g3" style={{ backgroundColor: color }} />
                                                    {color}
                                                </div>
                                            </td>
                                            {SIZES.map(size => {
                                                const v = rowVariants.find(rv => rv.size === size);
                                                return (
                                                    <td key={size} className="p-3 border-r-[2px] border-neutral-g2">
                                                        <div className="flex justify-center">
                                                            <input 
                                                                type="number" 
                                                                min="0"
                                                                value={v?.stock || 0}
                                                                onChange={(e) => handleStockChange(color, size, e.target.value)}
                                                                className={`w-16 px-2 py-1.5 bg-neutral-g1 border-[2px] border-neutral-g3 rounded-[2px] font-display text-[11px] font-black text-center outline-none focus:border-neutral-black focus:bg-white transition-all ${v?.stock === 0 ? 'opacity-50' : 'bg-primary-light border-primary'}`}
                                                            />
                                                        </div>
                                                    </td>
                                                );
                                            })}
                                            <td className="p-3 text-right font-display text-[13px] font-black">{rowTotal}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                            <tfoot className="bg-neutral-g1">
                                <tr>
                                    <td className="p-3 font-display text-[11px] font-black uppercase border-r-[2px] border-neutral-black border-t-[2px]">Totals</td>
                                    {SIZES.map(size => {
                                        const colTotal = variants.filter(v => v.size === size).reduce((sum, v) => sum + v.stock, 0);
                                        return <td key={size} className="p-3 text-center border-r-[2px] border-neutral-black border-t-[2px] font-display text-[13px] font-black">{colTotal}</td>
                                    })}
                                    <td className="p-3 text-right border-t-[2px] border-neutral-black font-display text-[14px] font-black text-primary-dark">
                                        {variants.reduce((sum, v) => sum + v.stock, 0)}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    )}
                </div>

                <div className="mt-6 flex justify-end">
                    <button 
                        onClick={handleSave} 
                        disabled={saving || loading || availableColors.length === 0}
                        className="flex items-center gap-2 px-6 py-3 bg-primary border-[2px] border-neutral-black rounded-[4px] font-display text-[12px] font-black uppercase tracking-[1px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all disabled:opacity-50"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Commit Changes
                    </button>
                </div>
            </div>
        </div>
    );
}
