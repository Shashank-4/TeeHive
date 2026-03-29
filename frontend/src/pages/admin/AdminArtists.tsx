import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import {
    Search,
    Users,
    CheckCircle,
    Clock,
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    Eye,
    Tag,
    ArrowUpRight,
} from "lucide-react";

interface Artist {
    id: string;
    name: string;
    email: string;
    artistNumber: number | null;
    displayName: string | null;
    displayPhotoUrl: string | null;
    verificationStatus: string;
    createdAt: string;
    _count: {
        designs: number;
        products: number;
    };
}

interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export default function AdminArtists() {
    const navigate = useNavigate();
    const [artists, setArtists] = useState<Artist[]>([]);
    const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
    const [activeTab, setActiveTab] = useState("all");
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);

    const fetchArtists = useCallback(async (page: number = 1) => {
        setLoading(true);
        try {
            const params: any = { page };
            if (activeTab !== "all") params.status = activeTab;
            if (search.trim()) params.search = search;

            const res = await api.get("/api/admin/artists", { params });
            setArtists(res.data.data.artists);
            setPagination(res.data.data.pagination);
        } catch (err) {
            console.error("Failed to fetch artists:", err);
        } finally {
            setLoading(false);
        }
    }, [activeTab, search]);

    useEffect(() => { fetchArtists(1); }, [fetchArtists]);

    const handleViewDetail = (artistId: string) => {
        navigate(`/admin/artists/${artistId}`);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "VERIFIED":
                return (
                    <div className="flex items-center gap-2 bg-success/10 text-success px-3 py-1 rounded-[4px] border-[1px] border-success/30 font-display text-[10px] font-black uppercase tracking-[1px]">
                        <CheckCircle className="w-3 h-3" /> Fully Verified
                    </div>
                );
            case "PENDING_VERIFICATION":
                return (
                    <div className="flex items-center gap-2 bg-primary/10 text-neutral-black px-3 py-1 rounded-[4px] border-[1px] border-primary font-display text-[10px] font-black uppercase tracking-[1px]">
                        <Clock className="w-3 h-3" /> Under Review
                    </div>
                );
            default:
                return (
                    <div className="flex items-center gap-2 bg-neutral-g2 text-neutral-g4 px-3 py-1 rounded-[4px] border-[1px] border-neutral-g3 font-display text-[10px] font-black uppercase tracking-[1px]">
                        <AlertCircle className="w-3 h-3" /> Unverified
                    </div>
                );
        }
    };

    return (
        <div className="w-full min-h-screen bg-neutral-g1 flex flex-col pt-4">
            <div className="flex-1 px-4 sm:px-8 pb-12 w-full max-w-[1600px] mx-auto">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 bg-neutral-black text-white px-3 py-1 rounded-[4px] font-display text-[10px] font-black uppercase tracking-[2px]">
                            <Users className="w-3 h-3 text-primary" /> Personnel Registry
                        </div>
                        <h1 className="font-display text-[32px] font-black text-neutral-black leading-none uppercase tracking-tight">
                            Artist <span className="text-primary italic">Directory</span>
                        </h1>
                    </div>

                    <div className="flex gap-4">
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-g3 group-focus-within:text-primary transition-colors" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search by name, ID or email..."
                                className="pl-12 pr-6 py-3 bg-white border-[2px] border-neutral-black rounded-[4px] font-display text-[12px] font-black uppercase placeholder:opacity-40 focus:shadow-[4px_4px_0px_0px_rgba(255,222,0,1)] outline-none transition-all w-full md:w-[320px]"
                            />
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-2 mb-8">
                    {["all", "PENDING_VERIFICATION", "VERIFIED", "UNVERIFIED"].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => { setActiveTab(tab); setPagination(prev => ({ ...prev, page: 1 })); }}
                            className={`px-6 py-2 rounded-[4px] border-[2px] transition-all font-display text-[11px] font-black uppercase tracking-[1px] ${activeTab === tab
                                ? "bg-neutral-black text-white border-neutral-black shadow-[4px_4px_0px_0px_rgba(255,222,0,1)] -translate-y-1"
                                : "bg-white border-neutral-g1 text-neutral-g3 hover:border-neutral-black hover:text-neutral-black"
                                }`}
                        >
                            {tab === "all" ? "Bureau (All)" : tab.replace("_", " ")}
                        </button>
                    ))}
                </div>

                <div className="bg-white border-[2px] border-neutral-black rounded-[8px] overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                    {loading ? (
                        <div className="p-20 flex flex-col items-center justify-center gap-4">
                            <div className="w-12 h-12 border-[4px] border-primary border-t-transparent rounded-full animate-spin"></div>
                            <p className="font-display text-[10px] font-black uppercase tracking-[2px]">Scanning Artist Archives...</p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-neutral-black text-white">
                                            {["Personnel", "Serial ID", "Asset Vol.", "Status", "Registration Date", "Actions"].map((head) => (
                                                <th key={head} className="py-4 px-6 font-display text-[10px] font-black uppercase tracking-[2px] border-r-[1px] border-white/10 last:border-0">{head}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y-[1px] divide-neutral-g1">
                                        {artists.map((artist) => (
                                            <tr key={artist.id} className="hover:bg-neutral-g1/50 transition-colors">
                                                <td className="py-5 px-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-[4px] bg-neutral-g1 border-[1px] border-neutral-black/20 overflow-hidden shrink-0">
                                                            {artist.displayPhotoUrl ? (
                                                                <img src={artist.displayPhotoUrl} alt="" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center font-display font-black text-neutral-g3">
                                                                    {artist.name.charAt(0).toUpperCase()}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <div className="font-display text-[14px] font-black text-neutral-black uppercase">{artist.displayName || artist.name}</div>
                                                            <div className="font-display text-[10px] font-bold text-neutral-g3 uppercase">{artist.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-5 px-6">
                                                    <div className="font-display text-[12px] font-black text-neutral-black bg-neutral-g2 px-2 py-1 rounded-[2px] uppercase tracking-widest inline-block">
                                                        {(artist.artistNumber !== undefined && artist.artistNumber !== null) ? String(artist.artistNumber).padStart(3, '0') : 'N/A'}
                                                    </div>
                                                </td>
                                                <td className="py-5 px-6 font-display text-[13px] font-black text-neutral-black uppercase italic">
                                                    <div className="flex items-center gap-3">
                                                        <span className="flex items-center gap-1 text-primary"><ArrowUpRight className="w-3 h-3" />{artist._count.designs}</span>
                                                        <span className="flex items-center gap-1 opacity-20 text-neutral-black"><Tag className="w-3 h-3" />{artist._count.products}</span>
                                                    </div>
                                                </td>
                                                <td className="py-5 px-6">
                                                    {getStatusBadge(artist.verificationStatus)}
                                                </td>
                                                <td className="py-5 px-6 font-display text-[11px] font-bold text-neutral-g4 uppercase">
                                                    {new Date(artist.createdAt).toLocaleDateString()}
                                                </td>
                                                <td className="py-5 px-6">
                                                    <div className="flex items-center gap-3">
                                                        <button
                                                            onClick={() => handleViewDetail(artist.id)}
                                                            className="p-2 bg-white border-[2px] border-neutral-black rounded-[4px] hover:bg-primary transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none translate-y-[-1px] active:translate-y-0"
                                                            title="Inspect Profile"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {pagination.totalPages > 1 && (
                                <div className="bg-neutral-black px-6 py-4 flex items-center justify-between">
                                    <span className="font-display text-[10px] font-black text-primary uppercase tracking-[2px]">
                                        Node {pagination.page} / {pagination.totalPages} — {pagination.total} Subjects Indexed
                                    </span>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => fetchArtists(pagination.page - 1)}
                                            disabled={pagination.page <= 1}
                                            className="w-10 h-10 bg-white border-[2px] border-neutral-black rounded-[2px] flex items-center justify-center hover:bg-primary transition-all disabled:opacity-20"
                                        >
                                            <ChevronLeft className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => fetchArtists(pagination.page + 1)}
                                            disabled={pagination.page >= pagination.totalPages}
                                            className="w-10 h-10 bg-white border-[2px] border-neutral-black rounded-[2px] flex items-center justify-center hover:bg-primary transition-all disabled:opacity-20"
                                        >
                                            <ChevronRight className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
