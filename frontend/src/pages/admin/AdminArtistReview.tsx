import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/axios";
import {
    ArrowLeft,
    CheckCircle,
    XCircle,
    Clock,
    Palette,
    Users,
    ExternalLink,
    ArrowUpRight,
    TrendingUp,
    Loader2,
    MessageSquare,
    UserCheck,
    ImageIcon,
} from "lucide-react";

interface Design {
    id: string;
    title: string;
    imageUrl: string;
    status: string;
}

interface ArtistDetail {
    id: string;
    name: string;
    email: string;
    artistNumber: number | null;
    displayName: string | null;
    bio: string | null;
    displayPhotoUrl: string | null;
    coverPhotoUrl: string | null;
    portfolioUrl: string | null;
    instagramUrl: string | null;
    twitterUrl: string | null;
    behanceUrl: string | null;
    dribbbleUrl: string | null;
    verificationStatus: string;
    verificationNote: string | null;
    canResubmitVerification: boolean;
    verifiedAt: string | null;
    createdAt: string;
    designs: Design[];
    _count: { products: number };
}

export default function AdminArtistReview() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [artist, setArtist] = useState<ArtistDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [rejecting, setRejecting] = useState(false);
    const [rejectionReason, setRejectionReason] = useState("");
    const [canResubmit, setCanResubmit] = useState<boolean>(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    useEffect(() => {
        if (id) fetchArtist();
    }, [id]);

    const fetchArtist = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/api/admin/artists/${id}`);
            setArtist(res.data.data.artist);
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to load artist detail.");
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async () => {
        if (!artist) return;
        setActionLoading(true);
        try {
            await api.patch(`/api/admin/artists/${artist.id}/verify`, { action: "APPROVE" });
            fetchArtist();
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to approve artist.");
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async () => {
        if (!artist || !rejectionReason.trim()) return;
        setActionLoading(true);
        try {
            await api.patch(`/api/admin/artists/${artist.id}/verify`, {
                action: "REJECT",
                reason: rejectionReason,
                canResubmitVerification: canResubmit,
            });
            setRejecting(false);
            fetchArtist();
        } catch (err) {
            console.error("Failed to reject:", err);
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="w-full min-h-screen bg-neutral-g1 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-12 h-12 text-primary animate-spin" />
                    <p className="font-display text-[12px] font-black uppercase tracking-[2px]">Decrypting Personnel Dossier...</p>
                </div>
            </div>
        );
    }

    if (error || !artist) {
        return (
            <div className="w-full min-h-screen bg-neutral-g1 flex items-center justify-center p-8">
                <div className="bg-white border-[3px] border-neutral-black p-10 rounded-[8px] max-w-md text-center shadow-[16px_16px_0px_0px_rgba(255,0,0,1)]">
                    <XCircle className="w-20 h-20 text-danger mx-auto mb-6" />
                    <h2 className="font-display text-[24px] font-black uppercase mb-4">Access Denied</h2>
                    <p className="font-display text-[14px] font-bold text-neutral-g4 uppercase mb-8">{error || "Subject not found in registry."}</p>
                    <button onClick={() => navigate("/admin/artists")} className="w-full py-4 bg-neutral-black text-white font-display text-[12px] font-black uppercase">Return to Directory</button>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen bg-neutral-g1 flex flex-col pt-4 text-neutral-black pb-20">
            <div className="px-4 sm:px-8 w-full max-w-7xl mx-auto">
                {/* Global Actions Bar */}
                <div className="flex items-center justify-between mb-8">
                    <button 
                        onClick={() => navigate("/admin/artists")}
                        className="flex items-center gap-3 px-5 py-3 bg-white border-[2px] border-neutral-black rounded-[4px] font-display text-[11px] font-black uppercase tracking-[1px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back to Registry
                    </button>

                    <div className="flex gap-4">
                        {artist.verificationStatus === "PENDING_VERIFICATION" && !rejecting && (
                            <>
                                <button 
                                    onClick={() => setRejecting(true)}
                                    className="px-8 py-3 bg-white border-[2px] border-danger text-danger rounded-[4px] font-display text-[12px] font-black uppercase tracking-[1px] shadow-[4px_4px_0px_0px_rgba(239,68,68,0.2)] hover:bg-danger hover:text-white transition-all"
                                >
                                    Flag & Deny
                                </button>
                                <button 
                                    onClick={handleApprove}
                                    disabled={actionLoading}
                                    className="px-8 py-3 bg-success border-[2px] border-neutral-black text-white rounded-[4px] font-display text-[12px] font-black uppercase tracking-[1px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all flex items-center gap-3"
                                >
                                    {actionLoading ? "Processing..." : "Authorize Personnel"} <UserCheck className="w-5 h-5" />
                                </button>
                            </>
                        )}
                        {artist.verificationStatus === "VERIFIED" && (
                            <div className="bg-success/10 text-success border-[2px] border-success px-6 py-3 rounded-[4px] font-display text-[12px] font-black uppercase flex items-center gap-3">
                                <CheckCircle className="w-5 h-5" /> Verified High Trust Subject
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-10">
                    <div className="space-y-10">
                        {/* Hero Header */}
                        <div className="relative group">
                            <div className="h-64 sm:h-96 w-full bg-neutral-black border-[3px] border-neutral-black rounded-[8px] overflow-hidden shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
                                {artist.coverPhotoUrl ? (
                                    <img src={artist.coverPhotoUrl} alt="Cover" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all duration-700" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <Palette className="w-20 h-20 text-white/5" />
                                    </div>
                                )}
                            </div>
                            
                            <div className="absolute -bottom-12 left-12 flex items-end gap-8">
                                <div className="w-40 h-40 bg-white border-[4px] border-neutral-black rounded-[8px] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                                    {artist.displayPhotoUrl ? (
                                        <img src={artist.displayPhotoUrl} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-primary font-display text-[64px] font-black italic">
                                            {(artist.displayName || artist.name).charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <div className="mb-4">
                                    <div className="flex items-center gap-4">
                                        <h1 className="font-display text-[32px] font-black uppercase tracking-tight leading-none">{artist.displayName || artist.name}</h1>
                                        <span className="font-display text-[14px] font-black bg-neutral-black text-white px-3 py-1 rounded-[2px] uppercase">
                                            ID #{String(artist.artistNumber).padStart(3, '0')}
                                        </span>
                                    </div>
                                    <p className="font-display text-[14px] font-bold text-neutral-g4 uppercase mt-2">{artist.email}</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-20 space-y-12">
                            {/* Detailed Info Sections */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="bg-white border-[2px] border-neutral-black p-8 rounded-[6px] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                                    <h3 className="font-display text-[12px] font-black uppercase tracking-[2px] text-primary mb-6 flex items-center gap-2">
                                        <Users className="w-4 h-4" /> Personnel Intel
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="font-display text-[16px] font-bold text-neutral-black leading-relaxed italic">
                                            "{artist.bio || "No cognitive summary provided by subject."}"
                                        </div>
                                        <div className="pt-4 border-t-[1px] border-neutral-g1 grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-[10px] font-black text-neutral-g3 uppercase mb-1">Status</p>
                                                <p className="text-[12px] font-black uppercase">{artist.verificationStatus}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-neutral-g3 uppercase mb-1">Joined</p>
                                                <p className="text-[12px] font-black uppercase">{new Date(artist.createdAt).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white border-[2px] border-neutral-black p-8 rounded-[6px] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                                    <h3 className="font-display text-[12px] font-black uppercase tracking-[2px] text-primary mb-6 flex items-center gap-2">
                                        <ExternalLink className="w-4 h-4" /> Comms Registry
                                    </h3>
                                    <div className="grid grid-cols-1 gap-3">
                                        {[
                                            { label: "Portfolio", icon: ExternalLink, value: artist.portfolioUrl },
                                            { label: "Instagram", icon: ArrowUpRight, value: artist.instagramUrl },
                                            { label: "Twitter / X", icon: ArrowUpRight, value: artist.twitterUrl },
                                            { label: "Behance", icon: ArrowUpRight, value: artist.behanceUrl },
                                            { label: "Dribbble", icon: ArrowUpRight, value: artist.dribbbleUrl },
                                        ].filter(x => x.value).map((link, i) => (
                                            <a key={i} href={link.value || ""} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 bg-neutral-g1 border-[1px] border-neutral-black rounded-[2px] hover:bg-primary transition-all group">
                                                <span className="font-display text-[10px] font-bold uppercase">{link.label}</span>
                                                <link.icon className="w-3 h-3 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                            </a>
                                        ))}
                                        {!artist.portfolioUrl && !artist.instagramUrl && !artist.twitterUrl && (
                                            <p className="text-center font-display text-[11px] font-black uppercase opacity-20 py-4">No social signals detected.</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Portfolio Review - LARGE PICTURES */}
                            <div className="space-y-8">
                                <div className="flex items-center justify-between border-b-[3px] border-neutral-black pb-4">
                                    <h2 className="font-display text-[22px] font-black uppercase tracking-tight flex items-center gap-4">
                                        <ImageIcon className="w-6 h-6 text-primary" /> Visual Assets <span className="text-[14px] opacity-30">({artist.designs.length})</span>
                                    </h2>
                                    <p className="font-display text-[11px] font-black uppercase text-neutral-g4 tracking-[1px]">Inspect meticulously before authorization</p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                    {artist.designs.map((design) => (
                                        <div 
                                            key={design.id} 
                                            onClick={() => setSelectedImage(design.imageUrl)}
                                            className="group bg-white border-[3px] border-neutral-black rounded-[8px] overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all cursor-pointer"
                                        >
                                            <div className="aspect-[4/3] relative overflow-hidden bg-neutral-g1 border-b-[3px] border-neutral-black">
                                                <img src={design.imageUrl} alt={design.title} className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-700" />
                                                <div className="absolute top-4 right-4 bg-neutral-black text-white px-3 py-1 rounded-[2px] font-display text-[10px] font-black uppercase tracking-[1px]">
                                                    {design.status}
                                                </div>
                                            </div>
                                            <div className="p-6 flex items-center justify-between">
                                                <div className="space-y-1">
                                                    <h4 className="font-display text-[16px] font-black uppercase tracking-tighter">{design.title}</h4>
                                                    <p className="font-display text-[10px] font-bold text-neutral-g4 uppercase">Asset Node: {design.id.substring(0,8)}...</p>
                                                </div>
                                                <button className="p-3 border-[2px] border-neutral-black rounded-[4px] hover:bg-neutral-black hover:text-white transition-all">
                                                    <ArrowUpRight className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <aside className="space-y-10">
                        {/* Payout Information - Admin View */}
                        <div className="bg-neutral-black border-[3px] border-neutral-black text-white p-8 rounded-[8px] shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)]">
                            <h3 className="font-display text-[12px] font-black uppercase tracking-[2px] text-primary mb-8 border-b-[1px] border-white/10 pb-4">Financial Protocol</h3>
                            <div className="space-y-6">
                                <div className="bg-white/5 p-5 rounded-[4px] border-[1px] border-white/10">
                                    <p className="text-[10px] font-black text-white/40 uppercase mb-3 text-left">Payout Gateway</p>
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-neutral-black">
                                            <TrendingUp className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="text-[14px] font-black uppercase">25% Revenue Share</p>
                                            <p className="text-[10px] font-bold text-white/40 uppercase">Global Artist Standard</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-center text-left">
                                        <span className="text-[11px] font-black text-white/40 uppercase">Drop Volume</span>
                                        <span className="text-[18px] font-black italic">{artist._count.products} NODES</span>
                                    </div>
                                    <div className="flex justify-between items-center text-left">
                                        <span className="text-[11px] font-black text-white/40 uppercase">Total Assets</span>
                                        <span className="text-[18px] font-black italic">{artist.designs.length} DESIGNS</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Rejection Panel */}
                        {rejecting ? (
                            <div className="bg-white border-[3px] border-danger p-8 rounded-[8px] animate-in slide-in-from-right duration-300">
                                <h3 className="font-display text-[16px] font-black uppercase text-danger mb-6 flex items-center gap-2">
                                    <MessageSquare className="w-5 h-5" /> Denial Justification
                                </h3>
                                <textarea 
                                    className="w-full bg-neutral-g1 border-[2px] border-neutral-black rounded-[4px] p-4 font-display text-[13px] font-black uppercase outline-none focus:bg-white transition-all min-h-[150px] mb-6"
                                    placeholder="Enter reasoning for personnel exclusion..."
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                />
                                <label className="flex items-center gap-3 mb-8 cursor-pointer group">
                                    <input 
                                        type="checkbox" 
                                        checked={canResubmit}
                                        onChange={(e) => setCanResubmit(e.target.checked)}
                                        className="sr-only"
                                    />
                                    <div className={`w-5 h-5 border-[2px] border-neutral-black rounded-[2px] flex items-center justify-center ${canResubmit ? 'bg-primary' : 'bg-white'}`}>
                                        {canResubmit && <CheckCircle className="w-3 h-3 text-neutral-black" />}
                                    </div>
                                    <span className="font-display text-[10px] font-black uppercase text-neutral-g4 group-hover:text-black transition-colors">Allow Resubmission Protocol</span>
                                </label>
                                <div className="flex gap-4">
                                    <button 
                                        onClick={() => setRejecting(false)}
                                        className="flex-1 py-3 border-[2px] border-neutral-black rounded-[4px] font-display text-[11px] font-black uppercase"
                                    >
                                        Abort
                                    </button>
                                    <button 
                                        onClick={handleReject}
                                        disabled={!rejectionReason.trim() || actionLoading}
                                        className="flex-1 py-3 bg-danger border-[2px] border-neutral-black text-white rounded-[4px] font-display text-[11px] font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all disabled:opacity-30"
                                    >
                                        Confirm
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-primary/10 border-[3px] border-primary p-8 rounded-[8px] text-center border-dashed">
                                <Clock className="w-10 h-10 text-primary mx-auto mb-4" />
                                <p className="font-display text-[11px] font-black uppercase tracking-[1px] leading-relaxed">
                                    Personnel under curation audit. <br/>Ensure all quality benchmarks are met before granting authority.
                                </p>
                            </div>
                        )}
                    </aside>
                </div>
            </div>

            {/* Image Detail Lightbox */}
            {selectedImage && (
                <div 
                    className="fixed inset-0 z-[100] bg-neutral-black/95 backdrop-blur-md flex items-center justify-center p-4 sm:p-10 cursor-zoom-out"
                    onClick={() => setSelectedImage(null)}
                >
                    <div className="relative w-full h-full flex items-center justify-center animate-in zoom-in duration-300">
                        <img 
                            src={selectedImage} 
                            alt="Full Size Asset" 
                            className="max-w-full max-h-full object-contain shadow-[20px_20px_0px_0px_rgba(255,222,0,0.2)] border-[4px] border-white" 
                        />
                        <button 
                            onClick={(e) => { e.stopPropagation(); setSelectedImage(null); }}
                            className="absolute top-0 right-0 p-4 text-white hover:text-primary transition-colors"
                        >
                            <XCircle className="w-10 h-10" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
