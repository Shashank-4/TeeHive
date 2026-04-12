import type { LegalDocMeta, LegalSection } from "./types";

export const artistAgreementMeta: LegalDocMeta = {
    brandLine: "Teehive is a brand operated by Karuna Innovations Sole Proprietorship - India.",
    docTitle: "Artist Agreement",
    shortName: "Artist Agreement",
    titleLines: ["Artist", "Agreement"],
    version: "1.0",
    contactEmail: "contact@teehive.co.in",
    phoneDisplay: "+91 92467 59898",
    website: "teehive.co.in",
    publicLabel: "Artist Side Document (Publicly Viewable)",
    effectiveDate: "5th April, 2026",
    intro: [
        "This Artist Agreement (“Agreement”) governs participation as an artist on TeeHive, a brand operated by Karuna Innovations, a sole proprietorship registered at:",
        "Flat No 501, H No 4-10-159, Sri Sai Homes\nDVK Road, Sri Ram Nagar Colony\nNalgonda, Telangana – 508001\nIndia",
        "By registering as an artist on TeeHive, you agree to be bound by this Agreement.",
    ],
};

export const artistAgreementSections: LegalSection[] = [
    {
        id: "nature-platform",
        number: "1",
        title: "NATURE OF PLATFORM",
        blocks: [
            {
                type: "paragraph",
                text: "TeeHive is an online print-on-demand marketplace enabling independent artists to upload original designs which are printed on apparel and sold to customers.",
            },
            { type: "paragraph", text: "Karuna Innovations facilitates:" },
            {
                type: "bullets",
                items: [
                    "Hosting of designs",
                    "Manufacturing and fulfillment",
                    "Customer support",
                    "Payment processing",
                    "Tax compliance",
                ],
            },
            { type: "paragraph", text: "TeeHive does not claim ownership of artist designs." },
        ],
    },
    {
        id: "ownership-designs",
        number: "2",
        title: "OWNERSHIP OF DESIGNS",
        blocks: [
            { type: "paragraph", text: "The Artist confirms that:" },
            {
                type: "bullets",
                items: [
                    "The uploaded design is original OR",
                    "The Artist possesses full legal rights to use and commercialize the design.",
                ],
            },
            {
                type: "paragraph",
                text: "The Artist retains ownership of all intellectual property rights in their designs.",
            },
        ],
    },
    {
        id: "license-teehive",
        number: "3",
        title: "LICENSE GRANTED TO TEEHIVE",
        blocks: [
            {
                type: "paragraph",
                text: "The Artist grants Karuna Innovations a non-exclusive, worldwide, royalty-based license to:",
            },
            {
                type: "bullets",
                items: [
                    "Reproduce the design",
                    "Print the design on products",
                    "Market and promote the design",
                    "Sell products containing the design",
                ],
            },
            {
                type: "paragraph",
                text: "This license remains valid until the Artist removes the design or terminates the account, subject to fulfillment of pending orders.",
            },
        ],
    },
    {
        id: "design-approval",
        number: "4",
        title: "DESIGN APPROVAL",
        blocks: [
            {
                type: "paragraph",
                text: "All designs are subject to manual review and approval by TeeHive before publication.",
            },
            { type: "paragraph", text: "Karuna Innovations reserves the right to:" },
            {
                type: "bullets",
                items: [
                    "Reject any design",
                    "Remove any design at its discretion",
                    "Suspend or terminate accounts violating policies",
                ],
            },
            {
                type: "paragraph",
                text: "Approval does not imply legal validation of ownership.",
            },
        ],
    },
    {
        id: "prohibited-content-agreement",
        number: "5",
        title: "PROHIBITED CONTENT",
        blocks: [
            { type: "paragraph", text: "The Artist shall not upload content that:" },
            {
                type: "bullets",
                items: [
                    "Infringes copyright or trademark rights",
                    "Uses official logos (brands, IPL teams, corporations etc.)",
                    "Uses copyrighted characters or direct reproductions",
                    "Uses celebrity images without authorization",
                    "Promotes hate speech or discrimination",
                    "Contains explicit sexual content",
                    "Violates Indian law",
                ],
            },
            { type: "paragraph", text: "Fan Art Policy" },
            {
                type: "paragraph",
                text: "Transformative, parody, or inspired artwork may be permitted provided it does not directly replicate copyrighted material.",
            },
            {
                type: "paragraph",
                text: "TeeHive retains sole discretion to determine whether content violates intellectual property rights.",
            },
        ],
    },
    {
        id: "copyright-takedown",
        number: "6",
        title: "COPYRIGHT CLAIMS & TAKEDOWN",
        blocks: [
            { type: "paragraph", text: "If TeeHive receives a copyright complaint:" },
            {
                type: "bullets",
                items: [
                    "The design may be immediately removed",
                    "The Artist will be notified",
                    "Repeated violations (two warnings) will result in permanent account termination.",
                ],
            },
        ],
    },
    {
        id: "indemnification-agreement",
        number: "7",
        title: "INDEMNIFICATION",
        blocks: [
            {
                type: "paragraph",
                text: "The Artist agrees to indemnify and hold harmless Karuna Innovations, its proprietor, affiliates, and representatives from any claims, damages, legal notices, losses, or expenses arising from:",
            },
            {
                type: "bullets",
                items: [
                    "Intellectual property infringement",
                    "Violation of third-party rights",
                    "Breach of this Agreement",
                ],
            },
            {
                type: "paragraph",
                text: "This clause survives termination of the Agreement.",
            },
        ],
    },
    {
        id: "commission-payout",
        number: "8",
        title: "COMMISSION & PAYOUT",
        blocks: [
            { type: "paragraph", text: "Commission Structure (MVP Phase)" },
            {
                type: "paragraph",
                text: "The Artist shall receive:\n25% of product base price excluding GST",
            },
            {
                type: "paragraph",
                text: "Example\nIf product price = ₹1000 + GST\nArtist commission = 25% of ₹1000",
            },
            { type: "paragraph", text: "Payout Timeline" },
            {
                type: "paragraph",
                text: "Payouts are processed monthly.",
            },
            {
                type: "paragraph",
                text: "Commission shall be calculated on the final selling price of the product excluding GST and after application of any discounts, promotional offers, coupon codes, or price reductions offered to customers.",
            },
        ],
    },
    {
        id: "tax-kyc",
        number: "9",
        title: "TAX & KYC REQUIREMENTS",
        blocks: [
            {
                type: "paragraph",
                text: "TeeHive reserves the right to deduct TDS as per Indian Income Tax laws.",
            },
        ],
    },
    {
        id: "account-deletion",
        number: "10",
        title: "ACCOUNT DELETION",
        blocks: [
            { type: "paragraph", text: "Artists may request account deletion at any time, subject to:" },
            {
                type: "bullets",
                items: ["No pending orders", "All active orders fulfilled"],
            },
            { type: "paragraph", text: "Upon deletion:" },
            {
                type: "bullets",
                items: [
                    "Designs will be removed from storefront",
                    "Previously completed orders remain visible in buyer order history",
                ],
            },
            {
                type: "paragraph",
                text: "Karuna Innovations shall not retain rights to continue selling deleted designs beyond pending orders.",
            },
        ],
    },
    {
        id: "termination-teehive",
        number: "11",
        title: "TERMINATION BY TEEHIVE",
        blocks: [
            { type: "paragraph", text: "TeeHive may suspend or terminate an Artist account for:" },
            {
                type: "bullets",
                items: [
                    "Repeated copyright violations",
                    "Fraudulent activity",
                    "Misuse of platform",
                    "Violation of this Agreement",
                ],
            },
        ],
    },
    {
        id: "limitation-liability-agreement",
        number: "12",
        title: "LIMITATION OF LIABILITY",
        blocks: [
            { type: "paragraph", text: "Karuna Innovations shall not be liable for:" },
            {
                type: "bullets",
                items: [
                    "Loss of profits",
                    "Platform downtime",
                    "Reduced visibility or sales",
                    "Indirect or consequential damages",
                ],
            },
            {
                type: "paragraph",
                text: "Total liability shall not exceed unpaid earnings due to the Artist.",
            },
        ],
    },
    {
        id: "future-modifications-agreement",
        number: "13",
        title: "FUTURE MODIFICATIONS",
        blocks: [
            { type: "paragraph", text: "TeeHive reserves the right to:" },
            {
                type: "bullets",
                items: [
                    "Modify commission rates",
                    "Introduce subscription tiers",
                    "Adjust payout schedules",
                    "Update platform policies",
                ],
            },
            {
                type: "paragraph",
                text: "Artists will be notified of material changes.\nContinued use of the platform constitutes acceptance.",
            },
        ],
    },
    {
        id: "transfer-business",
        number: "14",
        title: "TRANSFER OF BUSINESS",
        blocks: [
            {
                type: "paragraph",
                text: "In the event that Karuna Innovations restructures, converts to a private limited company, or transfers operations, this Agreement shall automatically transfer to the successor entity without requiring re-execution.",
            },
        ],
    },
    {
        id: "governing-law-agreement",
        number: "15",
        title: "GOVERNING LAW & DISPUTE RESOLUTION",
        blocks: [
            {
                type: "paragraph",
                text: "This Agreement shall be governed by Indian law.",
            },
            {
                type: "paragraph",
                text: "Disputes shall first be resolved through arbitration under the Arbitration and Conciliation Act, 1996.",
            },
            {
                type: "paragraph",
                text: "Seat of arbitration: Nalgonda, Telangana.\nCourts in Nalgonda, Telangana shall have jurisdiction.",
            },
        ],
    },
    {
        id: "contact-agreement",
        number: "16",
        title: "CONTACT",
        blocks: [
            {
                type: "paragraph",
                text: "For artist-related queries: contact@teehive.co.in | +91 92467 59898",
            },
        ],
    },
];
