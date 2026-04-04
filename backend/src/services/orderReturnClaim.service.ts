import { OrderStatus, Prisma, ReturnClaimReason } from "@prisma/client";
import { uploadAssetToR2 } from "./product.service";

const RETURN_WINDOW_DAYS = 5;

export const RETURN_CLAIM_REASON_OPTIONS: ReturnClaimReason[] = [
    "DAMAGED_GOODS",
    "WRONG_PRODUCT",
    "WRONG_SIZE",
    "WRONG_COLOR",
    "OTHER_ELIGIBLE_ISSUE",
];

export function isReturnClaimReason(value: string): value is ReturnClaimReason {
    return RETURN_CLAIM_REASON_OPTIONS.includes(value as ReturnClaimReason);
}

export function getReturnClaimEligibility(input: {
    status: OrderStatus;
    deliveredAt: Date;
    hasExistingClaim: boolean;
}) {
    if (input.status !== "DELIVERED") {
        return {
            eligible: false,
            message: "Return claims can only be submitted after the order is marked delivered.",
        };
    }

    if (input.hasExistingClaim) {
        return {
            eligible: false,
            message: "A return claim has already been submitted for this order.",
        };
    }

    const deadline = new Date(input.deliveredAt.getTime() + RETURN_WINDOW_DAYS * 24 * 60 * 60 * 1000);
    if (Date.now() > deadline.getTime()) {
        return {
            eligible: false,
            message: "The 5-day return claim window has expired for this order.",
        };
    }

    return {
        eligible: true,
        deadline,
        message: `Eligible until ${deadline.toISOString()}.`,
    };
}

export async function uploadReturnClaimEvidence(files: Express.Multer.File[] = []) {
    const uploads = await Promise.all(
        files.map((file) => uploadAssetToR2(file, "return-claims"))
    );

    return {
        evidenceUrls: uploads.map((upload) => upload.assetUrl),
        evidenceKeys: uploads.map((upload) => upload.assetKey),
    };
}

export function buildReturnClaimView(
    claim:
        | (Prisma.OrderReturnClaimGetPayload<{
              include: {
                  reviewedByAdmin: { select: { id: true; name: true; email: true } };
              };
          }> & {
              order?: { updatedAt: Date; status: OrderStatus } | null;
          })
        | null
) {
    if (!claim) return null;

    const evidenceUrls = Array.isArray(claim.evidenceUrls) ? claim.evidenceUrls : [];
    const evidenceKeys = Array.isArray(claim.evidenceKeys) ? claim.evidenceKeys : [];
    const deliveredAt = claim.order?.status === "DELIVERED" ? claim.order.updatedAt : null;
    const eligibility = deliveredAt
        ? getReturnClaimEligibility({
              status: claim.order!.status,
              deliveredAt,
              hasExistingClaim: true,
          })
        : null;

    return {
        id: claim.id,
        orderId: claim.orderId,
        reason: claim.reason,
        status: claim.status,
        description: claim.description,
        evidenceUrls,
        evidenceCount: evidenceUrls.length,
        evidenceKeys,
        requestedAt: claim.requestedAt,
        reviewedAt: claim.reviewedAt,
        reviewNote: claim.reviewNote,
        reviewedByAdmin: claim.reviewedByAdmin
            ? {
                  id: claim.reviewedByAdmin.id,
                  name: claim.reviewedByAdmin.name,
                  email: claim.reviewedByAdmin.email,
              }
            : null,
        policyWindowDays: RETURN_WINDOW_DAYS,
        policyDeadline: eligibility?.deadline || null,
    };
}

export function sanitizeClaimDescription(value: string) {
    return value.trim().replace(/\s+/g, " ");
}
