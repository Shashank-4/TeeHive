type Props = {
    rating: number;
    reviewCount: number;
    className?: string;
    /** Smaller copy for dense rows */
    compact?: boolean;
};

/** e.g. 4.8 (127) or "No ratings yet" */
export default function ArtistRatingInline({
    rating,
    reviewCount,
    className = "",
    compact = false,
}: Props) {
    const textSize = compact ? "text-[10px]" : "text-[11px]";
    if (!reviewCount || reviewCount < 1) {
        return (
            <span
                className={`font-display font-bold uppercase tracking-[0.08em] text-neutral-g3 ${textSize} ${className}`}
            >
                No ratings yet
            </span>
        );
    }
    return (
        <span
            className={`font-display font-black text-neutral-black ${textSize} ${className}`}
            title={`${reviewCount} rating${reviewCount === 1 ? "" : "s"}`}
        >
            ⭐ {rating.toFixed(1)} <span className="text-neutral-g4 font-bold">({reviewCount})</span>
        </span>
    );
}
