import React, { useState, useEffect } from "react";
import {
    Search,
    ChevronLeft,
    ChevronRight,
    Loader2,
    Palette,
    FolderLock,
    Image as ImageIcon,
    Download,
    CheckCircle,
    XCircle,
    AlertCircle,
    Database
} from "lucide-react";
import api from "../../api/axios";

interface AdminDesign {
    id: string;
    designCode: string;
    title: string;
    imageUrl: string;
    status: string;
    artistId: string;
    artist: {
        name: string;
        email: string;
    };
    createdAt: string;
}

interface PaginationData {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

const statusColor = (status: string) => {
    switch (status) {
        case "APPROVED": return "text-success bg-success/10 border-success/20";
        case "REJECTED": return "text-danger bg-danger/10 border-danger/20";
        default: return "text-primary-dark bg-primary/10 border-primary/20";
    }
};

export default function AdminDesigns() {
    const [designs, setDesigns] = useState<AdminDesign[]>([]);
    const [pagination, setPagination] = useState<PaginationData>({ page: 1, limit: 10, total: 0, totalPages: 1 });
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    
    // Bulk selection state (download-only)
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isDownloading, setIsDownloading] = useState(false);
    const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

    // Modals
    const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [rejectTargetId, setRejectTargetId] = useState<string | null>(null);
    const [rejectReason, setRejectReason] = useState("Quality Issue");
    const [rejectComments, setRejectComments] = useState("");

    const fetchDesigns = async (page = 1, search = searchQuery, statusType = statusFilter) => {
        setLoading(true);
        try {
            const params: any = { page, limit: 10 };
            if (search) params.search = search;
            if (statusType) params.status = statusType;
            
            const res = await api.get(`/api/admin/designs`, { params });
            setDesigns(res.data.data.designs);
            setPagination(res.data.data.pagination);
            // Reset selection on page change
            setSelectedIds([]);
        } catch (err) {
            console.error("Failed to load designs", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchDesigns(); }, []);

    const handleSearch = (e: React.FormEvent) => { e.preventDefault(); fetchDesigns(1, searchQuery, statusFilter); };
    const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => { 
        const v = e.target.value; 
        setStatusFilter(v); 
        fetchDesigns(1, searchQuery, v); 
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === designs.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(designs.map(d => d.id));
        }
    };

    const toggleSelect = (id: string) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(selId => selId !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const handleBulkDownload = async () => {
        if (selectedIds.length === 0) return;
        setIsDownloading(true);
        try {
            const res = await api.post(`/api/admin/designs/bulk-download`, { designIds: selectedIds });
            const links = res.data.data.downloadLinks;
            
            // Trigger sequential downloads to avoid browser blocking
            for (let i = 0; i < links.length; i++) {
                const { url, filename } = links[i];
                
                try {
                    // Method 1: Fetch as blob to force custom filename client-side
                    const response = await fetch(url);
                    const blob = await response.blob();
                    const objectUrl = window.URL.createObjectURL(blob);
                    
                    const a = document.createElement("a");
                    a.href = objectUrl;
                    a.download = filename || "design.jpg";
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    
                    // Cleanup memory
                    setTimeout(() => window.URL.revokeObjectURL(objectUrl), 1000);
                } catch (fetchErr) {
                    console.warn("Blob fetch failed (likely CORS), falling back to direct navigation:", fetchErr);
                    // Method 2: Fallback (relies on backend Content-Disposition header)
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = filename || "design.jpg";
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                }

                // 500ms delay between triggers
                await new Promise(r => setTimeout(r, 500));
            }
            // Optional: Unselect after download
            setSelectedIds([]);
        } catch (err) {
            console.error("Bulk download failed", err);
            alert("Failed to initiate bulk download.");
        } finally {
            setIsDownloading(false);
        }
    };

    const flagSingleDesign = async (
        designId: string,
        action: "APPROVE" | "REJECT",
        customReason: string | null = null
    ) => {
        if (!designId) return;
        setActionLoadingId(designId);
        try {
            await api.patch(`/api/admin/designs/bulk-flag`, {
                designIds: [designId],
                action,
                reason: customReason,
            });
            await fetchDesigns(pagination.page);
        } catch (err) {
            console.error("Flag design failed", err);
            alert(`Failed to ${action.toLowerCase()} design.`);
        } finally {
            setActionLoadingId(null);
        }
    };

    const handleRejectSubmit = async () => {
        const targetId = rejectTargetId;
        if (!targetId) return;

        const fullReason = `${rejectReason}${rejectComments ? ` - ${rejectComments}` : ""}`;
        setRejectModalOpen(false);
        setRejectTargetId(null);
        await flagSingleDesign(targetId, "REJECT", fullReason);
        setRejectReason("Quality Issue");
        setRejectComments("");
    };

    return (
        <div className="w-full min-h-screen bg-neutral-g1 flex flex-col pt-4 text-neutral-black">
            <div className="flex-1 px-4 sm:px-8 pb-12 w-full">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 bg-neutral-black text-white px-3 py-1 rounded-[4px] font-display text-[10px] font-black uppercase tracking-[2px]">
                            <FolderLock className="w-3 h-3 text-primary" /> SECURE VAULT
                        </div>
                        <h1 className="font-display text-[ clamp(32px,5vw,48px) ] font-black text-neutral-black leading-none uppercase tracking-tight">
                            Design <span className="text-primary italic">Repository</span>
                        </h1>
                        <p className="font-display text-[14px] font-bold text-neutral-g4 uppercase tracking-wider">
                            Manage asset source files. Search, audit, and batch-download artist submissions.
                        </p>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-6 mb-8">
                    <form onSubmit={handleSearch} className="flex flex-1 items-stretch gap-4 max-w-2xl">
                        <div className="relative flex-1 min-w-[250px]">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-black" />
                            <input
                                type="text"
                                placeholder="SEARCH BY CODE OR TITLE..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 bg-white border-[2px] border-neutral-black rounded-[4px] font-display text-[11px] font-black uppercase tracking-[1px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:translate-x-[1px] focus:translate-y-[1px] focus:shadow-none outline-none transition-all"
                            />
                        </div>
                        <div className="relative group min-w-[150px]">
                            <select
                                value={statusFilter}
                                onChange={handleStatusFilterChange}
                                className="w-full px-4 py-3 bg-white border-[2px] border-neutral-black rounded-[4px] font-display text-[11px] font-black uppercase tracking-[1px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] outline-none cursor-pointer hover:bg-primary transition-all appearance-none"
                            >
                                <option value="">All Statuses</option>
                                <option value="PENDING">Pending Review</option>
                                <option value="APPROVED">Approved</option>
                                <option value="REJECTED">Rejected</option>
                            </select>
                        </div>
                        <button type="submit" className="px-6 py-3 bg-neutral-black text-white border-[2px] border-neutral-black rounded-[4px] font-display text-[11px] font-black uppercase tracking-[2px] shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
                            Filter
                        </button>
                    </form>

                    {/* Bulk Actions Banner (Download-only) */}
                    <div className={`flex items-center gap-3 transition-opacity duration-300 ${selectedIds.length > 0 ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
                        <span className="font-display text-[11px] font-black uppercase bg-white px-3 py-2 border-[2px] border-neutral-black rounded-[4px]">
                            {selectedIds.length} Selected
                        </span>
                        <button 
                            onClick={handleBulkDownload}
                            disabled={isDownloading}
                            className="flex items-center gap-2 px-5 py-3 bg-primary border-[2px] border-neutral-black rounded-[4px] font-display text-[11px] font-black uppercase tracking-[1px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                            Batch Get
                        </button>
                    </div>
                </div>

                {/* Table Container */}
                <div className="bg-white border-[2px] border-neutral-black rounded-[6px] shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse min-w-[900px]">
                            <thead>
                                <tr className="bg-neutral-black text-white">
                                    <th className="py-5 px-6 w-12 text-center">
                                        <input 
                                            type="checkbox" 
                                            checked={designs.length > 0 && selectedIds.length === designs.length}
                                            onChange={toggleSelectAll}
                                            className="w-4 h-4 accent-primary cursor-pointer"
                                        />
                                    </th>
                                    {["Asset ID", "Thumbnail", "Title & Artist", "Status", "Date"].map(h => (
                                        <th key={h} className="font-display text-[10px] font-black tracking-[2px] uppercase py-5 px-6 text-left whitespace-nowrap">
                                            {h}
                                        </th>
                                    ))}
                                    <th className="font-display text-[10px] font-black tracking-[2px] uppercase py-5 px-6 text-left whitespace-nowrap">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y-[1px] divide-neutral-black/10">
                                {loading ? (
                                    <tr><td colSpan={7} className="py-24 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <Loader2 className="w-12 h-12 text-primary animate-spin" />
                                            <p className="font-display text-[10px] font-black uppercase tracking-[2px]">Fetching Records...</p>
                                        </div>
                                    </td></tr>
                                ) : designs.length === 0 ? (
                                    <tr><td colSpan={7} className="py-24 text-center">
                                        <div className="flex flex-col items-center gap-4 opacity-30">
                                            <Database className="w-16 h-16" />
                                            <p className="font-display text-[12px] font-black uppercase tracking-[2px]">No Designs Found</p>
                                        </div>
                                    </td></tr>
                                ) : (
                                    designs.map((design) => (
                                        <tr key={design.id} className={`transition-colors group ${selectedIds.includes(design.id) ? 'bg-primary/5' : 'hover:bg-neutral-g1'}`}>
                                            <td className="py-5 px-6 text-center">
                                                <input 
                                                    type="checkbox" 
                                                    checked={selectedIds.includes(design.id)}
                                                    onChange={() => toggleSelect(design.id)}
                                                    className="w-4 h-4 accent-primary cursor-pointer"
                                                />
                                            </td>
                                            <td className="py-5 px-6">
                                                <span className="font-display text-[12px] font-black text-neutral-black bg-neutral-g2 px-2 py-1 rounded-[2px] uppercase tracking-widest whitespace-nowrap">
                                                    {design.designCode || "N/A"}
                                                </span>
                                            </td>
                                            <td className="py-5 px-6">
                                                <div 
                                                    onClick={() => setFullscreenImage(design.imageUrl)}
                                                    className="w-16 h-16 bg-neutral-black border-[1px] border-neutral-black rounded-[4px] overflow-hidden group-hover:shadow-[4px_4px_0px_0px_rgba(255,222,0,1)] transition-all flex-shrink-0 cursor-pointer"
                                                >
                                                    {design.imageUrl ? (
                                                        <img src={design.imageUrl} alt={design.title} className="w-full h-full object-cover bg-white pointer-events-none" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <ImageIcon className="w-6 h-6 text-white opacity-20" />
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-5 px-6">
                                                <div className="min-w-0">
                                                    <div className="font-display text-[14px] font-black text-neutral-black uppercase tracking-tight truncate">{design.title}</div>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Palette className="w-3 h-3 text-primary" />
                                                        <span className="font-display text-[10px] font-bold text-neutral-g4 uppercase">{design.artist?.name || "Unknown Artist"}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-5 px-6">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-[2px] font-display text-[9px] font-black uppercase tracking-[1.5px] border-[1px] whitespace-nowrap ${statusColor(design.status)}`}>
                                                    {design.status === "APPROVED" && <CheckCircle className="w-3 h-3" />}
                                                    {design.status === "REJECTED" && <XCircle className="w-3 h-3" />}
                                                    {design.status}
                                                </span>
                                            </td>
                                            <td className="py-5 px-6">
                                                <span className="font-display text-[10px] font-bold text-neutral-g4 uppercase">
                                                    {new Date(design.createdAt).toLocaleDateString()}
                                                </span>
                                            </td>
                                            <td className="py-5 px-6">
                                                {(() => {
                                                    const isResolved = design.status === "APPROVED" || design.status === "REJECTED";
                                                    const isBusy = actionLoadingId === design.id;

                                                    return (
                                                        <div className="flex gap-3 items-center">
                                                            <button
                                                                type="button"
                                                                disabled={isResolved || isBusy}
                                                                onClick={() => flagSingleDesign(design.id, "APPROVE", null)}
                                                                className={`px-4 py-2 border-[1.5px] rounded-[2px] font-display text-[9px] font-black uppercase tracking-[1px] transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${isResolved ? "bg-neutral-g1 text-neutral-g4 border-neutral-g2 cursor-not-allowed" : "bg-success text-white border-neutral-black hover:bg-white hover:text-success hover:shadow-none"} ${isBusy ? "opacity-50 cursor-wait" : ""}`}
                                                            >
                                                                {design.status === "APPROVED"
                                                                    ? "Approved"
                                                                    : isBusy
                                                                      ? "Approving..."
                                                                      : "Approve"}
                                                            </button>
                                                            <button
                                                                type="button"
                                                                disabled={isResolved || isBusy}
                                                                onClick={() => {
                                                                    setRejectTargetId(design.id);
                                                                    setRejectModalOpen(true);
                                                                }}
                                                                className={`px-4 py-2 border-[1.5px] rounded-[2px] font-display text-[9px] font-black uppercase tracking-[1px] transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${isResolved ? "bg-neutral-g1 text-neutral-g4 border-neutral-g2 cursor-not-allowed" : "bg-danger text-white border-neutral-black hover:bg-white hover:text-danger hover:shadow-none"} ${isBusy ? "opacity-50 cursor-wait" : ""}`}
                                                            >
                                                                {design.status === "REJECTED"
                                                                    ? "Rejected"
                                                                    : isBusy
                                                                      ? "Rejecting..."
                                                                      : "Reject"}
                                                            </button>
                                                        </div>
                                                    );
                                                })()}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {!loading && designs.length > 0 && (
                        <div className="bg-neutral-black px-8 py-5 flex items-center justify-between">
                            <span className="font-display text-[10px] font-black text-primary uppercase tracking-[2px]">
                                Page {pagination.page} / {pagination.totalPages} — {pagination.total} Records
                            </span>
                            <div className="flex items-center gap-4">
                                <button onClick={() => fetchDesigns(pagination.page - 1)} disabled={pagination.page === 1}
                                    className="w-10 h-10 bg-white border-[2px] border-neutral-black rounded-[2px] flex items-center justify-center hover:bg-primary transition-all disabled:opacity-20 shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)]">
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <button onClick={() => fetchDesigns(pagination.page + 1)} disabled={pagination.page === pagination.totalPages}
                                    className="w-10 h-10 bg-white border-[2px] border-neutral-black rounded-[2px] flex items-center justify-center hover:bg-primary transition-all disabled:opacity-20 shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)]">
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            
            {/* Reject Modal */}
            {rejectModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white border-[2px] border-neutral-black rounded-[6px] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-md w-full p-6">
                        <div className="flex justify-between items-center mb-6 border-b-[2px] border-neutral-black pb-4">
                            <h2 className="font-display text-[18px] font-black uppercase tracking-[1px] flex items-center gap-2">
                                <AlertCircle className="w-5 h-5 text-danger" /> Reject Designs
                            </h2>
                            <button
                                onClick={() => {
                                    setRejectModalOpen(false);
                                    setRejectTargetId(null);
                                }}
                                className="hover:opacity-50 transition-opacity"
                                type="button"
                            >
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>
                        
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="font-display text-[11px] font-black uppercase tracking-[1px] text-neutral-g4">Violation Reason *</label>
                                <select 
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                    className="w-full px-4 py-3 bg-neutral-g1 border-[2px] border-neutral-black rounded-[4px] font-body text-[14px] font-black outline-none"
                                >
                                    <option value="Quality Issue">Quality Issue</option>
                                    <option value="Copyright/Trademark">Copyright/Trademark</option>
                                    <option value="NSFW/Explicit">NSFW/Explicit</option>
                                    <option value="Hate Speech/Offensive">Hate Speech/Offensive</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="font-display text-[11px] font-black uppercase tracking-[1px] text-neutral-g4">Additional Comments (Required)</label>
                                <textarea 
                                    value={rejectComments}
                                    onChange={(e) => setRejectComments(e.target.value)}
                                    placeholder="Provide specific feedback to the artist..."
                                    rows={4}
                                    className="w-full px-4 py-3 bg-neutral-g1 border-[2px] border-neutral-black rounded-[4px] font-body text-[14px] font-black outline-none resize-none"
                                ></textarea>
                            </div>
                        </div>
                        
                        <div className="mt-8 flex gap-4">
                            <button 
                                onClick={() => {
                                    setRejectModalOpen(false);
                                    setRejectTargetId(null);
                                }}
                                type="button"
                                className="flex-1 py-3 px-4 bg-white border-[2px] border-neutral-black rounded-[4px] font-display text-[12px] font-black uppercase tracking-[1px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-none transition-all"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleRejectSubmit}
                                disabled={!rejectComments.trim()}
                                className="flex-[2] py-3 px-4 bg-danger text-white border-[2px] border-neutral-black rounded-[4px] font-display text-[12px] font-black uppercase tracking-[1px] shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-none transition-all disabled:opacity-50"
                            >
                                Execute Rejection
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Fullscreen Image viewer modal */}
            {fullscreenImage && (
                <div 
                    className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-8 cursor-pointer"
                    onClick={() => setFullscreenImage(null)}
                >
                    <img 
                        src={fullscreenImage} 
                        alt="Fullscreen View" 
                        className="max-w-full max-h-full object-contain cursor-default bg-white border-[4px] border-neutral-black shadow-[16px_16px_0px_0px_rgba(255,222,0,1)]"
                        onClick={(e) => e.stopPropagation()}
                    />
                    <button 
                        className="absolute top-8 right-8 text-white hover:text-primary transition-colors bg-neutral-black border-[2px] border-neutral-g3 rounded-[4px] p-2"
                        onClick={() => setFullscreenImage(null)}
                    >
                        <XCircle className="w-8 h-8" />
                    </button>
                </div>
            )}
        </div>
    );
}
