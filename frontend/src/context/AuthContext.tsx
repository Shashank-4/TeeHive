import {
    createContext,
    useContext,
    useCallback,
    useEffect,
    useState,
    type ReactNode,
} from "react";
import api from "../api/axios";
import { type SignUpSchema } from "../lib/validationSchemas";
import { type SignInSchema } from "../lib/validationSchemas";

interface User {
    id: string;
    name: string;
    email: string;
    isArtist: boolean;
    isAdmin: boolean;
    verificationStatus: "UNVERIFIED" | "PENDING_VERIFICATION" | "VERIFIED" | "REJECTED";
    displayName?: string;
    displayPhotoUrl?: string;
    /** Public storefront URL uses slug when set (from session /api/users/me). */
    artistSlug?: string | null;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    signUp: (
        data: SignUpSchema & { isArtist?: boolean }
    ) => Promise<{ isUpgrade: boolean } | void>;
    signIn: (data: SignInSchema & { loginAsArtist?: boolean }) => Promise<void>;
    verifyOtp: (email: string, otpCode: string, isUpgradingToArtist?: boolean) => Promise<void>;
    resendOtp: (email: string) => Promise<void>;
    googleAuth: (token: string, isArtist?: boolean) => Promise<void>;
    signOut: () => void;
    /** Re-fetch session from /api/users/me (e.g. after verification status changes on the server). */
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkUserSession = async () => {
            try {
                const response = await api.get<{ data: { user: User } }>(
                    "/api/users/me"
                );

                setUser(response.data.data.user);
            } catch (e) {
                console.log("No active session found.");
                setUser(null);
            } finally {
                setIsLoading(false);
            }
        };
        checkUserSession();
    }, []);

    const signUp = async (
        data: SignUpSchema & { isArtist?: boolean }
    ) => {
        const { confirmPassword, termsAccepted, artistAgreementAccepted: _artistAgreementAccepted, ...apiData } = data;
        const response = await api.post("/api/auth/signup", apiData);
        // Returns whether the user is upgrading from customer to artist
        if (response.data?.data?.isUpgrade) {
            return { isUpgrade: true };
        }
    };

    const signIn = async (data: SignInSchema & { loginAsArtist?: boolean }) => {
        await api.post("/api/auth/signin", data);
        // After sign-in, an OTP is sent. The UI will prompt for it.
    };

    const verifyOtp = async (email: string, otpCode: string, isUpgradingToArtist?: boolean) => {
        await api.post("/api/auth/verify-otp", { email, otpCode, isUpgradingToArtist });
        const userResponse = await api.get<{ data: { user: User } }>(
            "/api/users/me"
        );
        setUser(userResponse.data.data.user);
    };

    const resendOtp = async (email: string) => {
        await api.post("/api/auth/resend-otp", { email });
    };

    const googleAuth = async (token: string, isArtist?: boolean) => {
        await api.post("/api/auth/google", { token, isArtist });
        const userResponse = await api.get<{ data: { user: User } }>(
            "/api/users/me"
        );
        setUser(userResponse.data.data.user);
    };

    const signOut = async () => {
        await api.get("/api/auth/signout");
        setUser(null);
    };

    const refreshUser = useCallback(async () => {
        try {
            const response = await api.get<{ data: { user: User } }>(
                "/api/users/me"
            );
            setUser(response.data.data.user);
        } catch {
            setUser(null);
        }
    }, []);

    const value = {
        user,
        isAuthenticated: !!user,
        isLoading,
        signUp,
        signIn,
        verifyOtp,
        resendOtp,
        googleAuth,
        signOut,
        refreshUser,
    };

    return (
        <AuthContext.Provider value={value}>
            {!isLoading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
