import type { LegalDocMeta, LegalSection } from "./types";

export const returnRefundMeta: LegalDocMeta = {
    brandLine: "Teehive is a brand operated by Karuna Innovations Sole Proprietorship - India.",
    docTitle: "Return & Refund Policy",
    shortName: "Return & Refund Policy",
    titleLines: ["Return &", "Refund", "Policy"],
    version: "1.0",
    contactEmail: "contact@teehive.co.in",
    phoneDisplay: "+91 92467 59898",
    website: "teehive.co.in",
    publicLabel: "Public Policy Document",
    effectiveDate: "5th April, 2026",
    intro: [
        "This Return & Refund Policy applies to purchases made through www.teehive.co.in, operated by Karuna Innovations under the brand name TeeHive.",
        "By placing an order on TeeHive, you agree to this policy.",
    ],
};

export const returnRefundSections: LegalSection[] = [
    {
        id: "eligibility",
        number: "1",
        title: "ELIGIBILITY FOR RETURNS",
        blocks: [
            { type: "paragraph", text: "Returns are accepted only under the following conditions:" },
            {
                type: "bullets",
                items: [
                    "The product received is physically damaged",
                    "The print on the product is incorrect or defective",
                    "The size delivered does not match the size ordered",
                    "The color of the ordered product is incorrect",
                ],
            },
            {
                type: "paragraph",
                text: "Return requests must be initiated within 5 days from the date of delivery.\nReturns requested after 5 days will not be accepted.",
            },
        ],
    },
    {
        id: "non-returnable",
        number: "2",
        title: "NON-RETURNABLE CASES",
        blocks: [
            { type: "paragraph", text: "Returns will NOT be accepted in cases of:" },
            {
                type: "bullets",
                items: [
                    "Change of mind",
                    "Incorrect size selected by the customer",
                    "Minor color variations due to screen differences",
                    "Slight placement variation in print",
                    "Products washed, worn, or altered",
                    "Incorrect shipping address provided by the customer",
                ],
            },
            {
                type: "paragraph",
                text: "As all products are printed on demand, we do not accept returns for buyer preference changes.",
            },
        ],
    },
    {
        id: "return-process",
        number: "3",
        title: "RETURN PROCESS",
        blocks: [
            { type: "paragraph", text: "To initiate a return:" },
            { type: "bullets", items: ["Email contact@teehive.co.in"] },
            {
                type: "paragraph",
                text: "Include:",
            },
            {
                type: "bullets",
                items: [
                    "Order ID",
                    "Recorded video during the opening of the package",
                    "Clear photographs of the issue",
                    "Description of the problem",
                ],
            },
            {
                type: "paragraph",
                text: "Our team will review the request and respond within a reasonable timeframe.\nIf approved, further instructions will be provided.",
            },
        ],
    },
    {
        id: "refund-replacement",
        number: "4",
        title: "REFUND / REPLACEMENT",
        blocks: [
            { type: "paragraph", text: "Upon approval:" },
            {
                type: "bullets",
                items: [
                    "The product may be replaced OR",
                    "A refund may be issued, at the discretion of Karuna Innovations",
                ],
            },
            {
                type: "paragraph",
                text: "Refunds (if approved) will be processed to the original payment method.\nRefund processing time may vary depending on the payment provider.",
            },
        ],
    },
    {
        id: "shipping-costs",
        number: "5",
        title: "SHIPPING COSTS",
        blocks: [
            { type: "paragraph", text: "If the return is approved due to:" },
            {
                type: "bullets",
                items: ["Damaged product", "Wrong print", "Wrong size or color delivered"],
            },
            {
                type: "paragraph",
                text: "Return shipping (if applicable) will be arranged or reimbursed by TeeHive.\nShipping costs are non-refundable in other cases.",
            },
        ],
    },
    {
        id: "fraudulent-claims",
        number: "6",
        title: "FRAUDULENT CLAIMS",
        blocks: [
            { type: "paragraph", text: "Karuna Innovations reserves the right to:" },
            {
                type: "bullets",
                items: [
                    "Reject suspicious or fraudulent return requests",
                    "Suspend accounts engaging in misuse of return policies",
                ],
            },
        ],
    },
    {
        id: "marketplace",
        number: "7",
        title: "MARKETPLACE CLARIFICATION",
        blocks: [
            {
                type: "paragraph",
                text: "TeeHive is a print-on-demand marketplace featuring independent artist designs.\nProducts are manufactured upon order.",
            },
            {
                type: "paragraph",
                text: "Because of this model:",
            },
            {
                type: "bullets",
                items: [
                    "Returns are limited to quality-related issues only",
                    "Exchange for design preference is not supported",
                ],
            },
        ],
    },
    {
        id: "contact",
        number: "8",
        title: "CONTACT",
        blocks: [
            { type: "paragraph", text: "For return-related queries:" },
            { type: "paragraph", text: "📧 contact@teehive.co.in" },
            { type: "paragraph", text: "📞 9246759898" },
        ],
    },
];
