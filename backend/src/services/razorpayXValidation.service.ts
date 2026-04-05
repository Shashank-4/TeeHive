type RazorpayXMethodType = "UPI" | "BANK_ACCOUNT";

type ContactInput = {
    artistId: string;
    name: string;
    email: string;
    phone?: string | null;
};

type BankValidationInput = ContactInput & {
    bankAccountName: string;
    bankAccountNumber: string;
    bankIfsc: string;
};

type UpiValidationInput = ContactInput & {
    upiId: string;
    upiName: string;
};

type RazorpayXResponse = {
    id?: string;
    status?: string;
    reference_id?: string;
    utr?: string | null;
    created_at?: number;
    contact_id?: string;
    fund_account?: {
        id?: string;
        contact_id?: string;
        account_type?: string;
    };
    results?: {
        account_status?: string | null;
        registered_name?: string | null;
        details?: string | null;
        name_match_score?: number | null;
        validated_account_type?: string | null;
    };
    status_details?: {
        description?: string | null;
        source?: string | null;
        reason?: string | null;
    };
};

export type ProviderVerificationDecision =
    | "VERIFIED"
    | "PENDING_REVIEW"
    | "PENDING_PROVIDER";

export type ProviderValidationResult = {
    methodType: RazorpayXMethodType;
    providerValidationId: string | null;
    providerValidationStatus: string | null;
    providerValidationMode: string;
    providerValidationReference: string | null;
    providerContactId: string | null;
    providerFundAccountId: string | null;
    providerRegisteredName: string | null;
    providerNameMatchScore: number | null;
    providerValidationReason: string | null;
    providerValidationPayload: RazorpayXResponse;
    providerValidatedAt: Date | null;
    providerUtr: string | null;
    verificationStatus: ProviderVerificationDecision;
    verificationNotes: string | null;
};

const BASE_URL = "https://api.razorpay.com/v1";
const POLL_DELAYS_MS = [500, 1200, 2200];
const AUTO_VERIFY_NAME_MATCH_SCORE = 85;

function getConfig() {
    const keyId = process.env.RAZORPAYX_KEY_ID;
    const keySecret = process.env.RAZORPAYX_KEY_SECRET;
    const sourceAccountNumber = process.env.RAZORPAYX_SOURCE_ACCOUNT_NUMBER;

    if (!keyId || !keySecret || !sourceAccountNumber) {
        throw new Error("RazorpayX payout validation is not configured on the server.");
    }

    return { keyId, keySecret, sourceAccountNumber };
}

/** When true, never call RazorpayX validation APIs (manual admin review only). */
export function isRazorpayXValidationDisabledByEnv(): boolean {
    const v = (process.env.DISABLE_RAZORPAYX_VALIDATION || "").trim().toLowerCase();
    return v === "true" || v === "1" || v === "yes";
}

export function isRazorpayXValidationEnvComplete(): boolean {
    const keyId = process.env.RAZORPAYX_KEY_ID?.trim();
    const keySecret = process.env.RAZORPAYX_KEY_SECRET?.trim();
    const sourceAccountNumber = process.env.RAZORPAYX_SOURCE_ACCOUNT_NUMBER?.trim();
    return Boolean(keyId && keySecret && sourceAccountNumber);
}

/** Run penny-drop / fund validation against RazorpayX only when explicitly enabled and creds exist. */
export function shouldRunRazorpayXPayoutValidation(): boolean {
    if (isRazorpayXValidationDisabledByEnv()) return false;
    return isRazorpayXValidationEnvComplete();
}

function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function authHeader() {
    const { keyId, keySecret } = getConfig();
    return `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`;
}

async function razorpayXRequest<T>(path: string, init: RequestInit): Promise<T> {
    const response = await fetch(`${BASE_URL}${path}`, {
        ...init,
        headers: {
            Authorization: authHeader(),
            "Content-Type": "application/json",
            ...(init.headers || {}),
        },
    });

    const text = await response.text();
    const data = text ? JSON.parse(text) : {};

    if (!response.ok) {
        const message =
            data?.error?.description ||
            data?.error?.reason ||
            data?.error?.code ||
            data?.message ||
            `RazorpayX request failed with status ${response.status}`;
        throw new Error(message);
    }

    return data as T;
}

function normalizeName(value: string) {
    return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function namesLikelyMatch(submittedName: string, providerName: string | null | undefined) {
    if (!providerName) return false;
    const left = normalizeName(submittedName);
    const right = normalizeName(providerName);
    return Boolean(left && right && (left === right || left.includes(right) || right.includes(left)));
}

function buildDecision(input: {
    methodType: RazorpayXMethodType;
    validation: RazorpayXResponse;
    submittedName: string;
    providerValidationMode: string;
    contactId: string | null;
    fundAccountId: string | null;
}): ProviderValidationResult {
    const providerStatus = input.validation.status || null;
    const registeredName = input.validation.results?.registered_name || null;
    const nameMatchScore = input.validation.results?.name_match_score ?? null;
    const accountStatus = input.validation.results?.account_status || null;
    const reason =
        input.validation.status_details?.description ||
        input.validation.results?.details ||
        input.validation.status_details?.reason ||
        null;

    let verificationStatus: ProviderVerificationDecision = "PENDING_PROVIDER";
    let verificationNotes: string | null = null;

    if (providerStatus === "completed") {
        const strongNameMatch =
            typeof nameMatchScore === "number"
                ? nameMatchScore >= AUTO_VERIFY_NAME_MATCH_SCORE
                : namesLikelyMatch(input.submittedName, registeredName);
        const activeAccount = accountStatus === "active";

        if (activeAccount && strongNameMatch) {
            verificationStatus = "VERIFIED";
            verificationNotes = "Live Razorpay validation completed successfully.";
        } else {
            verificationStatus = "VERIFIED";
            verificationNotes = activeAccount
                ? "Razorpay validated the destination; beneficiary name differed from submission — details kept on file."
                : reason || "Razorpay could not confirm the payout destination as active; details kept on file.";
        }
    } else if (providerStatus === "failed") {
        verificationStatus = "VERIFIED";
        verificationNotes = reason || "Razorpay validation did not complete; payout details saved on file.";
    } else {
        verificationStatus = "PENDING_PROVIDER";
        verificationNotes = "Razorpay validation is still in progress.";
    }

    return {
        methodType: input.methodType,
        providerValidationId: input.validation.id || null,
        providerValidationStatus: providerStatus,
        providerValidationMode: input.providerValidationMode,
        providerValidationReference: input.validation.reference_id || null,
        providerContactId:
            input.validation.fund_account?.contact_id || input.validation.contact_id || input.contactId,
        providerFundAccountId: input.validation.fund_account?.id || input.fundAccountId,
        providerRegisteredName: registeredName,
        providerNameMatchScore: typeof nameMatchScore === "number" ? Math.round(nameMatchScore) : null,
        providerValidationReason: reason,
        providerValidationPayload: input.validation,
        providerValidatedAt: providerStatus === "completed" ? new Date() : null,
        providerUtr: input.validation.utr || null,
        verificationStatus,
        verificationNotes,
    };
}

async function createContact(input: ContactInput) {
    const referenceId = `artist_${input.artistId.slice(0, 24)}`;
    return razorpayXRequest<{ id: string }>("/contacts", {
        method: "POST",
        body: JSON.stringify({
            name: input.name.slice(0, 50),
            email: input.email,
            contact: input.phone?.slice(0, 15) || undefined,
            type: "employee",
            reference_id: referenceId,
            notes: {
                artistId: input.artistId,
                scope: "artist_payout_validation",
            },
        }),
    });
}

async function createBankFundAccount(contactId: string, input: BankValidationInput) {
    return razorpayXRequest<{ id: string }>("/fund_accounts", {
        method: "POST",
        body: JSON.stringify({
            contact_id: contactId,
            account_type: "bank_account",
            bank_account: {
                name: input.bankAccountName,
                ifsc: input.bankIfsc,
                account_number: input.bankAccountNumber,
            },
        }),
    });
}

async function createVpaFundAccount(contactId: string, input: UpiValidationInput) {
    return razorpayXRequest<{ id: string }>("/fund_accounts", {
        method: "POST",
        body: JSON.stringify({
            contact_id: contactId,
            account_type: "vpa",
            vpa: {
                address: input.upiId,
            },
        }),
    });
}

async function createBankValidation(fundAccountId: string) {
    const { sourceAccountNumber } = getConfig();
    return razorpayXRequest<RazorpayXResponse>("/fund_accounts/validations", {
        method: "POST",
        body: JSON.stringify({
            account_number: sourceAccountNumber,
            fund_account: { id: fundAccountId },
            amount: 100,
            currency: "INR",
            notes: {
                scope: "artist_payout_validation",
            },
        }),
    });
}

async function createVpaValidation(contact: ContactInput, input: UpiValidationInput) {
    const { sourceAccountNumber } = getConfig();
    return razorpayXRequest<RazorpayXResponse>("/fund_accounts/validations", {
        method: "POST",
        body: JSON.stringify({
            source_account_number: sourceAccountNumber,
            validation_type: "pennydrop",
            reference_id: `artist_${contact.artistId.slice(0, 24)}_${Date.now()}`,
            fund_account: {
                account_type: "vpa",
                vpa: {
                    address: input.upiId,
                },
                contact: {
                    name: input.upiName.slice(0, 50),
                    email: contact.email,
                    contact: contact.phone?.slice(0, 15) || undefined,
                    type: "employee",
                    reference_id: `artist_${contact.artistId.slice(0, 24)}`,
                },
            },
        }),
    });
}

export async function fetchValidationById(validationId: string) {
    return razorpayXRequest<RazorpayXResponse>(`/fund_accounts/validations/${validationId}`, {
        method: "GET",
    });
}

async function waitForSettledValidation(validation: RazorpayXResponse) {
    let current = validation;
    if (!current.id) return current;

    for (const delay of POLL_DELAYS_MS) {
        if (current.status === "completed" || current.status === "failed") {
            return current;
        }
        const validationId = current.id;
        if (!validationId) {
            return current;
        }
        await sleep(delay);
        current = await fetchValidationById(validationId);
    }

    return current;
}

export async function validateBankPayoutMethod(input: BankValidationInput) {
    const contact = await createContact(input);
    const fundAccount = await createBankFundAccount(contact.id, input);
    const validation = await waitForSettledValidation(await createBankValidation(fundAccount.id));

    return buildDecision({
        methodType: "BANK_ACCOUNT",
        validation,
        submittedName: input.bankAccountName,
        providerValidationMode: "BANK_PENNYDROP",
        contactId: contact.id,
        fundAccountId: fundAccount.id,
    });
}

export async function validateUpiPayoutMethod(input: UpiValidationInput) {
    const contact = await createContact(input);
    const fundAccount = await createVpaFundAccount(contact.id, input);
    const validation = await waitForSettledValidation(await createVpaValidation(input, input));

    return buildDecision({
        methodType: "UPI",
        validation,
        submittedName: input.upiName,
        providerValidationMode: "UPI_PENNYDROP",
        contactId: contact.id,
        fundAccountId: fundAccount.id,
    });
}
