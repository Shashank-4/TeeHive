import React from "react";

interface StockStatusPillProps {
    stock?: number;
    stockStatus?: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK" | string;
    showCount?: boolean;
    className?: string;
}

const StockStatusPill: React.FC<StockStatusPillProps> = ({
    stock,
    stockStatus,
    showCount = false,
    className = "",
}) => {
    const resolvedStatus =
        stockStatus ||
        (typeof stock === "number"
            ? stock > 10
                ? "IN_STOCK"
                : stock > 0
                  ? "LOW_STOCK"
                  : "OUT_OF_STOCK"
            : "OUT_OF_STOCK");

    let label = "Out of Stock";
    let colorClass = "bg-neutral-r1/10 text-danger border-danger/20";

    if (resolvedStatus === "IN_STOCK") {
        label = "In Stock";
        colorClass = "bg-success/10 text-success border-success/20";
    } else if (resolvedStatus === "LOW_STOCK") {
        label = "Low Stock";
        colorClass = "bg-primary/10 text-neutral-black border-primary/30";
    }

    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-[2px] border font-display text-[9px] font-black uppercase tracking-[1px] shadow-sm ${colorClass} ${className}`}>
            {label} {showCount && typeof stock === "number" && stock > 0 && `(${stock})`}
        </span>
    );
};

export default StockStatusPill;
