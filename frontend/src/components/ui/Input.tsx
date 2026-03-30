import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    icon?: React.ReactNode;
    rightElement?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className = '', label, error, icon, rightElement, ...props }, ref) => {
        return (
            <div className="flex flex-col mb-4">
                {label && (
                    <label className="font-display text-[11px] font-black tracking-[2px] uppercase text-neutral-black mb-2 block">
                        {label}
                    </label>
                )}
                <div className="relative flex items-center group">
                    {icon && (
                        <div className="absolute left-4 text-neutral-black opacity-30 group-focus-within:opacity-100 group-focus-within:text-primary transition-all pointer-events-none flex items-center justify-center">
                            {icon}
                        </div>
                    )}
                    <input
                        ref={ref}
                        className={`w-full border-[2.5px] border-neutral-black rounded-[4px] px-5 py-3.5 text-[14px] font-body text-neutral-black bg-white outline-none transition-all placeholder:text-neutral-g3 focus:bg-white focus:shadow-[4px_4px_0px_0px_rgba(255,222,0,1)] disabled:bg-neutral-g1 disabled:text-neutral-g4 ${icon ? 'pl-11' : ''
                            } ${rightElement ? 'pr-11' : ''} ${error ? 'border-danger focus:shadow-[4px_4px_0px_0px_rgba(229,57,53,0.3)]' : ''} ${className}`}
                        {...props}
                    />
                    {rightElement && (
                        <div className="absolute right-4 flex items-center justify-center">
                            {rightElement}
                        </div>
                    )}
                </div>
                {error && <span className="text-danger font-display font-black text-[10px] uppercase tracking-widest mt-2 ml-1">{error}</span>}
            </div>
        );
    }
);

Input.displayName = 'Input';
