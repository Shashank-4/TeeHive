interface ReturnPolicyNoteProps {
    variant?: "customer" | "admin";
    className?: string;
}

export default function ReturnPolicyNote({
    variant = "customer",
    className = "",
}: ReturnPolicyNoteProps) {
    const baseClassName =
        variant === "admin"
            ? "border-neutral-black bg-neutral-black text-white"
            : "border-neutral-black bg-primary/10 text-neutral-black";

    const title =
        variant === "admin"
            ? "Returns And Refund Operations"
            : "5-Day Returns Policy";

    const body =
        variant === "admin"
            ? "Approve returns only for damaged goods, wrong product delivery, or wrong size/color dispatch. Process eligible refunds directly in the Razorpay Dashboard and rely on refund webhooks or ledger review to reconcile the order status."
            : "Returns are accepted within 5 days of delivery only for damaged goods, wrong product delivery, or wrong size/color received. Preference-based returns or exchanges are not supported.";

    return (
        <div className={`rounded-[4px] border-[1.5px] p-4 ${baseClassName} ${className}`}>
            <div className="font-display text-[10px] font-black uppercase tracking-[1.5px] mb-2">
                {title}
            </div>
            <p className="font-display text-[10px] font-bold uppercase leading-relaxed opacity-80">
                {body}
            </p>
        </div>
    );
}
