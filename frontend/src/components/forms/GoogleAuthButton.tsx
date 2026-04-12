import type { ComponentProps } from "react";
import { useLayoutEffect, useRef, useState } from "react";
import { GoogleLogin } from "@react-oauth/google";

type GoogleAuthButtonProps = {
    onSuccess: NonNullable<ComponentProps<typeof GoogleLogin>["onSuccess"]>;
    onError: () => void;
    text: "continue_with" | "signup_with";
};

const GOOGLE_G = (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden>
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
        <path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.97-6.19a24.01 24.01 0 0 0 0 21.56l7.97-6.19z" />
        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
);

/**
 * Custom Google auth button: renders Google's invisible iframe on top of our
 * own styled button so clicks land on Google's real control while we own the UI.
 */
export default function GoogleAuthButton({ onSuccess, onError, text }: GoogleAuthButtonProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [width, setWidth] = useState(320);
    const [pressed, setPressed] = useState(false);

    useLayoutEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const update = () => setWidth(Math.max(200, Math.floor(el.getBoundingClientRect().width)));
        update();
        const ro = new ResizeObserver(update);
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    const label = text === "signup_with" ? "Sign up with Google" : "Continue with Google";

    return (
        <div
            ref={containerRef}
            className="relative w-full mb-2 select-none"
            onPointerDown={() => setPressed(true)}
            onPointerUp={() => setPressed(false)}
            onPointerLeave={() => setPressed(false)}
        >
            {/* ── Visible button (non-interactive, purely visual) ── */}
            <div
                aria-hidden
                className={[
                    "pointer-events-none",
                    "flex w-full items-center justify-center gap-3",
                    "h-[48px] rounded-[4px]",
                    "border-[2px] border-neutral-black bg-white",
                    "shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",
                    "transition-all duration-150",
                    pressed
                        ? "translate-x-[2px] translate-y-[2px] shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                        : "",
                ].join(" ")}
            >
                {GOOGLE_G}
                <span className="font-display text-[12px] font-black uppercase tracking-[1.5px] text-neutral-black">
                    {label}
                </span>
            </div>

            {/* ── Google's real iframe — stretched over the visible button, fully transparent ── */}
            <div
                className="absolute inset-0 z-10 overflow-hidden opacity-[0.01] cursor-pointer"
                style={{ minHeight: 48 }}
            >
                <GoogleLogin
                    onSuccess={onSuccess}
                    onError={onError}
                    theme="outline"
                    size="large"
                    text={text}
                    shape="rectangular"
                    logo_alignment="center"
                    width={width}
                    containerProps={{
                        className: "!flex w-full h-full items-center justify-center",
                        style: { height: "100%", minHeight: 48 },
                    }}
                />
            </div>
        </div>
    );
}
