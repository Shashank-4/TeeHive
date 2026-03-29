import { useState, useEffect } from "react";
import {
    ShieldCheck,
    Save,
    Info,
    CreditCard,
    DollarSign,
    Zap
} from "lucide-react";
import Loader from "../../components/shared/Loader";
import api from "../../api/axios";

export default function ArtistPayout() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [stats, setStats] = useState<any>(null);
    const [formData, setFormData] = useState({
        upiId: "",
        upiName: "",
        bankAccountName: "",
        bankAccountNumber: "",
        bankIfsc: "",
        bankName: "",
        preferredMethod: "UPI"
    });

    useEffect(() => {
        const fetchPayoutData = async () => {
            try {
                setLoading(true);
                const [profileRes, statsRes] = await Promise.all([
                    api.get("/api/artist/profile"),
                    api.get("/api/artist/stats")
                ]);

                const profile = profileRes.data.data.artist;
                setFormData({
                    upiId: profile.payoutDetails?.upiId || "",
                    upiName: profile.payoutDetails?.upiName || "",
                    bankAccountName: profile.payoutDetails?.bankAccountName || "",
                    bankAccountNumber: profile.payoutDetails?.bankAccountNumber || "",
                    bankIfsc: profile.payoutDetails?.bankIfsc || "",
                    bankName: profile.payoutDetails?.bankName || "",
                    preferredMethod: profile.payoutDetails?.preferredMethod || "UPI"
                });
                setStats(statsRes.data.data.stats);
            } catch (error) {
                console.error("Failed to fetch payout details:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchPayoutData();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            await api.patch("/api/artist/profile", {
                payoutDetails: formData
            });
            alert("Payout details updated successfully!");
        } catch (error) {
            console.error("Failed to save payout details:", error);
            alert("Failed to save changes. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    const currentEarnings = stats?.totalRevenue || 0;
    const threshold = 500;
    const progress = Math.min((currentEarnings / threshold) * 100, 100);

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
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 bg-neutral-black text-white px-3 py-1 rounded-[4px] font-display text-[10px] font-black uppercase tracking-[2px]">
                            <DollarSign className="w-3 h-3 text-primary" /> Financial Node
                        </div>
                        <h1 className="font-display text-[ clamp(32px,5vw,48px) ] font-black text-neutral-black leading-none uppercase tracking-tight">
                            Payout <span className="text-primary italic">Control</span>
                        </h1>
                        <p className="font-display text-[14px] font-bold text-neutral-g4 uppercase tracking-wider">
                            Configure your clearing house and monitor threshold progression.
                        </p>
                    </div>

                    <div className="bg-white border-[2px] border-neutral-black px-6 py-4 rounded-[4px] shadow-[4px_4px_0px_0px_rgba(255,222,0,1)] flex items-center gap-4">
                        <div className="w-10 h-10 bg-neutral-black rounded-full flex items-center justify-center text-primary text-[20px]">
                            💰
                        </div>
                        <div>
                            <p className="font-display text-[10px] font-black uppercase text-neutral-g3">Cycle Status</p>
                            <p className="font-display text-[14px] font-black text-neutral-black uppercase tracking-[1px]">1st of Month Clearance</p>
                        </div>
                    </div>
                </div>

                {/* Status Alert Banner */}
                <div className="bg-neutral-black border-[2px] border-neutral-black rounded-[6px] p-6 flex items-center gap-6 mb-10 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)]">
                    <Zap className="w-8 h-8 text-primary animate-pulse" />
                    <div>
                        <p className="font-display text-[16px] font-black text-white uppercase tracking-[1px]">Automated Clearing House Active</p>
                        <p className="font-display text-[11px] font-bold text-neutral-g2 uppercase tracking-wide opacity-60 mt-1">
                            Min threshold: ₹500 &nbsp;•&nbsp; Artist Commission: 25% Gross &nbsp;•&nbsp; Rolling balance support enabled
                        </p>
                    </div>
                </div>

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

                {/* Threshold Tracker */}
                <div className="bg-white border-[2px] border-neutral-black rounded-[6px] p-8 mb-10 relative overflow-hidden shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
                    <div className="absolute top-0 right-0 w-64 h-full bg-primary opacity-5 -skew-x-12 translate-x-24 pointer-events-none" />

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-10 relative z-10">
                        <div className="flex-1 space-y-4">
                            <div className="flex items-center gap-2">
                                <Info className="w-5 h-5 text-primary" />
                                <span className="font-display text-[12px] font-black uppercase tracking-[2px] text-neutral-g4">Accumulation Progress</span>
                            </div>
                            <div className="font-display text-[48px] font-black text-neutral-black leading-none italic uppercase tracking-tighter">
                                ₹{currentEarnings.toLocaleString('en-IN')}
                            </div>
                            <div className="font-display text-[13px] font-bold text-neutral-g4 uppercase tracking-wide flex items-center gap-2">
                                {currentEarnings >= threshold
                                    ? <span className="text-success flex items-center gap-1 font-black">● Threshold Breakthrough Achieved</span>
                                    : <span className="text-neutral-black">Target Deficit: ₹{(threshold - currentEarnings).toLocaleString('en-IN')}</span>}
                            </div>
                        </div>

                        <div className="w-full md:w-[400px] space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="font-display text-[11px] font-black text-neutral-black uppercase tracking-[2px]">Phase Completion</span>
                                <span className="font-display text-[16px] font-black text-success italic">{Math.round(progress)}%</span>
                            </div>
                            <div className="w-full h-8 bg-neutral-g1 border-[2px] border-neutral-black rounded-full overflow-hidden p-[3px]">
                                <div
                                    className="h-full bg-success border-[1px] border-neutral-black rounded-full transition-all duration-1000 ease-out shadow-[inset_0px_0px_10px_rgba(0,0,0,0.1)]"
                                    style={{ width: `${progress}%` }}
                                >
                                    {progress > 10 && <div className="w-full h-full bg-white/20 animate-pulse" />}
                                </div>
                            </div>
                            <div className="flex justify-between font-display text-[10px] font-black text-neutral-g3 uppercase tracking-[2px]">
                                <span className="bg-white border-[1px] border-neutral-black px-2 py-0.5 rounded-[2px]">₹0 Origin</span>
                                <span className="bg-primary text-neutral-black border-[1px] border-neutral-black px-2 py-0.5 rounded-[2px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">Threshold: ₹500</span>
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
