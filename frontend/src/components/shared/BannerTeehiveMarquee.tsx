/**
 * Decorative background for shop / artists / Hive50 heroes: repeating "TeeHive" drifting left → right.
 */
const SEGMENT = Array.from({ length: 12 }, () => "TEEHIVE").join("     ");

export default function BannerTeehiveMarquee() {
    const textClass =
        "font-display text-[clamp(8.5rem,10vw,8.5rem)] font-black text-white/[0.06] tracking-[0.12em] whitespace-nowrap shrink-0";

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0" aria-hidden>
            <div className="absolute inset-y-0 left-0 flex items-center h-full animate-banner-teehive-ltr">
                <span className={textClass}>{SEGMENT}</span>
                <span className={textClass}>{SEGMENT}</span>
            </div>
        </div>
    );
}
