import React from 'react';

interface LoaderProps {
    size?: string;
    className?: string;
    fullPage?: boolean;
}

const Loader: React.FC<LoaderProps> = ({ size = "w-32 h-32", className = "", fullPage = false }) => {
    const content = (
        <div className={`flex flex-col items-center justify-center gap-6 ${className}`}>
            <div className="relative">
                <img
                    src="/assets/loading-image.svg"
                    alt="Loading..."
                    className={`${size} object-contain animate-bounce`}
                />
            </div>
            <span className="font-display text-[14px] font-black tracking-[4px] uppercase text-neutral-black animate-pulse bg-primary px-3 py-1 rounded-[2px] shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
                Syncing the Hive...
            </span>
        </div>
    );

    if (fullPage) {
        return (
            <div className="fixed inset-0 bg-white/95 backdrop-blur-md z-[9999] flex items-center justify-center">
                {content}
            </div>
        );
    }

    return content;
};

export default Loader;
