import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { User, Palette, ArrowRight } from "lucide-react";
import SignInForm from "../components/forms/SignInForm";
import SignUpForm from "../components/forms/SignUpForm";
import { useSiteHeaderLogo } from "../hooks/useSiteHeaderLogo";

const LEGAL_LINKS = [
    { label: "Privacy Policy", to: "/privacy-policy" },
    { label: "Terms", to: "/terms" },
    { label: "Artist Agreement", to: "/artist-agreement" },
] as const;

/** Desktop form column: centers when short, scrolls when content + viewport need it. */
function DesktopFormColumn({
    isArtist,
    isSignUp,
    setIsSignUp,
    headerLogoSrc,
    subtitle,
}: {
    isArtist: boolean;
    isSignUp: boolean;
    setIsSignUp: (v: boolean) => void;
    headerLogoSrc: string;
    subtitle: string;
}) {
    return (
        <div className="mx-auto flex h-full min-h-0 w-full max-h-full max-w-[400px] flex-col items-center overflow-y-auto overscroll-y-contain px-4 py-4 sm:px-6 sm:py-6 md:px-8">
            <Link to="/" className="mb-2 shrink-0">
                <img src={headerLogoSrc} alt="TeeHive" className="h-16 sm:h-20 w-auto max-w-[min(280px,85vw)] object-contain object-center" />
            </Link>
            <h2 className="font-display text-[clamp(22px,4vw,30px)] font-black uppercase tracking-tight text-neutral-black leading-none mb-2 w-full text-center shrink-0">
                {isSignUp ? "Create Account" : "Sign In"}
            </h2>
            <p className="font-display text-[10px] sm:text-[11px] font-bold uppercase tracking-[1.5px] text-neutral-black/40 mb-4 sm:mb-6 w-full text-center shrink-0 px-1">
                {subtitle}
            </p>

            <div className="w-full min-w-0 shrink-0">
                {isSignUp ? (
                    <SignUpForm isArtist={isArtist} setIsSignUp={setIsSignUp} />
                ) : (
                    <SignInForm isArtist={isArtist} />
                )}
            </div>

            <div className="mt-5 sm:mt-6 pt-4 sm:pt-5 border-t-[2px] border-neutral-black/10 flex flex-col items-center gap-4 w-full shrink-0">
                <button
                    type="button"
                    onClick={() => setIsSignUp(!isSignUp)}
                    className="group flex flex-wrap items-center justify-center gap-x-2 gap-y-1 font-display text-[10px] sm:text-[11px] font-black uppercase tracking-[2px] text-neutral-black/40 hover:text-neutral-black transition-colors text-center px-1"
                >
                    {isSignUp ? "Already have an account?" : "New to TeeHive?"}
                    <span className="text-neutral-black underline underline-offset-4 decoration-primary decoration-[3px] group-hover:text-primary transition-colors">
                        {isSignUp ? "Sign In" : "Create Account"}
                    </span>
                    <ArrowRight className="w-4 h-4 text-primary group-hover:translate-x-1 transition-transform shrink-0" />
                </button>
            </div>

            <div className="mt-5 sm:mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 w-full shrink-0 pb-1">
                {LEGAL_LINKS.map(({ label, to }) => (
                    <Link
                        key={to}
                        to={to}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-display text-[8px] sm:text-[9px] font-black uppercase tracking-[2px] text-neutral-black/30 hover:text-primary transition-colors no-underline"
                    >
                        {label}
                    </Link>
                ))}
            </div>
        </div>
    );
}

export default function LoginPage() {
    const [searchParams] = useSearchParams();
    const [isArtist, setIsArtist] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false);
    const headerLogoSrc = useSiteHeaderLogo();

    useEffect(() => {
        const type = (searchParams.get("type") || "").toLowerCase();
        const mode = (searchParams.get("mode") || "").toLowerCase();
        if (type === "artist") setIsArtist(true);
        if (mode === "signup") setIsSignUp(true);
    }, [searchParams]);

    return (
        <div className="relative flex h-[100dvh] min-h-0 w-full max-w-[100vw] overflow-hidden bg-white font-body text-neutral-black">

            {/* ─── MOBILE VIEW ─── */}
            <div className="md:hidden flex h-[100dvh] min-h-0 w-full flex-col bg-white overflow-hidden z-50 relative">
                <div className="flex min-h-0 flex-1 flex-col">
                    <div className="shrink-0 flex flex-col items-center px-4 pt-[max(0.5rem,env(safe-area-inset-top))]">
                        <Link to="/" className="mb-3 mt-1">
                            <img
                                src={headerLogoSrc}
                                alt="TeeHive"
                                className="h-11 min-[400px]:h-12 w-auto max-w-[min(260px,88vw)] object-contain object-center"
                            />
                        </Link>

                        <div className="flex w-full max-w-[min(320px,100%)] gap-1 rounded-[4px] border-[3px] border-neutral-black bg-white p-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                            <button
                                type="button"
                                onClick={() => setIsArtist(false)}
                                className={`flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-[2px] py-2 font-display text-[9px] min-[360px]:text-[10px] font-black uppercase tracking-[1.5px] min-[360px]:tracking-[2px] transition-all duration-200 ${
                                    !isArtist
                                        ? "border-[2px] border-neutral-black bg-primary text-neutral-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                                        : "border-[2px] border-transparent bg-transparent text-neutral-black/40 hover:text-neutral-black"
                                }`}
                            >
                                <User className="h-3.5 w-3.5 shrink-0" /> Customer
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsArtist(true)}
                                className={`flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-[2px] py-2 font-display text-[9px] min-[360px]:text-[10px] font-black uppercase tracking-[1.5px] min-[360px]:tracking-[2px] transition-all duration-200 ${
                                    isArtist
                                        ? "border-[2px] border-neutral-black bg-primary text-neutral-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                                        : "border-[2px] border-transparent bg-transparent text-neutral-black/40 hover:text-neutral-black"
                                }`}
                            >
                                <Palette className="h-3.5 w-3.5 shrink-0" /> Artist
                            </button>
                        </div>

                        <h2 className="font-display mb-1.5 mt-4 w-full text-center text-[clamp(22px,6.5vw,28px)] font-black uppercase leading-none tracking-tight text-neutral-black">
                            {isSignUp ? "Create Account" : "Sign In"}
                        </h2>
                        <p className="mb-4 w-full max-w-[min(340px,100%)] text-center font-display text-[10px] font-bold uppercase leading-snug tracking-[1.5px] text-neutral-black/40">
                            {isSignUp
                                ? isArtist
                                    ? "Join as a TeeHive Artist"
                                    : "Join TeeHive as a Customer"
                                : isArtist
                                  ? "Access your Artist Portal"
                                  : "Access your Customer Dashboard"}
                        </p>
                    </div>

                    <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-4">
                        <div className="mx-auto flex w-full max-w-[min(380px,100%)] flex-col items-center pb-4">
                            {isSignUp ? (
                                <SignUpForm isArtist={isArtist} setIsSignUp={setIsSignUp} />
                            ) : (
                                <SignInForm isArtist={isArtist} />
                            )}

                            <div className="mt-5 w-full border-t-[2px] border-neutral-black/10 pt-5">
                                <button
                                    type="button"
                                    onClick={() => setIsSignUp(!isSignUp)}
                                    className="group flex w-full flex-wrap items-center justify-center gap-x-2 gap-y-1 font-display text-[10px] font-black uppercase tracking-[2px] text-neutral-black/40 transition-colors hover:text-neutral-black"
                                >
                                    {isSignUp ? "Already have an account?" : "New to TeeHive?"}
                                    <span className="text-neutral-black underline decoration-primary decoration-[3px] underline-offset-4 transition-colors group-hover:text-primary">
                                        {isSignUp ? "Sign In" : "Create Account"}
                                    </span>
                                    <ArrowRight className="h-4 w-4 shrink-0 text-primary transition-transform group-hover:translate-x-1" />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="shrink-0 border-t border-neutral-black/5 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
                        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
                            {LEGAL_LINKS.map(({ label, to }) => (
                                <Link
                                    key={to}
                                    to={to}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-display text-[8px] font-black uppercase tracking-[2px] text-neutral-black/30 transition-colors hover:text-primary no-underline"
                                >
                                    {label}
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── DESKTOP VIEW ─── */}

            {/* Left Side: Customer Form Box */}
            <div
                className={`absolute left-0 top-0 hidden h-[100dvh] max-h-[100dvh] min-h-0 w-1/2 overflow-hidden bg-white transition-all duration-700 ease-in-out md:flex ${
                    isArtist ? "z-10 translate-x-full opacity-0" : "z-20 translate-x-0 opacity-100"
                }`}
            >
                <div className="flex h-full min-h-0 w-full flex-col items-stretch justify-center px-2 sm:px-4">
                    <DesktopFormColumn
                        isArtist={false}
                        isSignUp={isSignUp}
                        setIsSignUp={setIsSignUp}
                        headerLogoSrc={headerLogoSrc}
                        subtitle={
                            isSignUp ? "Join TeeHive as a Customer" : "Access your Customer Dashboard"
                        }
                    />
                </div>
            </div>

            {/* Artist Form Box */}
            <div
                className={`absolute left-0 top-0 hidden h-[100dvh] max-h-[100dvh] min-h-0 w-1/2 overflow-hidden bg-white transition-all duration-700 ease-in-out md:flex ${
                    isArtist ? "z-20 translate-x-full opacity-100 animate-[show_0.6s]" : "z-10 translate-x-0 opacity-0"
                }`}
            >
                <div className="flex h-full min-h-0 w-full flex-col items-stretch justify-center px-2 sm:px-4">
                    <DesktopFormColumn
                        isArtist
                        isSignUp={isSignUp}
                        setIsSignUp={setIsSignUp}
                        headerLogoSrc={headerLogoSrc}
                        subtitle={isSignUp ? "Join as a TeeHive Artist" : "Access your Artist Portal"}
                    />
                </div>
            </div>

            {/* Sliding promo overlay */}
            <div
                className={`absolute left-1/2 top-0 z-[100] hidden h-[100dvh] max-h-[100dvh] min-h-0 w-1/2 overflow-hidden transition-transform duration-700 ease-in-out md:block ${
                    isArtist ? "-translate-x-full" : ""
                }`}
            >
                <div
                    className={`relative -left-full h-full min-h-0 w-[200%] bg-neutral-black transition-transform duration-700 ease-in-out ${
                        isArtist ? "translate-x-1/2" : "translate-x-0"
                    }`}
                >
                    <div className="pointer-events-none absolute inset-0 overflow-hidden">
                        <div className="absolute left-[-8%] top-[-5%] select-none font-display text-[clamp(72px,22vmin,280px)] font-black uppercase leading-none text-white/[0.03]">
                            HIVE
                        </div>
                        <div className="pointer-events-none absolute bottom-[-10%] right-[-10%] h-[min(500px,70vmin)] w-[min(500px,70vmin)] rounded-full bg-primary/10 blur-[120px]" />
                        <div className="pointer-events-none absolute left-[-10%] top-[-10%] h-[min(400px,55vmin)] w-[min(400px,55vmin)] rounded-full bg-primary/5 blur-[100px]" />
                    </div>

                    <div
                        className={`absolute left-0 top-0 flex h-full min-h-0 w-1/2 flex-col items-center justify-center overflow-y-auto overscroll-y-contain px-4 text-center transition-transform duration-700 ease-in-out min-[900px]:px-10 lg:px-12 ${
                            isArtist ? "translate-x-0" : "-translate-x-[12%] min-[1100px]:-translate-x-[20%]"
                        }`}
                    >
                        <div className="flex max-w-[min(320px,92%)] flex-col items-center py-4">
                            <h2 className="mb-3 font-display text-[clamp(26px,3.8vw+1.2vh,48px)] font-black uppercase leading-[1.05] tracking-tight text-white min-[900px]:mb-4">
                                Shop <br />
                                <span className="text-primary italic">Custom Art.</span>
                            </h2>
                            <p className="mb-6 max-w-[min(300px,94%)] font-display text-[clamp(12px,1.1vw+0.8vh,14px)] font-bold leading-relaxed tracking-[1.5px] text-white/60 min-[900px]:mb-10">
                                Discover unique designs by independent Indian artists on premium apparel.
                            </p>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsArtist(false);
                                    setIsSignUp(false);
                                }}
                                className="flex max-w-full flex-wrap items-center justify-center gap-2 border-[3px] border-white bg-white px-6 py-3 font-display text-[11px] font-black uppercase tracking-[2px] text-neutral-black shadow-[6px_6px_0px_0px_rgba(255,222,0,1)] transition-all duration-300 min-[900px]:gap-3 min-[900px]:px-10 min-[900px]:py-4 min-[900px]:text-[12px] min-[900px]:tracking-[2.5px] hover:translate-x-0 hover:translate-y-0 hover:shadow-none sm:-translate-x-1 sm:-translate-y-1"
                            >
                                <User className="h-4 w-4 shrink-0" />
                                <span className="text-center">Switch to Customer</span>
                            </button>
                        </div>
                    </div>

                    <div
                        className={`absolute right-0 top-0 flex h-full min-h-0 w-1/2 flex-col items-center justify-center overflow-y-auto overscroll-y-contain px-4 text-center transition-transform duration-700 ease-in-out min-[900px]:px-10 lg:px-12 ${
                            isArtist ? "translate-x-[12%] min-[1100px]:translate-x-[20%]" : "translate-x-0"
                        }`}
                    >
                        <div className="flex max-w-[min(320px,92%)] flex-col items-center py-4">
                            <h2 className="mb-3 font-display text-[clamp(26px,3.8vw+1.2vh,48px)] font-black uppercase leading-[1.05] tracking-tight text-white min-[900px]:mb-4">
                                Sell <br />
                                <span className="text-primary italic">Your Art.</span>
                            </h2>
                            <p className="mb-6 max-w-[min(300px,94%)] font-display text-[clamp(12px,1.1vw+0.8vh,14px)] font-bold leading-relaxed tracking-[1.5px] text-white/60 min-[900px]:mb-10">
                                Launch your own storefront, set your margins, and earn fair royalties.
                            </p>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsArtist(true);
                                    setIsSignUp(false);
                                }}
                                className="flex max-w-full flex-wrap items-center justify-center gap-2 border-[3px] border-white bg-white px-6 py-3 font-display text-[11px] font-black uppercase tracking-[2px] text-neutral-black shadow-[6px_6px_0px_0px_rgba(255,222,0,1)] transition-all duration-300 min-[900px]:gap-3 min-[900px]:px-10 min-[900px]:py-4 min-[900px]:text-[12px] min-[900px]:tracking-[2.5px] hover:translate-x-0 hover:translate-y-0 hover:shadow-none sm:-translate-x-1 sm:-translate-y-1"
                            >
                                <Palette className="h-4 w-4 shrink-0" />
                                <span className="text-center">Switch to Artist</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <style
                dangerouslySetInnerHTML={{
                    __html: `
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
            `,
                }}
            />
        </div>
    );
}
