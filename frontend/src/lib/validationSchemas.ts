import { z } from "zod";

// Schema for the Sign In form
export const signInSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
});

export type SignInSchema = z.infer<typeof signInSchema>;

const signUpBaseSchema = z
    .object({
        firstName: z.string().min(2, "First name must be at least 2 characters"),
        lastName: z.string().min(2, "Last name must be at least 2 characters"),
        email: z.string().email("Invalid email address"),
        password: z.string().min(8, "Password must be at least 8 characters"),
        confirmPassword: z.string(),
        termsAccepted: z.boolean().refine((val) => val === true, {
            message: "You must accept the terms and conditions",
        }),
        artistAgreementAccepted: z.boolean().optional(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    });

export type SignUpSchema = z.infer<typeof signUpBaseSchema>;

/** Resolver schema: artist sign-up must also accept the Artist Agreement. */
export const getSignUpSchema = (isArtist: boolean) =>
    signUpBaseSchema.refine((data) => !isArtist || data.artistAgreementAccepted === true, {
        message: "You must accept the Artist Agreement",
        path: ["artistAgreementAccepted"],
    });
