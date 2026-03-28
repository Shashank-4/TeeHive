import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signUpSchema, type SignUpSchema } from "../../lib/validationSchemas";
import { Mail, Lock, Eye, EyeOff, UserIcon, ShieldCheck, ArrowRight } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";

interface SignUpFormProps {
    isArtist: boolean;
    setIsSignUp?: (val: boolean) => void;
}

const SignUpForm = ({ isArtist }: SignUpFormProps) => {
    const { signUp, verifyOtp, googleAuth } = useAuth();
    const navigate = useNavigate();
    const [apiError, setApiError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Step 1: Credentials | Step 2: OTP
    const [step, setStep] = useState<1 | 2>(1);
    const [otpCode, setOtpCode] = useState("");
    const [isVerifying, setIsVerifying] = useState(false);
    const [isUpgrading, setIsUpgrading] = useState(false);

    const {
        register,
        handleSubmit,
        getValues,
        formState: { errors, isSubmitting },
    } = useForm<SignUpSchema>({
        resolver: zodResolver(signUpSchema),
    });

    const redirectUser = async () => {
        const meResponse = await (await import("../../api/axios")).default.get("/api/users/me");
        const loggedInUser = meResponse.data.data.user;

        if (loggedInUser.isArtist) {
            if (loggedInUser.verificationStatus === "VERIFIED") {
                navigate("/artist/dashboard");
            } else if (loggedInUser.verificationStatus === "PENDING_VERIFICATION") {
                navigate("/artist/verification-status");
            } else {
                navigate("/artist/setup-profile");
            }
        } else if (loggedInUser.isAdmin) {
            navigate("/admin/dashboard");
        } else {
            navigate("/");
        }
    };

    const onSubmit: SubmitHandler<SignUpSchema> = async (data) => {
        setApiError(null);
        const submissionData = { ...data, isArtist };
        try {
            const res = await signUp(submissionData);
            if (res?.isUpgrade) {
                setIsUpgrading(true);
            }
            setStep(2); // Move to OTP step
        } catch (error: any) {
            setApiError(
                error.response?.data?.message || "An unexpected error occurred."
            );
            console.error(error);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (otpCode.length !== 6) {
            setApiError("VALID_6_DIGIT_OTP_REQUIRED");
            return;
        }
        setApiError(null);
        setIsVerifying(true);
        try {
            const email = getValues("email");
            await verifyOtp(email, otpCode, isUpgrading ? true : undefined);
            await redirectUser();
        } catch (error: any) {
            setApiError(error.response?.data?.message || "INVALID_DATA_PACKET");
        } finally {
            setIsVerifying(false);
        }
    };

    const handleGoogleSuccess = async (credentialResponse: any) => {
        setApiError(null);
        try {
            if (credentialResponse.credential) {
                await googleAuth(credentialResponse.credential, isArtist);
                await redirectUser();
            }
        } catch (error: any) {
            setApiError(error.response?.data?.message || "GOOGLE_AUTH_FAILURE");
        }
    };

    const buttonText = `INITIALIZE_${isArtist ? "ARTIST" : "CUSTOMER"}_NODE`;

    return (
        <div className="space-y-4">
            {step === 1 ? (
                <form
                    onSubmit={handleSubmit(onSubmit)}
                    className="space-y-3"
                >
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <Input
                                label="F_NAME"
                                icon={<UserIcon className="w-4 h-4" />}
                                {...register("firstName")}
                                id="firstName"
                                type="text"
                                placeholder="Arjun"
                                error={errors.firstName?.message}
                                className="!py-2.5"
                            />
                        </div>
                        <div className="flex-1">
                            <Input
                                label="L_NAME"
                                icon={<UserIcon className="w-4 h-4" />}
                                {...register("lastName")}
                                id="lastName"
                                type="text"
                                placeholder="Sharma"
                                error={errors.lastName?.message}
                                className="!py-2.5"
                            />
                        </div>
                    </div>

                    <Input
                        label="UPLINK_EMAIL"
                        icon={<Mail className="w-4 h-4" />}
                        {...register("email")}
                        id="email"
                        type="email"
                        placeholder="arjun@email.com"
                        error={errors.email?.message}
                        className="!py-2.5"
                    />

                    <div className="flex gap-4">
                        <div className="flex-1 relative">
                            <Input
                                label="ACCESS_KEY"
                                icon={<Lock className="w-4 h-4" />}
                                {...register("password")}
                                id="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                error={errors.password?.message}
                                className="!py-2.5 pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-[38px] opacity-30 hover:opacity-100 transition-opacity"
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                        <div className="flex-1 relative">
                            <Input
                                label="CONFIRM_KEY"
                                icon={<Lock className="w-4 h-4" />}
                                {...register("confirmPassword")}
                                id="confirmPassword"
                                type={showConfirmPassword ? "text" : "password"}
                                placeholder="••••••••"
                                error={errors.confirmPassword?.message}
                                className="!py-2.5 pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-[38px] opacity-30 hover:opacity-100 transition-opacity"
                            >
                                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    <div className="flex items-start gap-2 py-1">
                        <input
                            {...register("termsAccepted")}
                            id="termsAccepted"
                            type="checkbox"
                            className="w-4 h-4 mt-0.5 accent-primary cursor-pointer shrink-0 border-[2px] border-neutral-black"
                        />
                        <label
                            htmlFor="termsAccepted"
                            className="text-[10px] text-neutral-black/40 leading-tight uppercase font-display font-black tracking-wider"
                        >
                            I accept the <span className="text-neutral-black underline">Protocol Terms</span> & <span className="text-neutral-black underline">Privacy Shield</span>.
                        </label>
                    </div>
                    {errors.termsAccepted && (
                        <p className="mt-[-4px] text-[10px] text-danger font-display font-black uppercase tracking-widest leading-none">
                            {errors.termsAccepted.message}
                        </p>
                    )}

                    {apiError && (
                        <p className="text-[10px] text-center text-danger font-display font-black uppercase tracking-widest">
                            {apiError}
                        </p>
                    )}

                    <Button
                        type="submit"
                        isLoading={isSubmitting}
                        size="md"
                        className="w-full !mt-2"
                    >
                        {buttonText}
                    </Button>

                    <div className="flex items-center gap-4 py-1">
                        <div className="flex-1 h-[2px] bg-neutral-black/5"></div>
                        <div className="text-[9px] text-neutral-black/20 font-display font-black tracking-[3px] uppercase whitespace-nowrap">
                            OR_CONTINUE_WITH
                        </div>
                        <div className="flex-1 h-[2px] bg-neutral-black/5"></div>
                    </div>

                    <div className="relative w-full rounded-[4px] overflow-hidden bg-white border-[3px] border-neutral-black hover:border-primary hover:shadow-[6px_6px_0px_0px_rgba(255,222,0,1)] hover:-translate-x-1 hover:-translate-y-1 transition-all">
                        <GoogleLogin
                            onSuccess={handleGoogleSuccess}
                            onError={() => setApiError("GOOGLE_SIGN_UP_FAILED")}
                            theme="outline"
                            size="large"
                            text="signup_with"
                            width="2000"
                        />
                    </div>
                </form>
            ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-6">
                    <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-primary border-[2.5px] border-neutral-black rounded-[4px] flex items-center justify-center mx-auto mb-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                            <ShieldCheck className="w-8 h-8 text-neutral-black" />
                        </div>
                        <h3 className="font-display text-[22px] font-black text-neutral-black uppercase tracking-tight italic">
                            {isUpgrading ? "Upgrade_Node" : "Verify_Identity"}
                        </h3>
                        <p className="text-[11px] font-display font-bold text-neutral-black/40 uppercase tracking-[1px] mt-2">
                            Code sent to <span className="text-neutral-black italic">{getValues("email")}</span>
                        </p>
                    </div>

                    <div className="space-y-6">
                        <input
                            type="text"
                            maxLength={6}
                            value={otpCode}
                            onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                            placeholder="000000"
                            className="w-full text-center text-[32px] tracking-[0.5em] font-display font-black py-4 border-[3px] border-neutral-black rounded-[4px] focus:bg-primary/5 focus:shadow-[6px_6px_0px_0px_rgba(255,222,0,1)] transition-all outline-none bg-white text-neutral-black"
                        />
                        {apiError && (
                            <p className="text-[10px] text-center text-danger font-display font-black uppercase tracking-widest">
                                {apiError}
                            </p>
                        )}
                        <Button
                            type="submit"
                            isLoading={isVerifying}
                            disabled={isVerifying || otpCode.length !== 6}
                            className="w-full"
                        >
                            {isVerifying ? "SYNCHRONIZING..." : "INITIATE_SESSION"}
                        </Button>
                        <button
                            type="button"
                            onClick={() => {
                                setStep(1);
                                setOtpCode("");
                                setApiError(null);
                            }}
                            className="w-full py-2 text-[10px] font-display font-black text-neutral-black/30 hover:text-neutral-black uppercase tracking-[2px] transition-colors italic border-b border-transparent hover:border-neutral-black/10 inline-flex items-center justify-center gap-2"
                        >
                            Abort_To_Registry <ArrowRight className="w-3 h-3" />
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
};

export default SignUpForm;
