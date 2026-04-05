import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import Toast from "../../components/shared/Toast";
import { useAuth } from "../../context/AuthContext";
import {
    Camera,
    Upload,
    Plus,
    Globe,
    Link2,
    Save,
    AlertCircle,
    CheckCircle,
    Loader2,
    ImageIcon,
    CreditCard,
    Smartphone,
    ArrowLeft,
} from "lucide-react";
import { payoutFormFromMethods } from "../../utils/payoutMethods";
import { allocateSlugFromDisplayName } from "../../utils/artistSlugFromDisplayName";

interface Design {
    id: string;
    title: string;
    imageUrl: string;
    status: string;
}

export default function ArtistEditProfile() {
    const navigate = useNavigate();
    const { user } = useAuth();

    // Profile fields
    const [displayName, setDisplayName] = useState("");
    const [artistSlug, setArtistSlug] = useState("");
    const [displayNameStatus, setDisplayNameStatus] = useState<
        "idle" | "checking" | "ok" | "taken" | "invalid" | "too_long" | "error"
    >("idle");
    const [slugStatus, setSlugStatus] = useState<"idle" | "checking" | "ok" | "bad" | "taken">("idle");
    const confirmedDisplayNameRef = useRef("");
    const profileSnapshotRef = useRef({ displayName: "", artistSlug: "" });
    const [bio, setBio] = useState("");
    const [portfolioUrl, setPortfolioUrl] = useState("");
    const [instagramUrl, setInstagramUrl] = useState("");
    const [twitterUrl, setTwitterUrl] = useState("");
    const [behanceUrl, setBehanceUrl] = useState("");
    const [dribbbleUrl, setDribbbleUrl] = useState("");

    // Payout Details
    const [upiId, setUpiId] = useState("");
    const [upiName, setUpiName] = useState("");
    const [bankAccountName, setBankAccountName] = useState("");
    const [bankAccountNumber, setBankAccountNumber] = useState("");
    const [bankIfsc, setBankIfsc] = useState("");
    const [bankName, setBankName] = useState("");
    const [preferredMethod, setPreferredMethod] = useState<"UPI" | "BANK">("UPI");

    // Photo files
    const [displayPhotoFile, setDisplayPhotoFile] = useState<File | null>(null);
    const [coverPhotoFile, setCoverPhotoFile] = useState<File | null>(null);
    const [displayPhotoPreview, setDisplayPhotoPreview] = useState<string>("");
    const [coverPhotoPreview, setCoverPhotoPreview] = useState<string>("");

    // Designs
    const [designs, setDesigns] = useState<Design[]>([]);
    const [designFile, setDesignFile] = useState<File | null>(null);
    const [designTitle, setDesignTitle] = useState("");
    const [uploadingDesign, setUploadingDesign] = useState(false);

    // State
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchProfile = useCallback(async () => {
        try {
            const [profileResponse, payoutResponse] = await Promise.all([
                api.get("/api/artist/profile"),
                api.get("/api/artist/payout-methods"),
            ]);
            const profile = profileResponse.data.data.profile;
            const dn = (profile.displayName || "").trim();
            const sl = ((profile.artistSlug as string) || "").trim();
            setDisplayName(profile.displayName || "");
            setArtistSlug(sl);
            profileSnapshotRef.current = { displayName: dn, artistSlug: sl };
            confirmedDisplayNameRef.current = dn;
            if (dn.length >= 2 && sl.length >= 2) {
                setDisplayNameStatus("ok");
                setSlugStatus("ok");
            } else {
                setDisplayNameStatus("idle");
                setSlugStatus("idle");
            }
            setBio(profile.bio || "");
            setPortfolioUrl(profile.portfolioUrl || "");
            setInstagramUrl(profile.instagramUrl || "");
            setTwitterUrl(profile.twitterUrl || "");
            setBehanceUrl(profile.behanceUrl || "");
            setDribbbleUrl(profile.dribbbleUrl || "");
            if (profile.displayPhotoUrl) setDisplayPhotoPreview(profile.displayPhotoUrl);
            if (profile.coverPhotoUrl) setCoverPhotoPreview(profile.coverPhotoUrl);
            if (profile.designs) setDesigns(profile.designs);
            const payoutForm = payoutFormFromMethods(payoutResponse.data.data?.methods || []);
            setUpiId(payoutForm.upiId);
            setUpiName(payoutForm.upiName);
            setBankAccountName(payoutForm.bankAccountName);
            setBankAccountNumber(payoutForm.bankAccountNumber);
            setBankIfsc(payoutForm.bankIfsc);
            setBankName(payoutForm.bankName);
            setPreferredMethod(payoutForm.preferredMethod);
        } catch (err) {
            console.error("Failed to fetch profile:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    /** Use value from blur event so validation is not one keystroke behind React state. */
    const validateDisplayNameAndGenerateSlug = useCallback(async (rawFromInput: string) => {
        const name = rawFromInput.trim();
        if (name.length < 2) {
            setDisplayNameStatus("invalid");
            setSlugStatus("idle");
            setArtistSlug("");
            return;
        }
        if (name.length > 80) {
            setDisplayNameStatus("too_long");
            setSlugStatus("idle");
            return;
        }
        if (name === confirmedDisplayNameRef.current && artistSlug.trim().length >= 2) {
            setDisplayNameStatus("ok");
            setSlugStatus("ok");
            return;
        }

        setDisplayNameStatus("checking");
        setSlugStatus("idle");
        try {
            const q = new URLSearchParams({ name });
            if (user?.id) q.set("excludeUserId", user.id);
            const dnRes = await api.get(`/api/artists/check-display-name?${q.toString()}`);
            if (dnRes.data?.data?.available !== true) {
                setDisplayNameStatus("taken");
                setSlugStatus("idle");
                setArtistSlug("");
                return;
            }
            setDisplayNameStatus("ok");
            setSlugStatus("checking");
            const slug = await allocateSlugFromDisplayName(name, api, user?.id);
            if (!slug) {
                setSlugStatus("bad");
                setArtistSlug("");
                return;
            }
            setArtistSlug(slug);
            setSlugStatus("ok");
            confirmedDisplayNameRef.current = name;
        } catch (err) {
            console.error("check-display-name / slug allocation failed:", err);
            setDisplayNameStatus("error");
            setSlugStatus("idle");
            setArtistSlug("");
        }
    }, [artistSlug, user?.id]);

    const handleDisplayPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setDisplayPhotoFile(file);
            setDisplayPhotoPreview(URL.createObjectURL(file));
        }
    };

    const handleCoverPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setCoverPhotoFile(file);
            setCoverPhotoPreview(URL.createObjectURL(file));
        }
    };

    const handleSaveProfile = async () => {
        setSaving(true);
        setError(null);
        const slug = artistSlug.trim().toLowerCase();
        const nameTrim = displayName.trim();
        const nameChanged = nameTrim !== profileSnapshotRef.current.displayName;
        if (nameChanged) {
            if (displayNameStatus !== "ok" || slugStatus !== "ok" || slug.length < 2) {
                setError(
                    "Click outside the display name field to confirm it’s unique and refresh your storefront URL."
                );
                setToast({
                    message: "Confirm your display name (click outside the field) before saving.",
                    type: "error",
                });
                setSaving(false);
                return;
            }
        }
        if (slug.length >= 2 && slugStatus !== "ok") {
            setError("Storefront URL handle is not ready. Confirm your display name first.");
            setToast({ message: "Confirm your display name before saving.", type: "error" });
            setSaving(false);
            return;
        }
        try {
            const formData = new FormData();
            formData.append("displayName", displayName);
            if (slug.length >= 2) formData.append("artistSlug", slug);
            formData.append("bio", bio);
            formData.append("portfolioUrl", portfolioUrl);
            formData.append("instagramUrl", instagramUrl);
            formData.append("twitterUrl", twitterUrl);
            formData.append("behanceUrl", behanceUrl);
            formData.append("dribbbleUrl", dribbbleUrl);
            if (displayPhotoFile) formData.append("displayPhoto", displayPhotoFile);
            if (coverPhotoFile) formData.append("coverPhoto", coverPhotoFile);

            await api.put("/api/artist/profile", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            await api.put("/api/artist/payout-methods", {
                upiId,
                upiName,
                bankAccountName,
                bankAccountNumber,
                bankIfsc,
                bankName,
                preferredMethod,
            });

            setDisplayPhotoFile(null);
            setCoverPhotoFile(null);
            setToast({ message: "Profile updated successfully!", type: "success" });
            const dn = displayName.trim();
            const sl = artistSlug.trim();
            profileSnapshotRef.current = { displayName: dn, artistSlug: sl };
            confirmedDisplayNameRef.current = dn;
            setDisplayNameStatus("ok");
            setSlugStatus(sl.length >= 2 ? "ok" : "idle");
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to save profile");
            setToast({ message: err.response?.data?.message || "Failed to save profile", type: "error" });
        } finally {
            setSaving(false);
        }
    };

    const handleUploadDesign = async () => {
        if (!designFile || !designTitle.trim()) return;
        setUploadingDesign(true);
        setError(null);
        try {
            const formData = new FormData();
            formData.append("file", designFile);
            formData.append("title", designTitle);
            await api.post("/api/designs/upload", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            setDesignFile(null);
            setDesignTitle("");
            setToast({ message: "Design uploaded successfully!", type: "success" });
            await fetchProfile();
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to upload design");
            setToast({ message: err.response?.data?.message || "Failed to upload design", type: "error" });
        } finally {
            setUploadingDesign(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 text-yellow-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen bg-neutral-g1 flex flex-col pt-4">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            <div className="flex-1 px-4 sm:px-8 pb-12 w-full">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
                    <div className="space-y-2">
                        <button
                            onClick={() => navigate("/artist/profile")}
                            className="inline-flex items-center gap-2 text-neutral-g4 hover:text-neutral-black transition-colors font-display text-[11px] font-black uppercase tracking-[1px] mb-3"
                        >
                            <ArrowLeft className="w-4 h-4" /> Back to Profile
                        </button>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={handleSaveProfile}
                            disabled={saving}
                            className="flex items-center gap-2 px-8 py-3 bg-primary border-[2px] border-neutral-black rounded-[4px] font-display text-[13px] font-black uppercase tracking-[1px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all disabled:opacity-50"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            {saving ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </div>

                {/* Alerts */}
                {error && (
                    <div className="mb-8 p-4 bg-neutral-black text-danger border-l-4 border-danger animate-in fade-in slide-in-from-top-4 duration-300">
                        <div className="flex items-center gap-3">
                            <AlertCircle className="w-5 h-5 shrink-0" />
                            <span className="font-display text-[13px] font-black uppercase tracking-wider">{error}</span>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">
                    {/* Left Column – Profile Forms */}
                    <div className="space-y-8">
                        {/* Visual Identity Section */}
                        <div className="bg-white border-[2px] border-neutral-black rounded-[6px] overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                            <div className="bg-neutral-black p-4 flex items-center gap-3 text-white">
                                <ImageIcon className="w-5 h-5 text-primary" />
                                <h2 className="font-display text-[14px] font-black uppercase tracking-[1px]">Visual Identity</h2>
                            </div>

                            <div className="p-6 space-y-8">
                                {/* Cover Photo Editor */}
                                <div className="space-y-3">
                                    <label className="font-display text-[11px] font-black uppercase tracking-[1.5px] text-neutral-g4">Storefront Cover Banner</label>
                                    <div className="relative group overflow-hidden border-[2px] border-neutral-black rounded-[4px] bg-neutral-g1 h-48 sm:h-64 flex items-center justify-center cursor-pointer transition-all hover:bg-neutral-g2">
                                        {coverPhotoPreview ? (
                                            <>
                                                <img src={coverPhotoPreview} alt="Cover" className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-neutral-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <div className="bg-white px-4 py-2 rounded-[2px] border-[2px] border-neutral-black font-display text-[11px] font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                                        Change Banner
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="flex flex-col items-center gap-2 opacity-40 group-hover:opacity-80 transition-opacity">
                                                <ImageIcon className="w-10 h-10" />
                                                <span className="font-display text-[11px] font-black uppercase tracking-[1px]">Upload Storefront Banner</span>
                                            </div>
                                        )}
                                        <input type="file" accept="image/*" onChange={handleCoverPhotoChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                                    </div>
                                </div>

                                <div className="flex flex-col md:flex-row gap-8">
                                    {/* Display Photo */}
                                    <div className="shrink-0 space-y-3">
                                        <label className="font-display text-[11px] font-black uppercase tracking-[1.5px] text-neutral-g4 block">Profile Pic</label>
                                        <div className="relative w-32 h-32 group border-[2px] border-neutral-black rounded-[4px] bg-neutral-g1 flex items-center justify-center cursor-pointer overflow-hidden transition-all hover:bg-neutral-g2">
                                            {displayPhotoPreview ? (
                                                <img src={displayPhotoPreview} alt="Avatar" className="w-full h-full object-cover" />
                                            ) : (
                                                <Camera className="w-8 h-8 opacity-30" />
                                            )}
                                            <div className="absolute inset-0 bg-neutral-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <Camera className="w-6 h-6 text-white" />
                                            </div>
                                            <input type="file" accept="image/*" onChange={handleDisplayPhotoChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                                        </div>
                                    </div>

                                    {/* Display Name & Bio */}
                                    <div className="flex-1 space-y-6">
                                        <div className="space-y-2">
                                            <label className="font-display text-[11px] font-black uppercase tracking-[1.5px] text-neutral-g4">
                                                Public Display Name
                                            </label>
                                            <p className="font-display text-[10px] font-bold text-neutral-g3 uppercase tracking-tight">
                                                Must be unique. Click outside to check and update your URL.
                                            </p>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="text"
                                                    value={displayName}
                                                    onChange={(e) => {
                                                        const v = e.target.value;
                                                        setDisplayName(v);
                                                        if (v.trim() !== confirmedDisplayNameRef.current) {
                                                            setDisplayNameStatus("idle");
                                                            setSlugStatus("idle");
                                                        }
                                                    }}
                                                    onBlur={(e) => {
                                                        const v = e.currentTarget.value;
                                                        setDisplayName(v);
                                                        void validateDisplayNameAndGenerateSlug(v);
                                                    }}
                                                    placeholder="e.g. Urban Rebel, Chrome Spirit"
                                                    className="flex-1 min-w-0 px-4 py-3 bg-neutral-g1 border-[2px] border-neutral-black rounded-[4px] font-body text-[14px] font-black placeholder:opacity-30 focus:bg-white focus:shadow-[4px_4px_0px_0px_rgba(255,222,0,1)] outline-none transition-all"
                                                />
                                                {displayNameStatus === "checking" && (
                                                    <Loader2
                                                        className="w-5 h-5 shrink-0 text-primary animate-spin"
                                                        aria-hidden
                                                    />
                                                )}
                                                {displayNameStatus === "ok" && (
                                                    <CheckCircle
                                                        className="w-5 h-5 shrink-0 text-success"
                                                        aria-hidden
                                                    />
                                                )}
                                            </div>
                                            {displayNameStatus === "taken" && (
                                                <p className="font-display text-[10px] font-bold text-danger uppercase">
                                                    This display name is already taken
                                                </p>
                                            )}
                                            {displayNameStatus === "invalid" && (
                                                <p className="font-display text-[10px] font-bold text-danger uppercase">
                                                    Enter at least 2 characters
                                                </p>
                                            )}
                                            {displayNameStatus === "too_long" && (
                                                <p className="font-display text-[10px] font-bold text-danger uppercase">
                                                    Max 80 characters
                                                </p>
                                            )}
                                            {displayNameStatus === "error" && (
                                                <p className="font-display text-[10px] font-bold text-danger uppercase leading-relaxed">
                                                    Could not reach the server. In dev, clear VITE_API_URL (use Vite proxy)
                                                    or set it to your running API — restart dev server.
                                                </p>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <label className="font-display text-[11px] font-black uppercase tracking-[1.5px] text-neutral-g4">
                                                Storefront URL handle
                                            </label>
                                            <p className="font-display text-[10px] font-bold text-neutral-g3 uppercase tracking-tight">
                                                Generated from your display name (read-only).
                                            </p>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-display text-[11px] font-bold text-neutral-g3">/artists/</span>
                                                <input
                                                    type="text"
                                                    readOnly
                                                    value={artistSlug}
                                                    placeholder="—"
                                                    className="flex-1 min-w-[160px] px-4 py-3 bg-neutral-g2/80 border-[2px] border-neutral-black rounded-[4px] font-body text-[14px] font-black cursor-default outline-none"
                                                />
                                                {slugStatus === "checking" && (
                                                    <Loader2
                                                        className="w-5 h-5 shrink-0 text-primary animate-spin"
                                                        aria-hidden
                                                    />
                                                )}
                                            </div>
                                            {slugStatus === "checking" && displayNameStatus === "ok" && (
                                                <p className="font-display text-[10px] font-bold text-neutral-g3 uppercase">
                                                    Reserving handle…
                                                </p>
                                            )}
                                            {slugStatus === "ok" && (
                                                <p className="font-display text-[10px] font-bold text-success uppercase">
                                                    Handle ready
                                                </p>
                                            )}
                                            {slugStatus === "bad" && (
                                                <p className="font-display text-[10px] font-bold text-danger uppercase">
                                                    Could not reserve a URL — try a different display name
                                                </p>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <label className="font-display text-[11px] font-black uppercase tracking-[1.5px] text-neutral-g4 flex justify-between">
                                                Artist Bio
                                                <span className="text-neutral-g3">{bio.length}/500</span>
                                            </label>
                                            <textarea
                                                value={bio}
                                                onChange={(e) => setBio(e.target.value)}
                                                placeholder="Tell your story. What inspires your art?"
                                                rows={4}
                                                maxLength={500}
                                                className="w-full px-4 py-3 bg-neutral-g1 border-[2px] border-neutral-black rounded-[4px] font-body text-[14px] font-bold placeholder:opacity-30 focus:bg-white focus:shadow-[4px_4px_0px_0px_rgba(255,222,0,1)] outline-none transition-all resize-none"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Social Presence Section */}
                        <div className="bg-white border-[2px] border-neutral-black rounded-[6px] overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                            <div className="bg-neutral-black p-4 flex items-center gap-3 text-white">
                                <Link2 className="w-5 h-5 text-primary" />
                                <h2 className="font-display text-[14px] font-black uppercase tracking-[1px]">Social Connect</h2>
                            </div>
                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
                                {[
                                    { icon: Globe, label: "Portfolio/Website", value: portfolioUrl, setter: setPortfolioUrl, placeholder: "yourportfolio.com" },
                                    { icon: Link2, label: "Instagram", value: instagramUrl, setter: setInstagramUrl, placeholder: "@handle" },
                                    { icon: Link2, label: "Twitter / X", value: twitterUrl, setter: setTwitterUrl, placeholder: "@handle" },
                                    { icon: Link2, label: "Behance", value: behanceUrl, setter: setBehanceUrl, placeholder: "behance.net/you" },
                                ].map((field, idx) => (
                                    <div key={idx} className="space-y-2">
                                        <label className="font-display text-[10px] font-black uppercase tracking-[1px] text-neutral-g4">{field.label}</label>
                                        <div className="relative">
                                            <field.icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                                            <input
                                                type="text"
                                                value={field.value}
                                                onChange={(e) => field.setter(e.target.value)}
                                                placeholder={field.placeholder}
                                                className="w-full pl-10 pr-4 py-3 bg-neutral-g1 border-[2px] border-neutral-black rounded-[4px] font-body text-[13px] font-bold placeholder:opacity-30 focus:bg-white focus:shadow-[4px_4px_0px_0px_rgba(255,222,0,1)] outline-none transition-all"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Payout Details Section */}
                        <div className="bg-white border-[2px] border-neutral-black rounded-[6px] overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                            <div className="bg-neutral-black p-4 flex items-center gap-3 text-white">
                                <CreditCard className="w-5 h-5 text-primary" />
                                <h2 className="font-display text-[14px] font-black uppercase tracking-[1px]">Payout Settings</h2>
                            </div>
                            <div className="p-6">
                                <div className="flex gap-2 mb-8">
                                    {(["UPI", "BANK"] as const).map(m => (
                                        <button
                                            key={m}
                                            onClick={() => setPreferredMethod(m)}
                                            className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-[4px] border-[2px] transition-all font-display text-[12px] font-black uppercase tracking-[1px] ${preferredMethod === m
                                                ? "border-neutral-black bg-primary text-neutral-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] translate-x-[-2px] translate-y-[-2px]"
                                                : "border-neutral-g2 bg-white text-neutral-g3 hover:border-neutral-black hover:text-neutral-black"
                                                }`}
                                        >
                                            {m === "UPI" ? <Smartphone className="w-4 h-4" /> : <CreditCard className="w-4 h-4" />}
                                            {m === "UPI" ? "UPI (Instant)" : "Bank Transfer"}
                                        </button>
                                    ))}
                                </div>

                                {preferredMethod === "UPI" ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300">
                                        <div className="space-y-2 text-left">
                                            <label className="font-display text-[11px] font-black uppercase tracking-[1.5px] text-neutral-g4">UPI ID</label>
                                            <input
                                                type="text"
                                                value={upiId}
                                                onChange={e => setUpiId(e.target.value)}
                                                placeholder="you@okaxis"
                                                className="w-full px-4 py-3 bg-neutral-g1 border-[2px] border-neutral-black rounded-[4px] font-body text-[14px] font-black placeholder:opacity-30 focus:bg-white focus:shadow-[4px_4px_0px_0px_rgba(255,222,0,1)] outline-none transition-all text-left"
                                            />
                                        </div>
                                        <div className="space-y-2 text-left">
                                            <label className="font-display text-[11px] font-black uppercase tracking-[1.5px] text-neutral-g4 text-left">Full Name on Account</label>
                                            <input
                                                type="text"
                                                value={upiName}
                                                onChange={e => setUpiName(e.target.value)}
                                                placeholder="Legal name per UPI/Bank"
                                                className="w-full px-4 py-3 bg-neutral-g1 border-[2px] border-neutral-black rounded-[4px] font-body text-[14px] font-black placeholder:opacity-30 focus:bg-white focus:shadow-[4px_4px_0px_0px_rgba(255,222,0,1)] outline-none transition-all text-left"
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300">
                                        <div className="md:col-span-2 space-y-2">
                                            <label className="font-display text-[11px] font-black uppercase tracking-[1.5px] text-neutral-g4">Account Holder Name</label>
                                            <input
                                                type="text"
                                                value={bankAccountName}
                                                onChange={e => setBankAccountName(e.target.value)}
                                                className="w-full px-4 py-3 bg-neutral-g1 border-[2px] border-neutral-black rounded-[4px] font-body text-[14px] font-black outline-none"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="font-display text-[11px] font-black uppercase tracking-[1.5px] text-neutral-g4">Account Number</label>
                                            <input
                                                type="password"
                                                value={bankAccountNumber}
                                                onChange={e => setBankAccountNumber(e.target.value)}
                                                className="w-full px-4 py-3 bg-neutral-g1 border-[2px] border-neutral-black rounded-[4px] font-body text-[14px] font-black outline-none"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="font-display text-[11px] font-black uppercase tracking-[1.5px] text-neutral-g4">IFSC Code</label>
                                            <input
                                                type="text"
                                                value={bankIfsc}
                                                onChange={e => setBankIfsc(e.target.value.toUpperCase())}
                                                placeholder="HDFC0001234"
                                                className="w-full px-4 py-3 bg-neutral-g1 border-[2px] border-neutral-black rounded-[4px] font-body text-[14px] font-black outline-none uppercase"
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="mt-6 p-4 bg-primary/10 border-l-[4px] border-primary">
                                    <p className="font-body text-[12px] font-bold text-neutral-black leading-relaxed">
                                        🐝 <strong className="uppercase">Note:</strong> You earn <span className="text-[14px] font-black">25%</span> of every sale. Royalties for the previous month's verified sales are settled manually on the 10th day of the current month, so keep your payout details accurate to avoid delays.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column – Designs */}
                    <div className="space-y-8">
                        {/* Design Upload Section */}
                        <div className="bg-white border-[2px] border-neutral-black rounded-[6px] overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                            <div className="bg-neutral-black p-4 flex items-center justify-between text-white">
                                <div className="flex items-center gap-3">
                                    <Upload className="w-5 h-5 text-primary" />
                                    <h2 className="font-display text-[14px] font-black uppercase tracking-[1px]">Portfolio</h2>
                                </div>
                                <span className="font-display text-[11px] font-black uppercase px-2 py-1 rounded-[2px] text-success bg-success/10">
                                    {designs.length} Designs
                                </span>
                            </div>

                            <div className="p-6 space-y-6">
                                {designs.length < 10 && (
                                    <div className="space-y-4 p-4 border-[2px] border-dashed border-neutral-g3 rounded-[6px] bg-neutral-g1">
                                        <div className="space-y-2">
                                            <label className="font-display text-[10px] font-black uppercase tracking-[1px] text-neutral-g4">New Design Title</label>
                                            <input
                                                type="text"
                                                value={designTitle}
                                                onChange={(e) => setDesignTitle(e.target.value)}
                                                placeholder="e.g. Cyberpunk Samurai"
                                                className="w-full px-4 py-2 border-[2px] border-neutral-black rounded-[4px] font-display text-[12px] font-black outline-none"
                                            />
                                        </div>

                                        <div className="flex flex-col gap-3">
                                            <label className="flex items-center justify-center gap-2 px-4 py-3 bg-white border-[2px] border-neutral-black rounded-[4px] font-display text-[11px] font-black uppercase cursor-pointer hover:bg-neutral-black hover:text-white transition-all">
                                                <ImageIcon className="w-4 h-4" />
                                                {designFile ? designFile.name.substring(0, 15) + "..." : "Select File"}
                                                <input type="file" accept="image/*" onChange={(e) => setDesignFile(e.target.files?.[0] || null)} className="hidden" />
                                            </label>

                                            <button
                                                onClick={handleUploadDesign}
                                                disabled={!designFile || !designTitle.trim() || uploadingDesign}
                                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-neutral-black border-[2px] border-neutral-black rounded-[4px] font-display text-[11px] font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all disabled:opacity-50"
                                            >
                                                {uploadingDesign ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                                Upload Design
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-3">
                                    {designs.map((design) => (
                                        <div key={design.id} className="relative group rounded-[4px] overflow-hidden border-[2px] border-neutral-black aspect-square bg-neutral-g1">
                                            <img src={design.imageUrl} alt={design.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                            <div className="absolute inset-x-0 bottom-0 bg-neutral-black/80 p-2 transform translate-y-full group-hover:translate-y-0 transition-transform">
                                                <p className="text-white font-display text-[9px] font-black uppercase truncate">{design.title}</p>
                                            </div>
                                        </div>
                                    ))}
                                    {designs.length === 0 && (
                                        <div className="col-span-2 py-10 text-center opacity-20 flex flex-col items-center gap-2">
                                            <ImageIcon className="w-12 h-12" />
                                            <span className="font-display text-[10px] font-black uppercase tracking-[1px]">No designs uploaded</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
