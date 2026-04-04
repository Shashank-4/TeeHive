import { useEffect, useState } from "react";
import {
    Search,
    Filter,
    Grid,
    List,
    Plus,
    RefreshCw,
} from "lucide-react";
import Loader from "../../components/shared/Loader";
import { Link } from "react-router-dom";
import UploadDesignModal from "../../components/modals/UploadDesignModal";
import api from "../../api/axios";

interface Design {
    id: string;
    title: string;
    imageUrl: string;
    createdAt: string;
    status: string;
    rejectionReason?: string;
}

export default function ArtistDesignManager() {
    const [viewMode, setViewMode] = useState("grid");
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [designs, setDesigns] = useState<Design[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    function handleModalClose() {
        setShowUploadModal(false);
    }

    const handleDesignUpload = (newDesign: { id: string; title: string; imageUrl: string; status?: string }) => {
        const formattedDesign = {
            id: newDesign.id,
            title: newDesign.title,
            imageUrl: newDesign.imageUrl,
            status: newDesign.status || "PENDING",
            createdAt: new Date().toISOString(),
        };
        setDesigns((prevDesigns) => [formattedDesign, ...prevDesigns]);
    };

    const handleDeleteDesign = async (id: string, isRejected: boolean = false) => {
        const action = isRejected ? "dismiss" : "terminate";
        if (!confirm(`Are you sure you want to ${action} this design?`)) return;
        
        try {
            await api.delete(`/api/designs/${id}`);
            setDesigns((prev) => prev.filter((d) => d.id !== id));
        } catch (err) {
            console.error("Failed to delete design", err);
            alert(`Failed to ${action} design. Please try again.`);
        }
    };

    const loadDesigns = async (mode: "initial" | "refresh" = "initial") => {
        try {
            if (mode === "initial") setIsLoading(true);
            else setIsRefreshing(true);
            setError(null);
            const response = await api.get("/api/designs");
            setDesigns(response.data.data.designs);
        } catch (err) {
            setError("Failed to fetch designs. Please try again.");
            console.error("Error while fetching the designs of the artist", err);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        loadDesigns("initial");
    }, []);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader size="w-12 h-12" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full min-h-screen bg-neutral-g1 flex items-center justify-center p-8">
                <div className="bg-white border-[2px] border-neutral-black p-12 rounded-[6px] shadow-[12px_12px_0px_0px_rgba(255,0,0,1)] text-center max-w-md">
                    <div className="text-[48px] mb-4">⚠️</div>
                    <h2 className="font-display text-[20px] font-black uppercase mb-2">Transmission Interrupted</h2>
                    <p className="font-display text-[12px] font-bold text-neutral-g4 uppercase mb-6">{error}</p>
                    <button onClick={() => window.location.reload()} className="w-full py-3 bg-primary border-[2px] border-neutral-black font-display text-[12px] font-black uppercase tracking-[1px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all">Retry Link</button>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen bg-neutral-g1 flex flex-col pt-4">
            <div className="flex-1 px-4 sm:px-8 pb-12 w-full">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
                    <button
                        onClick={() => setShowUploadModal(true)}
                        className="flex items-center gap-3 px-8 py-4 bg-primary border-[2px] border-neutral-black rounded-[4px] font-display text-[14px] font-black uppercase tracking-[1px] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
                    >
                        <Plus className="w-5 h-5" /> Upload New Asset
                    </button>
                </div>

                {/* Toolbar */}
                <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 mb-8">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-black" />
                        <input
                            type="text"
                            placeholder="SEARCH CURRENT DESIGN REPOSITORY..."
                            className="w-full pl-11 pr-4 py-3 bg-white border-[2px] border-neutral-black rounded-[4px] font-display text-[11px] font-black uppercase tracking-[1px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:translate-x-[1px] focus:translate-y-[1px] focus:shadow-none outline-none transition-all"
                        />
                    </div>

                    <div className="flex gap-3 flex-wrap">
                        <button
                            type="button"
                            onClick={() => loadDesigns("refresh")}
                            disabled={isRefreshing || isLoading}
                            className="flex items-center gap-2 px-4 py-3 bg-white border-[2px] border-neutral-black rounded-[4px] font-display text-[11px] font-black uppercase tracking-[1px] hover:bg-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Refresh status from server (e.g. after admin review)"
                        >
                            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
                            Sync status
                        </button>
                        <button type="button" className="flex items-center gap-2 px-4 py-3 bg-white border-[2px] border-neutral-black rounded-[4px] font-display text-[11px] font-black uppercase tracking-[1px] hover:bg-neutral-g1 transition-colors">
                            <Filter className="w-4 h-4" /> Filter
                        </button>
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
                </div>

                {/* Designs Content */}
                {designs.length === 0 ? (
                    <div className="bg-white border-[2px] border-neutral-black rounded-[6px] p-24 text-center shadow-[12px_12px_0px_0px_rgba(0,0,0,0.05)]">
                        <div className="w-24 h-24 bg-neutral-g1 border-[2px] border-dashed border-neutral-black rounded-full flex items-center justify-center mx-auto mb-6 opacity-30">
                            <Plus className="w-10 h-10" />
                        </div>
                        <h3 className="font-display text-[20px] font-black uppercase mb-2">The Lab is Empty</h3>
                        <p className="font-display text-[11px] font-bold text-neutral-g4 uppercase tracking-[2px] mb-8">No source graphics detected in your hive cache.</p>
                        <button
                            onClick={() => setShowUploadModal(true)}
                            className="px-8 py-3 bg-primary border-[2px] border-neutral-black font-display text-[12px] font-black uppercase tracking-[1px] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
                        >
                            Initialize First Upload
                        </button>
                    </div>
                ) : viewMode === "grid" ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 md:gap-8">
                        {designs.map((design) => (
                            <div
                                key={design.id}
                                className="group bg-white border-[2px] border-neutral-black rounded-[6px] overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
                            >
                                <div className="aspect-square overflow-hidden bg-neutral-g1 relative group">
                                    {design.status === "REJECTED" && (
                                        <div className="absolute top-4 left-0 right-0 bg-danger text-white text-[10px] font-black uppercase text-center py-1 z-10 shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                                            Rejected Violation
                                        </div>
                                    )}
                                    {design.status === "PENDING" && (
                                        <div className="absolute top-4 left-0 right-0 bg-primary/90 text-neutral-black text-[10px] font-black uppercase text-center py-1 z-10 shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                                            Pending Review
                                        </div>
                                    )}
                                    <img src={design.imageUrl} alt={design.title} className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ${design.status === 'REJECTED' ? 'grayscale opacity-70' : ''}`} />
                                    
                                    {design.status === "APPROVED" && (
                                        <div className="absolute inset-0 bg-neutral-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20">
                                            <Link to={`/artist/create-mockup`} className="bg-primary border-[2px] border-neutral-black px-4 py-2 font-display text-[10px] font-black uppercase tracking-[1px] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all">Manifest Prod</Link>
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-col flex-1 p-4 border-t-[2px] border-neutral-black">
                                    <div className="font-display text-[13px] font-black text-neutral-black uppercase truncate mb-auto text-wrap line-clamp-2">{design.title}</div>
                                    
                                    {design.status === "REJECTED" && design.rejectionReason && (
                                        <div className="mt-2 mb-2 bg-danger/10 border-[1px] border-danger p-2 rounded-[2px]">
                                            <p className="font-display text-[9px] font-black text-danger uppercase mb-1">Reason:</p>
                                            <p className="font-display text-[10px] font-black text-neutral-g4 line-clamp-3">{design.rejectionReason}</p>
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-neutral-black/10">
                                        <span className="text-[10px] font-bold text-neutral-g4 uppercase">{new Date(design.createdAt).toLocaleDateString()}</span>
                                        <button 
                                            onClick={() => handleDeleteDesign(design.id, design.status === "REJECTED")} 
                                            className="text-[9px] font-black uppercase text-danger hover:underline"
                                        >
                                            {design.status === "REJECTED" ? "Dismiss" : "Terminate"}
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
                                    {["Asset", "Recorded Date", "System Actions"].map(h => (
                                        <th key={h} className="font-display text-[10px] font-black tracking-[2px] uppercase py-5 px-6 text-left whitespace-nowrap">
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {designs.map((design) => (
                                    <tr key={design.id} className="border-b-[1px] border-neutral-black/5 hover:bg-primary/5 transition-colors">
                                        <td className="py-5 px-6">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-12 h-12 border-[1px] border-neutral-black rounded-[2px] overflow-hidden ${design.status === 'REJECTED' ? 'bg-danger/10' : 'bg-neutral-g1'}`}>
                                                    <img src={design.imageUrl} alt={design.title} className={`w-full h-full object-cover ${design.status === 'REJECTED' ? 'grayscale opacity-70' : ''}`} />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-display text-[14px] font-black text-neutral-black uppercase">{design.title}</span>
                                                    {design.status === "REJECTED" && (
                                                        <span className="font-display text-[10px] font-black text-danger uppercase mt-1">Rejected: {design.rejectionReason}</span>
                                                    )}
                                                    {design.status === "PENDING" && (
                                                        <span className="font-display text-[10px] font-black text-primary-dark uppercase mt-1">Pending Review</span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-5 px-6 font-display text-[11px] font-bold text-neutral-g4 uppercase">
                                            {new Date(design.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="py-5 px-6">
                                            <div className="flex gap-3">
                                                {design.status === "APPROVED" && (
                                                    <Link to={`/artist/create-mockup`}>
                                                        <button className="px-4 py-2 bg-primary border-[1.5px] border-neutral-black rounded-[2px] font-display text-[9px] font-black uppercase tracking-[1px] hover:translate-x-[1px] hover:translate-y-[1px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none transition-all">
                                                            Manifest
                                                        </button>
                                                    </Link>
                                                )}
                                                <button 
                                                    onClick={() => handleDeleteDesign(design.id, design.status === "REJECTED")}
                                                    className="px-4 py-2 bg-white border-[1.5px] border-neutral-black rounded-[2px] font-display text-[9px] font-black text-danger uppercase tracking-[1px] hover:bg-neutral-black hover:text-white transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)] hover:shadow-none"
                                                >
                                                    {design.status === "REJECTED" ? "Dismiss" : "Wipe"}
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

            {showUploadModal && (
                <UploadDesignModal
                    onClose={handleModalClose}
                    onUploadComplete={handleDesignUpload}
                />
            )}
        </div>
    );
}
