import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signInSchema, type SignInSchema } from "../../lib/validationSchemas";
import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, ShieldCheck, ArrowLeft } from "lucide-react";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import GoogleAuthButton from "./GoogleAuthButton";

interface SignInFormProps {
    isArtist: boolean;
}

/** Resend cooldown; single interval while on OTP step avoids stacked timeouts from [step, countdown] effects. */
const OTP_RESEND_SECONDS = 30;

const SignInForm = ({ isArtist }: SignInFormProps) => {
    const { signIn, verifyOtp, resendOtp, googleAuth } = useAuth();
    const navigate = useNavigate();
    const [apiError, setApiError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [step, setStep] = useState<1 | 2>(1);
    const [otpCode, setOtpCode] = useState("");
    const [isVerifying, setIsVerifying] = useState(false);
    const [countdown, setCountdown] = useState(OTP_RESEND_SECONDS);
    const [isResending, setIsResending] = useState(false);

    useEffect(() => {
        if (step !== 2) return;
        const id = window.setInterval(() => {
            setCountdown((c) => Math.max(0, c - 1));
        }, 1000);
        return () => window.clearInterval(id);
    }, [step]);

    const handleResendOtp = async () => {
        if (countdown > 0 || isResending) return;
        setApiError(null);
        setIsResending(true);
        try {
            await resendOtp(getValues("email"));
            setCountdown(OTP_RESEND_SECONDS);
        } catch (err: any) {
            setApiError(err.response?.data?.message?.toUpperCase() || "FAILED TO RESEND OTP.");
        } finally {
            setIsResending(false);
        }
    };

    const { register, handleSubmit, getValues, formState: { errors, isSubmitting } } =
        useForm<SignInSchema>({ resolver: zodResolver(signInSchema) });

    const redirectUser = async () => {
        const res = await (await import("../../api/axios")).default.get("/api/users/me");
        const u = res.data.data.user;
        if (u.isArtist) {
            if (u.verificationStatus === "VERIFIED") navigate("/artist/dashboard");
            else if (u.verificationStatus === "PENDING_VERIFICATION") navigate("/artist/verification-status");
            else navigate("/artist/setup-profile");
        } else if (u.isAdmin) {
            navigate("/admin/dashboard");
        } else {
            navigate("/");
        }
    };

    const onSubmit: SubmitHandler<SignInSchema> = async (data) => {
        setApiError(null);
        try {
            await signIn({ ...data, loginAsArtist: isArtist });
            setCountdown(OTP_RESEND_SECONDS);
            setStep(2);
        } catch (err: any) {
            setApiError(err.response?.data?.message?.toUpperCase() || "INCORRECT EMAIL OR PASSWORD.");
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (otpCode.length !== 6) { setApiError("ENTER THE FULL 6-DIGIT CODE."); return; }
        setApiError(null);
        setIsVerifying(true);
        try {
            await verifyOtp(getValues("email"), otpCode);
            await redirectUser();
        } catch (err: any) {
            setApiError(err.response?.data?.message?.toUpperCase() || "INVALID OR EXPIRED CODE.");
        } finally {
            setIsVerifying(false);
        }
    };

    const handleGoogleSuccess = async (cr: { credential?: string }) => {
        setApiError(null);
        try {
            if (cr.credential) {
                await googleAuth(cr.credential, isArtist);
                await redirectUser();
            }
        } catch (err: any) {
            setApiError(err.response?.data?.message?.toUpperCase() || "GOOGLE SIGN-IN FAILED.");
        }
    };

    if (step === 1) return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-1">
            <Input
                label="Email Address"
                icon={<Mail className="w-4 h-4" />}
                {...register("email")}
                id="signin-email"
                type="email"
                placeholder="you@example.com"
                error={errors.email?.message?.toUpperCase()}
            />
            <Input
                label="Password"
                icon={<Lock className="w-4 h-4" />}
                {...register("password")}
                id="signin-password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                error={errors.password?.message?.toUpperCase()}
                rightElement={
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="focus:outline-none group">
                        {showPassword
                            ? <EyeOff className="w-4 h-4 text-neutral-g3 group-hover:text-neutral-black transition-colors" />
                            : <Eye className="w-4 h-4 text-neutral-g3 group-hover:text-neutral-black transition-colors" />
                        }
                    </button>
                }
            />

            <div className="flex items-center justify-between pt-1 pb-2">
                <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" id="remember-me" name="remember-me"
                        className="w-4 h-4 accent-primary border-[2px] border-neutral-black cursor-pointer" />
                    <span className="font-display text-[10px] font-black uppercase tracking-[2px] text-neutral-black/50">Remember me</span>
                </label>
                <Link to="/forgot-password"
                    className="font-display text-[10px] font-black uppercase tracking-[2px] text-danger hover:underline decoration-danger">
                    Forgot password?
                </Link>
            </div>

            {apiError && (
                <p className="text-[11px] font-display font-black uppercase tracking-widest text-danger text-center border-[2px] border-danger/20 bg-danger/5 py-2 px-3 rounded-[4px] mb-3">
                    {apiError}
                </p>
            )}

            <Button type="submit" isLoading={isSubmitting} size="lg" variant="dark" className="w-full">
                Sign In as {isArtist ? "Artist" : "Customer"}
            </Button>

            <div className="flex items-center gap-4 py-3">
                <div className="flex-1 h-[2px] bg-neutral-black/8" />
                <span className="font-display text-[9px] font-black uppercase tracking-[3px] text-neutral-black/20 whitespace-nowrap">Or continue with</span>
                <div className="flex-1 h-[2px] bg-neutral-black/8" />
            </div>

            <GoogleAuthButton
                onSuccess={handleGoogleSuccess}
                onError={() => setApiError("GOOGLE SIGN-IN FAILED.")}
                text="continue_with"
            />
        </form>
    );

    return (
        <form onSubmit={handleVerifyOtp} className="space-y-5">
            <div className="text-center space-y-4">
                <div className="w-14 h-14 bg-primary border-[2.5px] border-neutral-black rounded-[4px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center mx-auto">
                    <ShieldCheck className="w-7 h-7 text-neutral-black stroke-[2.5]" />
                </div>
                <div>
                    <h4 className="font-display text-[16px] font-black uppercase tracking-tight text-neutral-black">Verify Your Email</h4>
                    <p className="font-display text-[11px] font-bold uppercase tracking-[1.5px] text-neutral-black/40 mt-1">
                        Code sent to <span className="text-neutral-black">{getValues("email")}</span>
                    </p>
                </div>
                {countdown > 0
                    ? <p className="font-display text-[10px] font-black uppercase tracking-[2px] text-neutral-black/30">Resend in <span className="text-neutral-black">{countdown}s</span></p>
                    : <p className="font-display text-[10px] font-black uppercase tracking-[2px] text-neutral-black/30">Didn't receive it? Resend below.</p>
                }
            </div>

            <input
                type="text" maxLength={6} value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                className="w-full text-center text-[36px] tracking-[0.5em] font-display font-black py-4 border-[3px] border-neutral-black rounded-[4px] focus:shadow-[6px_6px_0px_0px_rgba(255,222,0,1)] outline-none bg-white placeholder:text-neutral-black/10 transition-all"
            />

            {apiError && (
                <p className="text-[11px] font-display font-black uppercase tracking-widest text-danger text-center border-[2px] border-danger/20 bg-danger/5 py-2 rounded-[4px]">
                    {apiError}
                </p>
            )}

            <Button type="submit" isLoading={isVerifying} disabled={otpCode.length !== 6} size="lg" variant="dark" className="w-full">
                Verify & Sign In
            </Button>

            <div className="flex items-center justify-between">
                <button type="button" onClick={handleResendOtp} disabled={countdown > 0 || isResending}
                    className="font-display text-[10px] font-black uppercase tracking-[2px] text-primary hover:underline disabled:opacity-30 disabled:cursor-not-allowed">
                    {isResending ? "Sending…" : "Resend Code"}
                </button>
                <button type="button"
                    onClick={() => { setStep(1); setOtpCode(""); setApiError(null); setCountdown(OTP_RESEND_SECONDS); }}
                    className="font-display text-[10px] font-black uppercase tracking-[2px] text-neutral-black/30 hover:text-neutral-black flex items-center gap-1.5 transition-colors">
                    <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>
            </div>
        </form>
    );
};

export default SignInForm;
