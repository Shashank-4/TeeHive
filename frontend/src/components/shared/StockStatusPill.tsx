import React from "react";

interface StockStatusPillProps {
    stock: number;
    showCount?: boolean;
    className?: string;
}

const StockStatusPill: React.FC<StockStatusPillProps> = ({ stock, showCount = false, className = "" }) => {
    let label = "Out of Stock";
    let colorClass = "bg-neutral-r1/10 text-danger border-danger/20";

    if (stock > 10) {
        label = "In Stock";
        colorClass = "bg-success/10 text-success border-success/20";
    } else if (stock > 0) {
        label = "Low Stock";
        colorClass = "bg-primary/10 text-neutral-black border-primary/30";
    }

    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-[2px] border font-display text-[9px] font-black uppercase tracking-[1px] shadow-sm ${colorClass} ${className}`}>
            {label} {showCount && stock > 0 && `(${stock})`}
        </span>
    );
};

export default StockStatusPill;
