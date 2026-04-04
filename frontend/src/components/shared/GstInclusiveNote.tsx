/**
 * Shown wherever customers see payable product prices (PDP, bag, checkout).
 * Assumes catalog prices already include 5% GST — no extra tax line is added on subtotal.
 */
export default function GstInclusiveNote({ className = "" }: { className?: string }) {
    return (
        <p
            className={`text-[12px] leading-relaxed text-neutral-g4 font-body font-medium ${className}`.trim()}
        >
            MRP is inclusive of 5% GST. No extra GST is added to item prices at checkout.
        </p>
    );
}
