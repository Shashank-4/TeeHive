import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";
import {
    Clock,
    CheckCircle,
    XCircle,
    ArrowRight,
    RefreshCw,
    Loader2,
    Sparkles,
} from "lucide-react";

export default function ArtistVerificationStatus() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [status, setStatus] = useState<string>(user?.verificationStatus || "UNVERIFIED");
    const [rejectionNote, setRejectionNote] = useState<string>("");
    const [canResubmit, setCanResubmit] = useState<boolean>(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const response = await api.get("/api/artist/profile");
                const profile = response.data.data.profile;
                setStatus(profile.verificationStatus);
                setRejectionNote(profile.verificationNote || "");
                setCanResubmit(profile.canResubmitVerification || false);
            } catch (err) {
                console.error("Failed to fetch status:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchStatus();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 text-yellow-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="w-full min-h-[85vh] bg-neutral-g1 flex flex-col items-center justify-center px-4 py-12">
            <div className="max-w-[500px] w-full bg-white border-[2px] border-neutral-black rounded-[6px] shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] p-8 sm:p-12 text-center overflow-hidden relative">
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full -mr-12 -mt-12 blur-2xl" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/10 rounded-full -ml-12 -mb-12 blur-2xl" />

                {status === "PENDING_VERIFICATION" && (
                    <div className="space-y-8 animate-in fade-in zoom-in duration-500">
                        <div className="w-24 h-24 bg-primary border-[2px] border-neutral-black rounded-full flex items-center justify-center mx-auto shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                            <Clock className="w-12 h-12 text-neutral-black" />
                        </div>
                        <div className="space-y-3">
                            <div className="inline-block px-3 py-1 bg-neutral-black text-primary font-display text-[10px] font-black uppercase tracking-[2px] rounded-[2px] mb-2">
                                Status: Under Review
                            </div>
                            <h1 className="font-display text-[32px] font-black text-neutral-black leading-tight uppercase">
                                Curators Are <span className="italic">Reviewing</span>
                            </h1>
                            <p className="font-body text-[14px] font-bold text-neutral-g4 leading-relaxed">
                                We're checking out your portfolio. This usually takes <span className="text-neutral-black font-black">12–24 hours</span>. We'll hit you up as soon as it's live!
                            </p>
                        </div>
                        <div className="p-4 bg-neutral-g1 border-[2px] border-neutral-black rounded-[4px] border-dashed">
                            <p className="font-display text-[11px] font-black text-neutral-g4 uppercase tracking-wider">
                                Current Queue: <span className="text-neutral-black">Low</span>
                            </p>
                        </div>
                        <button
                            onClick={() => window.location.reload()}
                            className="inline-flex items-center gap-2 font-display text-[12px] font-black text-neutral-g3 hover:text-neutral-black uppercase tracking-[2px] transition-all group"
                        >
                            <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                            Force Refresh
                        </button>
                    </div>
                )}

                {status === "VERIFIED" && (
                    <div className="space-y-8 animate-in fade-in zoom-in duration-500">
                        <div className="w-24 h-24 bg-success border-[2px] border-neutral-black rounded-full flex items-center justify-center mx-auto shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                            <CheckCircle className="w-12 h-12 text-white" />
                        </div>
                        <div className="space-y-3">
                            <div className="inline-block px-4 py-1 bg-success text-white font-display text-[10px] font-black uppercase tracking-[2px] rounded-[2px] mb-2">
                                Artist Authenticated
                            </div>
                            <h1 className="font-display text-[32px] font-black text-neutral-black leading-tight uppercase">
                                You're <span className="text-success italic">Official!</span>
                            </h1>
                            <p className="font-body text-[14px] font-bold text-neutral-g4 leading-relaxed px-4">
                                Welcome to the Hive. Your profile is verified and your storefront is live. Time to start making some noise.
                            </p>
                        </div>
                        <button
                            onClick={() => navigate("/artist/dashboard")}
                            className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-primary text-neutral-black border-[2px] border-neutral-black rounded-[4px] font-display text-[16px] font-black uppercase shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all group"
                        >
                            Go to Dashboard
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                )}

                {status === "REJECTED" && (
                    <div className="space-y-8 animate-in fade-in zoom-in duration-500">
                        <div className="w-24 h-24 bg-danger border-[2px] border-neutral-black rounded-full flex items-center justify-center mx-auto shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                            <XCircle className="w-12 h-12 text-white" />
                        </div>
                        <div className="space-y-3">
                            <div className="inline-block px-3 py-1 bg-danger text-white font-display text-[10px] font-black uppercase tracking-[2px] rounded-[2px] mb-2">
                                Revision Required
                            </div>
                            <h1 className="font-display text-[32px] font-black text-neutral-black leading-tight uppercase">
                                Not <span className="text-danger italic">Quite</span> Yet
                            </h1>
                            <p className="font-body text-[14px] font-bold text-neutral-g4 leading-relaxed">
                                Curators needed a few changes before we can verify you. Don't sweat it, just update and re-submit!
                            </p>
                        </div>
                        {rejectionNote && (
                            <div className="bg-danger/5 border-[2px] border-danger rounded-[4px] p-4 text-left">
                                <p className="font-display text-[11px] font-black text-danger uppercase tracking-[1px] mb-1">Feedback:</p>
                                <p className="font-body text-[13px] font-bold text-neutral-black leading-relaxed">{rejectionNote}</p>
                            </div>
                        )}
                        {canResubmit ? (
                            <button
                                onClick={() => navigate("/artist/setup-profile")}
                                className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-neutral-black text-white border-[2px] border-neutral-black rounded-[4px] font-display text-[15px] font-black uppercase shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
                            >
                                Fix & Re-submit
                                <ArrowRight className="w-5 h-5" />
                            </button>
                        ) : (
                            <div className="bg-neutral-g1 p-4 rounded-[4px] border-[2px] border-neutral-black border-dashed">
                                <p className="font-display text-[11px] font-black text-neutral-g3 uppercase leading-relaxed">
                                    Resubmission disabled. Please contact support at <span className="text-neutral-black underline">ops@teehive.com</span>
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {status === "UNVERIFIED" && (
                    <div className="space-y-8 animate-in fade-in zoom-in duration-500">
                        <div className="w-24 h-24 bg-neutral-g1 border-[2px] border-neutral-black rounded-full flex items-center justify-center mx-auto shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                            <Sparkles className="w-12 h-12 text-neutral-g3" />
                        </div>
                        <div className="space-y-3">
                            <div className="inline-block px-3 py-1 bg-neutral-black text-white font-display text-[10px] font-black uppercase tracking-[2px] rounded-[2px] mb-2">
                                Action Needed
                            </div>
                            <h1 className="font-display text-[32px] font-black text-neutral-black leading-tight uppercase">
                                Setup <span className="italic">Required</span>
                            </h1>
                            <p className="font-body text-[14px] font-bold text-neutral-g4 leading-relaxed">
                                Your artist journey starts here. Complete your store profile and upload your first 3 designs.
                            </p>
                        </div>
                        <button
                            onClick={() => navigate("/artist/setup-profile")}
                            className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-primary text-neutral-black border-[2px] border-neutral-black rounded-[4px] font-display text-[16px] font-black uppercase shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all group"
                        >
                            Setup Profile
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
