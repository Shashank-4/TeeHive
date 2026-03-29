import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { Lock, Zap, Eye, EyeOff, ShieldCheck, CheckCircle2 } from "lucide-react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios from "../../api/axios";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";

const resetPasswordSchema = z
    .object({
        password: z.string().min(8, "Password must be at least 8 characters long"),
        confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    });

type ResetPasswordSchema = z.infer<typeof resetPasswordSchema>;

export default function ResetPassword() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");


    const [isSubmitted, setIsSubmitted] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<ResetPasswordSchema>({
        resolver: zodResolver(resetPasswordSchema),
    });

    const onSubmit: SubmitHandler<ResetPasswordSchema> = async (data) => {
        if (!token) {
            setApiError("Invalid or missing reset token.");
            return;
        }

        setApiError(null);
        try {
            await axios.post("/api/auth/reset-password", { token, password: data.password });
            setIsSubmitted(true);
        } catch (error: any) {
            setApiError(error.response?.data?.message || "Failed to reset password.");
        }
    };

    if (!token) {
         return (
             <div className="h-screen w-screen bg-neutral-g1 flex items-center justify-center p-10 font-body relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent opacity-50 pointer-events-none" />
                <div className="w-full max-w-[440px] bg-white border-[3px] border-neutral-black p-10 rounded-[4px] shadow-[10px_10px_0px_0px_rgba(255,222,0,1)] relative z-10 text-center">
                    <h1 className="font-display text-[28px] font-black uppercase tracking-tight mb-4 text-danger italic leading-none">Access Expired</h1>
                    <p className="text-[14px] text-neutral-g4 font-semibold uppercase tracking-wider mb-8">This reset token is either invalid or has reached its lifecycle end.</p>
                    <Link to="/forgot-password">
                        <Button className="w-full !py-4">REQUEST NEW SYNC</Button>
                    </Link>
                </div>
             </div>
         );
    }

    return (
        <div className="h-screen w-screen bg-neutral-g1 flex items-center justify-center p-6 lg:p-10 font-body overflow-hidden relative">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent opacity-50 pointer-events-none" />

            <div className="w-full max-w-[440px] relative z-10 flex flex-col items-center">
                <Link to="/login" className="flex items-center gap-3 no-underline group mb-10">
                    <div className="w-10 h-10 bg-primary text-neutral-black p-2 flex items-center justify-center rounded-[4px] rotate-[-8deg] group-hover:rotate-0 transition-all border-[2px] border-neutral-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        <Zap className="w-6 h-6" fill="currentColor" />
                    </div>
                    <span className="font-display text-[26px] font-black tracking-[2px] text-neutral-black uppercase group-hover:text-primary transition-colors">
                        TEE<span className="italic">HIVE</span>
                    </span>
                </Link>

                <div className="w-full bg-white border-[3px] border-neutral-black p-8 lg:p-10 rounded-[4px] shadow-[10px_10px_0px_0px_rgba(255,222,0,1)]">
                    {!isSubmitted ? (
                        <>
                            <div className="mb-8">
                                <h1 className="font-display text-[28px] lg:text-[34px] font-black text-neutral-black leading-[0.9] tracking-tight mb-3 uppercase italic">
                                    Finalize<br />Change
                                </h1>
                                <p className="text-[14px] text-neutral-g4 font-semibold uppercase tracking-wider">
                                    Update your access credentials to synchronize with the Hive.
                                </p>
                            </div>

                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                                <div className="space-y-4">
                                    <div className="relative">
                                        <Input
                                            label="New Access Password"
                                            icon={<Lock className="w-4 h-4" />}
                                            {...register("password")}
                                            id="password"
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Min 8 characters"
                                            error={errors.password?.message}
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

                                    <Input
                                        label="Confirm New Password"
                                        icon={<ShieldCheck className="w-4 h-4" />}
                                        {...register("confirmPassword")}
                                        id="confirmPassword"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Verify your access"
                                        error={errors.confirmPassword?.message}
                                    />
                                </div>

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
                                    OVERWRITE CREDENTIALS
                                </Button>
                            </form>
                        </>
                    ) : (
                        <div className="text-center py-4">
                            <div className="w-16 h-16 bg-success/10 border-[2.5px] border-success/20 rounded-md flex items-center justify-center mx-auto mb-6">
                                <CheckCircle2 className="w-8 h-8 text-success stroke-[2.5]" />
                            </div>
                            <h2 className="font-display text-[24px] font-black text-neutral-black tracking-[-1px] mb-3 uppercase italic leading-none">
                                Success Sync
                            </h2>
                            <p className="text-[14px] text-neutral-g4 font-semibold uppercase tracking-wider mb-8">
                                Your access node is updated. Proceed to synchronize with the Hive.
                            </p>
                            <Link to="/login">
                                <Button className="w-full !py-4">SIGN IN NOW</Button>
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
