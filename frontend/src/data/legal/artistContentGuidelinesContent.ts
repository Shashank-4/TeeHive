import type { LegalDocMeta, LegalSection } from "./types";

export const artistContentGuidelinesMeta: LegalDocMeta = {
    brandLine: "Teehive is a brand operated by Karuna Innovations Sole Proprietorship - India.",
    docTitle: "Artist Content Guidelines",
    shortName: "Artist Content Guidelines",
    titleLines: ["Artist", "Content", "Guidelines"],
    version: "1.0",
    contactEmail: "contact@teehive.co.in",
    phoneDisplay: "+91 92467 59898",
    website: "teehive.co.in",
    publicLabel: "Artist Side Document (Publicly Viewable)",
    effectiveDate: "5th April, 2026",
    intro: [
        "Welcome to TeeHive — a platform built for independent artists.",
        "To keep the marketplace safe, original, and legally compliant, please follow the guidelines below before uploading your designs.",
    ],
};

export const artistContentGuidelinesSections: LegalSection[] = [
    {
        id: "ownership-rule",
        number: "1",
        title: "OWNERSHIP RULE",
        blocks: [
            { type: "paragraph", text: "You must upload only designs that:" },
            {
                type: "bullets",
                items: ["You created yourself, OR", "You have full legal rights to use commercially."],
            },
            {
                type: "paragraph",
                text: "By uploading a design, you confirm that you own the rights to it.\nIf you do not own the rights, do not upload it.",
            },
        ],
    },
    {
        id: "fan-art",
        number: "2",
        title: "FAN ART POLICY (READ CAREFULLY)",
        blocks: [
            { type: "paragraph", text: "We understand fan-inspired artwork is popular." },
            { type: "paragraph", text: "However, the following are NOT allowed:" },
            {
                type: "bullets",
                items: [
                    "Direct copies of copyrighted characters (e.g., Naruto, Marvel, Disney, etc.)",
                    "Movie posters or exact recreations",
                    "Official logos (brands, IPL teams, companies etc.)",
                    "Celebrity photos or realistic portraits without permission",
                    "Trademarked names or slogans",
                ],
            },
            { type: "paragraph", text: "What is allowed?" },
            {
                type: "bullets",
                items: [
                    "Parody",
                    "Transformative artwork",
                    "Original interpretations inspired by themes",
                    "Creative reimaginings that do not copy official material",
                ],
            },
            {
                type: "paragraph",
                text: "TeeHive reserves the right to determine whether a design violates intellectual property rights. If in doubt, don’t upload it.",
            },
        ],
    },
    {
        id: "prohibited-content",
        number: "3",
        title: "PROHIBITED CONTENT",
        blocks: [
            { type: "paragraph", text: "The following content is strictly prohibited:" },
            {
                type: "bullets",
                items: [
                    "Hate speech or discriminatory content",
                    "Religious hate or incitement",
                    "Explicit sexual content",
                    "Violence promoting harm",
                    "Illegal or unlawful material",
                    "Defamatory or abusive language",
                ],
            },
            {
                type: "paragraph",
                text: "Designs violating Indian law will be rejected immediately.",
            },
        ],
    },
    {
        id: "quality-standards",
        number: "4",
        title: "QUALITY STANDARDS",
        blocks: [
            { type: "paragraph", text: "To ensure premium output:" },
            {
                type: "bullets",
                items: [
                    "Upload high-resolution PNG files",
                    "Use transparent backgrounds",
                    "Avoid pixelated or low-quality artwork",
                ],
            },
            {
                type: "paragraph",
                text: "Low-quality designs may be rejected.",
            },
        ],
    },
    {
        id: "review-approval",
        number: "5",
        title: "REVIEW & APPROVAL",
        blocks: [
            { type: "paragraph", text: "All designs are manually reviewed before going live." },
            { type: "paragraph", text: "TeeHive may:" },
            {
                type: "bullets",
                items: ["Approve", "Reject", "Request modification", "Remove designs later if necessary"],
            },
            {
                type: "paragraph",
                text: "Approval does not guarantee immunity from copyright claims.",
            },
        ],
    },
    {
        id: "copyright-complaints",
        number: "6",
        title: "COPYRIGHT COMPLAINTS",
        blocks: [
            { type: "paragraph", text: "If a valid complaint is received:" },
            {
                type: "bullets",
                items: [
                    "The design will be removed",
                    "The artist will be notified",
                    "Repeated violations (2 warnings) may result in account suspension or termination.",
                ],
            },
        ],
    },
    {
        id: "respect-the-hive",
        number: "7",
        title: "RESPECT THE HIVE",
        blocks: [
            {
                type: "paragraph",
                text: "TeeHive is built for creators.\nUpload responsibly.\nRespect originality.\nBuild your brand ethically.",
            },
        ],
    },
    {
        id: "need-help",
        number: "8",
        title: "NEED HELP?",
        blocks: [
            {
                type: "paragraph",
                text: "If you're unsure whether your design is acceptable: contact@teehive.co.in\nWe’re here to help.",
            },
        ],
    },
];
