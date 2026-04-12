import type { ComponentProps } from "react";
import { GoogleLogin } from "@react-oauth/google";

type GoogleAuthButtonProps = {
    onSuccess: NonNullable<ComponentProps<typeof GoogleLogin>["onSuccess"]>;
    onError: () => void;
    text: "continue_with" | "signup_with";
};

export default function GoogleAuthButton({ onSuccess, onError, text }: GoogleAuthButtonProps) {
    return (
        <div className="relative w-full group cursor-pointer h-[54px] mb-2">
            {/* Neo-brutalist shadow & border backdrop */}
            <div className="absolute inset-0 bg-neutral-black border-[2px] border-neutral-black rounded-[4px] shadow-[4px_4px_0px_0px_rgba(255,222,0,1)] transition-all duration-300 group-hover:translate-x-[4px] group-hover:translate-y-[4px] group-hover:shadow-none pointer-events-none" />
            
            {/* Iframe wrapper - clips the inner Google styling slightly to blend with our border */}
            <div className="absolute inset-[2px] z-10 flex items-center justify-center overflow-hidden rounded-[2px] bg-neutral-black transition-all duration-300 group-hover:translate-x-[4px] group-hover:translate-y-[4px] [&>div]:w-full [&>div]:flex [&>div]:justify-center">
                <div className="scale-[1.05] w-full flex justify-center origin-center">
                    <GoogleLogin
                        onSuccess={onSuccess}
                        onError={onError}
                        theme="filled_black"
                        size="large"
                        text={text}
                        shape="rectangular"
                        logo_alignment="center"
                        width={400}
                    />
                </div>
            </div>
            
            {/* Absolute overlay to catch clicks if needed, though iframe catches them. We use pointer-events-none so iframe can be clicked */}
            <div className="absolute inset-0 z-20 pointer-events-none transition-all duration-300 group-hover:translate-x-[4px] group-hover:translate-y-[4px] shadow-[inset_0_0_0_2px_rgba(255,255,255,0.05)] rounded-[4px]" />
        </div>
    );
}
