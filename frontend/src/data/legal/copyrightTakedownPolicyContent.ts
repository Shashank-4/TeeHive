import type { LegalDocMeta, LegalSection } from "./types";

export const copyrightTakedownMeta: LegalDocMeta = {
    brandLine: "Teehive is a brand operated by Karuna Innovations Sole Proprietorship - India.",
    docTitle: "Copyright Takedown Policy",
    shortName: "Copyright Takedown Policy",
    titleLines: ["Copyright", "Takedown", "Policy"],
    version: "1.0",
    contactEmail: "contact@teehive.co.in",
    phoneDisplay: "+91 92467 59898",
    website: "teehive.co.in",
    publicLabel: "Public Policy Document",
    effectiveDate: "5th April, 2026",
    intro: [
        "TeeHive is a brand operated by Karuna Innovations, a sole proprietorship registered in Nalgonda, Telangana, India.",
        "TeeHive respects intellectual property rights and expects artists using the platform to do the same.",
        "This Copyright Takedown Policy outlines the procedure for reporting and handling alleged intellectual property infringements.",
    ],
};

export const copyrightTakedownSections: LegalSection[] = [
    {
        id: "reporting",
        number: "1",
        title: "REPORTING COPYRIGHT INFRINGEMENT",
        blocks: [
            {
                type: "paragraph",
                text: "If you believe that content available on TeeHive infringes your copyright or trademark rights, you may submit a written complaint to: contact@teehive.co.in",
            },
            { type: "paragraph", text: "Your complaint must include:" },
            {
                type: "bullets",
                items: [
                    "Your full name and contact details",
                    "Description of the copyrighted work allegedly infringed",
                    "Direct URL or clear identification of the infringing content",
                    "A statement that you believe in good faith that the use is unauthorized",
                    "A statement that the information provided is accurate",
                    "Your physical or electronic signature",
                ],
            },
            {
                type: "paragraph",
                text: "Incomplete complaints may not be processed.",
            },
        ],
    },
    {
        id: "review-process",
        number: "2",
        title: "REVIEW PROCESS",
        blocks: [
            { type: "paragraph", text: "Upon receiving a valid complaint:" },
            {
                type: "bullets",
                items: [
                    "The reported content may be temporarily disabled or removed",
                    "The artist who uploaded the content will be notified",
                    "TeeHive may request additional information from either party",
                ],
            },
            {
                type: "paragraph",
                text: "TeeHive reserves the right to determine whether the reported content violates intellectual property rights.",
            },
        ],
    },
    {
        id: "artist-response",
        number: "3",
        title: "ARTIST RESPONSE",
        blocks: [
            { type: "paragraph", text: "The artist may respond by providing:" },
            {
                type: "bullets",
                items: ["Proof of ownership", "Proof of license", "Evidence of transformative use (if applicable)"],
            },
            {
                type: "paragraph",
                text: "If sufficient proof is provided, TeeHive may reinstate the content at its discretion.",
            },
        ],
    },
    {
        id: "repeat-infringement",
        number: "4",
        title: "REPEAT INFRINGEMENT POLICY",
        blocks: [
            { type: "paragraph", text: "If an artist receives two (2) valid infringement warnings, TeeHive reserves the right to:" },
            {
                type: "bullets",
                items: [
                    "Suspend or terminate the artist’s account",
                    "Withhold payouts pending investigation",
                    "Permanently remove associated content",
                ],
            },
        ],
    },
    {
        id: "limitation-liability",
        number: "5",
        title: "LIMITATION OF LIABILITY",
        blocks: [
            {
                type: "paragraph",
                text: "TeeHive operates as a marketplace platform hosting user-generated content.",
            },
            {
                type: "paragraph",
                text: "Karuna Innovations does not pre-verify ownership of all uploaded content beyond reasonable review procedures.",
            },
            { type: "paragraph", text: "Karuna Innovations shall not be held liable for:" },
            {
                type: "bullets",
                items: [
                    "Unauthorized uploads by artists",
                    "Disputes between artists and third parties",
                    "Indirect or consequential damages arising from infringement claims",
                ],
            },
            {
                type: "paragraph",
                text: "Liability, if any, shall be limited as stated in the Terms & Conditions.",
            },
        ],
    },
    {
        id: "false-claims",
        number: "6",
        title: "FALSE CLAIMS",
        blocks: [
            { type: "paragraph", text: "Submitting false, misleading, or bad-faith infringement claims may result in:" },
            {
                type: "bullets",
                items: ["Legal action", "Account suspension (if applicable)"],
            },
            {
                type: "paragraph",
                text: "TeeHive reserves the right to pursue remedies available under applicable law.",
            },
        ],
    },
    {
        id: "governing-law",
        number: "7",
        title: "GOVERNING LAW",
        blocks: [
            {
                type: "paragraph",
                text: "This Policy shall be governed by the laws of India.",
            },
            {
                type: "paragraph",
                text: "Disputes shall be subject to jurisdiction of courts in Nalgonda, Telangana.",
            },
        ],
    },
    {
        id: "contact",
        number: "8",
        title: "CONTACT",
        blocks: [
            {
                type: "paragraph",
                text: "All copyright-related communications must be sent to:\ncontact@teehive.co.in | +91 92467 59898",
            },
        ],
    },
];
