import type { LegalDocMeta, LegalSection } from "./types";

export const privacyMeta: LegalDocMeta = {
    brandLine: "Teehive is a brand operated by Karuna Innovations Sole Proprietorship - India.",
    docTitle: "Privacy Policy",
    shortName: "Privacy Policy",
    version: "1.0",
    contactEmail: "contact@teehive.co.in",
    phoneDisplay: "+91 92467 59898",
    website: "teehive.co.in",
    publicLabel: "Public Policy Document",
    effectiveDate: "5th April, 2026",
    intro: [
        "This Privacy Policy describes how TeeHive, a brand operated by Karuna Innovations, collects, uses, stores, and protects your personal information when you use www.teehive.co.in (“Website”).",
        "By accessing or using the Website, you agree to the terms of this Privacy Policy.",
    ],
};

export const privacySections: LegalSection[] = [
    {
        id: "about-us",
        number: "1",
        title: "ABOUT US",
        blocks: [
            { type: "paragraph", text: "TeeHive is operated by:" },
            {
                type: "paragraph",
                text: "Karuna Innovations\nFlat No 501, H No 4-10-159, Sri Sai Homes,\nDVK Road, Sri Ram Nagar Colony,\nNalgonda, Telangana – 508001.\nIndia.",
            },
            {
                type: "paragraph",
                text: "For any privacy-related concerns, reach out to contact@teehive.co.in",
            },
        ],
    },
    {
        id: "information-we-collect",
        number: "2",
        title: "INFORMATION WE COLLECT",
        blocks: [
            {
                type: "paragraph",
                text: "We collect information necessary to operate the platform efficiently and legally.",
            },
        ],
        subsections: [
            {
                label: "A",
                title: "Information Provided by Buyers",
                blocks: [
                    {
                        type: "paragraph",
                        text: "When you place an order or create an account, we may collect:",
                    },
                    {
                        type: "bullets",
                        items: [
                            "Full name",
                            "Email address",
                            "Mobile number",
                            "Shipping and billing address",
                            "Payment details (processed via third-party gateways)",
                        ],
                    },
                ],
            },
            {
                label: "B",
                title: "Information Provided by Artists",
                blocks: [
                    {
                        type: "paragraph",
                        text: "When registering as an artist, we may collect:",
                    },
                    {
                        type: "bullets",
                        items: [
                            "Full name",
                            "Email address",
                            "Mobile number",
                            "UPI & Bank account details (for payouts)",
                            "PAN details (for TDS compliance under Indian tax laws)",
                            "Uploaded design files",
                            "Social media links (optional)",
                        ],
                    },
                ],
            },
        ],
    },
    {
        id: "how-we-use",
        number: "3",
        title: "HOW WE USE YOUR INFORMATION",
        blocks: [
            { type: "paragraph", text: "We use collected information to:" },
            {
                type: "bullets",
                items: [
                    "Process and fulfill orders",
                    "Manage artist payouts",
                    "Deduct and remit applicable TDS",
                    "Improve user experience",
                    "Communicate order updates",
                    "Provide customer support",
                    "Prevent fraud and misuse",
                    "Comply with legal obligations",
                ],
            },
            { type: "paragraph", text: "We do not sell personal data to third parties." },
        ],
        subsections: [
            {
                label: "C",
                title: "Automatically Collected Information",
                blocks: [
                    { type: "paragraph", text: "When you use the Website, we may collect:" },
                    {
                        type: "bullets",
                        items: [
                            "IP address",
                            "Device information",
                            "Browser type",
                            "Pages visited",
                            "Cookies and usage data",
                        ],
                    },
                    {
                        type: "paragraph",
                        text: "This helps improve performance and security.",
                    },
                ],
            },
        ],
    },
    {
        id: "payment-processing",
        number: "4",
        title: "PAYMENT PROCESSING",
        blocks: [
            {
                type: "paragraph",
                text: "Payments are processed securely via third-party payment gateways (such as Razorpay or similar providers).",
            },
            {
                type: "paragraph",
                text: "TeeHive does not store full credit/debit card details.",
            },
            {
                type: "paragraph",
                text: "Payment providers may collect and process payment information in accordance with their own privacy policies.",
            },
        ],
    },
    {
        id: "tax-compliance",
        number: "5",
        title: "TAX & COMPLIANCE DATA",
        blocks: [
            { type: "paragraph", text: "For artists receiving payouts:" },
            {
                type: "paragraph",
                text: "PAN details may be collected for TDS deduction as required under Indian Income Tax laws.",
            },
            {
                type: "paragraph",
                text: "TDS will be deducted and reported as per statutory requirements.",
            },
            {
                type: "paragraph",
                text: "This information is used strictly for compliance purposes.",
            },
        ],
    },
    {
        id: "cookies",
        number: "6",
        title: "COOKIES",
        blocks: [
            { type: "paragraph", text: "We use cookies and similar tracking technologies to:" },
            {
                type: "bullets",
                items: [
                    "Improve Website performance",
                    "Analyze traffic",
                    "Enhance user experience",
                ],
            },
            {
                type: "paragraph",
                text: "You may disable cookies through your browser settings, though some features may not function properly.",
            },
        ],
    },
    {
        id: "data-storage-security",
        number: "7",
        title: "DATA STORAGE & SECURITY",
        blocks: [
            {
                type: "paragraph",
                text: "We implement reasonable security measures to protect your information from:",
            },
            {
                type: "bullets",
                items: ["Unauthorized access", "Misuse", "Alteration", "Disclosure"],
            },
            {
                type: "paragraph",
                text: "However, no online system can be guaranteed 100% secure.",
            },
            {
                type: "paragraph",
                text: "Users are responsible for maintaining confidentiality of their login credentials.",
            },
        ],
    },
    {
        id: "data-sharing",
        number: "8",
        title: "DATA SHARING",
        blocks: [
            { type: "paragraph", text: "We may share information with:" },
            {
                type: "bullets",
                items: [
                    "Printing and fulfillment partners (only necessary details for order delivery)",
                    "Payment processors",
                    "Logistics providers",
                    "Government authorities if legally required",
                ],
            },
            {
                type: "paragraph",
                text: "We do not share personal data for advertising resale purposes.",
            },
        ],
    },
    {
        id: "data-retention",
        number: "9",
        title: "DATA RETENTION",
        blocks: [
            { type: "paragraph", text: "We retain your information:" },
            {
                type: "bullets",
                items: [
                    "As long as your account is active",
                    "As required for tax compliance",
                    "As necessary to resolve disputes",
                ],
            },
            {
                type: "paragraph",
                text: "Users may request account deletion, subject to legal retention obligations.",
            },
        ],
    },
    {
        id: "user-rights",
        number: "10",
        title: "USER RIGHTS",
        blocks: [
            { type: "paragraph", text: "You may:" },
            {
                type: "bullets",
                items: [
                    "Request access to your personal data",
                    "Request correction of inaccurate information",
                    "Request deletion of your account (subject to compliance requirements)",
                ],
            },
            {
                type: "paragraph",
                text: "Requests may be sent to: contact@teehive.co.in",
            },
        ],
    },
    {
        id: "third-party-links",
        number: "11",
        title: "THIRD-PARTY LINKS",
        blocks: [
            {
                type: "paragraph",
                text: "Our Website may contain links to third-party websites.",
            },
            {
                type: "paragraph",
                text: "We are not responsible for their privacy practices.",
            },
            {
                type: "paragraph",
                text: "Users are encouraged to review third-party privacy policies independently.",
            },
        ],
    },
    {
        id: "children-privacy",
        number: "12",
        title: "CHILDREN'S PRIVACY",
        blocks: [
            {
                type: "paragraph",
                text: "TeeHive does not knowingly collect personal information from individuals under 18 years of age without guardian supervision.",
            },
        ],
    },
    {
        id: "changes-policy",
        number: "13",
        title: "CHANGES TO THIS POLICY",
        blocks: [
            {
                type: "paragraph",
                text: "Karuna Innovations reserves the right to update this Privacy Policy at any time.",
            },
            {
                type: "paragraph",
                text: "Updated versions will be posted with a revised effective date.",
            },
            {
                type: "paragraph",
                text: "Continued use of the Website constitutes acceptance of changes.",
            },
        ],
    },
    {
        id: "grievance-officer",
        number: "14",
        title: "GRIEVANCE OFFICER",
        blocks: [
            {
                type: "paragraph",
                text: "As per applicable IT Rules, the designated Grievance Officer is:",
            },
            { type: "paragraph", text: "Thallapally Sai Savanth" },
            { type: "paragraph", text: "📧 contact@teehive.co.in" },
            { type: "paragraph", text: "📞 9246759898" },
            {
                type: "paragraph",
                text: "Any complaints or concerns regarding data handling may be addressed to the above contact.",
            },
        ],
    },
];
