import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios from "../../api/axios";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";

const forgotPasswordSchema = z.object({
    email: z.string().email("Invalid email address"),
});

type ForgotPasswordSchema = z.infer<typeof forgotPasswordSchema>;
const LOGO_BLACK = "/assets/logoHorizontalBlack.svg";
export default function ForgotPassword() {
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<ForgotPasswordSchema>({
        resolver: zodResolver(forgotPasswordSchema),
    });

    const onSubmit: SubmitHandler<ForgotPasswordSchema> = async (data) => {
        setApiError(null);
        try {
            // We'll pass isArtist: true if the last context was artist? 
            // Actually, the backend handles both.
            await axios.post("/api/auth/forgot-password", { ...data, isArtist: false });
            setIsSubmitted(true);
        } catch (error: any) {
            setApiError(error.response?.data?.message || "Failed to send reset link.");
        }
    };

    return (
        <div className="h-screen w-screen bg-neutral-g1 flex items-center justify-center p-6 lg:p-10 font-body overflow-hidden relative">
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent opacity-50 pointer-events-none" />

            <div className="w-full max-w-[440px] relative z-10 flex flex-col items-center">
                  <Link to="/" className="mb-2">
                        <img src={LOGO_BLACK} alt="TeeHive" className="h-20 w-auto" />
                    </Link>

                <div className="w-full bg-white border-[3px] border-neutral-black p-8 lg:p-10 rounded-[4px] shadow-[10px_10px_0px_0px_rgba(255,222,0,1)]">
                    {!isSubmitted ? (
                        <>
                            <div className="mb-8">
                                <h1 className="font-display text-[28px] lg:text-[34px] font-black text-neutral-black leading-[0.9] tracking-tight mb-3 uppercase italic">
                                    Reset<br />Password
                                </h1>
                                <p className="text-[14px] text-neutral-g4 font-semibold uppercase tracking-wider">
                                    Enter your email to receive access credentials link.
                                </p>
                            </div>

                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                                <Input
                                    label="Email Address"
                                    icon={<Mail className="w-4 h-4" />}
                                    {...register("email")}
                                    id="email"
                                    type="email"
                                    placeholder="your@email.com"
                                    error={errors.email?.message}
                                />

                                {apiError && (
                                    <p className="text-[12px] text-center text-danger font-bold uppercase tracking-wide">
                                        {apiError}
                                    </p>
                                )}

                                <Button
                                    type="submit"
                                    isLoading={isSubmitting}
                                    className="w-full !py-4"
                                >
                                    SEND RESET LINK
                                </Button>

                                <Link
                                    to="/login"
                                    className="flex items-center justify-center gap-2 text-[12px] font-black uppercase tracking-[2px] text-neutral-black/40 hover:text-neutral-black transition-colors"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    Back to Login
                                </Link>
                            </form>
                        </>
                    ) : (
                        <div className="text-center py-4">
                            <div className="w-16 h-16 bg-success/10 border-[2.5px] border-success/20 rounded-md flex items-center justify-center mx-auto mb-6">
                                <CheckCircle2 className="w-8 h-8 text-success stroke-[2.5]" />
                            </div>
                            <h2 className="font-display text-[24px] font-black text-neutral-black tracking-[-1px] mb-3 uppercase italic leading-none">
                                Link Generated
                            </h2>
                            <p className="text-[14px] text-neutral-g4 font-semibold uppercase tracking-wider mb-8">
                                Check your inbox. If the account exists, your reset link is waiting.
                            </p>
                            <Link to="/login">
                                <Button className="w-full !py-4" variant="outline">
                                    RETURN TO SIGN IN
                                </Button>
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
