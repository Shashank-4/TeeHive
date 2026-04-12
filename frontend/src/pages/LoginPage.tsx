import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { User, Palette, ArrowRight } from "lucide-react";
import SignInForm from "../components/forms/SignInForm";
import SignUpForm from "../components/forms/SignUpForm";

const LOGO_BLACK = "/assets/logoHorizontalBlack.svg";

export default function LoginPage() {
    const [searchParams] = useSearchParams();
    const [isArtist, setIsArtist] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false);

    useEffect(() => {
        const type = (searchParams.get("type") || "").toLowerCase();
        const mode = (searchParams.get("mode") || "").toLowerCase();
        if (type === "artist") setIsArtist(true);
        if (mode === "signup") setIsSignUp(true);
    }, [searchParams]);

    return (
        <div className="flex h-[100dvh] w-full font-body bg-white text-neutral-black overflow-hidden relative">

            {/* ─── MOBILE VIEW ─── */}
            <div className="md:hidden w-full h-[100dvh] flex flex-col bg-white overflow-hidden z-50 relative">
                <div className="flex-1 p-4 flex flex-col items-center justify-center">
                    <Link to="/" className="mb-4 mt-2">
                        <img src={LOGO_BLACK} alt="TeeHive" className="h-12 w-auto" />
                    </Link>
                    
                    {/* Role Tabs for mobile */}
                    <div className="flex p-1 bg-white border-[3px] border-neutral-black rounded-[4px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] gap-1 w-full max-w-[320px] mb-6">
                        <button
                            onClick={() => setIsArtist(false)}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[2px] font-display text-[10px] font-black uppercase tracking-[2px] transition-all duration-200
                                ${!isArtist
                                    ? "bg-primary text-neutral-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] border-[2px] border-neutral-black"
                                    : "bg-transparent text-neutral-black/40 border-[2px] border-transparent hover:text-neutral-black"
                                }`}
                        >
                            <User className="w-3.5 h-3.5" /> Customer
                        </button>
                        <button
                            onClick={() => setIsArtist(true)}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[2px] font-display text-[10px] font-black uppercase tracking-[2px] transition-all duration-200
                                ${isArtist
                                    ? "bg-primary text-neutral-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] border-[2px] border-neutral-black"
                                    : "bg-transparent text-neutral-black/40 border-[2px] border-transparent hover:text-neutral-black"
                                }`}
                        >
                            <Palette className="w-3.5 h-3.5" /> Artist
                        </button>
                    </div>

                    <h2 className="font-display text-[28px] font-black uppercase tracking-tight text-neutral-black leading-none mb-2 w-full text-center">
                        {isSignUp ? "Create Account" : "Sign In"}
                    </h2>
                    <p className="font-display text-[11px] font-bold uppercase tracking-[1.5px] text-neutral-black/40 mb-6 w-full text-center">
                        {isSignUp 
                            ? (isArtist ? "Join as a TeeHive Artist" : "Join TeeHive as a Customer")
                            : (isArtist ? "Access your Artist Portal" : "Access your Customer Dashboard")
                        }
                    </p>

                    <div className="w-full max-w-[380px]">
                        {isSignUp 
                            ? <SignUpForm isArtist={isArtist} setIsSignUp={setIsSignUp} /> 
                            : <SignInForm isArtist={isArtist} />
                        }
                    </div>

                    <div className="mt-6 mb-4 pt-5 border-t-[2px] border-neutral-black/10 flex flex-col items-center gap-4 w-full max-w-[380px]">
                        <button 
                            onClick={() => setIsSignUp(!isSignUp)} 
                            className="group flex items-center justify-center gap-3 font-display text-[11px] font-black uppercase tracking-[2px] text-neutral-black/40 hover:text-neutral-black transition-colors"
                        >
                            {isSignUp ? "Already have an account?" : "New to TeeHive?"}
                            <span className="text-neutral-black underline underline-offset-4 decoration-primary decoration-[3px] group-hover:text-primary transition-colors">
                                {isSignUp ? "Sign In" : "Create Account"}
                            </span>
                            <ArrowRight className="w-4 h-4 text-primary group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                    
                    {/* Footer Legal Links */}
                    <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-auto pb-4">
                        {[
                            { label: "Privacy Policy", to: "/privacy-policy" },
                            { label: "Terms", to: "/terms" },
                            { label: "Artist Agreement", to: "/artist-agreement" },
                        ].map(({ label, to }) => (
                            <Link
                                key={to}
                                to={to}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-display text-[9px] font-black uppercase tracking-[2px] text-neutral-black/30 hover:text-primary transition-colors no-underline"
                            >
                                {label}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>

            {/* ─── DESKTOP VIEW ─── */}
            
            {/* Left Side: Customer Form Box */}
            <div className={`hidden md:flex absolute top-0 left-0 w-1/2 h-full transition-all duration-700 ease-in-out px-8 py-6 flex-col justify-center bg-white ${isArtist ? "translate-x-full opacity-0 z-10" : "translate-x-0 opacity-100 z-20"}`}>
                <div className="w-full max-w-[400px] mx-auto flex flex-col items-center">
                    <Link to="/" className="mb-2">
                        <img src={LOGO_BLACK} alt="TeeHive" className="h-20 w-auto" />
                    </Link>
                    <h2 className="font-display text-[30px] font-black uppercase tracking-tight text-neutral-black leading-none mb-2 w-full text-center">
                        {isSignUp ? "Create Account" : "Sign In"}
                    </h2>
                    <p className="font-display text-[11px] font-bold uppercase tracking-[1.5px] text-neutral-black/40 mb-6 w-full text-center">
                        {isSignUp ? "Join TeeHive as a Customer" : "Access your Customer Dashboard"}
                    </p>
                    
                    <div className="w-full">
                        {isSignUp ? <SignUpForm isArtist={false} setIsSignUp={setIsSignUp} /> : <SignInForm isArtist={false} />}
                    </div>
                    
                    <div className="mt-6 pt-5 border-t-[2px] border-neutral-black/10 flex flex-col items-center gap-4 w-full">
                        <button 
                            onClick={() => setIsSignUp(!isSignUp)} 
                            className="group flex items-center justify-center gap-3 font-display text-[11px] font-black uppercase tracking-[2px] text-neutral-black/40 hover:text-neutral-black transition-colors"
                        >
                            {isSignUp ? "Already have an account?" : "New to TeeHive?"}
                            <span className="text-neutral-black underline underline-offset-4 decoration-primary decoration-[3px] group-hover:text-primary transition-colors">
                                {isSignUp ? "Sign In" : "Create Account"}
                            </span>
                            <ArrowRight className="w-4 h-4 text-primary group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>

                    <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 w-full">
                        {[
                            { label: "Privacy Policy", to: "/privacy-policy" },
                            { label: "Terms", to: "/terms" },
                            { label: "Artist Agreement", to: "/artist-agreement" },
                        ].map(({ label, to }) => (
                            <Link
                                key={to}
                                to={to}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-display text-[9px] font-black uppercase tracking-[2px] text-neutral-black/30 hover:text-primary transition-colors no-underline"
                            >
                                {label}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>

            {/* Left Side (Shifts Right): Artist Form Box */}
            <div className={`hidden md:flex absolute top-0 left-0 w-1/2 h-full transition-all duration-700 ease-in-out px-8 py-6 flex-col justify-center bg-white ${isArtist ? "translate-x-full opacity-100 z-20 animate-[show_0.6s]" : "translate-x-0 opacity-0 z-10"}`}>
                <div className="w-full max-w-[400px] mx-auto flex flex-col items-center">
                    <Link to="/" className="mb-2">
                        <img src={LOGO_BLACK} alt="TeeHive" className="h-20 w-auto" />
                    </Link>
                    <h2 className="font-display text-[30px] font-black uppercase tracking-tight text-neutral-black leading-none mb-2 w-full text-center">
                        {isSignUp ? "Create Account" : "Sign In"}
                    </h2>
                    <p className="font-display text-[11px] font-bold uppercase tracking-[1.5px] text-neutral-black/40 mb-6 w-full text-center">
                        {isSignUp ? "Join as a TeeHive Artist" : "Access your Artist Portal"}
                    </p>
                    
                    <div className="w-full">
                        {isSignUp ? <SignUpForm isArtist={true} setIsSignUp={setIsSignUp} /> : <SignInForm isArtist={true} />}
                    </div>
                    
                    <div className="mt-6 pt-5 border-t-[2px] border-neutral-black/10 flex flex-col items-center gap-4 w-full">
                        <button 
                            onClick={() => setIsSignUp(!isSignUp)} 
                            className="group flex items-center justify-center gap-3 font-display text-[11px] font-black uppercase tracking-[2px] text-neutral-black/40 hover:text-neutral-black transition-colors"
                        >
                            {isSignUp ? "Already have an account?" : "New to TeeHive?"}
                            <span className="text-neutral-black underline underline-offset-4 decoration-primary decoration-[3px] group-hover:text-primary transition-colors">
                                {isSignUp ? "Sign In" : "Create Account"}
                            </span>
                            <ArrowRight className="w-4 h-4 text-primary group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>

                    <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 w-full">
                        {[
                            { label: "Privacy Policy", to: "/privacy-policy" },
                            { label: "Terms", to: "/terms" },
                            { label: "Artist Agreement", to: "/artist-agreement" },
                        ].map(({ label, to }) => (
                            <Link
                                key={to}
                                to={to}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-display text-[9px] font-black uppercase tracking-[2px] text-neutral-black/30 hover:text-primary transition-colors no-underline"
                            >
                                {label}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>

            {/* The Sliding Overlay Wrapper */}
            <div className={`hidden md:block absolute top-0 left-1/2 w-1/2 h-full overflow-hidden transition-transform duration-700 ease-in-out z-[100] ${isArtist ? "-translate-x-full" : ""}`}>
                
                {/* The Sliding Overlay Inner Background */}
                <div className={`relative -left-full w-[200%] h-full bg-neutral-black transition-transform duration-700 ease-in-out ${isArtist ? "translate-x-1/2" : "translate-x-0"}`}>
                    
                    {/* Watermark / Glow inside the panel */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <div className="absolute top-[-5%] left-[-5%] text-[300px] font-display font-black text-white/[0.03] select-none leading-none uppercase">HIVE</div>
                        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />
                        <div className="absolute top-[-10%] left-[-10%] w-[400px] h-[400px] bg-primary/5 blur-[100px] rounded-full pointer-events-none" />
                    </div>

                    {/* Left Panel Content (Visible when Artist form active, overlay is on left) */}
                    <div className={`absolute top-0 left-0 w-1/2 h-full flex flex-col justify-center items-center text-center px-12 transition-transform duration-700 ease-in-out ${isArtist ? "translate-x-0" : "-translate-x-[20%]"}`}>
                        <h2 className="font-display text-[48px] font-black uppercase tracking-tight text-white leading-[1.1] mb-4">
                            Shop <br/><span className="text-primary italic">Custom Art.</span>
                        </h2>
                        <p className="font-display text-[14px] font-bold tracking-[1.5px] text-white/60 mb-10 max-w-[300px] leading-relaxed">
                            Discover unique designs by independent Indian artists on premium apparel.
                        </p>
                        <button 
                            onClick={() => { setIsArtist(false); setIsSignUp(false); }}
                            className="px-10 py-4 border-[3px] border-white text-white font-display text-[12px] font-black uppercase tracking-[2.5px] hover:bg-white hover:text-neutral-black hover:shadow-[6px_6px_0px_0px_rgba(255,222,0,1)] hover:-translate-x-1 hover:-translate-y-1 transition-all duration-300 flex items-center gap-3"
                        >
                            <User className="w-4 h-4" />
                            Switch to Customer
                        </button>
                    </div>

                    {/* Right Panel Content (Visible when Customer form active, overlay is on right) */}
                    <div className={`absolute top-0 right-0 w-1/2 h-full flex flex-col justify-center items-center text-center px-12 transition-transform duration-700 ease-in-out ${isArtist ? "translate-x-[20%]" : "translate-x-0"}`}>
                        <h2 className="font-display text-[48px] font-black uppercase tracking-tight text-white leading-[1.1] mb-4">
                            Sell <br/><span className="text-primary italic">Your Art.</span>
                        </h2>
                        <p className="font-display text-[14px] font-bold tracking-[1.5px] text-white/60 mb-10 max-w-[300px] leading-relaxed">
                            Launch your own storefront, set your margins, and earn fair royalties.
                        </p>
                        <button 
                            onClick={() => { setIsArtist(true); setIsSignUp(false); }}
                            className="px-10 py-4 border-[3px] border-white text-white font-display text-[12px] font-black uppercase tracking-[2.5px] hover:bg-white hover:text-neutral-black hover:shadow-[6px_6px_0px_0px_rgba(255,222,0,1)] hover:-translate-x-1 hover:-translate-y-1 transition-all duration-300 flex items-center gap-3"
                        >
                            <Palette className="w-4 h-4" />
                            Switch to Artist
                        </button>
                    </div>

                </div>
            </div>

            {/* Global style overrides for the scrollbar and keyframes */}
            <style dangerouslySetInnerHTML={{__html: `
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
                .scrollbar-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
                @keyframes show {
                    0%, 49.99% { opacity: 0; z-index: 1; }
                    50%, 100% { opacity: 1; z-index: 20; }
                }
            `}} />
        </div>
    );
}
