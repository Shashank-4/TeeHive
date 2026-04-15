import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
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
    CreditCard,
    Smartphone,
    AlertCircle,
    ShieldCheck,
    Receipt,
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

interface PayoutReview {
    id: string;
    action: string;
    note?: string | null;
    createdAt: string;
    reviewerAdmin?: {
        id: string;
        name: string;
        email: string;
    } | null;
}

interface PayoutMethod {
    id: string;
    methodType: "UPI" | "BANK_ACCOUNT";
    verificationStatus: string;
    isDefault: boolean;
    isActive: boolean;
    submittedAt?: string | null;
    verifiedAt?: string | null;
    rejectedAt?: string | null;
    createdAt?: string;
    updatedAt?: string;
    upiIdMasked?: string;
    upiName?: string;
    bankAccountName?: string;
    bankAccountNumberMasked?: string;
    bankAccountNumberLast4?: string;
    bankIfsc?: string;
    bankName?: string;
    verificationNotes?: string | null;
    rejectionReason?: string | null;
    providerContactId?: string | null;
    providerFundAccountId?: string | null;
    providerValidation?: {
        validationId?: string | null;
        validationStatus?: string | null;
        validationMode?: string | null;
        validationReference?: string | null;
        registeredName?: string | null;
        nameMatchScore?: number | null;
        reason?: string | null;
        validatedAt?: string | null;
        utr?: string | null;
    };
    reviews?: PayoutReview[];
}

interface AdminArtistSettlement {
    id: string;
    amount: number;
    currency: string;
    status: string;
    periodStart: string;
    periodEnd: string;
    bankReference: string | null;
    processedAt: string | null;
    createdAt: string;
    method: string;
    notes: string | null;
}

function formatPeriodLabel(start: string) {
    try {
        return new Date(start).toLocaleDateString("en-IN", { month: "short", year: "numeric" });
    } catch {
        return start.slice(0, 10);
    }
}

function settlementStatusClass(status: string) {
    const s = status?.toUpperCase();
    if (s === "PAID") return "bg-success/15 text-success border-success/40";
    if (s === "PENDING" || s === "APPROVED" || s === "PROCESSING") return "bg-primary/15 text-neutral-black border-primary/50";
    if (s === "FAILED" || s === "CANCELLED") return "bg-danger/10 text-danger border-danger/30";
    return "bg-neutral-g1 text-neutral-g4 border-neutral-black/20";
}

function formatTs(iso: string | null | undefined) {
    if (!iso) return "—";
    try {
        return new Date(iso).toLocaleString("en-IN", {
            dateStyle: "medium",
            timeStyle: "short",
        });
    } catch {
        return iso;
    }
}

/** Treat only explicit false-y values as inactive (handles odd JSON / older payloads). */
function isPayoutRowActive(m: Pick<PayoutMethod, "isActive">): boolean {
    const v = m.isActive as unknown;
    if (v === false || v === "false" || v === 0 || v === "0") return false;
    return true;
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
    const [payoutMethods, setPayoutMethods] = useState<PayoutMethod[]>([]);
    const [payoutLoading, setPayoutLoading] = useState(false);
    const [payoutError, setPayoutError] = useState<string | null>(null);
    const [settlements, setSettlements] = useState<AdminArtistSettlement[]>([]);
    const [settlementsLoading, setSettlementsLoading] = useState(false);

    const fetchSettlements = useCallback(async () => {
        if (!id) return;
        setSettlementsLoading(true);
        try {
            const res = await api.get(`/api/admin/artists/${id}/settlements`);
            setSettlements(res.data.data?.settlements || []);
        } catch {
            setSettlements([]);
        } finally {
            setSettlementsLoading(false);
        }
    }, [id]);

    const fetchPayoutMethods = useCallback(async () => {
        if (!id) return;
        setPayoutLoading(true);
        setPayoutError(null);
        try {
            const res = await api.get(`/api/admin/artists/${id}/payout-methods`);
            const raw = (res.data.data?.methods || []) as PayoutMethod[];
            setPayoutMethods(
                raw.map((m) => ({
                    ...m,
                    isActive: isPayoutRowActive(m),
                }))
            );
        } catch (err: any) {
            setPayoutError(err.response?.data?.message || "Failed to load payout methods.");
        } finally {
            setPayoutLoading(false);
        }
    }, [id]);

    useEffect(() => {
        if (id) {
            fetchArtist();
            fetchPayoutMethods();
            fetchSettlements();
        }
    }, [id, fetchPayoutMethods, fetchSettlements]);

    useEffect(() => {
        const onVis = () => {
            if (document.visibilityState === "visible" && id) {
                fetchPayoutMethods();
                fetchSettlements();
            }
        };
        document.addEventListener("visibilitychange", onVis);
        return () => document.removeEventListener("visibilitychange", onVis);
    }, [id, fetchPayoutMethods, fetchSettlements]);

    const sortedPayoutMethods = useMemo(() => {
        const list = [...payoutMethods];
        const tier = (m: PayoutMethod) => (isPayoutRowActive(m) ? 0 : 1);
        const typeOrder = (t: string) => (t === "UPI" ? 0 : 1);
        list.sort((a, b) => {
            if (tier(a) !== tier(b)) return tier(a) - tier(b);
            if (typeOrder(a.methodType) !== typeOrder(b.methodType)) return typeOrder(a.methodType) - typeOrder(b.methodType);
            if (a.isDefault !== b.isDefault) return a.isDefault ? -1 : 1;
            const tb = new Date(b.updatedAt || b.createdAt || 0).getTime();
            const ta = new Date(a.updatedAt || a.createdAt || 0).getTime();
            return tb - ta;
        });
        return list;
    }, [payoutMethods]);

    const activeMethodCount = useMemo(
        () => sortedPayoutMethods.filter(isPayoutRowActive).length,
        [sortedPayoutMethods]
    );

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
            await fetchArtist();
            await fetchPayoutMethods();
            await fetchSettlements();
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
            await fetchArtist();
            await fetchPayoutMethods();
            await fetchSettlements();
        } catch (err) {
            console.error("Failed to reject:", err);
        } finally {
            setActionLoading(false);
        }
    };

    const payoutStatusClass = (status: string) => {
        if (status === "VERIFIED") return "bg-success/10 text-success border-success/30";
        if (status === "PENDING_PROVIDER") return "bg-blue-500/10 text-blue-500 border-blue-500/30";
        if (status === "PENDING_REVIEW") return "bg-primary/10 text-neutral-black border-primary/40";
        if (status === "REQUIRES_RESUBMISSION") return "bg-amber-500/10 text-amber-600 border-amber-500/30";
        if (status === "REJECTED") return "bg-danger/10 text-danger border-danger/30";
        if (status === "DISABLED" || status === "DRAFT") return "bg-neutral-g1 text-neutral-g4 border-neutral-black/20";
        return "bg-neutral-g1 text-neutral-black border-neutral-black/20";
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
                                        <span className="text-[11px] font-black text-white/40 uppercase">Royalty Cycle</span>
                                        <span className="text-[12px] font-black uppercase">10TH OF MONTH</span>
                                    </div>
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

                        <div className="bg-white border-[3px] border-neutral-black p-8 rounded-[8px] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                            <h3 className="font-display text-[12px] font-black uppercase tracking-[2px] text-primary mb-2 border-b-[1px] border-neutral-black/10 pb-4 flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4" /> Payout Methods
                            </h3>
                            <p className="font-body text-[11px] text-neutral-g4 mb-4 leading-relaxed">
                                All payout methods on file for this artist (active and inactive).
                                Sensitive details are masked — full details are only accessible via the server-side payout script.
                            </p>
                            {!payoutLoading && !payoutError && payoutMethods.length > 0 && (
                                <div className="mb-6 rounded-[4px] border border-neutral-black/15 bg-neutral-g1/50 p-4 font-body text-[11px] text-neutral-black">
                                    <span className="font-display text-[9px] font-black uppercase tracking-wider text-neutral-g3">
                                        Summary
                                    </span>
                                    <p className="mt-1 text-[11px] text-neutral-g4">
                                        {activeMethodCount} active method{activeMethodCount !== 1 ? "s" : ""} ·{" "}
                                        {payoutMethods.length} total on file
                                    </p>
                                </div>
                            )}
                            {payoutLoading ? (
                                <div className="flex items-center gap-3 font-display text-[11px] font-black uppercase text-neutral-g4">
                                    <Loader2 className="w-4 h-4 animate-spin" /> Loading payout registry...
                                </div>
                            ) : payoutError ? (
                                <div className="border-[2px] border-danger bg-danger/5 text-danger p-4 rounded-[4px] font-display text-[10px] font-black uppercase tracking-[1px] flex items-center gap-3">
                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                    <span>{payoutError}</span>
                                </div>
                            ) : payoutMethods.length === 0 ? (
                                <div className="border-[2px] border-dashed border-neutral-g2 p-5 rounded-[4px] font-display text-[10px] font-black uppercase text-neutral-g4">
                                    No payout method on file for this artist.
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {sortedPayoutMethods.map((method) => (
                                        <div
                                            key={method.id}
                                            className={`rounded-[6px] border-[2px] border-neutral-black p-5 ${
                                                isPayoutRowActive(method) ? "bg-neutral-g1/40" : "bg-neutral-g1/80 opacity-90"
                                            }`}
                                        >
                                            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-neutral-black/10 pb-4">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[4px] border-[2px] border-neutral-black bg-white">
                                                        {method.methodType === "UPI" ? (
                                                            <Smartphone className="h-5 w-5 text-primary" />
                                                        ) : (
                                                            <CreditCard className="h-5 w-5 text-primary" />
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="font-display text-[13px] font-black uppercase">
                                                            {method.methodType === "UPI" ? "UPI" : "Bank transfer"}
                                                            {method.isDefault ? " · Default" : ""}
                                                            {!isPayoutRowActive(method) ? (
                                                                <span className="ml-2 text-danger">· Inactive</span>
                                                            ) : null}
                                                        </div>
                                                        <div className="mt-0.5 font-mono text-[10px] font-medium uppercase tracking-wide text-neutral-g4 break-all">
                                                            ID {method.id}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div
                                                    className={`inline-flex shrink-0 items-center rounded-[4px] border px-3 py-1.5 font-display text-[9px] font-black uppercase tracking-[1px] ${payoutStatusClass(method.verificationStatus)}`}
                                                >
                                                    {method.verificationStatus.replaceAll("_", " ")}
                                                </div>
                                            </div>

                                            <dl className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-2">
                                                {method.methodType === "UPI" ? (
                                                    <>
                                                        <div className="sm:col-span-2">
                                                            <dt className="font-display text-[9px] font-black uppercase tracking-wider text-neutral-g3">
                                                                UPI ID (masked)
                                                            </dt>
                                                            <dd className="mt-0.5 break-all font-mono text-[13px] font-semibold text-neutral-black">
                                                                {method.upiIdMasked || "—"}
                                                            </dd>
                                                        </div>
                                                        <div className="sm:col-span-2">
                                                            <dt className="font-display text-[9px] font-black uppercase tracking-wider text-neutral-g3">
                                                                Name on UPI
                                                            </dt>
                                                            <dd className="mt-0.5 font-body text-[13px] text-neutral-black">
                                                                {method.upiName?.trim() || "—"}
                                                            </dd>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <>
                                                        <div className="sm:col-span-2">
                                                            <dt className="font-display text-[9px] font-black uppercase tracking-wider text-neutral-g3">
                                                                Account holder
                                                            </dt>
                                                            <dd className="mt-0.5 font-body text-[13px] text-neutral-black">
                                                                {method.bankAccountName?.trim() || "—"}
                                                            </dd>
                                                        </div>
                                                        <div className="sm:col-span-2">
                                                            <dt className="font-display text-[9px] font-black uppercase tracking-wider text-neutral-g3">
                                                                Account number (masked)
                                                            </dt>
                                                            <dd className="mt-0.5 break-all font-mono text-[13px] font-semibold tracking-wide text-neutral-black">
                                                                {method.bankAccountNumberMasked || "—"}
                                                            </dd>
                                                        </div>
                                                        <div>
                                                            <dt className="font-display text-[9px] font-black uppercase tracking-wider text-neutral-g3">
                                                                IFSC
                                                            </dt>
                                                            <dd className="mt-0.5 font-mono text-[13px] font-semibold text-neutral-black">
                                                                {method.bankIfsc?.trim() || "—"}
                                                            </dd>
                                                        </div>
                                                        <div>
                                                            <dt className="font-display text-[9px] font-black uppercase tracking-wider text-neutral-g3">
                                                                Bank name
                                                            </dt>
                                                            <dd className="mt-0.5 font-body text-[13px] text-neutral-black">
                                                                {method.bankName?.trim() || "—"}
                                                            </dd>
                                                        </div>
                                                    </>
                                                )}
                                                <div>
                                                    <dt className="font-display text-[9px] font-black uppercase tracking-wider text-neutral-g3">
                                                        Submitted
                                                    </dt>
                                                    <dd className="mt-0.5 font-body text-[12px] text-neutral-black">
                                                        {formatTs(method.submittedAt)}
                                                    </dd>
                                                </div>
                                                <div>
                                                    <dt className="font-display text-[9px] font-black uppercase tracking-wider text-neutral-g3">
                                                        Verified
                                                    </dt>
                                                    <dd className="mt-0.5 font-body text-[12px] text-neutral-black">
                                                        {formatTs(method.verifiedAt)}
                                                    </dd>
                                                </div>
                                                <div>
                                                    <dt className="font-display text-[9px] font-black uppercase tracking-wider text-neutral-g3">
                                                        Created / updated
                                                    </dt>
                                                    <dd className="mt-0.5 font-body text-[11px] leading-snug text-neutral-black">
                                                        {formatTs(method.createdAt)}
                                                        <span className="text-neutral-g3"> → </span>
                                                        {formatTs(method.updatedAt)}
                                                    </dd>
                                                </div>
                                                {method.rejectedAt ? (
                                                    <div>
                                                        <dt className="font-display text-[9px] font-black uppercase tracking-wider text-neutral-g3">
                                                            Rejected at
                                                        </dt>
                                                        <dd className="mt-0.5 font-body text-[12px] text-danger">
                                                            {formatTs(method.rejectedAt)}
                                                        </dd>
                                                    </div>
                                                ) : null}
                                            </dl>

                                            {(method.providerContactId || method.providerFundAccountId) && (
                                                <div className="mt-4 rounded-[4px] border border-neutral-black/10 bg-white p-3 font-mono text-[10px] leading-relaxed text-neutral-g4 break-all">
                                                    {method.providerContactId ? (
                                                        <div>
                                                            <span className="font-display font-black uppercase text-neutral-g3">
                                                                Razorpay contact{" "}
                                                            </span>
                                                            {method.providerContactId}
                                                        </div>
                                                    ) : null}
                                                    {method.providerFundAccountId ? (
                                                        <div className="mt-1">
                                                            <span className="font-display font-black uppercase text-neutral-g3">
                                                                Fund account{" "}
                                                            </span>
                                                            {method.providerFundAccountId}
                                                        </div>
                                                    ) : null}
                                                </div>
                                            )}

                                            <div className="mt-4 space-y-2 border-t border-neutral-black/10 pt-4 font-display text-[10px] font-bold uppercase text-neutral-g4">
                                                {method.providerValidation?.validationMode ? (
                                                    <div>
                                                        Provider mode:{" "}
                                                        <span className="text-neutral-black">
                                                            {method.providerValidation.validationMode.replaceAll("_", " ")}
                                                        </span>
                                                    </div>
                                                ) : null}
                                                {method.providerValidation?.validationStatus ? (
                                                    <div>
                                                        Provider status:{" "}
                                                        <span className="text-neutral-black">
                                                            {method.providerValidation.validationStatus}
                                                        </span>
                                                    </div>
                                                ) : null}
                                                {method.providerValidation?.registeredName ? (
                                                    <div className="normal-case">
                                                        Registered name: {method.providerValidation.registeredName}
                                                    </div>
                                                ) : null}
                                                {(method.providerValidation?.reason ||
                                                    method.verificationNotes ||
                                                    method.rejectionReason) && (
                                                    <div className="whitespace-pre-wrap border-l-2 border-primary/60 pl-3 normal-case text-[12px] font-semibold leading-relaxed text-neutral-black">
                                                        {method.providerValidation?.reason ||
                                                            method.verificationNotes ||
                                                            method.rejectionReason}
                                                    </div>
                                                )}
                                            </div>

                                            {method.reviews?.length ? (
                                                <div className="mt-4 border-t border-neutral-black/10 pt-4">
                                                    <p className="mb-3 font-display text-[9px] font-black uppercase text-neutral-g3">
                                                        Review / audit history ({method.reviews.length})
                                                    </p>
                                                    <ul className="space-y-3">
                                                        {method.reviews.map((review) => (
                                                            <li
                                                                key={review.id}
                                                                className="rounded-[4px] border border-neutral-black/10 bg-white/80 p-3 font-body text-[11px] leading-snug text-neutral-black"
                                                            >
                                                                <span className="font-display text-[10px] font-black uppercase text-primary">
                                                                    {review.action.replaceAll("_", " ")}
                                                                </span>
                                                                <span className="text-neutral-g3"> · </span>
                                                                {formatTs(review.createdAt)}
                                                                {review.reviewerAdmin ? (
                                                                    <>
                                                                        <span className="text-neutral-g3"> · </span>
                                                                        Admin: {review.reviewerAdmin.name} (
                                                                        {review.reviewerAdmin.email})
                                                                    </>
                                                                ) : null}
                                                                {review.note ? (
                                                                    <p className="mt-1.5 whitespace-pre-wrap border-l-2 border-neutral-g2 pl-2 text-[11px] font-medium normal-case">
                                                                        {review.note}
                                                                    </p>
                                                                ) : null}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            ) : null}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="bg-white border-[3px] border-neutral-black p-8 rounded-[8px] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                            <div className="flex flex-wrap items-start justify-between gap-3 border-b-[1px] border-neutral-black/10 pb-4 mb-4">
                                <h3 className="font-display text-[12px] font-black uppercase tracking-[2px] text-primary flex items-center gap-2">
                                    <Receipt className="w-4 h-4" /> Settlement history
                                </h3>
                                <Link
                                    to="/admin/settlements"
                                    className="font-display text-[9px] font-black uppercase text-primary hover:underline"
                                >
                                    All settlements →
                                </Link>
                            </div>
                            <p className="font-body text-[11px] text-neutral-g4 mb-4 leading-relaxed">
                                Read-only rows from royalty runs (script-generated). Status and bank reference update when finance marks the batch paid.
                            </p>
                            {settlementsLoading ? (
                                <div className="flex items-center gap-3 font-display text-[11px] font-black uppercase text-neutral-g4 py-6">
                                    <Loader2 className="w-4 h-4 animate-spin" /> Loading settlements…
                                </div>
                            ) : settlements.length === 0 ? (
                                <div className="border-[2px] border-dashed border-neutral-g2 p-5 rounded-[4px] font-display text-[10px] font-black uppercase text-neutral-g4">
                                    No settlement records for this artist yet.
                                </div>
                            ) : (
                                <div className="overflow-x-auto -mx-2">
                                    <table className="w-full text-left border-collapse text-[11px]">
                                        <thead>
                                            <tr className="border-b-[2px] border-neutral-black bg-neutral-g1/50">
                                                {["Period", "Amount", "Method", "Status", "Reference", "Notes", "Created"].map((h) => (
                                                    <th key={h} className="font-display text-[9px] font-black uppercase tracking-wider text-neutral-g4 py-3 px-2 whitespace-nowrap">
                                                        {h}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {settlements.map((s) => (
                                                <tr key={s.id} className="border-b border-neutral-black/10">
                                                    <td className="py-3 px-2 font-display font-bold uppercase whitespace-nowrap">
                                                        {formatPeriodLabel(s.periodStart)}
                                                    </td>
                                                    <td className="py-3 px-2 font-display font-black whitespace-nowrap">
                                                        ₹{s.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                                    </td>
                                                    <td className="py-3 px-2 font-display text-[10px] font-bold text-neutral-g3 uppercase max-w-[120px] break-words">
                                                        {s.method}
                                                    </td>
                                                    <td className="py-3 px-2">
                                                        <span
                                                            className={`inline-block rounded-[3px] border px-2 py-0.5 font-display text-[8px] font-black uppercase ${settlementStatusClass(s.status)}`}
                                                        >
                                                            {s.status}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-2 font-mono text-[10px] break-all max-w-[100px]">
                                                        {s.bankReference || "—"}
                                                    </td>
                                                    <td className="py-3 px-2 font-body text-[10px] text-neutral-g4 max-w-[160px] break-words">
                                                        {s.notes || "—"}
                                                    </td>
                                                    <td className="py-3 px-2 font-body text-[10px] text-neutral-g4 whitespace-nowrap">
                                                        {formatTs(s.createdAt)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
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
