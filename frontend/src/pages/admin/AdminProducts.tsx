import React, { useState, useEffect } from "react";
import {
    Search,
    Eye,
    ChevronLeft,
    ChevronRight,
    Loader2,
    Package,
    Palette,
    Tag,
    TrendingUp,
    Filter,
    Database,
    Layers,
    Star,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api/axios";
import ProductVariantsModal from "../../components/modals/ProductVariantsModal";
import StockStatusPill from "../../components/shared/StockStatusPill";

interface AdminProduct {
    id: string;
    title: string;
    artist: string;
    categories: string[];
    price: number;
    originalPrice?: number;
    isDiscounted?: boolean;
    discountPercent?: number;
    stock: number;
    sales: number;
    rating: number;
    status: string;
    image: string;
    isLatestDrop?: boolean;
}

interface PaginationData {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

const statusSelectClass = (status: string) => {
    if (status === "PUBLISHED") return "bg-success text-white border-neutral-black shadow-[2px_2px_0px_0px_rgba(34,197,94,0.3)]";
    if (status === "DRAFT") return "bg-primary text-neutral-black border-neutral-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]";
    return "bg-neutral-black text-white border-neutral-black";
};

export default function AdminProducts() {
    const navigate = useNavigate();
    const [products, setProducts] = useState<AdminProduct[]>([]);
    const [pagination, setPagination] = useState<PaginationData>({ page: 1, limit: 10, total: 0, totalPages: 1 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

    const [variantModalOpen, setVariantModalOpen] = useState(false);
    const [selectedProductForVariants, setSelectedProductForVariants] = useState<{ id: string, title: string } | null>(null);
    const [latestDropCount, setLatestDropCount] = useState(0);
    const [latestDropMax, setLatestDropMax] = useState(10);

    const handleVariantSaveSuccess = (newStockStatus: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK") => {
        if (selectedProductForVariants) {
            setProducts(
                products.map((p) =>
                    p.id === selectedProductForVariants.id ? { ...p, stockStatus: newStockStatus } : p
                )
            );
        }
    };

    const fetchProducts = async (page = 1, search = searchQuery, statusType = statusFilter) => {
        setLoading(true);
        try {
            const res = await api.get(`/api/admin/products`, { params: { page, limit: 10, search, status: statusType } });
            setProducts(res.data.data.products);
            setPagination(res.data.data.pagination);
            if (typeof res.data.data.latestDropCount === "number") setLatestDropCount(res.data.data.latestDropCount);
            if (typeof res.data.data.latestDropMax === "number") setLatestDropMax(res.data.data.latestDropMax);
            setError(null);
        } catch (err) {
            console.error("Failed to load products", err);
            setError("Failed to load products. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchProducts(); }, []);

    const handleSearch = (e: React.FormEvent) => { e.preventDefault(); fetchProducts(1, searchQuery, statusFilter); };
    const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => { const v = e.target.value; setStatusFilter(v); fetchProducts(1, searchQuery, v); };

    const handleStatusChange = async (productId: string, newStatus: string) => {
        setActionLoading({ ...actionLoading, [productId]: true });
        try {
            await api.patch(`/api/admin/products/${productId}/status`, { status: newStatus });
            setProducts(
                products.map((p) =>
                    p.id === productId
                        ? { ...p, status: newStatus, isLatestDrop: newStatus === "PUBLISHED" ? p.isLatestDrop : false }
                        : p
                )
            );
            if (newStatus !== "PUBLISHED") {
                const removed = products.find((p) => p.id === productId)?.isLatestDrop;
                if (removed) setLatestDropCount((c) => Math.max(0, c - 1));
            }
        } catch (err) {
            console.error("Failed to update status", err);
            alert("Failed to update product status");
        } finally {
            setActionLoading({ ...actionLoading, [productId]: false });
        }
    };

    const handleLatestDropToggle = async (product: AdminProduct) => {
        if (product.status !== "PUBLISHED") {
            alert("Only published products can be marked as latest drops.");
            return;
        }
        const next = !product.isLatestDrop;
        if (next && latestDropCount >= latestDropMax) {
            alert(`You can mark at most ${latestDropMax} products as latest drops.`);
            return;
        }
        setActionLoading({ ...actionLoading, [product.id]: true });
        try {
            const res = await api.patch(`/api/admin/products/${product.id}/latest-drop`, { isLatestDrop: next });
            setProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, isLatestDrop: next } : p)));
            if (typeof res.data?.data?.latestDropCount === "number") {
                setLatestDropCount(res.data.data.latestDropCount);
            }
        } catch (err: any) {
            const msg = err?.response?.data?.message || "Failed to update latest drop";
            alert(msg);
        } finally {
            setActionLoading({ ...actionLoading, [product.id]: false });
        }
    };

    const handleStockChange = async (productId: string, newStock: number) => {
        setActionLoading({ ...actionLoading, [productId]: true });
        try {
            await api.patch(`/api/admin/products/${productId}/stock`, { stock: newStock });
            setProducts(products.map(p => p.id === productId ? { ...p, stock: newStock } : p));
        } catch (err) {
            console.error("Failed to update stock", err);
            alert("Failed to update product stock");
        } finally {
            setActionLoading({ ...actionLoading, [productId]: false });
        }
    };

    return (
        <div className="w-full min-h-screen bg-neutral-g1 flex flex-col pt-4 text-neutral-black">
            <div className="flex-1 px-4 sm:px-8 pb-12 w-full">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 bg-neutral-black text-white px-3 py-1 rounded-[4px] font-display text-[10px] font-black uppercase tracking-[2px]">
                            <Database className="w-3 h-3 text-primary" /> Inventory Index
                        </div>
                        <h1 className="font-display text-[ clamp(32px,5vw,48px) ] font-black text-neutral-black leading-none uppercase tracking-tight">
                            Global <span className="text-primary italic">Stockpile</span>
                        </h1>
                        <p className="font-display text-[14px] font-bold text-neutral-g4 uppercase tracking-wider">
                            Real-time monitoring of SKU performance, stock levels, and publication status.
                        </p>
                        <div className="inline-flex items-center gap-2 mt-3 px-3 py-1.5 bg-white border-[2px] border-neutral-black rounded-[4px] font-display text-[10px] font-black uppercase tracking-[1px]">
                            <Star className="w-3.5 h-3.5 fill-primary text-neutral-black" />
                            Latest drops: {latestDropCount}/{latestDropMax} (shop + home)
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 border-[2px] border-red-500 p-6 rounded-[4px] mb-8 flex items-center gap-4 animate-bounce">
                        <Tag className="text-red-500 w-8 h-8" />
                        <div>
                            <h4 className="font-display text-[12px] font-black uppercase text-red-500 tracking-[1px]">Buffer Synchronization Failed</h4>
                            <p className="font-display text-[11px] font-bold text-red-400 uppercase">{error}</p>
                        </div>
                    </div>
                )}

                {/* Toolbar */}
                <form onSubmit={handleSearch} className="flex flex-col xl:flex-row items-stretch xl:items-center gap-6 mb-8">
                    <div className="relative flex-1 min-w-[300px]">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-black" />
                        <input
                            type="text"
                            placeholder="SEARCH BY SKU TITLE OR CREATOR..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-4 py-4 bg-white border-[2px] border-neutral-black rounded-[4px] font-display text-[11px] font-black uppercase tracking-[1px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:translate-x-[1px] focus:translate-y-[1px] focus:shadow-none outline-none transition-all"
                        />
                    </div>

                    <div className="flex gap-4">
                        <div className="relative group">
                            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-black pointer-events-none" />
                            <select
                                value={statusFilter}
                                onChange={handleStatusFilterChange}
                                className="pl-11 pr-10 py-4 bg-white border-[2px] border-neutral-black rounded-[4px] font-display text-[11px] font-black uppercase tracking-[1px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] outline-none cursor-pointer hover:bg-primary transition-all appearance-none min-w-[200px]"
                            >
                                <option value="all">Global Availability</option>
                                <option value="PUBLISHED">Published Nodes</option>
                                <option value="DRAFT">Pending Drafts</option>
                                <option value="ARCHIVED">Cold Storage</option>
                            </select>
                        </div>
                        <button
                            onClick={() => navigate("/admin/inventory-matrix")}
                            className="flex items-center gap-3 px-6 py-3 bg-white border-[2px] border-neutral-black rounded-[4px] font-display text-[12px] font-black uppercase tracking-[1px] shadow-[4px_4px_0px_0px_rgba(255,165,0,0.2)] hover:bg-neutral-black hover:text-white transition-all group"
                        >
                            <Layers className="w-4 h-4 text-primary group-hover:text-primary" /> Global Matrix Control
                        </button>
                        <button type="submit" className="px-10 py-4 bg-primary border-[2px] border-neutral-black rounded-[4px] font-display text-[12px] font-black uppercase tracking-[2px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all">
                            Filter Registry
                        </button>
                    </div>
                </form>

                {/* Table Container */}
                <div className="bg-white border-[2px] border-neutral-black rounded-[6px] shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-neutral-black text-white">
                                    {["Asset Node", "Personnel", "Credit Value", "Buffer Level", "Data Metrics", "Logic State", "Spotlight", "Actions"].map(h => (
                                        <th key={h} className="font-display text-[10px] font-black tracking-[2px] uppercase py-5 px-6 text-left whitespace-nowrap">
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y-[1px] divide-neutral-black/10">
                                {loading && products.length === 0 ? (
                                    <tr><td colSpan={8} className="py-24 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <Loader2 className="w-12 h-12 text-primary animate-spin" />
                                            <p className="font-display text-[10px] font-black uppercase tracking-[2px]">Syncing Buffer Feeds...</p>
                                        </div>
                                    </td></tr>
                                ) : products.length === 0 ? (
                                    <tr><td colSpan={8} className="py-24 text-center">
                                        <div className="flex flex-col items-center gap-4 opacity-30">
                                            <Database className="w-16 h-16" />
                                            <p className="font-display text-[12px] font-black uppercase tracking-[2px]">Inventory Zero Detected</p>
                                        </div>
                                    </td></tr>
                                ) : (
                                    products.map((product) => (
                                        <tr key={product.id} className="hover:bg-primary/5 transition-colors group">
                                            <td className="py-5 px-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-14 h-14 bg-neutral-black border-[1px] border-neutral-black rounded-[4px] overflow-hidden group-hover:shadow-[4px_4px_0px_0px_rgba(255,222,0,1)] transition-all flex-shrink-0">
                                                        {product.image ? (
                                                            <img src={product.image} alt={product.title} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center">
                                                                <Package className="w-6 h-6 text-white opacity-20" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="font-display text-[14px] font-black text-neutral-black uppercase tracking-tight truncate group-hover:text-primary transition-colors">{product.title}</div>
                                                        <div className="flex gap-2 mt-1">
                                                            {product.categories?.slice(0, 2).map((c, i) => (
                                                                <span key={i} className="font-display text-[8px] font-bold text-neutral-g4 uppercase border-[1px] border-neutral-g2 px-1 rounded-[2px]">{c}</span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-5 px-6">
                                                <div className="font-display text-[13px] font-black text-neutral-black uppercase flex items-center gap-2">
                                                    <Palette className="w-3 h-3 text-primary" /> {product.artist}
                                                </div>
                                            </td>
                                            <td className="py-5 px-6">
                                                <div className="flex flex-col">
                                                    <span className="font-display text-[18px] font-black text-neutral-black italic leading-none">₹{product.price.toLocaleString('en-IN')}</span>
                                                    {product.isDiscounted && (
                                                        <span className="font-display text-[11px] font-bold text-neutral-g3 line-through mt-1">₹{product.originalPrice?.toLocaleString('en-IN')}</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-5 px-6">
                                                <div className="flex flex-col gap-2 relative">
                                                    <div className="flex items-center gap-2">
                                                        <select
                                                            value={(product as any).stockStatus || "IN_STOCK"}
                                                            onChange={(e) => handleStockChange(product.id, e.target.value as any)}
                                                            className={`appearance-none w-28 px-3 py-2 bg-neutral-g1 border-[2px] border-neutral-black rounded-[2px] font-display text-[10px] font-black uppercase text-center outline-none focus:bg-white transition-all`}
                                                        >
                                                            <option value="IN_STOCK">In Stock</option>
                                                            <option value="LOW_STOCK">Low Stock</option>
                                                            <option value="OUT_OF_STOCK">Out of Stock</option>
                                                        </select>
                                                        <StockStatusPill stockStatus={(product as any).stockStatus} />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-5 px-6">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2 font-display text-[11px] font-black text-neutral-black">
                                                        <TrendingUp className="w-3 h-3 text-success" /> {product.sales} <span className="text-[9px] text-neutral-g4">UNITS</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        {[1, 2, 3, 4, 5].map(s => (
                                                            <div key={s} className={`w-1.5 h-1.5 rounded-full ${s <= Math.round(product.rating) ? 'bg-primary' : 'bg-neutral-g2'}`} />
                                                        ))}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-5 px-6">
                                                <select
                                                    value={product.status}
                                                    onChange={(e) => handleStatusChange(product.id, e.target.value)}
                                                    disabled={actionLoading[product.id]}
                                                    className={`appearance-none px-4 py-2 pr-8 rounded-[2px] font-display text-[9px] font-black tracking-[1.5px] uppercase border-[2px] focus:outline-none cursor-pointer transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none translate-x-[-1px] translate-y-[-1px] hover:translate-x-0 hover:translate-y-0 ${statusSelectClass(product.status)} ${actionLoading[product.id] ? "opacity-50 cursor-wait" : ""}`}
                                                >
                                                    <option value="PUBLISHED">Published</option>
                                                    <option value="DRAFT">Registry Only</option>
                                                    <option value="ARCHIVED">Archived</option>
                                                </select>
                                            </td>
                                            <td className="py-5 px-6">
                                                <button
                                                    type="button"
                                                    title={
                                                        product.status !== "PUBLISHED"
                                                            ? "Publish the product first"
                                                            : product.isLatestDrop
                                                              ? "Remove from latest drops"
                                                              : latestDropCount >= latestDropMax
                                                                ? `Maximum ${latestDropMax} latest drops`
                                                                : "Add to latest drops (home + shop)"
                                                    }
                                                    disabled={
                                                        actionLoading[product.id] ||
                                                        product.status !== "PUBLISHED" ||
                                                        (!product.isLatestDrop && latestDropCount >= latestDropMax)
                                                    }
                                                    onClick={() => handleLatestDropToggle(product)}
                                                    className={`p-3 rounded-[4px] border-[2px] border-neutral-black transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none ${
                                                        product.isLatestDrop
                                                            ? "bg-primary text-neutral-black hover:translate-x-[1px] hover:translate-y-[1px]"
                                                            : "bg-white text-neutral-g4 hover:bg-neutral-black hover:text-primary"
                                                    }`}
                                                >
                                                    <Star
                                                        className={`w-4 h-4 ${product.isLatestDrop ? "fill-neutral-black text-neutral-black" : ""}`}
                                                    />
                                                </button>
                                            </td>
                                            <td className="py-5 px-6 text-right">
                                                <div className="flex justify-end gap-3">
                                                    <Link to={`/products/${product.id}`} target="_blank"
                                                        className="p-3 bg-white border-[2px] border-neutral-black rounded-[4px] hover:bg-neutral-black hover:text-white transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none inline-flex items-center gap-2">
                                                        <Eye className="w-4 h-4" />
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {!loading && products.length > 0 && (
                        <div className="bg-neutral-black px-8 py-5 flex items-center justify-between">
                            <span className="font-display text-[10px] font-black text-primary uppercase tracking-[2px]">
                                Node Range {pagination.page} / {pagination.totalPages} — {pagination.total} Active SKUs Indexed
                            </span>
                            <div className="flex items-center gap-4">
                                <button onClick={() => fetchProducts(pagination.page - 1)} disabled={pagination.page === 1}
                                    className="w-10 h-10 bg-white border-[2px] border-neutral-black rounded-[2px] flex items-center justify-center hover:bg-primary transition-all disabled:opacity-20 shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)]">
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <button onClick={() => fetchProducts(pagination.page + 1)} disabled={pagination.page === pagination.totalPages}
                                    className="w-10 h-10 bg-white border-[2px] border-neutral-black rounded-[2px] flex items-center justify-center hover:bg-primary transition-all disabled:opacity-20 shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)]">
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <ProductVariantsModal
                isOpen={variantModalOpen}
                onClose={() => {
                    setVariantModalOpen(false);
                    setSelectedProductForVariants(null);
                }}
                productId={selectedProductForVariants?.id || null}
                productTitle={selectedProductForVariants?.title || ""}
                onSaveSuccess={handleVariantSaveSuccess}
            />
        </div>
    );
}
