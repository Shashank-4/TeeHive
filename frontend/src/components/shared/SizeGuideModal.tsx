import ImageWithSkeleton from "./ImageWithSkeleton";
import { SIZE_GUIDE_MEASUREMENTS } from "../../constants/productSizes";

type SizeGuideModalProps = {
    open: boolean;
    onClose: () => void;
};

/**
 * Branded size guide: semantic table for SEO/accessibility plus reference diagram (sizeGuide.webp).
 */
export default function SizeGuideModal({ open, onClose }: SizeGuideModalProps) {
    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-[200] flex items-center justify-center bg-neutral-black/80 p-3 sm:p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="size-guide-title"
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-[4px] border-[3px] border-neutral-black bg-white shadow-[12px_12px_0px_0px_rgba(240,221,38,0.35)]"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="sticky top-0 z-10 flex flex-wrap items-start justify-between gap-3 border-b-[3px] border-neutral-black bg-primary px-4 py-4 sm:px-6 sm:py-5">
                    <div className="min-w-0 pr-2">
                        <p className="font-display text-[10px] font-black uppercase tracking-[0.35em] text-neutral-black/70">
                            TeeHive fit guide
                        </p>
                        <h2
                            id="size-guide-title"
                            className="font-display text-[clamp(1.25rem,4vw,1.75rem)] font-black uppercase tracking-tight text-neutral-black"
                        >
                            Unisex T-shirt sizes
                        </h2>
                        <p className="mt-1 max-w-xl font-body text-[13px] sm:text-[14px] font-medium leading-snug text-neutral-g5">
                            Use this chart to pick your size. Measurements are body chest (full round) and garment length;
                            allow about one inch of tolerance.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="shrink-0 rounded-[4px] border-[2px] border-neutral-black bg-white px-4 py-2 font-display text-[11px] font-black uppercase tracking-[1px] text-neutral-black transition-colors hover:bg-neutral-black hover:text-white"
                    >
                        Close
                    </button>
                </div>

                <div className="space-y-8 p-4 sm:p-6">
                    <div className="overflow-x-auto rounded-[4px] border-[2px] border-neutral-black">
                        <table className="w-full min-w-[320px] border-collapse text-left">
                            <caption className="border-b-[2px] border-neutral-black bg-neutral-g1 px-4 py-3 text-left font-body text-[13px] font-semibold text-neutral-g5">
                                TeeHive unisex tee — size chart (inches)
                            </caption>
                            <thead>
                                <tr className="bg-neutral-black text-white">
                                    <th scope="col" className="px-3 py-3 font-display text-[11px] font-black uppercase tracking-wider sm:px-4">
                                        Size
                                    </th>
                                    <th scope="col" className="px-3 py-3 font-display text-[11px] font-black uppercase tracking-wider sm:px-4">
                                        Chest (in)
                                    </th>
                                    <th scope="col" className="px-3 py-3 font-display text-[11px] font-black uppercase tracking-wider sm:px-4">
                                        Length (in)
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {SIZE_GUIDE_MEASUREMENTS.map((row, i) => (
                                    <tr
                                        key={row.size}
                                        className={i % 2 === 0 ? "bg-white" : "bg-neutral-g1/80"}
                                    >
                                        <th
                                            scope="row"
                                            className="border-t border-neutral-g2 px-3 py-2.5 font-display text-[13px] font-black text-neutral-black sm:px-4"
                                        >
                                            {row.size}
                                        </th>
                                        <td className="border-t border-neutral-g2 px-3 py-2.5 font-body text-[14px] font-medium text-neutral-g5 sm:px-4">
                                            {row.chestIn}
                                        </td>
                                        <td className="border-t border-neutral-g2 px-3 py-2.5 font-body text-[14px] font-medium text-neutral-g5 sm:px-4">
                                            {row.lengthIn}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div>
                        <p className="mb-3 font-display text-[11px] font-black uppercase tracking-[0.2em] text-neutral-g4">
                            How to measure
                        </p>
                        <ImageWithSkeleton
                            src="/assets/sizeGuide.webp"
                            alt="Diagram showing how to measure chest and length for TeeHive T-shirt sizing"
                            className="w-full max-h-[min(52vh,520px)] rounded-[4px] border-[2px] border-neutral-black object-contain bg-neutral-g1"
                            wrapperClassName="w-full"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
