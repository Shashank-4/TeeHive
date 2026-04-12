import type { LegalDocMeta, LegalSection } from "./types";

export const taxPayoutMeta: LegalDocMeta = {
    brandLine: "Teehive is a brand operated by Karuna Innovations Sole Proprietorship - India.",
    docTitle: "Tax & Payout Policy",
    shortName: "Tax & Payout Policy",
    titleLines: ["Tax &", "Payout", "Policy"],
    version: "1.0",
    contactEmail: "contact@teehive.co.in",
    phoneDisplay: "+91 92467 59898",
    website: "teehive.co.in",
    publicLabel: "Public Policy Document",
    effectiveDate: "5th April, 2026",
    intro: [
        "This Tax & Payout Policy applies to all artists registered on TeeHive, operated by Karuna Innovations, Nalgonda, Telangana, India.",
        "By participating as an artist, you agree to this Policy.",
    ],
};

/** Section order follows the policy substance; PDF page order had subsections out of sequence. */
export const taxPayoutSections: LegalSection[] = [
    {
        id: "commission-mvp",
        number: "1",
        title: "COMMISSION STRUCTURE (MVP PHASE)",
        blocks: [
            {
                type: "paragraph",
                text: "Artists shall receive 25% of the final selling price of the product excluding GST.",
            },
            {
                type: "paragraph",
                text: "Note: Applicable Tax Deducted at Source (TDS) will be deducted from artist earnings as per Indian government rules and regulations.",
            },
            {
                type: "paragraph",
                text: "Pricing Note:\nProduct prices displayed on Teehive are inclusive of GST (currently 5% for clothing).\nNo additional GST is charged at checkout.\nFree shipping is provided on all orders.",
            },
            {
                type: "paragraph",
                text: "Commission is calculated based on:",
            },
            {
                type: "bullets",
                items: [
                    "Final price paid by customer",
                    "After discounts (if any)",
                    "Excluding GST",
                ],
            },
            {
                type: "paragraph",
                text: "Example 1 – No Discount\nProduct Price: ₹1000 (including GST)\nArtist Commission = 25% of ₹1000 = ₹250 (TDS will be deducted if applicable)",
            },
            {
                type: "paragraph",
                text: "Example 2 – With Discount\nProduct Price: ₹1000\n20% Discount → ₹800\nArtist Commission = 25% of ₹800 = ₹200 (TDS will be deducted if applicable)",
            },
            {
                type: "paragraph",
                text: "Commission is always calculated on final base price after discounts (excluding GST).",
            },
        ],
    },
    {
        id: "future-commission",
        number: "2",
        title: "FUTURE COMMISSION CHANGES",
        blocks: [
            {
                type: "paragraph",
                text: "TeeHive reserves the right to modify commission rates when subscription tiers are introduced.",
            },
            {
                type: "paragraph",
                text: "Artists will be notified prior to such changes.",
            },
        ],
    },
    {
        id: "payout-timeline",
        number: "3",
        title: "PAYOUT TIMELINE",
        blocks: [
            {
                type: "paragraph",
                text: "Payouts are processed on the 10th of every month.",
            },
            {
                type: "paragraph",
                text: "Earnings from the previous month will be paid in the following month (i.e. earnings for March will be paid on April 10th).",
            },
            {
                type: "paragraph",
                text: "There is no minimum threshold.",
            },
            {
                type: "paragraph",
                text: "TeeHive reserves the right to adjust payout timelines in the future with notice.",
            },
        ],
    },
    {
        id: "tds",
        number: "4",
        title: "TAX DEDUCTION AT SOURCE (TDS)",
        blocks: [
            { type: "paragraph", text: "As per Indian Income Tax laws:" },
            {
                type: "bullets",
                items: [
                    "TDS may be deducted from artist earnings at applicable rates.",
                    "The exact TDS rate will be as per prevailing government regulations.",
                    "Artists are responsible for complying with applicable tax laws.",
                ],
            },
        ],
    },
    {
        id: "refunds-adjustments",
        number: "5",
        title: "REFUNDS & ADJUSTMENTS",
        blocks: [
            { type: "paragraph", text: "If a customer order is:" },
            {
                type: "bullets",
                items: ["Refunded", "Cancelled", "Returned due to eligible reasons"],
            },
            {
                type: "paragraph",
                text: "Commission for that order will be reversed or adjusted in future payouts.",
            },
        ],
    },
    {
        id: "payment-methods",
        number: "6",
        title: "PAYMENT METHODS",
        blocks: [
            { type: "paragraph", text: "Payouts shall be made via:" },
            { type: "bullets", items: ["Bank transfer", "UPI (where applicable)"] },
            {
                type: "paragraph",
                text: "Artists are responsible for providing accurate payment details.",
            },
        ],
    },
    {
        id: "dispute-resolution",
        number: "7",
        title: "DISPUTE RESOLUTION",
        blocks: [
            {
                type: "paragraph",
                text: "Any payout disputes must be raised within 30 days of payout statement.",
            },
            {
                type: "paragraph",
                text: "Failure to raise dispute within this period shall be deemed acceptance.",
            },
        ],
    },
    {
        id: "modification-policy",
        number: "8",
        title: "MODIFICATION OF POLICY",
        blocks: [
            {
                type: "paragraph",
                text: "Karuna Innovations reserves the right to modify this Policy at any time.",
            },
            {
                type: "paragraph",
                text: "Continued participation on the platform constitutes acceptance.",
            },
        ],
    },
];
