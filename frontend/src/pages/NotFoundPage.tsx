import { Link } from "react-router-dom";
import { Home, Search } from "lucide-react";
import { Button } from "../components/ui/Button";

const notFoundBtnClass =
    "w-full h-14 shrink-0 justify-center gap-2 px-4 text-[12px] sm:text-[13px] !py-0 leading-none";

export default function NotFoundPage() {
    return (
        <div className="min-h-[calc(100dvh-4.25rem)] sm:min-h-[calc(100dvh-4.75rem)] bg-neutral-g1 text-neutral-black font-body flex flex-col items-center justify-center px-4 sm:px-6 py-10 relative overflow-hidden">
            <div
                className="absolute inset-x-0 top-8 text-center text-[clamp(100px,22vw,180px)] font-display font-black text-neutral-black/[0.04] select-none pointer-events-none leading-none uppercase tracking-tighter"
                aria-hidden
            >
                404
            </div>

            <div className="relative z-10 w-full max-w-lg text-center">
                <p className="font-display text-[10px] font-black uppercase tracking-[3px] text-neutral-black/35 mb-4">
                    Page not found
                </p>

                <h1 className="font-display text-[clamp(52px,12vw,88px)] font-black leading-none tracking-tight uppercase mb-2">
                    <span className="text-neutral-black">Lost</span>
                    <br />
                    <span className="text-primary italic [text-shadow:0.08em_0.08em_0_rgb(10,10,10),0_0.04em_0_rgb(10,10,10),0_0.35em_0.65em_rgba(0,0,0,0.22),0_0_1.1em_rgba(255,222,0,0.45)]">
                        In the hive
                    </span>
                </h1>

                <p className="font-body text-[14px] sm:text-[17px] text-neutral-black/60 leading-relaxed mt-6 mb-8 max-w-md mx-auto uppercase">
                    That URL is not part of TeeHive. Try the homepage, search artist-designed tees and apparel, or browse our India catalog.
                </p>

                <div className="bg-white border-[3px] border-neutral-black rounded-[4px] p-6 sm:p-7 shadow-[8px_8px_0px_0px_rgba(255,222,0,1)] text-left space-y-4">
                    <p className="font-display text-[10px] font-black uppercase tracking-[2px] text-neutral-black/40">
                        Popular next steps
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Link to="/" className="no-underline min-w-0 block">
                            <Button variant="dark" size="lg" className={notFoundBtnClass}>
                                <Home className="w-4 h-4 shrink-0" aria-hidden />
                                Home
                            </Button>
                        </Link>
                        <Link to="/products" className="no-underline min-w-0 block">
                            <Button variant="outline" size="lg" className={notFoundBtnClass}>
                                <Search className="w-4 h-4 shrink-0" aria-hidden />
                                Browse products
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
