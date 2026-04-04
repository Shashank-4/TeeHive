import crypto from "crypto";
import {
    Prisma,
    PrismaClient,
    PayoutMethodType,
    PayoutReviewAction,
    PayoutVerificationStatus,
} from "@prisma/client";
import {
    fetchValidationById,
    validateBankPayoutMethod,
    validateUpiPayoutMethod,
    type ProviderValidationResult,
} from "./razorpayXValidation.service";

const prisma = new PrismaClient();

type SaveArtistPayoutMethodsInput = {
    preferredMethod?: "UPI" | "BANK";
    upiId?: string;
    upiName?: string;
    bankAccountName?: string;
    bankAccountNumber?: string;
    bankIfsc?: string;
    bankName?: string;
};

const UPI_ID_REGEX = /^[a-z0-9._-]{2,256}@[a-z]{2,64}$/i;
const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const BANK_ACCOUNT_REGEX = /^\d{6,18}$/;

function getPayoutEncryptionKey() {
    const secret = process.env.PAYOUT_DETAILS_ENCRYPTION_KEY;
    if (!secret) {
        throw new Error("Payout encryption key is not configured on the server.");
    }
    return crypto.createHash("sha256").update(secret).digest();
}

function encryptValue(value: string) {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv("aes-256-gcm", getPayoutEncryptionKey(), iv);
    const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag();
    return Buffer.concat([iv, tag, encrypted]).toString("base64");
}

function decryptValue(value: string | null | undefined) {
    if (!value) return "";
    const payload = Buffer.from(value, "base64");
    const iv = payload.subarray(0, 12);
    const tag = payload.subarray(12, 28);
    const encrypted = payload.subarray(28);
    const decipher = crypto.createDecipheriv("aes-256-gcm", getPayoutEncryptionKey(), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}

function buildFingerprint(type: PayoutMethodType, seed: string) {
    return crypto
        .createHash("sha256")
        .update(`${type}:${seed}`)
        .digest("hex");
}

function normalizeUpiId(value: string) {
    return value.trim().toLowerCase();
}

function normalizeName(value: string) {
    return value.trim().replace(/\s+/g, " ");
}

function normalizeAccountNumber(value: string) {
    return value.replace(/\D/g, "");
}

function normalizeIfsc(value: string) {
    return value.trim().toUpperCase();
}

function maskUpiId(upiId: string) {
    const [local, handle] = upiId.split("@");
    if (!local || !handle) return upiId;
    if (local.length <= 2) return `${local[0] || "*"}***@${handle}`;
    return `${local.slice(0, 2)}***@${handle}`;
}

function maskBankAccount(last4: string | null | undefined) {
    return last4 ? `XXXXXX${last4}` : "";
}

function buildProviderSummary(method: any) {
    return {
        validationId: method.providerValidationId || null,
        validationStatus: method.providerValidationStatus || null,
        validationMode: method.providerValidationMode || null,
        validationReference: method.providerValidationReference || null,
        registeredName: method.providerRegisteredName || null,
        nameMatchScore: method.providerNameMatchScore ?? null,
        reason: method.providerValidationReason || null,
        validatedAt: method.providerValidatedAt || null,
        utr: method.providerUtr || null,
    };
}

function mapMethodForArtist(method: any) {
    return {
        id: method.id,
        methodType: method.methodType,
        verificationStatus: method.verificationStatus,
        isDefault: method.isDefault,
        isActive: method.isActive,
        submittedAt: method.submittedAt,
        verifiedAt: method.verifiedAt,
        rejectedAt: method.rejectedAt,
        rejectionReason: method.rejectionReason,
        verificationNotes: method.verificationNotes,
        upiId: method.upiId || "",
        upiIdMasked: method.upiId ? maskUpiId(method.upiId) : "",
        upiName: method.upiName || "",
        bankAccountName: method.bankAccountName || "",
        bankAccountNumber: decryptValue(method.bankAccountNumberEncrypted),
        bankAccountNumberMasked: maskBankAccount(method.bankAccountNumberLast4),
        bankAccountNumberLast4: method.bankAccountNumberLast4 || "",
        bankIfsc: method.bankIfsc || "",
        bankName: method.bankName || "",
        providerValidation: buildProviderSummary(method),
        reviews: (method.reviews || []).map((review: any) => ({
            id: review.id,
            action: review.action,
            note: review.note,
            createdAt: review.createdAt,
            reviewerAdmin: review.reviewerAdmin
                ? {
                      id: review.reviewerAdmin.id,
                      name: review.reviewerAdmin.name,
                      email: review.reviewerAdmin.email,
                  }
                : null,
        })),
    };
}

function mapMethodForAdmin(method: any) {
    return {
        id: method.id,
        methodType: method.methodType,
        verificationStatus: method.verificationStatus,
        isDefault: method.isDefault,
        isActive: method.isActive,
        submittedAt: method.submittedAt,
        verifiedAt: method.verifiedAt,
        rejectedAt: method.rejectedAt,
        rejectionReason: method.rejectionReason,
        verificationNotes: method.verificationNotes,
        upiIdMasked: method.upiId ? maskUpiId(method.upiId) : "",
        upiName: method.upiName || "",
        bankAccountName: method.bankAccountName || "",
        bankAccountNumberMasked: maskBankAccount(method.bankAccountNumberLast4),
        bankAccountNumberLast4: method.bankAccountNumberLast4 || "",
        bankIfsc: method.bankIfsc || "",
        bankName: method.bankName || "",
        providerValidation: buildProviderSummary(method),
        reviews: (method.reviews || []).map((review: any) => ({
            id: review.id,
            action: review.action,
            note: review.note,
            createdAt: review.createdAt,
            reviewerAdmin: review.reviewerAdmin
                ? {
                      id: review.reviewerAdmin.id,
                      name: review.reviewerAdmin.name,
                      email: review.reviewerAdmin.email,
                  }
                : null,
        })),
    };
}

function applyProviderValidationUpdate(result: ProviderValidationResult) {
    return {
        providerValidationId: result.providerValidationId,
        providerValidationStatus: result.providerValidationStatus,
        providerValidationMode: result.providerValidationMode,
        providerValidationReference: result.providerValidationReference,
        providerContactId: result.providerContactId,
        providerFundAccountId: result.providerFundAccountId,
        providerRegisteredName: result.providerRegisteredName,
        providerNameMatchScore: result.providerNameMatchScore,
        providerValidationReason: result.providerValidationReason,
        providerValidationPayload: result.providerValidationPayload as Prisma.InputJsonValue,
        providerValidatedAt: result.providerValidatedAt,
        providerUtr: result.providerUtr,
        verificationStatus: result.verificationStatus,
        verificationNotes: result.verificationNotes,
        verifiedAt: result.verificationStatus === "VERIFIED" ? new Date() : null,
        rejectedAt: null,
        rejectionReason: null,
    };
}

function buildProviderFallbackResult(
    methodType: PayoutMethodType,
    mode: string,
    reason: string
): ProviderValidationResult {
    return {
        methodType,
        providerValidationId: null,
        providerValidationStatus: "provider_unavailable",
        providerValidationMode: mode,
        providerValidationReference: null,
        providerContactId: null,
        providerFundAccountId: null,
        providerRegisteredName: null,
        providerNameMatchScore: null,
        providerValidationReason: reason,
        providerValidationPayload: {
            status: "failed",
            status_details: {
                description: reason,
                reason: "provider_unavailable",
                source: "internal",
            },
        },
        providerValidatedAt: null,
        providerUtr: null,
        verificationStatus: "PENDING_REVIEW",
        verificationNotes:
            "Automatic Razorpay validation could not be completed. Finance review is required before settlement.",
    };
}

async function refreshPendingProviderValidation(method: any) {
    if (method.verificationStatus !== "PENDING_PROVIDER" || !method.providerValidationId) {
        return;
    }

    try {
        const latest = await fetchValidationById(method.providerValidationId);
        const nameUsedForVerification =
            method.methodType === "UPI" ? method.upiName || "" : method.bankAccountName || "";
        const result: ProviderValidationResult = {
            methodType: method.methodType,
            providerValidationId: latest.id || method.providerValidationId,
            providerValidationStatus: latest.status || method.providerValidationStatus,
            providerValidationMode: method.providerValidationMode || method.methodType,
            providerValidationReference:
                latest.reference_id || method.providerValidationReference || null,
            providerContactId:
                latest.fund_account?.contact_id || latest.contact_id || method.providerContactId || null,
            providerFundAccountId:
                latest.fund_account?.id || method.providerFundAccountId || null,
            providerRegisteredName: latest.results?.registered_name || null,
            providerNameMatchScore:
                typeof latest.results?.name_match_score === "number"
                    ? Math.round(latest.results.name_match_score)
                    : null,
            providerValidationReason:
                latest.status_details?.description ||
                latest.results?.details ||
                latest.status_details?.reason ||
                null,
            providerValidationPayload: latest,
            providerValidatedAt: latest.status === "completed" ? new Date() : null,
            providerUtr: latest.utr || null,
            verificationStatus:
                latest.status === "completed"
                    ? (typeof latest.results?.name_match_score === "number" &&
                      latest.results.name_match_score >= 85) ||
                      normalizeName(latest.results?.registered_name || "") === normalizeName(nameUsedForVerification)
                        ? "VERIFIED"
                        : "PENDING_REVIEW"
                    : latest.status === "failed"
                      ? "PENDING_REVIEW"
                      : "PENDING_PROVIDER",
            verificationNotes:
                latest.status === "completed"
                    ? (typeof latest.results?.name_match_score === "number" &&
                      latest.results.name_match_score >= 85) ||
                      normalizeName(latest.results?.registered_name || "") === normalizeName(nameUsedForVerification)
                        ? "Live Razorpay validation completed successfully."
                        : "Razorpay validated the destination, but the beneficiary name needs manual review."
                    : latest.status === "failed"
                      ? latest.status_details?.description ||
                        latest.results?.details ||
                        "Razorpay validation failed and needs manual review."
                      : "Razorpay validation is still in progress.",
        };

        await prisma.artistPayoutMethod.update({
            where: { id: method.id },
            data: applyProviderValidationUpdate(result),
        });
    } catch (error) {
        console.error("Failed to refresh pending payout validation:", error);
    }
}

async function loadMethods(artistId: string) {
    const pendingMethods = await prisma.artistPayoutMethod.findMany({
        where: {
            artistId,
            isActive: true,
            verificationStatus: "PENDING_PROVIDER",
            providerValidationId: { not: null },
        },
    });
    await Promise.all(pendingMethods.map((method) => refreshPendingProviderValidation(method)));

    return prisma.artistPayoutMethod.findMany({
        where: { artistId, isActive: true },
        orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }],
        include: {
            reviews: {
                orderBy: { createdAt: "desc" },
                take: 5,
                include: {
                    reviewerAdmin: {
                        select: { id: true, name: true, email: true },
                    },
                },
            },
        },
    });
}

export async function listArtistPayoutMethodsService(artistId: string) {
    const methods = await loadMethods(artistId);
    return {
        methods: methods.map(mapMethodForArtist),
        defaultMethodId: methods.find((method) => method.isDefault)?.id || null,
    };
}

export async function listAdminArtistPayoutMethodsService(artistId: string) {
    const artist = await prisma.user.findUnique({
        where: { id: artistId },
        select: { id: true, name: true, email: true, displayName: true, isArtist: true },
    });

    if (!artist || !artist.isArtist) {
        throw new Error("Artist not found");
    }

    const methods = await loadMethods(artistId);
    return {
        artist,
        methods: methods.map(mapMethodForAdmin),
        defaultMethodId: methods.find((method) => method.isDefault)?.id || null,
    };
}

export async function saveArtistPayoutMethodsService(
    artistId: string,
    input: SaveArtistPayoutMethodsInput
) {
    const artist = await prisma.user.findUnique({
        where: { id: artistId },
        select: {
            id: true,
            email: true,
            name: true,
            displayName: true,
        },
    });

    if (!artist) {
        throw new Error("Artist not found");
    }

    const preferredMethod = input.preferredMethod === "BANK" ? "BANK_ACCOUNT" : "UPI";
    const upiTouched = Boolean(input.upiId?.trim() || input.upiName?.trim());
    const bankTouched = Boolean(
        input.bankAccountName?.trim() ||
            input.bankAccountNumber?.trim() ||
            input.bankIfsc?.trim() ||
            input.bankName?.trim()
    );

    let upiPayload:
        | {
              fingerprint: string;
              upiId: string;
              upiName: string;
          }
        | undefined;
    if (upiTouched) {
        const upiId = normalizeUpiId(input.upiId || "");
        const upiName = normalizeName(input.upiName || "");
        if (!upiId || !upiName) {
            throw new Error("Both UPI ID and linked name are required.");
        }
        if (!UPI_ID_REGEX.test(upiId)) {
            throw new Error("Please enter a valid UPI ID.");
        }
        upiPayload = {
            fingerprint: buildFingerprint("UPI", upiId),
            upiId,
            upiName,
        };
    }

    let bankPayload:
        | {
              fingerprint: string;
              bankAccountName: string;
              bankAccountNumber: string;
              bankAccountNumberEncrypted: string;
              bankAccountNumberLast4: string;
              bankIfsc: string;
              bankName: string;
          }
        | undefined;
    if (bankTouched) {
        const bankAccountName = normalizeName(input.bankAccountName || "");
        const bankAccountNumber = normalizeAccountNumber(input.bankAccountNumber || "");
        const bankIfsc = normalizeIfsc(input.bankIfsc || "");
        const bankName = normalizeName(input.bankName || "");

        if (!bankAccountName || !bankAccountNumber || !bankIfsc || !bankName) {
            throw new Error("Bank account name, account number, IFSC, and bank name are required.");
        }
        if (!BANK_ACCOUNT_REGEX.test(bankAccountNumber)) {
            throw new Error("Please enter a valid bank account number.");
        }
        if (!IFSC_REGEX.test(bankIfsc)) {
            throw new Error("Please enter a valid IFSC code.");
        }

        bankPayload = {
            fingerprint: buildFingerprint("BANK_ACCOUNT", `${bankAccountNumber}:${bankIfsc}`),
            bankAccountName,
            bankAccountNumber,
            bankAccountNumberEncrypted: encryptValue(bankAccountNumber),
            bankAccountNumberLast4: bankAccountNumber.slice(-4),
            bankIfsc,
            bankName,
        };
    }

    if (!upiPayload && !bankPayload) {
        throw new Error("Add at least one valid payout method before saving.");
    }

    const existingMethods = await prisma.artistPayoutMethod.findMany({
        where: {
            artistId,
            OR: [
                upiPayload
                    ? {
                          methodType: "UPI",
                          methodFingerprint: upiPayload.fingerprint,
                      }
                    : undefined,
                bankPayload
                    ? {
                          methodType: "BANK_ACCOUNT",
                          methodFingerprint: bankPayload.fingerprint,
                      }
                    : undefined,
            ].filter(Boolean) as Prisma.ArtistPayoutMethodWhereInput[],
        },
    });

    const existingMethodByKey = new Map(
        existingMethods.map((method) => [
            `${method.methodType}:${method.methodFingerprint || ""}`,
            method,
        ])
    );

    const providerResults = new Map<PayoutMethodType, ProviderValidationResult | null>();

    const existingUpiMethod = upiPayload
        ? existingMethodByKey.get(`UPI:${upiPayload.fingerprint}`)
        : null;
    const existingBankMethod = bankPayload
        ? existingMethodByKey.get(`BANK_ACCOUNT:${bankPayload.fingerprint}`)
        : null;

    if (upiPayload && existingUpiMethod?.verificationStatus !== "VERIFIED") {
        try {
            providerResults.set(
                "UPI",
                await validateUpiPayoutMethod({
                    artistId,
                    name: artist.displayName || artist.name,
                    email: artist.email,
                    upiId: upiPayload.upiId,
                    upiName: upiPayload.upiName,
                })
            );
        } catch (error: any) {
            if (error?.message?.includes("not configured")) {
                throw error;
            }
            providerResults.set(
                "UPI",
                buildProviderFallbackResult(
                    "UPI",
                    "UPI_PENNYDROP",
                    error?.message || "Razorpay validation is temporarily unavailable."
                )
            );
        }
    }

    if (bankPayload && existingBankMethod?.verificationStatus !== "VERIFIED") {
        try {
            providerResults.set(
                "BANK_ACCOUNT",
                await validateBankPayoutMethod({
                    artistId,
                    name: artist.displayName || artist.name,
                    email: artist.email,
                    bankAccountName: bankPayload.bankAccountName,
                    bankAccountNumber: bankPayload.bankAccountNumber,
                    bankIfsc: bankPayload.bankIfsc,
                })
            );
        } catch (error: any) {
            if (error?.message?.includes("not configured")) {
                throw error;
            }
            providerResults.set(
                "BANK_ACCOUNT",
                buildProviderFallbackResult(
                    "BANK_ACCOUNT",
                    "BANK_PENNYDROP",
                    error?.message || "Razorpay validation is temporarily unavailable."
                )
            );
        }
    }

    const methods = await prisma.$transaction(async (tx) => {
        const savedMethodIds: string[] = [];

        const upsertMethod = async (
            methodType: PayoutMethodType,
            payload:
                | typeof upiPayload
                | typeof bankPayload,
            isDefault: boolean
        ) => {
            if (!payload) return null;

            const existing =
                existingMethodByKey.get(`${methodType}:${payload.fingerprint}`) || null;

            const preserveVerified = existing?.verificationStatus === "VERIFIED";
            const providerResult = preserveVerified ? null : providerResults.get(methodType) || null;

            const method = existing
                ? await tx.artistPayoutMethod.update({
                      where: { id: existing.id },
                      data: {
                          isActive: true,
                          isDefault,
                          methodFingerprint: payload.fingerprint,
                          verificationStatus: preserveVerified
                              ? "VERIFIED"
                              : providerResult?.verificationStatus || "PENDING_REVIEW",
                          submittedAt: preserveVerified
                              ? existing.submittedAt || existing.verifiedAt || new Date()
                              : new Date(),
                          verifiedAt: preserveVerified ? existing.verifiedAt : null,
                          rejectedAt: null,
                          rejectionReason: null,
                          verificationNotes:
                              preserveVerified ? existing.verificationNotes : providerResult?.verificationNotes || null,
                          ...(providerResult ? applyProviderValidationUpdate(providerResult) : {}),
                          ...(methodType === "UPI"
                              ? {
                                    upiId: (payload as NonNullable<typeof upiPayload>).upiId,
                                    upiName: (payload as NonNullable<typeof upiPayload>).upiName,
                                }
                              : {
                                    bankAccountName: (payload as NonNullable<typeof bankPayload>).bankAccountName,
                                    bankAccountNumberEncrypted: (payload as NonNullable<typeof bankPayload>).bankAccountNumberEncrypted,
                                    bankAccountNumberLast4: (payload as NonNullable<typeof bankPayload>).bankAccountNumberLast4,
                                    bankIfsc: (payload as NonNullable<typeof bankPayload>).bankIfsc,
                                    bankName: (payload as NonNullable<typeof bankPayload>).bankName,
                                }),
                      },
                  })
                : await tx.artistPayoutMethod.create({
                      data: {
                          artistId,
                          methodType,
                          methodFingerprint: payload.fingerprint,
                          verificationStatus: providerResult?.verificationStatus || "PENDING_REVIEW",
                          isActive: true,
                          isDefault,
                          submittedAt: new Date(),
                          verificationNotes: providerResult?.verificationNotes || null,
                          ...(providerResult ? applyProviderValidationUpdate(providerResult) : {}),
                          ...(methodType === "UPI"
                              ? {
                                    upiId: (payload as NonNullable<typeof upiPayload>).upiId,
                                    upiName: (payload as NonNullable<typeof upiPayload>).upiName,
                                }
                              : {
                                    bankAccountName: (payload as NonNullable<typeof bankPayload>).bankAccountName,
                                    bankAccountNumberEncrypted: (payload as NonNullable<typeof bankPayload>).bankAccountNumberEncrypted,
                                    bankAccountNumberLast4: (payload as NonNullable<typeof bankPayload>).bankAccountNumberLast4,
                                    bankIfsc: (payload as NonNullable<typeof bankPayload>).bankIfsc,
                                    bankName: (payload as NonNullable<typeof bankPayload>).bankName,
                                }),
                      },
                  });

            savedMethodIds.push(method.id);
            return method;
        };

        const onlyValidType = upiPayload && !bankPayload ? "UPI" : !upiPayload && bankPayload ? "BANK_ACCOUNT" : preferredMethod;

        await upsertMethod("UPI", upiPayload, onlyValidType === "UPI");
        await upsertMethod("BANK_ACCOUNT", bankPayload, onlyValidType === "BANK_ACCOUNT");

        await tx.artistPayoutMethod.updateMany({
            where: {
                artistId,
                methodType: "UPI",
                id: { notIn: savedMethodIds },
            },
            data: {
                isActive: false,
                isDefault: false,
                verificationStatus: "DISABLED",
            },
        });

        await tx.artistPayoutMethod.updateMany({
            where: {
                artistId,
                methodType: "BANK_ACCOUNT",
                id: { notIn: savedMethodIds },
            },
            data: {
                isActive: false,
                isDefault: false,
                verificationStatus: "DISABLED",
            },
        });

        await tx.artistPayoutMethod.updateMany({
            where: {
                artistId,
                id: { notIn: savedMethodIds },
            },
            data: { isDefault: false },
        });

        await tx.user.update({
            where: { id: artistId },
            data: { payoutDetails: Prisma.DbNull },
        });

        return tx.artistPayoutMethod.findMany({
            where: { artistId, isActive: true },
            orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }],
            include: {
                reviews: {
                    orderBy: { createdAt: "desc" },
                    take: 5,
                    include: {
                        reviewerAdmin: {
                            select: { id: true, name: true, email: true },
                        },
                    },
                },
            },
        });
    });

    return {
        methods: methods.map(mapMethodForArtist),
        defaultMethodId: methods.find((method) => method.isDefault)?.id || null,
    };
}

export async function reviewArtistPayoutMethodService(input: {
    artistId: string;
    payoutMethodId: string;
    reviewerAdminId: string;
    action: PayoutReviewAction;
    note?: string;
}) {
    const method = await prisma.artistPayoutMethod.findFirst({
        where: {
            id: input.payoutMethodId,
            artistId: input.artistId,
            isActive: true,
        },
    });

    if (!method) {
        throw new Error("Payout method not found");
    }

    if (input.action !== "APPROVED" && !input.note?.trim()) {
        throw new Error("A review note is required for rejection or resubmission.");
    }

    const updatedMethod = await prisma.$transaction(async (tx) => {
        const verificationStatus: PayoutVerificationStatus =
            input.action === "APPROVED"
                ? "VERIFIED"
                : input.action === "REQUIRES_RESUBMISSION"
                  ? "REQUIRES_RESUBMISSION"
                  : "REJECTED";

        await tx.artistPayoutMethod.update({
            where: { id: method.id },
            data: {
                verificationStatus,
                verifiedAt: input.action === "APPROVED" ? new Date() : null,
                rejectedAt: input.action === "APPROVED" ? null : new Date(),
                rejectionReason: input.action === "APPROVED" ? null : input.note?.trim() || null,
                verificationNotes: input.note?.trim() || null,
            },
        });

        await tx.artistPayoutReview.create({
            data: {
                payoutMethodId: method.id,
                artistId: input.artistId,
                reviewerAdminId: input.reviewerAdminId,
                action: input.action,
                note: input.note?.trim() || null,
            },
        });

        return tx.artistPayoutMethod.findUniqueOrThrow({
            where: { id: method.id },
            include: {
                reviews: {
                    orderBy: { createdAt: "desc" },
                    take: 5,
                    include: {
                        reviewerAdmin: {
                            select: { id: true, name: true, email: true },
                        },
                    },
                },
            },
        });
    });

    return mapMethodForAdmin(updatedMethod);
}
