import { useState, useEffect } from "react";
import {
    Plus,
    Grid,
    List,
    Eye,
    Trash2,
    Search,
    Package,
} from "lucide-react";
import Loader from "../../components/shared/Loader";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api/axios";
import StockStatusPill from "../../components/shared/StockStatusPill";

interface Product {
    id: string;
    name: string;
    price: number;
    originalPrice?: number;
    isDiscounted?: boolean;
    discountPercent?: number;
    compareAtPrice?: number;
    category: string;
    tshirtColor: string;
    stock: number;
    status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
    mockupImageUrl: string;
    backMockupImageUrl?: string | null;
    primaryView?: string | null;
    design: {
        id: string;
        title: string;
        imageUrl: string;
    };
    createdAt: string;
}

/** Match storefront / PDP: hero listing image follows primary landing view. */
function cardListingImageUrl(p: Product): string {
    if (p.primaryView === "back" && p.backMockupImageUrl) return p.backMockupImageUrl;
    return p.mockupImageUrl;
}

const statusPillClass: Record<string, string> = {
    DRAFT: "bg-primary text-neutral-black",
    PUBLISHED: "bg-success text-white",
    ARCHIVED: "bg-neutral-g2 text-neutral-g4",
};

export default function ArtistProductManager() {
    const navigate = useNavigate();
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [statusFilter, setStatusFilter] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    useEffect(() => {
        fetchProducts();
    }, [statusFilter]);

    const fetchProducts = async () => {
        try {
            setIsLoading(true);
            const params = statusFilter !== "all" ? `?status=${statusFilter}` : "";
            const res = await api.get(`/api/artist/products${params}`);
            setProducts(res.data.data.products);
        } catch (error) {
            console.error("Failed to fetch products:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePublish = async (productId: string) => {
        setActionLoading(productId);
        try {
            await api.patch(`/api/artist/products/${productId}/publish`);
            setProducts((prev) => prev.map((p) => p.id === productId ? { ...p, status: "PUBLISHED" } : p));
        } catch (error) {
            console.error("Failed to publish product:", error);
        } finally {
            setActionLoading(null);
        }
    };

    const handleDelete = async (productId: string) => {
        if (
            !confirm(
                "Permanently delete this product? Mockup images will be removed from storage. You can use the same design on a new product afterward (unless this item was ever ordered)."
            )
        )
            return;
        setActionLoading(productId);
        try {
            await api.delete(`/api/artist/products/${productId}`);
            setProducts((prev) => prev.filter((p) => p.id !== productId));
        } catch (error: unknown) {
            console.error("Failed to delete product:", error);
            const msg =
                (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
                "Could not delete this product.";
            alert(msg);
        } finally {
            setActionLoading(null);
        }
    };

    const handleEdit = (productId: string) => {
        navigate(`/artist/create-mockup?productId=${productId}`);
    };

    const filteredProducts = products.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <div className="w-full min-h-screen bg-neutral-g1 flex flex-col pt-4">
            <div className="flex-1 px-4 sm:px-8 pb-12 w-full">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
                    <Link
                        to="/artist/create-mockup"
                        className="flex items-center gap-3 px-8 py-4 bg-primary border-[2px] border-neutral-black rounded-[4px] font-display text-[14px] font-black uppercase tracking-[1px] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
                    >
                        <Plus className="w-5 h-5" /> Manifest Product
                    </Link>
                </div>

                {/* Toolbar */}
                <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 mb-8">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-black" />
                        <input
                            type="text"
                            placeholder="SEARCH PRODUCT REPOSITORY..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-white border-[2px] border-neutral-black rounded-[4px] font-display text-[11px] font-black uppercase tracking-[1px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:translate-x-[1px] focus:translate-y-[1px] focus:shadow-none outline-none transition-all"
                        />
                    </div>

                    <div className="flex gap-1 flex-wrap">
                        {["all", "DRAFT", "PUBLISHED", "ARCHIVED"].map((status) => (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status)}
                                className={`px-4 py-2 border-[2px] border-neutral-black font-display text-[10px] font-black uppercase tracking-[1px] rounded-[2px] transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none ${statusFilter === status
                                    ? "bg-neutral-black text-white"
                                    : "bg-white text-neutral-black hover:bg-primary-light"
                                    }`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>

                    <div className="flex border-[2px] border-neutral-black rounded-[4px] overflow-hidden bg-white">
                        <button
                            onClick={() => setViewMode("grid")}
                            className={`w-12 h-11 flex items-center justify-center transition-colors ${viewMode === "grid" ? "bg-neutral-black text-white" : "text-neutral-black hover:bg-neutral-g1"}`}
                        >
                            <Grid className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setViewMode("list")}
                            className={`w-12 h-11 flex items-center justify-center transition-colors ${viewMode === "list" ? "bg-neutral-black text-white" : "text-neutral-black hover:bg-neutral-g1"}`}
                        >
                            <List className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                {isLoading ? (
                    <div className="flex justify-center items-center h-64">
                        <Loader size="w-12 h-12" />
                    </div>
                ) : filteredProducts.length === 0 ? (
                    <div className="bg-white border-[2px] border-neutral-black rounded-[6px] p-24 text-center shadow-[12px_12px_0px_0px_rgba(0,0,0,0.05)]">
                        <div className="w-24 h-24 bg-neutral-g1 border-[2px] border-dashed border-neutral-black rounded-full flex items-center justify-center mx-auto mb-6 opacity-30">
                            <Package className="w-10 h-10" />
                        </div>
                        <h3 className="font-display text-[20px] font-black uppercase mb-2">No Products Detected</h3>
                        <p className="font-display text-[11px] font-bold text-neutral-g4 uppercase tracking-[2px] mb-8">Initiate the manifestation engine to create your first drop.</p>
                        <Link
                            to="/artist/create-mockup"
                            className="inline-flex items-center gap-3 px-8 py-3 bg-primary border-[2px] border-neutral-black font-display text-[12px] font-black uppercase tracking-[1px] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
                        >
                            <Plus className="w-4 h-4" /> Manifest Product
                        </Link>
                    </div>
                ) : viewMode === "grid" ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {filteredProducts.map((product) => (
                            <div
                                key={product.id}
                                className="bg-white border-[2px] border-neutral-black rounded-[6px] overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all group"
                            >
                                <div className="aspect-square overflow-hidden relative bg-neutral-g1 border-b-[2px] border-neutral-black">
                                    <img
                                        src={cardListingImageUrl(product)}
                                        alt={product.name}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                    />
                                    <div className="absolute top-4 left-4">
                                        <span className={`px-2 py-1 rounded-[2px] border-[1px] border-neutral-black font-display text-[9px] font-black uppercase tracking-[1px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${statusPillClass[product.status]}`}>
                                            {product.status}
                                        </span>
                                    </div>
                                </div>
                                <div className="p-5">
                                    <div className="font-display text-[11px] font-black text-neutral-g3 uppercase mb-1">{product.design.title}</div>
                                    <div className="font-display text-[16px] font-black text-neutral-black uppercase mb-4 truncate">{product.name}</div>

                                    <div className="flex justify-between items-end mb-6">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold text-neutral-g4 uppercase">Retail Value</p>
                                            <div className="flex items-baseline gap-2">
                                                <p className="font-display text-[24px] font-black text-neutral-black leading-none italic">₹{product.price}</p>
                                                {product.isDiscounted && (
                                                    <p className="font-display text-[14px] font-bold text-neutral-g3 line-through">₹{product.originalPrice}</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-bold text-neutral-g4 uppercase">Status</p>
                                            <StockStatusPill stockStatus={(product as any).stockStatus} />
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        {product.status === "DRAFT" && (
                                            <button
                                                onClick={() => handleEdit(product.id)}
                                                className="flex-1 py-2.5 bg-white border-[1.5px] border-neutral-black rounded-[2px] font-display text-[9px] font-black uppercase tracking-[1px] text-neutral-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all font-display"
                                            >
                                                Edit Draft
                                            </button>
                                        )}
                                        {product.status === "DRAFT" && (
                                            <button
                                                onClick={() => handlePublish(product.id)}
                                                disabled={actionLoading === product.id}
                                                className="flex-1 py-2.5 bg-success border-[1.5px] border-neutral-black rounded-[2px] font-display text-[9px] font-black uppercase tracking-[1px] text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all disabled:opacity-50"
                                            >
                                                {actionLoading === product.id ? "..." : "Publish"}
                                            </button>
                                        )}
                                        <button className="flex-1 py-2.5 bg-white border-[1.5px] border-neutral-black rounded-[2px] font-display text-[9px] font-black uppercase tracking-[1px] text-neutral-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all font-display">
                                            <Eye className="w-3.5 h-3.5 inline mr-1 mb-0.5" /> View
                                        </button>
                                        <button
                                            onClick={() => handleDelete(product.id)}
                                            disabled={actionLoading === product.id}
                                            className="px-3 py-2.5 bg-white border-[1.5px] border-neutral-black rounded-[2px] text-danger shadow-[2px_2px_0px_0px_rgba(255,0,0,0.1)] hover:bg-danger hover:text-white transition-all disabled:opacity-50"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white border-[2px] border-neutral-black rounded-[6px] overflow-hidden shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-neutral-black text-white">
                                    {["Product", "Source Design", "Value", "Stock", "Status", "Actions"].map(h => (
                                        <th key={h} className="font-display text-[10px] font-black tracking-[2px] uppercase py-5 px-6 text-left whitespace-nowrap">
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredProducts.map((product) => (
                                    <tr key={product.id} className="border-b-[1px] border-neutral-black/5 hover:bg-primary/5 transition-colors">
                                        <td className="py-5 px-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-neutral-g1 border-[1px] border-neutral-black rounded-[2px] overflow-hidden">
                                                    <img src={cardListingImageUrl(product)} alt={product.name} className="w-full h-full object-cover" />
                                                </div>
                                                <span className="font-display text-[14px] font-black text-neutral-black uppercase">{product.name}</span>
                                            </div>
                                        </td>
                                        <td className="py-5 px-6 font-display text-[11px] font-bold text-neutral-g4 uppercase">{product.design.title}</td>
                                        <td className="py-5 px-6 font-display text-[14px] font-black text-neutral-black italic tracking-tight">₹{product.price}</td>
                                        <td className="py-5 px-6 font-display text-[11px] font-bold text-neutral-g4 uppercase">
                                            {(product as any).stockStatus?.replaceAll("_", " ") || "IN STOCK"}
                                        </td>
                                        <td className="py-5 px-6">
                                            <span className={`px-2 py-1 rounded-[2px] border-[1px] border-neutral-black font-display text-[9px] font-black uppercase tracking-[1px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${statusPillClass[product.status]}`}>
                                                {product.status}
                                            </span>
                                        </td>
                                        <td className="py-5 px-6">
                                            <div className="flex gap-2">
                                                {product.status === "DRAFT" && (
                                                    <button
                                                        onClick={() => handleEdit(product.id)}
                                                        className="px-4 py-2 bg-white text-neutral-black border-[1px] border-neutral-black rounded-[2px] font-display text-[9px] font-black uppercase tracking-[1px] hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
                                                    >
                                                        Edit
                                                    </button>
                                                )}
                                                {product.status === "DRAFT" && (
                                                    <button
                                                        onClick={() => handlePublish(product.id)}
                                                        disabled={actionLoading === product.id}
                                                        className="px-4 py-2 bg-success text-white border-[1px] border-neutral-black rounded-[2px] font-display text-[9px] font-black uppercase tracking-[1px] hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
                                                    >
                                                        Publish
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDelete(product.id)}
                                                    disabled={actionLoading === product.id}
                                                    className="px-4 py-2 bg-white border-[1px] border-neutral-black rounded-[2px] text-danger font-display text-[9px] font-black uppercase tracking-[1px] hover:bg-danger hover:text-white transition-all disabled:opacity-50"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
