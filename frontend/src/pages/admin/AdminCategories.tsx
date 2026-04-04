import React, { useState, useEffect, useCallback } from "react";
import {
    Plus,
    Trash2,
    Tag,
    Loader2,
    AlertTriangle,
    Upload,
    Layers,
    ArrowDownWideNarrow,
    ListOrdered,
    Shuffle,
    ChevronUp,
    ChevronDown,
} from "lucide-react";
import api from "../../api/axios";

interface Category {
    id: string;
    name: string;
    imageUrl?: string | null;
    sortOrder?: number;
}

type CategorySortMode = "alphabetical" | "custom";

function shuffleIds(ids: string[]): string[] {
    const a = [...ids];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

export default function AdminCategories() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [newCategory, setNewCategory] = useState("");
    const [newImage, setNewImage] = useState<File | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [sortMode, setSortMode] = useState<CategorySortMode>("alphabetical");
    const [reorderBusy, setReorderBusy] = useState(false);

    const fetchCategories = useCallback(async () => {
        try {
            setLoading(true);
            const res = await api.get("/api/categories");
            setCategories(res.data.data.categories || []);
            const m = res.data.data.categorySortMode;
            setSortMode(m === "custom" ? "custom" : "alphabetical");
            setError(null);
        } catch (err) {
            console.error("Failed to load categories", err);
            setError("Failed to load predefined categories. Please try again.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    const persistReorder = async (ordered: Category[]) => {
        setReorderBusy(true);
        try {
            const res = await api.patch("/api/categories/reorder", {
                orderedIds: ordered.map((c) => c.id),
            });
            setCategories(res.data.data.categories || []);
            setSortMode("custom");
            setError(null);
        } catch (err: any) {
            console.error("Failed to save category order", err);
            setError(err.response?.data?.message || "Failed to save category order");
            await fetchCategories();
        } finally {
            setReorderBusy(false);
        }
    };

    const setAlphabeticalMode = async () => {
        setReorderBusy(true);
        try {
            const res = await api.patch("/api/categories/sort-mode", { mode: "alphabetical" });
            setCategories(res.data.data.categories || []);
            setSortMode("alphabetical");
            setError(null);
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to switch sort mode");
        } finally {
            setReorderBusy(false);
        }
    };

    const setCustomMode = async () => {
        setReorderBusy(true);
        try {
            const res = await api.patch("/api/categories/sort-mode", { mode: "custom" });
            setCategories(res.data.data.categories || []);
            setSortMode("custom");
            setError(null);
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to switch sort mode");
        } finally {
            setReorderBusy(false);
        }
    };

    const moveCategory = (categoryId: string, dir: -1 | 1) => {
        const index = categories.findIndex((c) => c.id === categoryId);
        const j = index + dir;
        if (index < 0 || j < 0 || j >= categories.length) return;
        const next = [...categories];
        [next[index], next[j]] = [next[j], next[index]];
        setCategories(next);
        void persistReorder(next);
    };

    const randomizeOrder = () => {
        const shuffled = shuffleIds(categories.map((c) => c.id));
        const byId = new Map(categories.map((c) => [c.id, c]));
        const next = shuffled.map((id) => byId.get(id)!);
        setCategories(next);
        void persistReorder(next);
    };

    const handleAddCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = newCategory.trim().toLowerCase();
        if (!trimmed) return;

        try {
            setSubmitting(true);
            const formData = new FormData();
            formData.append("name", trimmed);
            if (newImage) {
                formData.append("image", newImage);
            }

            const res = await api.post("/api/categories", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            await fetchCategories();
            setNewCategory("");
            setNewImage(null);
            setError(null);
        } catch (err: any) {
            console.error("Failed to add category", err);
            setError(err.response?.data?.message || "Failed to add category");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteCategory = async (id: string, name: string) => {
        if (!window.confirm(`Are you sure you want to delete the category "${name}"?`)) return;

        try {
            await api.delete(`/api/categories/${id}`);
            setCategories(categories.filter((c) => c.id !== id));
            setError(null);
        } catch (err) {
            console.error("Failed to delete category", err);
            setError("Failed to delete category. It might be in use.");
        }
    };

    return (
        <div className="w-full min-h-screen bg-neutral-g1 flex flex-col pt-4">
            <div className="flex-1 px-4 sm:px-8 pb-12 w-full">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 bg-neutral-black text-white px-3 py-1 rounded-[4px] font-display text-[10px] font-black uppercase tracking-[2px]">
                            <Layers className="w-3 h-3 text-primary" /> Architecture Node
                        </div>
                        <h1 className="font-display text-[ clamp(32px,5vw,48px) ] font-black text-neutral-black leading-none uppercase tracking-tight">
                            Category <span className="text-primary italic">Taxonomy</span>
                        </h1>
                        <p className="font-display text-[14px] font-bold text-neutral-g4 uppercase tracking-wider">
                            Manage the fundamental classification system for storefront assets.
                        </p>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 border-[2px] border-red-500 p-6 rounded-[4px] mb-8 flex items-center gap-4 animate-bounce">
                        <AlertTriangle className="text-red-500 w-8 h-8" />
                        <div>
                            <h4 className="font-display text-[12px] font-black uppercase text-red-500 tracking-[1px]">Incompatible Protocol Detected</h4>
                            <p className="font-display text-[11px] font-bold text-red-400 uppercase">{error}</p>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-10">
                    {/* Add Category Form */}
                    <div className="bg-white border-[2px] border-neutral-black rounded-[6px] p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] h-fit sticky top-8">
                        <h3 className="font-display text-[16px] font-black uppercase tracking-[1px] mb-8 flex items-center gap-3">
                            <Plus className="w-5 h-5 text-primary" /> Append Taxonomy
                        </h3>
                        <form onSubmit={handleAddCategory} className="space-y-6">
                            <div className="space-y-2">
                                <label className="font-display text-[10px] font-black uppercase tracking-[2px] text-neutral-g4 px-1">Identifier</label>
                                <div className="relative">
                                    <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-black" />
                                    <input
                                        type="text"
                                        placeholder="E.G. UNDERGROUND_GEAR"
                                        value={newCategory}
                                        onChange={(e) => setNewCategory(e.target.value)}
                                        disabled={submitting}
                                        className="w-full pl-11 pr-4 py-4 bg-neutral-g1 border-[2px] border-neutral-black rounded-[4px] font-display text-[13px] font-black uppercase tracking-[1px] outline-none focus:bg-white transition-all disabled:opacity-50"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="font-display text-[10px] font-black uppercase tracking-[2px] text-neutral-g4 px-1">Visual Marker (IMAGE)</label>
                                <div className="relative group cursor-pointer border-[2px] border-dashed border-neutral-g3 rounded-[4px] p-6 hover:border-primary hover:bg-primary/5 transition-all">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => setNewImage(e.target.files?.[0] || null)}
                                        disabled={submitting}
                                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                    />
                                    <div className="flex flex-col items-center justify-center gap-3 text-neutral-g3 group-hover:text-primary">
                                        {newImage ? (
                                            <div className="font-display text-[11px] font-black uppercase text-success">{newImage.name} Selected</div>
                                        ) : (
                                            <>
                                                <Upload className="w-8 h-8" />
                                                <div className="font-display text-[10px] font-black uppercase">Click To Transmit Asset</div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={!newCategory.trim() || submitting}
                                className="w-full py-4 bg-primary border-[2px] border-neutral-black rounded-[4px] font-display text-[13px] font-black uppercase tracking-[2px] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all disabled:opacity-20 flex items-center justify-center gap-3 mt-4"
                            >
                                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Tag className="w-4 h-4" />}
                                Commit To Registry
                            </button>
                        </form>
                    </div>

                    {/* Categories List */}
                    <div className="bg-white border-[2px] border-neutral-black rounded-[6px] shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                        <div className="bg-neutral-black px-8 py-5 flex flex-col gap-4 border-b-[2px] border-neutral-black">
                            <div className="flex flex-wrap items-center justify-between gap-4">
                                <h3 className="font-display text-[14px] font-black text-white uppercase tracking-[2px] flex items-center gap-3">
                                    <Layers className="w-4 h-4 text-primary" /> Active Classifications
                                </h3>
                                <span className="font-display text-[10px] font-black uppercase text-primary tracking-[1px]">
                                    {categories.length} Nodes —{" "}
                                    {sortMode === "alphabetical" ? "A–Z order" : "Custom order"}
                                </span>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                <button
                                    type="button"
                                    disabled={reorderBusy || sortMode === "alphabetical"}
                                    onClick={() => void setAlphabeticalMode()}
                                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-neutral-black border-[2px] border-white font-display text-[10px] font-black uppercase tracking-[1px] rounded-[4px] hover:bg-primary transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    <ArrowDownWideNarrow className="w-4 h-4" /> Alphabetical (default)
                                </button>
                                <button
                                    type="button"
                                    disabled={reorderBusy || sortMode === "custom"}
                                    onClick={() => void setCustomMode()}
                                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 text-white border-[2px] border-white/30 font-display text-[10px] font-black uppercase tracking-[1px] rounded-[4px] hover:bg-primary hover:text-neutral-black hover:border-primary transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    <ListOrdered className="w-4 h-4" /> Custom order
                                </button>
                                {sortMode === "custom" && (
                                    <button
                                        type="button"
                                        disabled={reorderBusy || categories.length < 2}
                                        onClick={() => randomizeOrder()}
                                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-neutral-black border-[2px] border-neutral-black font-display text-[10px] font-black uppercase tracking-[1px] rounded-[4px] shadow-[3px_3px_0px_0px_rgba(255,255,255,0.2)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all disabled:opacity-40"
                                    >
                                        <Shuffle className="w-4 h-4" /> Randomize order
                                    </button>
                                )}
                            </div>
                            {sortMode === "custom" && (
                                <p className="font-display text-[9px] font-bold text-white/50 uppercase tracking-[1px]">
                                    Use arrows on each card to reorder. Order syncs to the storefront (home + shop) immediately. Randomize assigns a new random sequence (still saved as custom).
                                </p>
                            )}
                        </div>

                        <div className="p-8">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-20 gap-4">
                                    <Loader2 className="w-12 h-12 text-primary animate-spin" />
                                    <p className="font-display text-[10px] font-black uppercase">Decrypting Taxonomy...</p>
                                </div>
                            ) : categories.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 text-neutral-g3 opacity-30">
                                    <Tag className="w-16 h-16 mb-4" />
                                    <p className="font-display text-[12px] font-black uppercase tracking-[2px]">Taxonomy Registry Empty</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {categories.map((category) => (
                                        <div
                                            key={category.id}
                                            className="group flex flex-col p-5 bg-neutral-g1 border-[2px] border-neutral-black rounded-[4px] hover:bg-white hover:shadow-[6px_6px_0px_0px_rgba(255,222,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all relative"
                                        >
                                            <div className="flex items-center gap-4 mb-4">
                                                <div className="w-14 h-14 bg-white border-[1px] border-neutral-black rounded-[4px] overflow-hidden group-hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all">
                                                    {category.imageUrl ? (
                                                        <img
                                                            src={category.imageUrl}
                                                            alt={category.name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center opacity-20">
                                                            <Tag className="w-6 h-6" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 overflow-hidden">
                                                    <div className="font-display text-[15px] font-black text-neutral-black uppercase tracking-tight truncate">
                                                        {category.name}
                                                    </div>
                                                    <div className="font-display text-[9px] font-bold text-neutral-g4 uppercase">UUID: {category.id.slice(0, 8)}</div>
                                                </div>
                                            </div>

                                            <div className="flex justify-between items-center pt-2 mt-auto gap-2">
                                                {sortMode === "custom" && (
                                                    <div className="flex gap-1">
                                                        <button
                                                            type="button"
                                                            disabled={reorderBusy}
                                                            onClick={() => moveCategory(category.id, -1)}
                                                            className="p-2 border-[1px] border-neutral-black rounded-[2px] hover:bg-primary transition-all disabled:opacity-30"
                                                            title="Move up"
                                                        >
                                                            <ChevronUp className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            disabled={reorderBusy}
                                                            onClick={() => moveCategory(category.id, 1)}
                                                            className="p-2 border-[1px] border-neutral-black rounded-[2px] hover:bg-primary transition-all disabled:opacity-30"
                                                            title="Move down"
                                                        >
                                                            <ChevronDown className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                )}
                                                <button
                                                    onClick={() => handleDeleteCategory(category.id, category.name)}
                                                    className="p-2 border-[1px] border-neutral-black rounded-[2px] text-danger hover:bg-danger hover:text-white transition-all opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 ml-auto"
                                                    title="Purge Classification"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
