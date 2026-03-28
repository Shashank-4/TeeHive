import React from 'react';

export const Card = ({ className = '', children, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
    return (
        <div className={`bg-white border-[1.5px] border-neutral-g2 rounded-[6px] mb-[18px] transition-colors hover:border-primary ${className}`} {...props}>
            {children}
        </div>
    );
};

export const CardHeader = ({ className = '', title, subtitle, action, ...props }: React.HTMLAttributes<HTMLDivElement> & { title: React.ReactNode, subtitle?: React.ReactNode, action?: React.ReactNode }) => {
    return (
        <div className={`px-[18px] py-[14px] border-b border-neutral-g2 flex items-center justify-between gap-3 flex-wrap ${className}`} {...props}>
            <div>
                <div className="font-display text-[16px] font-extrabold tracking-[0.5px] text-neutral-black">{title}</div>
                {subtitle && <div className="text-[11px] text-neutral-g4 mt-[2px]">{subtitle}</div>}
            </div>
            {action && <div>{action}</div>}
        </div>
    );
};

export const CardBody = ({ className = '', children, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
    return (
        <div className={`p-[18px] ${className}`} {...props}>
            {children}
        </div>
    );
};
