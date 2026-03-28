import React from 'react';

type ButtonVariant = 'primary' | 'dark' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className = '', variant = 'primary', size = 'md', isLoading, children, ...props }, ref) => {

        const baseStyles = "inline-flex items-center justify-center gap-2 rounded-[4px] font-display tracking-[1.5px] uppercase transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed border-[2px]";

        const variants = {
            primary: "bg-primary text-neutral-black border-neutral-black hover:bg-neutral-black hover:text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] font-black italic",
            dark: "bg-neutral-black text-white border-neutral-black hover:bg-primary hover:text-neutral-black shadow-[4px_4px_0px_0px_rgba(240,221,38,0.3)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] font-black",
            outline: "bg-white text-neutral-black border-neutral-black hover:bg-neutral-g1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] font-black tracking-widest",
            ghost: "bg-transparent text-neutral-g4 hover:bg-neutral-g1 hover:text-neutral-black font-black border-transparent",
            danger: "bg-white text-danger border-danger hover:bg-danger hover:text-white shadow-[4px_4px_0px_0px_rgba(229,57,53,0.2)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] font-black"
        };

        const sizes = {
            sm: "px-4 py-2 text-[10px]",
            md: "px-6 py-3 text-[13px]",
            lg: "px-10 py-5 text-[15px]"
        };

        return (
            <button
                ref={ref}
                disabled={isLoading || props.disabled}
                className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
                {...props}
            >
                {isLoading ? (
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                ) : null}
                {children}
            </button>
        );
    }
);

Button.displayName = 'Button';
