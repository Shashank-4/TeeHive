import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Instagram, Mail, Shield, Zap, Palette } from "lucide-react";
import api from "../../api/axios";

const INSTAGRAM_URL =
    "https://www.instagram.com/teehive.co.in?igsh=YWlvN3gwZ2h6eG11";

const creatorLinks: { label: string; to: string }[] = [
    { label: "Global Registry", to: "/artists" },
    { label: "Register Node", to: "/login?mode=signup&type=artist" },
    { label: "Artist Agreement", to: "/artist-agreement" },
    { label: "Tax & Payout", to: "/artist-tax-payout-policy" },
];

const INVENTORY_LINKS: { label: string; to: string }[] = [
    { label: "New drops", to: "/products?sort=newest" },
    { label: "Shop all", to: "/products" },
    { label: "Hive50", to: "/hive50" },
];

function FooterInventoryLinks() {
    const [flashTo, setFlashTo] = useState("/products");

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await api.get("/api/promotions/special-offer");
                const offer = res.data?.data;
                const cat = String(offer?.categoryName || "").trim();
                if (cancelled || !offer?.isVisible || !cat) return;
                setFlashTo(`/products?category=${encodeURIComponent(cat)}`);
            } catch {
                /* keep default */
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    return (
        <div className="flex flex-col gap-4">
            {INVENTORY_LINKS.map((item) => (
                <Link
                    key={item.to + item.label}
                    to={item.to}
                    className="font-display text-[14px] font-black uppercase text-neutral-black/60 hover:text-primary hover:translate-x-2 transition-all no-underline inline-block group"
                >
                    {item.label}
                </Link>
            ))}
            <Link
                to={flashTo}
                className="font-display text-[14px] font-black uppercase text-neutral-black/60 hover:text-primary hover:translate-x-2 transition-all no-underline inline-block group"
            >
                Flash sale
            </Link>
        </div>
    );
}

export default function Footer() {

    return (
        <div className="bg-white border-t-[3px] border-neutral-black py-20 px-4 md:px-16 overflow-hidden relative">
            <div className="absolute top-0 left-[-5%] text-[300px] font-display font-black text-neutral-black/[0.03] select-none leading-none -z-0 pointer-events-none uppercase">HIVE</div>

            <div className="relative z-10 space-y-24">
                {/* ── CONTACT STRIP (same layout as former newsletter band) ── */}
                <section className="bg-neutral-black text-white p-4 sm:p-10 md:p-16 rounded-[6px] border-[3px] border-neutral-black shadow-[5px_5px_0px_0px_rgba(255,222,0,1)] sm:shadow-[12px_12px_0px_0px_rgba(255,222,0,1)] flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-5 sm:gap-10 lg:gap-12 group hover:shadow-none hover:translate-x-1.5 hover:translate-y-1.5 sm:hover:translate-x-3 sm:hover:translate-y-3 transition-all duration-300">
                    <div className="space-y-2 sm:space-y-4 max-w-[500px]">
                        <div className="inline-flex items-center gap-2 bg-primary text-neutral-black px-2.5 sm:px-3 py-1 rounded-[4px] font-display text-[8px] sm:text-[9px] font-black uppercase tracking-[2px]">
                            <Mail className="w-3 h-3 shrink-0" /> Contact
                        </div>
                        <h2 className="font-display text-[clamp(22px,6.5vw,52px)] font-black tracking-tight leading-[0.95] uppercase">
                            GET IN <span className="text-primary italic">TOUCH.</span>
                        </h2>
                        <p className="font-display text-[11px] sm:text-[14px] font-bold text-white/50 leading-snug sm:leading-relaxed">
                            Questions about an order, a design, or working with us? Send us an email and we will get back to you.
                        </p>
                    </div>
                    <div className="flex w-full lg:w-auto flex-1 max-w-[480px] group/form flex-col gap-3 min-w-0 sm:flex-row sm:items-stretch sm:gap-0">
                        <div className="flex w-full min-h-[52px] sm:min-h-[56px] sm:flex-1 sm:min-w-0 items-stretch bg-white text-neutral-black border-[3px] sm:border-[3.5px] border-white rounded-[4px] sm:rounded-r-none sm:border-r-0 px-4 sm:px-6 py-3 sm:py-4 font-display text-[12px] sm:text-[13px] font-bold outline-none">
                            <a
                                href="mailto:contact@teehive.co.in"
                                className="text-neutral-black hover:text-primary transition-colors break-all no-underline self-center"
                            >
                                contact@teehive.co.in
                            </a>
                        </div>
                        <a
                            href="mailto:contact@teehive.co.in"
                            className="bg-primary text-neutral-black border-[3px] sm:border-[3.5px] border-primary rounded-[4px] sm:rounded-l-none sm:border-l-0 sm:rounded-r-[4px] px-5 sm:px-8 py-3 sm:py-0 min-h-[48px] sm:min-h-[56px] w-auto max-w-full self-center sm:self-auto font-display text-[12px] sm:text-[14px] font-black tracking-[2px] uppercase whitespace-nowrap hover:bg-white hover:text-neutral-black hover:border-white transition-all group-hover/form:translate-x-0.5 sm:group-hover/form:translate-x-1 duration-300 inline-flex items-center justify-center gap-2 shadow-none sm:shadow-[4px_0_12px_rgba(255,222,0,0.3)] no-underline shrink-0"
                        >
                            Email us <ArrowRight className="w-4 h-4 shrink-0" />
                        </a>
                    </div>
                </section>

                {/* ── MAIN FOOTER ── */}
                <footer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr] gap-16 lg:gap-24">
                    {/* Brand Meta */}
                    <div className="space-y-2">
                        <Link to="/" className="inline-flex items-center no-underline group">
                            <img
                                src="/assets/logoHorizontalBlack.svg"
                                alt="TeeHive — custom artist t-shirts and apparel, India"
                                className="h-14 sm:h-16 md:h-20 w-auto max-w-[min(360px,92vw)] object-contain object-left transition-opacity group-hover:opacity-90"
                                width={360}
                                height={68}
                                loading="lazy"
                            />
                        </Link>
                        <p className="font-display text-[13px] sm:text-[14px] font-black uppercase tracking-wide m-0 text-neutral-black/40 leading-relaxed max-w-md">
                            Shop original artist tees and apparel in India. Fair shipping, clear returns, and easy checkout.
                            Artists sell custom merch with transparent tax and royalty payouts.
                        </p>
                        <div className="flex gap-4 mt-2">
                            <a
                                href={INSTAGRAM_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="TeeHive on Instagram"
                                className="w-12 h-12 border-[2.5px] border-neutral-black rounded-[4px] flex items-center justify-center text-neutral-black transition-all hover:bg-neutral-black hover:text-primary hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] active:translate-y-0"
                            >
                                <Instagram className="w-5 h-5" />
                            </a>
                        </div>
                    </div>

                    {/* Catalog */}
                    <div className="space-y-8">
                        <h4 className="font-display text-[12px] font-black tracking-[3px] uppercase text-neutral-black/30 flex items-center gap-2">
                            <Zap className="w-3 h-3 text-primary" /> INVENTORY
                        </h4>
                        <FooterInventoryLinks />
                    </div>

                    {/* Creator Registry */}
                    <div className="space-y-8">
                        <h4 className="font-display text-[12px] font-black tracking-[3px] uppercase text-neutral-black/30 flex items-center gap-2">
                            <Palette className="w-3 h-3 text-primary" /> CREATORS
                        </h4>
                        <div className="flex flex-col gap-4">
                            {creatorLinks.map((item) => (
                                <Link
                                    key={item.to + item.label}
                                    to={item.to}
                                    className="font-display text-[14px] font-black uppercase text-neutral-black/60 hover:text-primary hover:translate-x-2 transition-all no-underline inline-block group"
                                >
                                    {item.label}
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Infrastructure */}
                    <div className="space-y-8">
                        <h4 className="font-display text-[12px] font-black tracking-[3px] uppercase text-neutral-black/30 flex items-center gap-2">
                            <Shield className="w-3 h-3 text-primary" /> SUPPORT
                        </h4>
                        <div className="flex flex-col gap-4">
                            <Link
                                to="/copyright-takedown-policy"
                                className="font-display text-[14px] font-black uppercase text-neutral-black/60 hover:text-primary hover:translate-x-2 transition-all no-underline inline-block group"
                            >
                                Copyright Takedown
                            </Link>
                            <Link
                                to="/grievance-redressal"
                                className="font-display text-[14px] font-black uppercase text-neutral-black/60 hover:text-primary hover:translate-x-2 transition-all no-underline inline-block group"
                            >
                                Grievance Redressal
                            </Link>
                            <Link
                                to="/return-refund-policy"
                                className="font-display text-[14px] font-black uppercase text-neutral-black/60 hover:text-primary hover:translate-x-2 transition-all no-underline inline-block group"
                            >
                                Return &amp; Refund
                            </Link>
                            <Link
                                to="/shipping-policy"
                                className="font-display text-[14px] font-black uppercase text-neutral-black/60 hover:text-primary hover:translate-x-2 transition-all no-underline inline-block group"
                            >
                                Shipping
                            </Link>
                        </div>
                    </div>
                </footer>

                {/* ── Lower bar: copyright + legal links ── */}
                <div className="pt-10 border-t-[2.5px] border-neutral-black flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                    <p className="font-display text-[11px] sm:text-[12px] font-bold text-neutral-black/45 normal-case tracking-wide order-1 sm:order-none">
                        © {new Date().getFullYear()} TeeHive (Karuna Innovations, India). All rights reserved.
                    </p>

                    <div className="flex flex-wrap gap-x-8 gap-y-2 order-2 sm:order-none">
                        <Link
                            to="/privacy-policy"
                            className="font-display text-[10px] font-black text-neutral-black/40 hover:text-primary transition-all no-underline uppercase tracking-[2px]"
                        >
                            Privacy
                        </Link>
                        <Link
                            to="/terms"
                            className="font-display text-[10px] font-black text-neutral-black/40 hover:text-primary transition-all no-underline uppercase tracking-[2px]"
                        >
                            Terms
                        </Link>
                        <Link
                            to="/privacy-policy#data-storage-security"
                            className="font-display text-[10px] font-black text-neutral-black/40 hover:text-primary transition-all no-underline uppercase tracking-[2px]"
                        >
                            Security
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
