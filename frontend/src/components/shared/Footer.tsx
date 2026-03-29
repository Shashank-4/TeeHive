import { Link } from "react-router-dom";
import { ArrowRight, Instagram, Twitter, Youtube, Mail, Shield, Globe, Zap, Palette } from "lucide-react";

export default function Footer() {
    const SOCIALS = [
        { icon: Instagram, label: "IG", color: "hover:text-primary" },
        { icon: Twitter, label: "TW", color: "hover:text-primary" },
        { icon: Youtube, label: "YT", color: "hover:text-danger" },
    ];

    return (
        <div className="bg-white border-t-[3px] border-neutral-black py-20 px-4 md:px-16 overflow-hidden relative">
            <div className="absolute top-0 left-[-5%] text-[300px] font-display font-black text-neutral-black/[0.03] select-none leading-none -z-0 pointer-events-none uppercase">HIVE</div>

            <div className="relative z-10 space-y-24">
                {/* ── NEWSLETTER STRIP ── */}
                <section className="bg-neutral-black text-white p-12 md:p-16 rounded-[6px] border-[3px] border-neutral-black shadow-[12px_12px_0px_0px_rgba(255,222,0,1)] flex flex-col lg:flex-row items-center justify-between gap-12 group hover:shadow-none hover:translate-x-3 hover:translate-y-3 transition-all duration-300">
                    <div className="space-y-4 max-w-[500px]">
                        <div className="inline-flex items-center gap-2 bg-primary text-neutral-black px-3 py-1 rounded-[4px] font-display text-[9px] font-black uppercase tracking-[2px]">
                            <Mail className="w-3 h-3" /> COMM_FEED_AUTH
                        </div>
                        <h2 className="font-display text-[42px] md:text-[52px] font-black tracking-tight leading-none uppercase">
                            STAY IN THE <span className="text-primary italic">LOOP.</span>
                        </h2>
                        <p className="font-display text-[14px] font-bold text-white/40 uppercase tracking-[2px]">
                            SYNCHRONIZE WITH NEW DROPS, ARTIST SPOTLIGHTS & EXCLUSIVE EARLY ACCESS CODES.
                        </p>
                    </div>
                    <form className="flex w-full lg:w-auto flex-1 max-w-[480px] group/form" onSubmit={(e) => e.preventDefault()}>
                        <div className="flex-1 relative">
                            <input
                                type="email"
                                placeholder="JOIN_COMM_CHANNEL@DOMAIN"
                                className="w-full bg-white text-neutral-black border-[3.5px] border-white rounded-[4px] border-r-0 rounded-r-none px-6 py-5 font-display text-[13px] font-black uppercase tracking-[1px] outline-none placeholder:text-neutral-g3 focus:border-primary transition-all"
                            />
                        </div>
                        <button type="submit" className="bg-primary text-neutral-black border-[3.5px] border-primary border-l-0 rounded-r-[4px] px-8 font-display text-[14px] font-black tracking-[2px] uppercase whitespace-nowrap hover:bg-white hover:text-neutral-black hover:border-white transition-all group-hover/form:translate-x-1 duration-300 inline-flex items-center gap-2 shadow-[4px_0_12px_rgba(255,222,0,0.3)]">
                            AUTHORIZE <ArrowRight className="w-4 h-4" />
                        </button>
                    </form>
                </section>

                {/* ── MAIN FOOTER ── */}
                <footer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr] gap-16 lg:gap-24">
                    {/* Brand Meta */}
                    <div className="space-y-8">
                        <Link to="/" className="flex items-center gap-4 no-underline group">
                            <div className="w-10 h-10 bg-neutral-black text-primary p-2 flex items-center justify-center rounded-[4px] transition-transform group-hover:scale-110 rotate-[-8deg] group-hover:rotate-0">
                                <Zap className="w-6 h-6" />
                            </div>
                            <span className="font-display text-[32px] font-black tracking-[2px] text-neutral-black uppercase">
                                TEE<span className="text-primary italic">HIVE</span>
                            </span>
                        </Link>
                        <p className="font-display text-[15px] font-bold text-neutral-black/40 leading-relaxed uppercase tracking-wider">
                            India's premier decentralized fashion repository. Every artifact traces back to a verified independent mind.
                        </p>
                        <div className="flex gap-4">
                            {SOCIALS.map((s, i) => (
                                <div key={i} className={`w-12 h-12 border-[2.5px] border-neutral-black rounded-[4px] flex items-center justify-center cursor-pointer text-neutral-black transition-all hover:bg-neutral-black ${s.color} hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] active:translate-y-0`}>
                                    <s.icon className="w-5 h-5" />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Catalog */}
                    <div className="space-y-8">
                        <h4 className="font-display text-[12px] font-black tracking-[3px] uppercase text-neutral-black/30 flex items-center gap-2">
                            <Zap className="w-3 h-3 text-primary" /> INVENTORY
                        </h4>
                        <div className="flex flex-col gap-4">
                            {["New Drops", "Global Catalog", "Hive50 Viral", "Limited Forge"].map(item => (
                                <Link key={item} to="/products" className="font-display text-[14px] font-black uppercase text-neutral-black/60 hover:text-primary hover:translate-x-2 transition-all no-underline inline-block group">
                                    {item}
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Creator Registry */}
                    <div className="space-y-8">
                        <h4 className="font-display text-[12px] font-black tracking-[3px] uppercase text-neutral-black/30 flex items-center gap-2">
                            <Palette className="w-3 h-3 text-primary" /> CREATORS
                        </h4>
                        <div className="flex flex-col gap-4">
                            {["Global Registry", "Register Node", "Creator Protocol", "Success Logs"].map(item => (
                                <Link key={item} to="/artists" className="font-display text-[14px] font-black uppercase text-neutral-black/60 hover:text-primary hover:translate-x-2 transition-all no-underline inline-block group">
                                    {item}
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
                            {["Help Terminal", "Size Matrix", "Return Logistics", "Direct Uplink"].map(item => (
                                <a key={item} href="#" className="font-display text-[14px] font-black uppercase text-neutral-black/60 hover:text-primary hover:translate-x-2 transition-all no-underline inline-block group">
                                    {item}
                                </a>
                            ))}
                        </div>
                    </div>
                </footer>

                {/* ── SYSTEM STATUS ── */}
                <div className="pt-10 border-t-[2.5px] border-neutral-black flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 bg-neutral-black text-white px-3 py-1.5 rounded-[4px] font-display text-[9px] font-black uppercase tracking-[2px]">
                            <Globe className="w-3 h-3 text-primary" /> 200.1.55.0
                        </div>
                        <div className="flex items-center gap-2 text-success font-display text-[10px] font-black tracking-[2px] uppercase">
                            <div className="w-2 h-2 bg-success rounded-full animate-pulse" /> SYSTEM_ONLINE
                        </div>
                    </div>

                    <span className="font-display text-[11px] font-black text-neutral-black/20 uppercase tracking-[2px]">
                        © {new Date().getFullYear()} TEEHIVE_RECON. ALL ASSET RIGHTS ENCRYPTED.
                    </span>

                    <div className="flex gap-8">
                        {["PRIVACY", "TERMS", "SECURITY"].map(link => (
                            <a key={link} href="#" className="font-display text-[10px] font-black text-neutral-black/40 hover:text-primary transition-all no-underline uppercase tracking-[2px]">{link}</a>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
