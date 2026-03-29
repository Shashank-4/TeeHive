import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signInSchema, type SignInSchema } from "../../lib/validationSchemas";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";

import { Mail, Lock, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";

interface SignInFormProps {
    isArtist: boolean;
}

const SignInForm = ({ isArtist }: SignInFormProps) => {
    const { signIn, verifyOtp, googleAuth } = useAuth();
    const navigate = useNavigate();
    const [apiError, setApiError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    // Step 1: Credentials | Step 2: OTP
    const [step, setStep] = useState<1 | 2>(1);
    const [otpCode, setOtpCode] = useState("");
    const [isVerifying, setIsVerifying] = useState(false);

    const {
        register,
        handleSubmit,
        getValues,
        formState: { errors, isSubmitting },
    } = useForm<SignInSchema>({
        resolver: zodResolver(signInSchema),
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

    const onSubmit: SubmitHandler<SignInSchema> = async (data) => {
        setApiError(null);
        try {
            await signIn({ ...data, loginAsArtist: isArtist });
            setStep(2); // Proceed to OTP verification step
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
            setApiError("Please enter a valid 6-digit OTP.");
            return;
        }
        setApiError(null);
        setIsVerifying(true);
        try {
            const email = getValues("email");
            await verifyOtp(email, otpCode);
            await redirectUser();
        } catch (error: any) {
            setApiError(error.response?.data?.message || "Invalid or expired OTP.");
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
            setApiError(error.response?.data?.message || "Google Login failed.");
        }
    };

    const buttonText = `Sign In as ${isArtist ? "Artist" : "Customer"}`;

    return (
        <div className="space-y-6">
            {step === 1 ? (
                <form
                    onSubmit={handleSubmit(onSubmit)}
                    className="space-y-4"
                >
                    <Input
                        label="Email Address"
                        icon={<Mail className="w-4 h-4" />}
                        {...register("email")}
                        id="email"
                        type="email"
                        placeholder="your@email.com"
                        error={errors.email?.message}
                    />

                    <div className="relative">
                        <Input
                            label="Password"
                            icon={<Lock className="w-4 h-4" />}
                            {...register("password")}
                            id="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            error={errors.password?.message}
                            className="pr-12"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3.5 top-[34px] group"
                        >
                            {showPassword ? (
                                <EyeOff className="w-4 h-4 stroke-neutral-g3 group-hover:stroke-neutral-black transition-colors stroke-[1.8]" />
                            ) : (
                                <Eye className="w-4 h-4 stroke-neutral-g3 group-hover:stroke-neutral-black transition-colors stroke-[1.8]" />
                            )}
                        </button>
                    </div>

                    <div className="flex items-center justify-between !mt-[-4px] !mb-6">
                        <label className="flex items-center gap-2 cursor-pointer text-[13px] text-neutral-g4">
                            <input
                                id="remember-me"
                                name="remember-me"
                                type="checkbox"
                                className="w-[15px] h-[15px] accent-primary cursor-pointer"
                            />
                            Remember me
                        </label>
                        <Link
                            to="/forgot-password"
                            className="text-[13px] text-danger font-semibold hover:underline"
                        >
                            Forgot password?
                        </Link>
                    </div>

                    {apiError && (
                        <p className="mt-2 text-[12px] text-center text-danger font-bold">
                            {apiError}
                        </p>
                    )}

                    <Button
                        type="submit"
                        isLoading={isSubmitting}
                        size="md"
                        className="w-full !mb-6"
                    >
                        {buttonText}
                    </Button>

                    <div className="flex items-center gap-4 !mb-6">
                        <div className="flex-1 h-[2.5px] bg-neutral-black/5"></div>
                        <div className="text-[9px] text-neutral-black/20 font-display font-black tracking-[3px] uppercase whitespace-nowrap">
                            OR_CONTINUE_WITH
                        </div>
                        <div className="flex-1 h-[2.5px] bg-neutral-black/5"></div>
                    </div>

                    {/* Styled Google Auth wrapper */}
                    <div className="relative w-full rounded-[4px] overflow-hidden bg-white border-[3px] border-neutral-black hover:border-primary hover:shadow-[6px_6px_0px_0px_rgba(255,222,0,1)] hover:-translate-x-1 hover:-translate-y-1 transition-all">
                        <GoogleLogin
                            onSuccess={handleGoogleSuccess}
                            onError={() => setApiError("Google Sign-In Failed")}
                            theme="outline"
                            size="large"
                            text="continue_with"
                            width="2000"
                        />
                    </div>
                </form>
            ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-6">
                    <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-primary/10 border-[1.5px] border-primary/20 rounded-md flex items-center justify-center mx-auto mb-4">
                            <ShieldCheck className="w-8 h-8 text-neutral-black stroke-[1.5]" />
                        </div>
                        <h3 className="font-display text-[24px] font-black text-neutral-black tracking-[-0.5px]">Enter Verification Code</h3>
                        <p className="text-[13px] text-neutral-g4 mt-2">
                            We've sent a 6-digit code to <span className="font-bold text-neutral-black">{getValues("email")}</span>
                        </p>
                    </div>

                    <div className="space-y-4">
                        <input
                            type="text"
                            maxLength={6}
                            value={otpCode}
                            onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                            placeholder="000000"
                            className="w-full text-center text-3xl tracking-[1em] font-mono py-4 border-[1.5px] border-neutral-g2 rounded-md focus:border-primary focus:shadow-[0_0_0_3px_rgba(240,221,38,0.12)] transition-all outline-none bg-white text-neutral-black"
                        />
                        {apiError && (
                            <p className="text-[12px] text-center text-danger font-bold">
                                {apiError}
                            </p>
                        )}
                        <Button
                            type="submit"
                            isLoading={isVerifying}
                            disabled={isVerifying || otpCode.length !== 6}
                            className="w-full !py-3.5 !text-[15px] !tracking-[1.5px]"
                        >
                            {isVerifying ? "Verifying..." : "Verify & Sign In"}
                        </Button>
                        <button
                            type="button"
                            onClick={() => {
                                setStep(1);
                                setOtpCode("");
                                setApiError(null);
                            }}
                            className="w-full py-2 text-[13px] text-neutral-g4 hover:text-neutral-black font-semibold transition-colors"
                        >
                            Back to Login
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
};

export default SignInForm;
