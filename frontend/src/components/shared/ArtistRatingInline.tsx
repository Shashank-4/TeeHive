import { Star } from "lucide-react";

type Props = {
    rating: number;
    reviewCount: number;
    className?: string;
    compact?: boolean;
};


export default function ArtistRatingInline({
    rating,
    reviewCount,
    className = "",
    compact = false,
}: Props) {
    const textSize = compact ? "text-[12px]" : "text-[13px]";
    const starClass = compact ? "h-3.5 w-3.5" : "h-4 w-4";

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
            className={`inline-flex items-normal gap-1 font-display font-black text-neutral-black ${textSize} ${className}`}
            title={`${reviewCount} rating${reviewCount === 1 ? "" : "s"}`}
        >
            <Star
                className={`shrink-0 fill-primary text-primary drop-shadow-[1px_1px_0px_rgba(0,0,0,0.52)] ${starClass}`}
                strokeWidth={0}
                aria-hidden
            />
            <span>{rating.toFixed(1)}</span>
            <span className="text-neutral-g4 font-bold">({reviewCount})</span>
        </span>
    );
}
