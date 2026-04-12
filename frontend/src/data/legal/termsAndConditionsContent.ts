import type { LegalDocMeta, LegalSection } from "./types";

export const termsMeta: LegalDocMeta = {
    brandLine: "Teehive is a brand operated by Karuna Innovations Sole Proprietorship - India.",
    docTitle: "Terms & Conditions",
    shortName: "Terms & Conditions",
    version: "1.0",
    contactEmail: "contact@teehive.co.in",
    phoneDisplay: "+91 92467 59898",
    website: "teehive.co.in",
    publicLabel: "Public Policy Document",
    effectiveDate: "5th April, 2026",
    intro: [
        "These Terms and Conditions (“Terms”) govern the access and use of the website www.teehive.co.in (“Website”), operated under the brand name TeeHive, owned and managed by:",
        "Karuna Innovations\nFlat No 501, H No 4-10-159, Sri Sai Homes,\nDVK Road, Sri Ram Nagar Colony,\nNalgonda, Telangana – 508001.\nIndia.",
        "By accessing or using this Website, you agree to be bound by these Terms.",
        "If you do not agree, please do not use the Website.",
    ],
};

export const termsSections: LegalSection[] = [
    {
        id: "about-teehive",
        number: "1",
        title: "ABOUT TEEHIVE",
        blocks: [
            {
                type: "paragraph",
                text: "TeeHive is an online marketplace that enables independent artists to upload original designs, which are then printed on apparel and sold to customers.",
            },
            {
                type: "paragraph",
                text: "Karuna Innovations operates the platform and facilitates:",
            },
            {
                type: "bullets",
                items: [
                    "Hosting of artist-created content",
                    "Printing and fulfillment of products",
                    "Payment processing",
                    "Customer support",
                ],
            },
            {
                type: "paragraph",
                text: "TeeHive does not claim ownership of artist designs.",
            },
        ],
    },
    {
        id: "eligibility",
        number: "2",
        title: "ELIGIBILITY",
        blocks: [
            { type: "paragraph", text: "By using this Website, you confirm that:" },
            {
                type: "bullets",
                items: [
                    "You are at least 18 years of age, or",
                    "You are accessing the Website under parental/guardian supervision",
                    "All information provided by you is accurate and complete",
                ],
            },
        ],
    },
    {
        id: "user-accounts",
        number: "3",
        title: "USER ACCOUNTS",
        blocks: [
            {
                type: "paragraph",
                text: "To access certain features, users may create an account.",
            },
            { type: "paragraph", text: "You are responsible for:" },
            {
                type: "bullets",
                items: [
                    "Maintaining confidentiality of your login credentials",
                    "All activities conducted through your account",
                ],
            },
            {
                type: "paragraph",
                text: "Karuna Innovations reserves the right to suspend or terminate accounts found to violate these Terms.",
            },
        ],
    },
    {
        id: "product-information",
        number: "4",
        title: "PRODUCT INFORMATION",
        blocks: [
            {
                type: "paragraph",
                text: "We strive to ensure accurate product descriptions, pricing, and availability.",
            },
            { type: "paragraph", text: "However:" },
            {
                type: "bullets",
                items: [
                    "Colors may slightly vary due to screen differences",
                    "Minor print variations may occur due to production processes",
                ],
            },
            {
                type: "paragraph",
                text: "Karuna Innovations reserves the right to correct errors and update information without prior notice.",
            },
        ],
    },
    {
        id: "orders-payments",
        number: "5",
        title: "ORDERS & PAYMENTS",
        blocks: [
            {
                type: "paragraph",
                text: "All orders are subject to acceptance and availability.",
            },
            {
                type: "bullets",
                items: [
                    "Prices are listed in Indian Rupees (INR)",
                    "Applicable GST is charged as per Indian tax laws",
                    "Payments are processed through secure third-party gateways",
                ],
            },
            {
                type: "paragraph",
                text: "Karuna Innovations reserves the right to cancel orders in cases of:",
            },
            {
                type: "bullets",
                items: ["Suspected fraud", "Pricing errors", "Violation of Terms"],
            },
            {
                type: "paragraph",
                text: "Refunds (if applicable) will follow the Refund Policy.",
            },
        ],
    },
    {
        id: "returns-refunds",
        number: "6",
        title: "RETURNS & REFUNDS",
        blocks: [
            { type: "paragraph", text: "Returns are accepted only for:" },
            {
                type: "bullets",
                items: [
                    "Damaged products",
                    "Incorrect print",
                    "Incorrect size delivered",
                    "Incorrect color of the product",
                ],
            },
            {
                type: "paragraph",
                text: "Return requests must be initiated within 5 days of delivery.",
            },
            {
                type: "paragraph",
                text: "For complete details, refer to the Refund Policy.",
            },
        ],
    },
    {
        id: "intellectual-property",
        number: "7",
        title: "INTELLECTUAL PROPERTY",
        blocks: [
            {
                type: "paragraph",
                text: "All content on this Website, including logos, branding elements, and platform design, are the property of Karuna Innovations or its licensors.",
            },
            {
                type: "paragraph",
                text: "Artist-uploaded designs remain the intellectual property of the respective artists.",
            },
            {
                type: "paragraph",
                text: "By purchasing a product, users receive a physical item only. No ownership rights over the design are transferred.",
            },
            {
                type: "paragraph",
                text: "Reproduction, copying, or commercial use of any design without authorization is strictly prohibited.",
            },
        ],
    },
    {
        id: "user-generated-content",
        number: "8",
        title: "USER-GENERATED CONTENT",
        blocks: [
            {
                type: "paragraph",
                text: "TeeHive hosts designs uploaded by independent artists.",
            },
            { type: "paragraph", text: "Karuna Innovations:" },
            {
                type: "bullets",
                items: [
                    "Does not pre-verify ownership of all content beyond review processes",
                    "Is not responsible for intellectual property disputes between third parties and artists",
                ],
            },
            {
                type: "paragraph",
                text: "If you believe content infringes your rights, please refer to the Copyright Takedown Policy.",
            },
        ],
    },
    {
        id: "prohibited-use",
        number: "9",
        title: "PROHIBITED USE",
        blocks: [
            { type: "paragraph", text: "Users shall not:" },
            {
                type: "bullets",
                items: [
                    "Use the Website for unlawful purposes",
                    "Attempt to hack, disrupt, or damage the Website",
                    "Misuse content or infringe intellectual property rights",
                    "Provide false or misleading information",
                ],
            },
            {
                type: "paragraph",
                text: "Violation may result in termination and legal action.",
            },
        ],
    },
    {
        id: "limitation-liability",
        number: "10",
        title: "LIMITATION OF LIABILITY",
        blocks: [
            {
                type: "paragraph",
                text: "To the maximum extent permitted by law, Karuna Innovations shall not be liable for:",
            },
            {
                type: "bullets",
                items: [
                    "Indirect, incidental, or consequential damages",
                    "Loss of profits or data",
                    "Delays caused by third-party logistics providers",
                    "Issues arising from artist-submitted content",
                ],
            },
            {
                type: "paragraph",
                text: "In any case, total liability shall not exceed the amount paid by the user for the specific product in dispute.",
            },
        ],
    },
    {
        id: "indemnification",
        number: "11",
        title: "INDEMNIFICATION",
        blocks: [
            {
                type: "paragraph",
                text: "You agree to indemnify and hold harmless Karuna Innovations, its owner, employees, and affiliates from any claims, damages, losses, or legal expenses arising from:",
            },
            {
                type: "bullets",
                items: [
                    "Your misuse of the Website",
                    "Violation of these Terms",
                    "Infringement of third-party rights",
                ],
            },
        ],
    },
    {
        id: "force-majeure",
        number: "12",
        title: "FORCE MAJEURE",
        blocks: [
            {
                type: "paragraph",
                text: "Karuna Innovations shall not be held responsible for delays or failure in performance due to events beyond reasonable control, including but not limited to:",
            },
            {
                type: "bullets",
                items: [
                    "Natural disasters",
                    "Government actions",
                    "Strikes",
                    "Supply chain disruptions",
                ],
            },
        ],
    },
    {
        id: "governing-law",
        number: "13",
        title: "GOVERNING LAW & JURISDICTION",
        blocks: [
            {
                type: "paragraph",
                text: "These Terms shall be governed by the laws of India.",
            },
            {
                type: "paragraph",
                text: "All disputes shall be subject to the exclusive jurisdiction of courts located in Nalgonda, Telangana.",
            },
            {
                type: "paragraph",
                text: "Before approaching courts, parties agree to attempt resolution through arbitration in accordance with the Arbitration and Conciliation Act, 1996.",
            },
            {
                type: "paragraph",
                text: "The seat of arbitration shall be Nalgonda, Telangana.",
            },
        ],
    },
    {
        id: "modifications-terms",
        number: "14",
        title: "MODIFICATIONS TO TERMS",
        blocks: [
            {
                type: "paragraph",
                text: "Karuna Innovations reserves the right to modify these Terms at any time.",
            },
            {
                type: "paragraph",
                text: "Updated versions will be posted on this page with a revised effective date.",
            },
            {
                type: "paragraph",
                text: "Continued use of the Website after changes constitutes acceptance of the updated Terms.",
            },
        ],
    },
    {
        id: "contact-information",
        number: "15",
        title: "CONTACT INFORMATION",
        blocks: [
            {
                type: "paragraph",
                text: "For questions regarding these Terms, please contact:",
            },
            { type: "paragraph", text: "📧 contact@teehive.co.in" },
            { type: "paragraph", text: "📞 +91 92467 59898" },
        ],
    },
];
