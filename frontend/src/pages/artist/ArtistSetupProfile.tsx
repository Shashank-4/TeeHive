import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Cropper, { type Area } from "react-easy-crop";
import "react-easy-crop/react-easy-crop.css";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import {
    Camera,
    Globe,
    Link2,
    Send,
    AlertCircle,
    CheckCircle,
    Loader2,
    ImageIcon,
    CreditCard,
    Smartphone,
} from "lucide-react";
import { payoutFormFromMethods } from "../../utils/payoutMethods";
import { allocateSlugFromDisplayName } from "../../utils/artistSlugFromDisplayName";

const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
        const image = new Image();
        image.addEventListener("load", () => resolve(image));
        image.addEventListener("error", (err) => reject(err));
        image.src = url;
    });

const getCroppedImageBlob = async (imageSrc: string, cropPixels: Area): Promise<Blob> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement("canvas");
    canvas.width = cropPixels.width;
    canvas.height = cropPixels.height;

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not initialize image editor");

    ctx.drawImage(
        image,
        cropPixels.x,
        cropPixels.y,
        cropPixels.width,
        cropPixels.height,
        0,
        0,
        cropPixels.width,
        cropPixels.height
    );

    return await new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (!blob) {
                reject(new Error("Failed to crop image"));
                return;
            }
            resolve(blob);
        }, "image/jpeg", 0.92);
    });
};

export default function ArtistSetupProfile() {
    const navigate = useNavigate();
    const { user } = useAuth();

    // Profile fields
    const [displayName, setDisplayName] = useState("");
    const [artistSlug, setArtistSlug] = useState("");
    const [displayNameStatus, setDisplayNameStatus] = useState<
        "idle" | "checking" | "ok" | "taken" | "invalid" | "too_long" | "error"
    >("idle");
    const [slugStatus, setSlugStatus] = useState<"idle" | "checking" | "ok" | "bad" | "taken">("idle");
    /** Display name last validated on blur (unique + slug generated) */
    const confirmedDisplayNameRef = useRef("");
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
    const [cropModalOpen, setCropModalOpen] = useState(false);
    const [selectedImageForCrop, setSelectedImageForCrop] = useState<string>("");
    const [selectedImageName, setSelectedImageName] = useState("avatar");
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

    // State
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
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

    /** Pass `rawFromInput` from `onBlur` (e.currentTarget.value) — React may run blur before the last onChange commits, so state can be one character behind. */
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
            const preview = URL.createObjectURL(file);
            setSelectedImageForCrop(preview);
            setSelectedImageName(file.name || "avatar");
            setCrop({ x: 0, y: 0 });
            setZoom(1);
            setCroppedAreaPixels(null);
            setCropModalOpen(true);
        }
        e.target.value = "";
    };

    const onCropComplete = useCallback((_croppedArea: Area, croppedPixels: Area) => {
        setCroppedAreaPixels(croppedPixels);
    }, []);

    const handleApplyAvatarCrop = async () => {
        if (!selectedImageForCrop || !croppedAreaPixels) return;
        try {
            const croppedBlob = await getCroppedImageBlob(selectedImageForCrop, croppedAreaPixels);
            const croppedFile = new File([croppedBlob], `cropped-${selectedImageName}`, { type: "image/jpeg" });
            const croppedPreview = URL.createObjectURL(croppedBlob);
            setDisplayPhotoFile(croppedFile);
            setDisplayPhotoPreview(croppedPreview);
            URL.revokeObjectURL(selectedImageForCrop);
            setSelectedImageForCrop("");
            setCropModalOpen(false);
        } catch (err) {
            setError("Could not crop profile photo. Please try again.");
        }
    };

    const handleCancelAvatarCrop = () => {
        if (selectedImageForCrop) {
            URL.revokeObjectURL(selectedImageForCrop);
        }
        setSelectedImageForCrop("");
        setCropModalOpen(false);
    };

    const handleCoverPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setCoverPhotoFile(file);
            setCoverPhotoPreview(URL.createObjectURL(file));
        }
    };

    const handleSaveAndActivate = async () => {
        setSaving(true);
        setError(null);
        setSuccess(null);
        if (displayNameStatus !== "ok" || slugStatus !== "ok" || artistSlug.trim().length < 2) {
            setError("Confirm your public display name (click outside the field) so we can set your storefront URL.");
            setSaving(false);
            return;
        }
        if (!hasValidPayoutDetails) {
            setError("Please add payout details. Enter either valid UPI details or valid bank details.");
            setSaving(false);
            return;
        }
        try {
            const formData = new FormData();
            formData.append("displayName", displayName);
            formData.append("artistSlug", artistSlug.trim().toLowerCase());
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

            await api.post("/api/artist/submit-verification");
            navigate("/artist/manage-designs");
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to save and activate profile");
        } finally {
            setSaving(false);
        }
    };

    const hasValidUpiDetails = !!upiId.trim() && !!upiName.trim();
    const hasValidBankDetails =
        !!bankAccountName.trim() && !!bankAccountNumber.trim() && !!bankIfsc.trim();
    const hasValidPayoutDetails = hasValidUpiDetails || hasValidBankDetails;
    const slugOk = artistSlug.trim().length >= 2 && slugStatus === "ok";
    const displayOk = displayName.trim().length >= 2 && displayNameStatus === "ok";
    const canSubmit =
        displayOk && slugOk && !!displayPhotoPreview && hasValidPayoutDetails;

    const activationPayoutMethod = (() => {
        if (preferredMethod === "UPI" && hasValidUpiDetails) return "UPI";
        if (preferredMethod === "BANK" && hasValidBankDetails) return "BANK";
        if (hasValidUpiDetails) return "UPI";
        if (hasValidBankDetails) return "BANK";
        return null;
    })();

    const maskedBankAccountNumber =
        bankAccountNumber.length > 4
            ? `${"*".repeat(Math.max(0, bankAccountNumber.length - 4))}${bankAccountNumber.slice(-4)}`
            : bankAccountNumber;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 text-yellow-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen bg-neutral-g1 flex flex-col pt-4">
            <div className="flex-1 px-4 sm:px-8 pb-12 w-full">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
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
                {success && (
                    <div className="mb-8 p-4 bg-neutral-black text-success border-l-4 border-success animate-in fade-in slide-in-from-top-4 duration-300">
                        <div className="flex items-center gap-3">
                            <CheckCircle className="w-5 h-5 shrink-0" />
                            <span className="font-display text-[13px] font-black uppercase tracking-wider">{success}</span>
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
                                <h2 className="font-display text-[14px] font-black uppercase tracking-[1px]">1. Visual Identity</h2>
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
                                        <label className="font-display text-[11px] font-black uppercase tracking-[1.5px] text-neutral-g4 block">Profile Pic *</label>
                                        <div className="relative w-32 h-32 group border-[2px] border-neutral-black rounded-full bg-neutral-g1 flex items-center justify-center cursor-pointer overflow-hidden transition-all hover:bg-neutral-g2">
                                            {displayPhotoPreview ? (
                                                <img src={displayPhotoPreview} alt="Avatar" className="w-full h-full object-cover rounded-full" />
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
                                                Public Display Name *
                                            </label>
                                            <p className="font-display text-[10px] font-bold text-neutral-g3 uppercase tracking-tight">
                                                Must be unique. Click outside this field to check and generate your URL.
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
                                                    This display name is already taken — try another
                                                </p>
                                            )}
                                            {displayNameStatus === "invalid" && (
                                                <p className="font-display text-[10px] font-bold text-danger uppercase">
                                                    Enter at least 2 characters
                                                </p>
                                            )}
                                            {displayNameStatus === "too_long" && (
                                                <p className="font-display text-[10px] font-bold text-danger uppercase">
                                                    Display name must be 80 characters or less
                                                </p>
                                            )}
                                            {displayNameStatus === "error" && (
                                                <p className="font-display text-[10px] font-bold text-danger uppercase leading-relaxed">
                                                    Could not reach the server. Use an empty VITE_API_URL in dev so /api is
                                                    proxied to your backend, or set VITE_API_URL to your API origin — then
                                                    restart the dev server.
                                                </p>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <label className="font-display text-[11px] font-black uppercase tracking-[1.5px] text-neutral-g4">
                                                Storefront URL handle *
                                            </label>
                                            <p className="font-display text-[10px] font-bold text-neutral-g3 uppercase tracking-tight">
                                                Generated automatically from your display name (no spaces).
                                            </p>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-display text-[11px] font-bold text-neutral-g3">/artists/</span>
                                                <input
                                                    type="text"
                                                    readOnly
                                                    value={artistSlug}
                                                    placeholder="—"
                                                    className="flex-1 min-w-[160px] px-4 py-3 bg-neutral-g2/80 border-[2px] border-neutral-black rounded-[4px] font-body text-[14px] font-black text-neutral-black cursor-default outline-none"
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
                                                    Could not reserve a URL for this name — try a different display name
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
                                <h2 className="font-display text-[14px] font-black uppercase tracking-[1px]">2. Social Connect</h2>
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
                                <h2 className="font-display text-[14px] font-black uppercase tracking-[1px]">3. Payout Settings</h2>
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
                                            <label className="font-display text-[11px] font-black uppercase tracking-[1.5px] text-neutral-g4">UPI ID *</label>
                                            <input
                                                type="text"
                                                value={upiId}
                                                onChange={e => setUpiId(e.target.value)}
                                                placeholder="shashank@okaxis"
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
                                            <label className="font-display text-[11px] font-black uppercase tracking-[1.5px] text-neutral-g4">Account Holder Name *</label>
                                            <input
                                                type="text"
                                                value={bankAccountName}
                                                onChange={e => setBankAccountName(e.target.value)}
                                                className="w-full px-4 py-3 bg-neutral-g1 border-[2px] border-neutral-black rounded-[4px] font-body text-[14px] font-black outline-none"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="font-display text-[11px] font-black uppercase tracking-[1.5px] text-neutral-g4">Account Number *</label>
                                            <input
                                                type="password"
                                                value={bankAccountNumber}
                                                onChange={e => setBankAccountNumber(e.target.value)}
                                                className="w-full px-4 py-3 bg-neutral-g1 border-[2px] border-neutral-black rounded-[4px] font-body text-[14px] font-black outline-none"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="font-display text-[11px] font-black uppercase tracking-[1.5px] text-neutral-g4">IFSC Code *</label>
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

                    {/* Right Column – Activation Summary */}
                    <div className="space-y-8">
                        {/* Activation Tooltip */}
                        <div className="bg-neutral-black border-[2px] border-neutral-black rounded-[6px] p-6 text-white shadow-[8px_8px_0px_0px_rgba(255,222,0,1)] flex flex-col justify-between h-auto min-h-[300px]">
                            <div>
                                <h3 className="font-display text-[16px] font-black uppercase tracking-[1px] mb-2 text-primary">Instant Activation</h3>
                                <p className="font-body text-[12px] font-bold text-white/60 mb-6 leading-relaxed">
                                    Complete your profile details and activate your account instantly to start uploading designs right away.
                                </p>

                                <div className="space-y-3 mb-6 font-display text-[10px] font-black uppercase tracking-[1px]">
                                    <div className="flex items-center justify-between">
                                        <span className="text-white/40">Profile Info</span>
                                        {displayName ? <CheckCircle className="w-3 h-3 text-success" /> : <span className="text-danger">Mandatory</span>}
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-white/40">URL Handle</span>
                                        {slugOk ? <CheckCircle className="w-3 h-3 text-success" /> : <span className="text-danger">Mandatory</span>}
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-white/40">Profile Photo</span>
                                        {displayPhotoPreview ? <CheckCircle className="w-3 h-3 text-success" /> : <span className="text-danger">Mandatory</span>}
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-white/40">Payout Details</span>
                                        {hasValidPayoutDetails ? <CheckCircle className="w-3 h-3 text-success" /> : <span className="text-danger">Mandatory</span>}
                                    </div>
                                </div>

                                <div className="mb-6 rounded-[4px] border border-white/20 bg-white/5 p-3">
                                    <p className="font-display text-[10px] font-black uppercase tracking-[1px] text-white/50 mb-2">
                                        Payout Summary
                                    </p>
                                    {activationPayoutMethod === "UPI" ? (
                                        <p className="font-body text-[12px] font-bold text-white/90 leading-relaxed">
                                            Method: UPI <br />
                                            UPI ID: {upiId.trim()} <br />
                                            Name: {upiName.trim()}
                                        </p>
                                    ) : activationPayoutMethod === "BANK" ? (
                                        <p className="font-body text-[12px] font-bold text-white/90 leading-relaxed">
                                            Method: Bank Transfer <br />
                                            Account: {maskedBankAccountNumber || "Not provided"} <br />
                                            IFSC: {bankIfsc.trim() || "Not provided"} <br />
                                            Name: {bankAccountName.trim() || "Not provided"}
                                        </p>
                                    ) : (
                                        <p className="font-body text-[12px] font-bold text-danger leading-relaxed">
                                            Add either UPI details or bank details to activate.
                                        </p>
                                    )}
                                </div>
                            </div>

                            <button
                                onClick={handleSaveAndActivate}
                                disabled={!canSubmit || saving}
                                className={`w-full flex items-center justify-center gap-3 py-4 rounded-[4px] font-display text-[14px] font-black uppercase transition-all mt-4 ${canSubmit && !saving
                                    ? "bg-primary text-neutral-black hover:bg-white "
                                    : "bg-white/10 text-white/30 cursor-not-allowed"
                                    }`}
                            >
                                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                {saving ? "Activating..." : "Activate Account"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            {cropModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-[2px] p-4 flex items-center justify-center">
                    <div className="w-full max-w-xl bg-white border-[2px] border-neutral-black rounded-[6px] overflow-hidden shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]">
                        <div className="bg-neutral-black text-white px-4 py-3">
                            <h3 className="font-display text-[12px] font-black uppercase tracking-[1px]">
                                Adjust Profile Picture
                            </h3>
                        </div>
                        <div className="p-4">
                            <div className="relative w-full h-[360px] bg-neutral-black rounded-[4px] overflow-hidden">
                                <Cropper
                                    image={selectedImageForCrop}
                                    crop={crop}
                                    zoom={zoom}
                                    aspect={1}
                                    cropShape="round"
                                    showGrid={false}
                                    onCropChange={setCrop}
                                    onZoomChange={setZoom}
                                    onCropComplete={onCropComplete}
                                />
                            </div>
                            <div className="mt-4">
                                <label className="font-display text-[10px] font-black uppercase tracking-[1px] text-neutral-g4 block mb-2">
                                    Zoom
                                </label>
                                <input
                                    type="range"
                                    min={1}
                                    max={3}
                                    step={0.1}
                                    value={zoom}
                                    onChange={(e) => setZoom(Number(e.target.value))}
                                    className="w-full accent-primary"
                                />
                            </div>
                            <div className="mt-5 grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={handleCancelAvatarCrop}
                                    className="py-3 border-[2px] border-neutral-black rounded-[4px] font-display text-[11px] font-black uppercase tracking-[1px] hover:bg-neutral-g1 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleApplyAvatarCrop}
                                    className="py-3 bg-primary border-[2px] border-neutral-black rounded-[4px] font-display text-[11px] font-black uppercase tracking-[1px] hover:bg-primary/80 transition-colors"
                                >
                                    Use This Photo
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
