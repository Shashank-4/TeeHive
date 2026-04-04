import { useState, useEffect } from "react";
import {
    ShieldCheck,
    Save,
    Info,
    CreditCard,
    Zap
} from "lucide-react";
import Loader from "../../components/shared/Loader";
import api from "../../api/axios";
import {
    emptyPayoutForm,
    payoutFormFromMethods,
    type PayoutMethodRecord,
} from "../../utils/payoutMethods";

export default function ArtistPayout() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [stats, setStats] = useState<any>(null);
    const [methods, setMethods] = useState<PayoutMethodRecord[]>([]);
    const [message, setMessage] = useState<string | null>(null);
    const [messageType, setMessageType] = useState<"success" | "error" | null>(null);
    const [formData, setFormData] = useState(emptyPayoutForm);

    useEffect(() => {
        const fetchPayoutData = async () => {
            try {
                setLoading(true);
                const [methodsRes, statsRes] = await Promise.all([
                    api.get("/api/artist/payout-methods"),
                    api.get("/api/artist/stats")
                ]);

                const fetchedMethods = methodsRes.data.data?.methods || [];
                setMethods(fetchedMethods);
                setFormData(payoutFormFromMethods(fetchedMethods));
                setStats(statsRes.data.data.stats);
            } catch (error) {
                console.error("Failed to fetch payout details:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchPayoutData();
    }, []);

    useEffect(() => {
        if (!methods.some((method) => method.verificationStatus === "PENDING_PROVIDER")) {
            return;
        }

        const timeout = window.setTimeout(async () => {
            try {
                const methodsRes = await api.get("/api/artist/payout-methods");
                const fetchedMethods = methodsRes.data.data?.methods || [];
                setMethods(fetchedMethods);
                setFormData(payoutFormFromMethods(fetchedMethods));
            } catch (error) {
                console.error("Failed to refresh payout validation status:", error);
            }
        }, 4000);

        return () => window.clearTimeout(timeout);
    }, [methods]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            setMessage(null);
            setMessageType(null);
            const res = await api.put("/api/artist/payout-methods", formData);
            const updatedMethods = res.data.data?.methods || [];
            setMethods(updatedMethods);
            setFormData(payoutFormFromMethods(updatedMethods));
            setMessage("Payout details saved. Finance will verify them before settlement.");
            setMessageType("success");
        } catch (error: any) {
            console.error("Failed to save payout details:", error);
            setMessage(error.response?.data?.message || "Failed to save changes. Please try again.");
            setMessageType("error");
        } finally {
            setSaving(false);
        }
    };

    const currentEarnings = stats?.totalEarnings || 0;
    const defaultMethod = methods.find((method) => method.isDefault) || methods[0] || null;
    const defaultMethodLabel =
        defaultMethod?.methodType === "BANK_ACCOUNT"
            ? "Bank Account"
            : defaultMethod?.methodType === "UPI"
              ? "UPI"
              : "Not Set";
    const statusHeading =
        defaultMethod?.verificationStatus === "VERIFIED"
            ? "Verified Payout Method"
            : defaultMethod?.verificationStatus === "PENDING_PROVIDER"
              ? "Automated Validation In Progress"
            : defaultMethod?.verificationStatus === "REJECTED"
              ? "Payout Review Rejected"
              : defaultMethod?.verificationStatus === "REQUIRES_RESUBMISSION"
                ? "Payout Method Needs Update"
                : defaultMethod
                  ? "Payout Method Under Review"
                  : "Settlement Details On File";
    const statusCopy =
        defaultMethod?.rejectionReason ||
        defaultMethod?.verificationNotes ||
        defaultMethod?.providerValidation?.reason ||
        "Artist commission: 25% gross • Finance reviews only exceptional payout validation cases before settlement";

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader size="w-12 h-12" />
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen bg-neutral-g1 flex flex-col pt-4">
            <div className="flex-1 px-4 sm:px-8 pb-12 w-full">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
                    <div className="bg-white border-[2px] border-neutral-black px-6 py-4 rounded-[4px] shadow-[4px_4px_0px_0px_rgba(255,222,0,1)] flex items-center gap-4">
                        <div className="w-10 h-10 bg-neutral-black rounded-full flex items-center justify-center text-primary text-[20px]">
                            💰
                        </div>
                        <div>
                            <p className="font-display text-[10px] font-black uppercase text-neutral-g3">Payout Method</p>
                            <p className="font-display text-[14px] font-black text-neutral-black uppercase tracking-[1px]">Manual Settlement Ready</p>
                        </div>
                    </div>
                </div>

                {/* Status Alert Banner */}
                <div className="bg-neutral-black border-[2px] border-neutral-black rounded-[6px] p-6 flex items-center gap-6 mb-10 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)]">
                    <Zap className="w-8 h-8 text-primary animate-pulse" />
                    <div>
                        <p className="font-display text-[16px] font-black text-white uppercase tracking-[1px]">{statusHeading}</p>
                        <p className="font-display text-[11px] font-bold text-neutral-g2 uppercase tracking-wide opacity-60 mt-1">
                            {statusCopy}
                        </p>
                    </div>
                </div>

                {message && (
                    <div className={`mb-8 border-[2px] border-neutral-black rounded-[6px] px-5 py-4 font-display text-[11px] font-black uppercase tracking-[1px] ${
                        messageType === "success"
                            ? "bg-success/10 text-success"
                            : "bg-danger/10 text-danger"
                    }`}>
                        {message}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
                    {/* UPI Section */}
                    <div className="bg-white border-[2px] border-neutral-black rounded-[6px] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col h-full hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all">
                        <div className="px-6 py-5 border-b-[2px] border-neutral-black flex items-center justify-between bg-neutral-g1/30">
                            <div>
                                <h3 className="font-display text-[16px] font-black uppercase tracking-[1px]">UPI Protocol</h3>
                                <p className="font-display text-[10px] font-bold text-neutral-g4 uppercase tracking-tighter">Instant clearance enabled</p>
                            </div>
                            <div className="bg-success border-[1px] border-neutral-black text-white font-display text-[9px] font-black px-3 py-1 rounded-[2px] uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                Optimized
                            </div>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="font-display text-[10px] font-black uppercase tracking-[2px] text-neutral-g4 px-1">Receiver Address (UPI ID)</label>
                                <input
                                    id="upiId"
                                    className="w-full px-5 py-4 bg-neutral-g1 border-[2px] border-neutral-black rounded-[4px] font-display text-[14px] font-black uppercase tracking-[1px] shadow-[4px_4px_0px_0px_rgba(0,0,0,0.05)] focus:bg-white focus:shadow-none transition-all outline-none"
                                    placeholder="ADDRESS@UPI"
                                    value={formData.upiId}
                                    onChange={handleChange}
                                />
                                <p className="text-[9px] font-bold text-neutral-g3 uppercase px-1">Support: GPay, PhonePe, Paytm, BHIM</p>
                            </div>
                            <div className="space-y-2">
                                <label className="font-display text-[10px] font-black uppercase tracking-[2px] text-neutral-g4 px-1">Linked Identity Name</label>
                                <input
                                    id="upiName"
                                    className="w-full px-5 py-4 bg-neutral-g1 border-[2px] border-neutral-black rounded-[4px] font-display text-[14px] font-black uppercase tracking-[1px] outline-none focus:bg-white transition-all"
                                    placeholder="Verified Name"
                                    value={formData.upiName}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="bg-primary/10 border-[1px] border-neutral-black rounded-[4px] p-4 flex items-start gap-4">
                                <ShieldCheck className="w-5 h-5 text-neutral-black shrink-0" />
                                <p className="font-display text-[10px] font-bold text-neutral-black uppercase leading-relaxed">
                                    Asset encryption active. Payout data is isolated from public nodes and only accessible by treasury clearance.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Bank Account Section */}
                    <div className="bg-white border-[2px] border-neutral-black rounded-[6px] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col h-full hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all">
                        <div className="px-6 py-5 border-b-[2px] border-neutral-black flex items-center gap-4 bg-neutral-g1/30">
                            <div>
                                <h3 className="font-display text-[16px] font-black uppercase tracking-[1px]">NEFT / IMPS Hub</h3>
                                <p className="font-display text-[10px] font-bold text-neutral-g4 uppercase tracking-tighter">Legacy clearance support</p>
                            </div>
                            <CreditCard className="w-6 h-6 ml-auto opacity-20" />
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="font-display text-[10px] font-black uppercase tracking-[2px] text-neutral-g4 px-1">Account Holder Identity</label>
                                <input
                                    id="bankAccountName"
                                    className="w-full px-5 py-4 bg-neutral-g1 border-[2px] border-neutral-black rounded-[4px] font-display text-[14px] font-black uppercase tracking-[1px] outline-none focus:bg-white transition-all"
                                    placeholder="Full Legal Name"
                                    value={formData.bankAccountName}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="font-display text-[10px] font-black uppercase tracking-[2px] text-neutral-g4 px-1">Source Account Port</label>
                                    <input
                                        id="bankAccountNumber"
                                        type="password"
                                        className="w-full px-5 py-4 bg-neutral-g1 border-[2px] border-neutral-black rounded-[4px] font-display text-[14px] font-black uppercase tracking-[1px] outline-none focus:bg-white transition-all"
                                        placeholder="ACCOUNT NO."
                                        value={formData.bankAccountNumber}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="font-display text-[10px] font-black uppercase tracking-[2px] text-neutral-g4 px-1">Routing IFSC Code</label>
                                    <input
                                        id="bankIfsc"
                                        className="w-full px-5 py-4 bg-neutral-g1 border-[2px] border-neutral-black rounded-[4px] font-display text-[14px] font-black uppercase tracking-[1px] outline-none focus:bg-white transition-all"
                                        placeholder="IFSC CODE"
                                        value={formData.bankIfsc}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="font-display text-[10px] font-black uppercase tracking-[2px] text-neutral-g4 px-1">Institution Name</label>
                                <input
                                    id="bankName"
                                    className="w-full px-5 py-4 bg-neutral-g1 border-[2px] border-neutral-black rounded-[4px] font-display text-[14px] font-black uppercase tracking-[1px] outline-none focus:bg-white transition-all"
                                    placeholder="e.g. HDFC, ICICI, SBI"
                                    value={formData.bankName}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white border-[2px] border-neutral-black rounded-[6px] p-8 mb-10 relative overflow-hidden shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
                    <div className="absolute top-0 right-0 w-64 h-full bg-primary opacity-5 -skew-x-12 translate-x-24 pointer-events-none" />

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-10 relative z-10">
                        <div className="flex-1 space-y-4">
                            <div className="flex items-center gap-2">
                                <Info className="w-5 h-5 text-primary" />
                                <span className="font-display text-[12px] font-black uppercase tracking-[2px] text-neutral-g4">Eligible Earnings Snapshot</span>
                            </div>
                            <div className="font-display text-[48px] font-black text-neutral-black leading-none italic uppercase tracking-tighter">
                                ₹{currentEarnings.toLocaleString('en-IN')}
                            </div>
                            <div className="font-display text-[13px] font-bold text-neutral-black uppercase tracking-wide">
                                Previous month royalties are settled manually on the 10th day of the current month after finance reconciliation and payout-method validation.
                            </div>
                        </div>

                        <div className="w-full md:w-[400px] space-y-4">
                            <div className="bg-neutral-g1 border-[2px] border-neutral-black rounded-[6px] p-5 space-y-3">
                                <div className="font-display text-[11px] font-black text-neutral-black uppercase tracking-[2px]">Current Method</div>
                                <div className="font-display text-[20px] font-black text-neutral-black uppercase tracking-tight">
                                    {defaultMethodLabel}
                                </div>
                                <div className="font-display text-[10px] font-bold text-neutral-g4 uppercase tracking-[1.5px]">
                                    {defaultMethod
                                        ? [
                                              `Current status: ${defaultMethod.verificationStatus.replaceAll("_", " ")}`,
                                              defaultMethod.providerValidation?.registeredName
                                                  ? `Registered name: ${defaultMethod.providerValidation.registeredName}`
                                                  : null,
                                              typeof defaultMethod.providerValidation?.nameMatchScore === "number"
                                                  ? `Name match score: ${defaultMethod.providerValidation.nameMatchScore}`
                                                  : null,
                                          ]
                                              .filter(Boolean)
                                              .join(" • ")
                                        : "Keep one active method accurate so finance can settle previous-month royalties on the 10th without delays."}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Global Command Bar */}
                <div className="sticky bottom-8 z-40 bg-white border-[2px] border-neutral-black p-4 rounded-[6px] shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] flex justify-end items-center gap-6">
                    <p className="mr-auto font-display text-[10px] font-black uppercase text-neutral-g4 tracking-[2px] hidden md:block">
                        Confirm clearing data integrity before commit
                    </p>
                    <button
                        className="px-8 py-3.5 border-[2px] border-neutral-black rounded-[4px] font-display text-[12px] font-black uppercase tracking-[2px] hover:bg-neutral-g1 transition-all"
                    >
                        Abort Changes
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-10 py-3.5 bg-primary border-[2px] border-neutral-black rounded-[4px] font-display text-[12px] font-black uppercase tracking-[2px] hover:translate-x-[2px] hover:translate-y-[2px] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-none transition-all flex items-center gap-3 disabled:opacity-30"
                    >
                        {saving ? <Loader size="w-4 h-4" /> : <Save className="w-4 h-4" />}
                        Commit Clearance Data
                    </button>
                </div>
            </div>
        </div>
    );
}
