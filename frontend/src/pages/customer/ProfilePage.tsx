import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    User,
    Mail,
    Package,
    Edit3,
    Save,
    X,
    Crown,
    ChevronRight,
    Zap,
    Shield,
    Activity,
} from "lucide-react";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import Loader from "../../components/shared/Loader";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";

export default function ProfilePage() {
    const { user, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        name: user?.name || "",
        email: user?.email || "",
    });
    const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

    useEffect(() => {
        if (!isAuthenticated) navigate("/login");
    }, [isAuthenticated, navigate]);

    useEffect(() => {
        if (user) {
            setFormData({ name: user.name, email: user.email });
        }
    }, [user]);

    const handleSave = async () => {
        try {
            setIsSaving(true);
            await api.put("/api/users/profile", formData);
            setMessage({ text: "PROFILE_NODE_SYNCHRONIZED", type: "success" });
            setIsEditing(false);
            setTimeout(() => window.location.reload(), 1000);
        } catch (err: any) {
            setMessage({
                text: err.response?.data?.error || "FAILED_TO_UPDATE_PROTOCOL",
                type: "error",
            });
        } finally {
            setIsSaving(false);
        }
    };

    if (!user) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <Loader />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-g1 py-20 px-4 md:px-16 relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 text-[300px] font-display font-black text-neutral-black/[0.02] select-none leading-none -z-0 pointer-events-none uppercase">USER</div>

            <div className="max-w-5xl mx-auto relative z-10">
                {/* ── HEADER ── */}
                <div className="flex flex-col md:flex-row items-end justify-between gap-8 mb-12 border-b-[3px] border-neutral-black pb-10">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 bg-neutral-black text-primary px-3 py-1 rounded-[4px] font-display text-[10px] font-black uppercase tracking-[2px]">
                            <Activity className="w-3.5 h-3.5" /> USER_TERMINAL_V4
                        </div>
                        <h1 className="font-display text-[48px] md:text-[64px] font-black text-neutral-black leading-none tracking-tight uppercase italic">
                            My <span className="text-primary not-italic">Profile</span>
                        </h1>
                        <p className="font-display text-[14px] font-bold text-neutral-black/40 uppercase tracking-[2px]">
                            Manage your personal node configuration and protocol settings.
                        </p>
                    </div>

                    {user.isArtist && (
                        <Link to="/artist/dashboard" className="no-underline group">
                            <Button variant="dark" className="group-hover:translate-x-1 transition-transform">
                                <Crown className="w-4 h-4 text-primary" /> ARTIST_DASHBOARD
                            </Button>
                        </Link>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-10">
                    {/* ── MAIN CONFIG CARD ── */}
                    <div className="bg-white border-[3px] border-neutral-black rounded-[4px] shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                        {/* Avatar / Identity Banner */}
                        <div className="bg-neutral-black p-10 border-b-[3px] border-neutral-black flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[80px] rounded-full" />

                            <div className="relative group">
                                <div className="w-32 h-32 rounded-[6px] border-[3px] border-primary bg-white flex items-center justify-center overflow-hidden rotate-[-3deg] group-hover:rotate-0 transition-all duration-500 shadow-[6px_6px_0px_0px_rgba(255,222,0,0.3)]">
                                    {user.displayPhotoUrl ? (
                                        <img src={user.displayPhotoUrl} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-5xl font-display font-black text-neutral-black italic drop-shadow-[2px_2px_0px_rgba(240,221,38,1)]">
                                            {user.name.charAt(0).toUpperCase()}
                                        </span>
                                    )}
                                </div>
                                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-success border-[2.5px] border-neutral-black rounded-full" title="Node Online" />
                            </div>

                            <div className="text-center md:text-left space-y-2">
                                <div className="font-display text-[32px] font-black text-white uppercase tracking-tight leading-none group-hover:italic transition-all">
                                    {user.displayName || user.name}
                                </div>
                                <div className="font-display text-[12px] font-black text-white/40 uppercase tracking-[2px]">{user.email}</div>
                                <div className="flex gap-3 justify-center md:justify-start pt-3">
                                    <div className="bg-primary text-neutral-black px-3 py-1 rounded-[2px] font-display text-[9px] font-black uppercase tracking-[2px] border border-neutral-black">CUSTOMER_NODE</div>
                                    {user.isArtist && (
                                        <div className="bg-white/10 text-primary px-3 py-1 rounded-[2px] font-display text-[9px] font-black uppercase tracking-[2px] border border-primary/20">VERIFIED_CREATOR</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Node Form */}
                        <div className="p-10 lg:p-14">
                            {message && (
                                <div className={`mb-10 p-5 rounded-[4px] border-[2.5px] font-display text-[12px] font-black uppercase tracking-[2px] flex items-center gap-4 ${message.type === "success" ? "bg-success/10 border-success text-success" : "bg-danger/10 border-danger text-danger"}`}>
                                    <div className={`w-3 h-3 rounded-full animate-pulse ${message.type === "success" ? "bg-success" : "bg-danger"}`} />
                                    {message.text}
                                </div>
                            )}

                            <div className="space-y-8 max-w-xl">
                                <div className="group">
                                    <Input
                                        label="PROTOCOL_IDENTIFIER (NAME)"
                                        icon={<User className="w-4 h-4" />}
                                        value={formData.name}
                                        disabled={!isEditing}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className={!isEditing ? "bg-neutral-g1 border-dashed opacity-70" : ""}
                                    />
                                </div>

                                <div className="group">
                                    <Input
                                        label="UPLINK_CHANNEL (EMAIL)"
                                        icon={<Mail className="w-4 h-4" />}
                                        value={formData.email}
                                        disabled={!isEditing}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className={!isEditing ? "bg-neutral-g1 border-dashed opacity-70" : ""}
                                    />
                                </div>
                            </div>

                            <div className="mt-14 flex flex-wrap gap-5 border-t-[2.5px] border-neutral-g2 pt-10">
                                {isEditing ? (
                                    <>
                                        <Button
                                            variant="outline"
                                            onClick={() => {
                                                setIsEditing(false);
                                                setFormData({ name: user.name, email: user.email });
                                            }}
                                            className="flex-1 md:flex-none"
                                        >
                                            <X className="w-4 h-4" /> ABORT_CHANGES
                                        </Button>
                                        <Button
                                            isLoading={isSaving}
                                            onClick={handleSave}
                                            className="flex-1 md:flex-none"
                                        >
                                            <Save className="w-4 h-4" /> COMMIT_SYNCHRONIZATION
                                        </Button>
                                    </>
                                ) : (
                                    <Button
                                        onClick={() => setIsEditing(true)}
                                        className="w-full md:w-auto"
                                    >
                                        <Edit3 className="w-4 h-4" /> RECONFIGURE_NODE
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ── SIDEBAR LINKS ── */}
                    <div className="space-y-6">
                        <Link
                            to="/orders"
                            className="bg-white border-[3px] border-neutral-black p-8 rounded-[4px] flex items-center justify-between no-underline group hover:bg-neutral-black transition-all shadow-[6px_6px_0px_0px_rgba(255,222,0,1)] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px]"
                        >
                            <div className="flex items-center gap-6">
                                <div className="w-14 h-14 bg-neutral-black text-white p-3.5 flex items-center justify-center rounded-[4px] group-hover:bg-primary group-hover:text-neutral-black transition-colors rotate-[-4deg] group-hover:rotate-0">
                                    <Package className="w-full h-full" />
                                </div>
                                <div className="space-y-1">
                                    <div className="font-display text-[20px] font-black text-neutral-black group-hover:text-white uppercase leading-none italic">Asset_Logs</div>
                                    <div className="font-display text-[10px] font-bold text-neutral-black/30 group-hover:text-primary uppercase tracking-[2px]">Track & manage your orders</div>
                                </div>
                            </div>
                            <ChevronRight className="w-6 h-6 text-neutral-black group-hover:text-primary transition-all group-hover:translate-x-2" />
                        </Link>

                        <div className="bg-primary/5 border-[2.5px] border-neutral-black border-dashed p-8 rounded-[4px] space-y-4">
                            <h3 className="font-display text-[12px] font-black uppercase tracking-[3px] text-neutral-black flex items-center gap-3 italic">
                                <Shield className="w-4 h-4 text-primary" /> SECURITY_OVERSIGHT
                            </h3>
                            <p className="font-display text-[11px] font-bold text-neutral-black/40 uppercase tracking-[1.5px] leading-relaxed">
                                YOUR NODE IDENTITY IS PROTECTED BY RSA-4096 ENCRYPTION. ACCOUNT LOGS ARE AUDITED EVERY 24 HOURS FOR ANOMALIES.
                            </p>
                        </div>

                        <div className="bg-neutral-black border-[3px] border-neutral-black p-8 rounded-[4px] space-y-4 shadow-[6px_6px_0px_0px_rgba(255,222,0,0.2)]">
                            <h3 className="font-display text-[12px] font-black uppercase tracking-[3px] text-primary flex items-center gap-3">
                                <Zap className="w-4 h-4" /> SYSTEM_STATUS
                            </h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between text-[11px] font-display font-black text-white/40 uppercase tracking-[1px]">
                                    <span>CORE_PROTOCOL</span>
                                    <span className="text-success">STABLE_V4</span>
                                </div>
                                <div className="flex items-center justify-between text-[11px] font-display font-black text-white/40 uppercase tracking-[1px]">
                                    <span>DATA_LIFECYCLE</span>
                                    <span className="text-primary">ENCRYPTED</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
