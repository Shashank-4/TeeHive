import { useState } from "react";
import { Link } from "react-router-dom";
import { User, Palette, Zap, ShieldCheck, Star, Shield } from "lucide-react";
import SignInForm from "../components/forms/SignInForm";
import SignUpForm from "../components/forms/SignUpForm";

export default function LoginPage() {
    const [userType, setUserType] = useState<"CUSTOMER" | "ARTIST">("CUSTOMER");
    const [isSignUp, setIsSignUp] = useState(false);

    return (
        <div className="h-screen w-screen bg-white text-neutral-black flex flex-col md:flex-row font-body overflow-hidden">
            {/* ── LEFT SIDE: BRAND TERMINAL ── */}
            <div className="hidden md:flex w-[42%] lg:w-[45%] bg-neutral-black relative overflow-hidden flex-col justify-between p-10 lg:p-14 shrink-0 border-r-[3px] border-neutral-black h-full">
                {/* Visual Layers */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.03]">
                    <div className="absolute top-[-5%] left-[-10%] text-[400px] font-display font-black text-white select-none leading-none uppercase">HIVE</div>
                </div>

                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/[0.07] blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-primary/[0.05] blur-[100px] rounded-full translate-y-1/2 -translate-x-1/2" />

                {/* Brand Identity */}
                <div className="relative z-10 flex flex-col h-full justify-between">
                    <div>
                        <Link to="/" className="flex items-center gap-3 no-underline group mb-10 inline-flex">
                            <div className="w-10 h-10 bg-primary text-neutral-black p-2 flex items-center justify-center rounded-[4px] rotate-[-8deg] group-hover:rotate-0 transition-all border-[2px] border-neutral-black shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)]">
                                <Zap className="w-6 h-6" fill="currentColor" />
                            </div>
                            <span className="font-display text-[26px] font-black tracking-[2px] text-white uppercase transition-colors group-hover:text-primary">
                                TEE<span className="italic">HIVE</span>
                            </span>
                        </Link>

                        <div className="space-y-6">
                            <div className="inline-flex items-center gap-2.5 bg-primary text-neutral-black px-3 py-1 rounded-[4px] font-display text-[9px] font-black uppercase tracking-[2px] border-[2px] border-neutral-black shadow-[4px_4px_0px_0px_rgba(255,255,255,0.05)]">
                                <Shield className="w-3.5 h-3.5" /> ACCESS_NODE_v4
                            </div>

                            <h1 className="font-display text-[clamp(36px,4.5vw,56px)] font-black text-white leading-[0.85] tracking-tight uppercase">
                                Enter The <br />
                                <span className="text-primary italic">Creative</span> <br />
                                Protocol.
                            </h1>

                            <p className="font-display text-[14px] font-bold text-white/40 leading-relaxed max-w-[340px] uppercase tracking-wide">
                                Join India's elite independent designer network. Synchronize with the hive.
                            </p>
                        </div>
                    </div>

                    {/* Stats & Trust */}
                    <div className="grid grid-cols-3 gap-6 pt-10 border-t-[2px] border-white/10">
                        {[
                            { label: "NODES", value: "250+", sub: "Verified" },
                            { label: "PAYOUT", value: "25%", sub: "Royalties" },
                            { label: "VAULT", value: "FREE", sub: "Access" },
                        ].map((stat, i) => (
                            <div key={i} className="space-y-0.5">
                                <div className="font-display text-[9px] font-black text-primary uppercase tracking-[2px]">{stat.label}</div>
                                <div className="font-display text-[22px] font-black text-white leading-none tracking-tight">{stat.value}</div>
                                <div className="font-display text-[8px] font-bold text-white/20 uppercase tracking-[1px]">{stat.sub}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── RIGHT SIDE: AUTH INTERFACE ── */}
            <div className="flex-1 bg-neutral-g1 flex items-center justify-center p-6 lg:p-10 relative h-full overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent opacity-50 pointer-events-none" />

                <div className="w-full max-w-[440px] relative z-10 flex flex-col h-full max-h-[92vh] justify-center items-center">
                    {/* Role Selector Tabs */}
                    <div className="w-full flex gap-1.5 p-1 bg-white border-[2.5px] border-neutral-black rounded-[4px] mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] shrink-0">
                        <button
                            onClick={() => setUserType("CUSTOMER")}
                            className={`flex-1 flex items-center justify-center gap-2.5 py-3 rounded-[2px] font-display text-[11px] font-black uppercase tracking-[2.5px] transition-all ${userType === "CUSTOMER"
                                ? "bg-primary text-neutral-black border-[2px] border-neutral-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                                : "text-neutral-black/30 hover:text-neutral-black border-[2px] border-transparent"
                                }`}
                        >
                            <User className="w-4 h-4" />
                            Customer
                        </button>
                        <button
                            onClick={() => setUserType("ARTIST")}
                            className={`flex-1 flex items-center justify-center gap-2.5 py-3 rounded-[2px] font-display text-[11px] font-black uppercase tracking-[2.5px] transition-all ${userType === "ARTIST"
                                ? "bg-primary text-neutral-black border-[2px] border-neutral-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                                : "text-neutral-black/30 hover:text-neutral-black border-[2px] border-transparent"
                                }`}
                        >
                            <Palette className="w-4 h-4" />
                            Artist
                        </button>
                    </div>

                    {/* Authenticator Block */}
                    <div className="w-full bg-white border-[3px] border-neutral-black p-8 lg:p-10 rounded-[4px] shadow-[10px_10px_0px_0px_rgba(255,222,0,1)] transition-all duration-300 overflow-hidden shrink-0">
                        <div className="mb-6 flex items-end justify-between">
                            <div>
                                <h2 className="font-display text-[28px] lg:text-[34px] font-black text-neutral-black leading-[0.9] tracking-tight mb-2 uppercase italic">
                                    {isSignUp
                                        ? (userType === 'ARTIST' ? 'Register\nNode' : 'New\nAccount')
                                        : (userType === 'ARTIST' ? 'Artist\nAuth' : 'Welcome\nBack')}
                                </h2>
                                <div className="flex items-center gap-2">
                                    <div className="h-[2px] w-4 bg-primary"></div>
                                    <div className="font-display text-[10px] font-black uppercase tracking-[1.5px] text-neutral-black/30">
                                        {isSignUp ? "Already a Node? " : "New Arrival? "}
                                        <button
                                            onClick={() => setIsSignUp(!isSignUp)}
                                            className="text-neutral-black hover:text-primary transition-colors italic border-b border-neutral-black/10"
                                        >
                                            {isSignUp ? "Sync →" : "Entry →"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-neutral-g1 p-2 rounded-[4px] border-[1.5px] border-neutral-black/5 flex items-center justify-center">
                                <ShieldCheck className="w-5 h-5 opacity-20" />
                            </div>
                        </div>

                        {/* Forms */}
                        <div className="relative animate-in fade-in slide-in-from-bottom-2 duration-500 overflow-hidden">
                            {isSignUp ? (
                                <SignUpForm isArtist={userType === "ARTIST"} setIsSignUp={setIsSignUp} />
                            ) : (
                                <SignInForm isArtist={userType === "ARTIST"} />
                            )}
                        </div>
                    </div>

                    {/* Meta Info */}
                    <div className="mt-8 flex items-center justify-center gap-8 opacity-25 select-none shrink-0">
                        <div className="flex items-center gap-2 font-display text-[9px] font-black uppercase tracking-[3px]">
                            <ShieldCheck className="w-3 h-3 text-success" /> SSL_SECURED
                        </div>
                        <div className="flex items-center gap-2 font-display text-[9px] font-black uppercase tracking-[3px]">
                            <Star className="w-3 h-3 text-primary" /> TRUST_V4
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
