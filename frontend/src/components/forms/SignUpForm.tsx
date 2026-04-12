import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { getSignUpSchema, type SignUpSchema } from "../../lib/validationSchemas";
import { Mail, Lock, Eye, EyeOff, UserIcon, ShieldCheck, ArrowLeft } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import GoogleAuthButton from "./GoogleAuthButton";

interface SignUpFormProps {
    isArtist: boolean;
    setIsSignUp?: (val: boolean) => void;
}

const OTP_RESEND_SECONDS = 30;

const SignUpForm = ({ isArtist }: SignUpFormProps) => {
    const schema = useMemo(() => getSignUpSchema(isArtist), [isArtist]);
    const { signUp, verifyOtp, resendOtp, googleAuth } = useAuth();
    const navigate = useNavigate();
    const [apiError, setApiError] = useState<string | null>(null);
    const [showPw, setShowPw] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [step, setStep] = useState<1 | 2>(1);
    const [otpCode, setOtpCode] = useState("");
    const [isVerifying, setIsVerifying] = useState(false);
    const [isUpgrading, setIsUpgrading] = useState(false);
    const [countdown, setCountdown] = useState(OTP_RESEND_SECONDS);
    const [isResending, setIsResending] = useState(false);

    useEffect(() => {
        if (step !== 2) return;
        const id = window.setInterval(() => {
            setCountdown((c) => Math.max(0, c - 1));
        }, 1000);
        return () => window.clearInterval(id);
    }, [step]);

    const { register, handleSubmit, getValues, setValue, formState: { errors, isSubmitting } } =
        useForm<SignUpSchema>({ resolver: zodResolver(schema), defaultValues: { artistAgreementAccepted: false } });

    useEffect(() => { if (!isArtist) setValue("artistAgreementAccepted", false); }, [isArtist, setValue]);

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

    const onSubmit: SubmitHandler<SignUpSchema> = async (data) => {
        setApiError(null);
        try {
            const res = await signUp({ ...data, isArtist });
            if (res?.isUpgrade) setIsUpgrading(true);
            setCountdown(OTP_RESEND_SECONDS);
            setStep(2);
        } catch (err: any) {
            setApiError(err.response?.data?.message?.toUpperCase() || "REGISTRATION FAILED.");
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (otpCode.length !== 6) { setApiError("ENTER THE FULL 6-DIGIT CODE."); return; }
        setApiError(null);
        setIsVerifying(true);
        try {
            await verifyOtp(getValues("email"), otpCode, isUpgrading ? true : undefined);
            await redirectUser();
        } catch (err: any) {
            setApiError(err.response?.data?.message?.toUpperCase() || "INVALID OR EXPIRED CODE.");
        } finally {
            setIsVerifying(false);
        }
    };

    const handleResendOtp = async () => {
        if (countdown > 0 || isResending) return;
        setApiError(null); setIsResending(true);
        try {
            await resendOtp(getValues("email"));
            setCountdown(OTP_RESEND_SECONDS);
        } catch (err: any) {
            setApiError(err.response?.data?.message?.toUpperCase() || "FAILED TO RESEND OTP.");
        } finally {
            setIsResending(false); }
    };

    const handleGoogleSuccess = async (cr: any) => {
        setApiError(null);
        try {
            if (cr.credential) { await googleAuth(cr.credential, isArtist); await redirectUser(); }
        } catch (err: any) {
            setApiError(err.response?.data?.message?.toUpperCase() || "GOOGLE SIGN-UP FAILED.");
        }
    };

    /* ── STEP 1: REGISTER ── */
    if (step === 1) return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-0">
            {/* Name row */}
            <div className="grid grid-cols-2 gap-3">
                <Input label="First Name" icon={<UserIcon className="w-4 h-4" />}
                    {...register("firstName")} id="firstName" type="text" placeholder="Arjun"
                    error={errors.firstName?.message?.toUpperCase()} />
                <Input label="Last Name" icon={<UserIcon className="w-4 h-4" />}
                    {...register("lastName")} id="lastName" type="text" placeholder="Sharma"
                    error={errors.lastName?.message?.toUpperCase()} />
            </div>

            <Input label="Email Address" icon={<Mail className="w-4 h-4" />}
                {...register("email")} id="email" type="email" placeholder="you@example.com"
                error={errors.email?.message?.toUpperCase()} />

            {/* Password row */}
            <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                    <Input label="Password" icon={<Lock className="w-4 h-4" />}
                        {...register("password")} id="password"
                        type={showPw ? "text" : "password"} placeholder="••••••••"
                        error={errors.password?.message?.toUpperCase()}
                        rightElement={
                            <button type="button" onClick={() => setShowPw(!showPw)} className="focus:outline-none group">
                                {showPw ? <EyeOff className="w-4 h-4 text-neutral-g3 group-hover:text-neutral-black" />
                                        : <Eye    className="w-4 h-4 text-neutral-g3 group-hover:text-neutral-black" />}
                            </button>
                        }
                    />
                </div>
                <div className="relative">
                    <Input label="Confirm" icon={<Lock className="w-4 h-4" />}
                        {...register("confirmPassword")} id="confirmPassword"
                        type={showConfirm ? "text" : "password"} placeholder="••••••••"
                        error={errors.confirmPassword?.message?.toUpperCase()}
                        rightElement={
                            <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="focus:outline-none group">
                                {showConfirm ? <EyeOff className="w-4 h-4 text-neutral-g3 group-hover:text-neutral-black" />
                                             : <Eye    className="w-4 h-4 text-neutral-g3 group-hover:text-neutral-black" />}
                            </button>
                        }
                    />
                </div>
            </div>

            {/* Agreements */}
            <div className="space-y-2 pt-1 pb-3">
                <label className="flex items-start gap-2.5 cursor-pointer">
                    <input {...register("termsAccepted")} id="termsAccepted" type="checkbox"
                        className="w-4 h-4 mt-0.5 accent-primary shrink-0 border-[2px] border-neutral-black cursor-pointer" />
                    <span className="font-display text-[10px] font-black uppercase tracking-[1.5px] text-neutral-black/50 leading-snug">
                        I accept the{" "}
                        <Link to="/terms" target="_blank" className="text-neutral-black underline underline-offset-2 decoration-primary decoration-2 hover:text-primary">Terms</Link>
                        {" "}&amp;{" "}
                        <Link to="/privacy-policy" target="_blank" className="text-neutral-black underline underline-offset-2 decoration-primary decoration-2 hover:text-primary">Privacy Policy</Link>
                    </span>
                </label>
                {errors.termsAccepted && (
                    <p className="font-display text-[9px] font-black uppercase tracking-widest text-danger ml-6">{errors.termsAccepted.message?.toUpperCase()}</p>
                )}
                {isArtist && (
                    <>
                        <label className="flex items-start gap-2.5 cursor-pointer">
                            <input {...register("artistAgreementAccepted")} id="artistAgreement" type="checkbox"
                                className="w-4 h-4 mt-0.5 accent-primary shrink-0 border-[2px] border-neutral-black cursor-pointer" />
                            <span className="font-display text-[10px] font-black uppercase tracking-[1.5px] text-neutral-black/50 leading-snug">
                                I accept the{" "}
                                <Link to="/artist-agreement" target="_blank" className="text-neutral-black underline underline-offset-2 decoration-primary decoration-2 hover:text-primary">Artist Agreement</Link>
                            </span>
                        </label>
                        {errors.artistAgreementAccepted && (
                            <p className="font-display text-[9px] font-black uppercase tracking-widest text-danger ml-6">{errors.artistAgreementAccepted.message?.toUpperCase()}</p>
                        )}
                    </>
                )}
            </div>

            {apiError && (
                <p className="text-[11px] font-display font-black uppercase tracking-widest text-danger text-center border-[2px] border-danger/20 bg-danger/5 py-2 px-3 rounded-[4px] mb-3">
                    {apiError}
                </p>
            )}

            <Button type="submit" isLoading={isSubmitting} size="lg" variant="dark" className="w-full">
                Create {isArtist ? "Artist" : "Customer"} Account
            </Button>

            <div className="flex items-center gap-4 py-3">
                <div className="flex-1 h-[2px] bg-neutral-black/8" />
                <span className="font-display text-[9px] font-black uppercase tracking-[3px] text-neutral-black/20 whitespace-nowrap">Or continue with</span>
                <div className="flex-1 h-[2px] bg-neutral-black/8" />
            </div>

            <GoogleAuthButton
                onSuccess={handleGoogleSuccess}
                onError={() => setApiError("GOOGLE SIGN-UP FAILED.")}
                text="signup_with"
            />
        </form>
    );

    /* ── STEP 2: OTP ── */
    return (
        <form onSubmit={handleVerifyOtp} className="space-y-5">
            <div className="text-center space-y-4">
                <div className="w-14 h-14 bg-primary border-[2.5px] border-neutral-black rounded-[4px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center mx-auto">
                    <ShieldCheck className="w-7 h-7 text-neutral-black stroke-[2.5]" />
                </div>
                <div>
                    <h4 className="font-display text-[16px] font-black uppercase tracking-tight text-neutral-black">
                        {isUpgrading ? "Confirm Upgrade" : "Verify Your Email"}
                    </h4>
                    <p className="font-display text-[11px] font-bold uppercase tracking-[1.5px] text-neutral-black/40 mt-1">
                        Code sent to <span className="text-neutral-black">{getValues("email")}</span>
                    </p>
                </div>
                {countdown > 0
                    ? <p className="font-display text-[10px] font-black uppercase tracking-[2px] text-neutral-black/30">Resend in <span className="text-neutral-black">{countdown}seconds</span></p>
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
                Verify & Activate Account
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

export default SignUpForm;
