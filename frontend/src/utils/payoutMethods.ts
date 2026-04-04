export type PreferredPayoutMethod = "UPI" | "BANK";

export type PayoutMethodRecord = {
    id: string;
    methodType: "UPI" | "BANK_ACCOUNT";
    verificationStatus: string;
    isDefault: boolean;
    isActive: boolean;
    submittedAt?: string | null;
    verifiedAt?: string | null;
    rejectedAt?: string | null;
    rejectionReason?: string | null;
    verificationNotes?: string | null;
    upiId?: string;
    upiIdMasked?: string;
    upiName?: string;
    bankAccountName?: string;
    bankAccountNumber?: string;
    bankAccountNumberMasked?: string;
    bankAccountNumberLast4?: string;
    bankIfsc?: string;
    bankName?: string;
    providerValidation?: {
        validationId?: string | null;
        validationStatus?: string | null;
        validationMode?: string | null;
        validationReference?: string | null;
        registeredName?: string | null;
        nameMatchScore?: number | null;
        reason?: string | null;
        validatedAt?: string | null;
        utr?: string | null;
    };
};

export type PayoutFormData = {
    upiId: string;
    upiName: string;
    bankAccountName: string;
    bankAccountNumber: string;
    bankIfsc: string;
    bankName: string;
    preferredMethod: PreferredPayoutMethod;
};

export const emptyPayoutForm: PayoutFormData = {
    upiId: "",
    upiName: "",
    bankAccountName: "",
    bankAccountNumber: "",
    bankIfsc: "",
    bankName: "",
    preferredMethod: "UPI",
};

export function payoutFormFromMethods(methods: PayoutMethodRecord[]): PayoutFormData {
    const upiMethod = methods.find((method) => method.methodType === "UPI" && method.isActive);
    const bankMethod = methods.find(
        (method) => method.methodType === "BANK_ACCOUNT" && method.isActive
    );
    const defaultMethod =
        methods.find((method) => method.isDefault) ||
        upiMethod ||
        bankMethod ||
        null;

    return {
        upiId: upiMethod?.upiId || "",
        upiName: upiMethod?.upiName || "",
        bankAccountName: bankMethod?.bankAccountName || "",
        bankAccountNumber: bankMethod?.bankAccountNumber || "",
        bankIfsc: bankMethod?.bankIfsc || "",
        bankName: bankMethod?.bankName || "",
        preferredMethod: defaultMethod?.methodType === "BANK_ACCOUNT" ? "BANK" : "UPI",
    };
}
