import type { LegalDocMeta, LegalSection } from "./types";

export const grievanceRedressalMeta: LegalDocMeta = {
    brandLine: "Teehive is a brand operated by Karuna Innovations Sole Proprietorship - India.",
    docTitle: "Grievance Redressal Mechanism",
    shortName: "Grievance Redressal Mechanism",
    titleLines: ["Grievance", "Redressal", "Mechanism"],
    version: "1.0",
    contactEmail: "contact@teehive.co.in",
    phoneDisplay: "+91 92467 59898",
    website: "teehive.co.in",
    publicLabel: "Public Policy Document",
    effectiveDate: "5th April, 2026",
    intro: [
        "In accordance with applicable Indian laws, including the Information Technology Act, 2000 and relevant rules thereunder, TeeHive has established a Grievance Redressal Mechanism.",
        "TeeHive is operated by:\nKaruna Innovations\nFlat No 501, H No 4-10-159, Sri Sai Homes\nDVK Road, Sri Ram Nagar Colony\nNalgonda, Telangana – 508001\nIndia",
    ],
};

export const grievanceRedressalSections: LegalSection[] = [
    {
        id: "grievance-officer",
        number: "1",
        title: "GRIEVANCE OFFICER",
        blocks: [
            { type: "paragraph", text: "The designated Grievance Officer for TeeHive is:" },
            { type: "paragraph", text: "Name: Thallapally Sai Savanth" },
            { type: "paragraph", text: "Email: contact@teehive.co.in" },
            { type: "paragraph", text: "Phone: 9246759898" },
        ],
    },
    {
        id: "types-grievances",
        number: "2",
        title: "TYPES OF GRIEVANCES",
        blocks: [
            { type: "paragraph", text: "Users may raise concerns related to:" },
            {
                type: "bullets",
                items: [
                    "Intellectual property violations",
                    "Content complaints",
                    "Privacy concerns",
                    "Order-related disputes",
                    "Account suspension issues",
                    "Any violation of Terms & Policies",
                ],
            },
        ],
    },
    {
        id: "how-to-submit",
        number: "3",
        title: "HOW TO SUBMIT A COMPLAINT",
        blocks: [
            { type: "paragraph", text: "Complaints must include:" },
            {
                type: "bullets",
                items: [
                    "Full name",
                    "Contact details",
                    "Description of the grievance",
                    "Relevant order ID (if applicable)",
                    "Any supporting evidence",
                ],
            },
            {
                type: "paragraph",
                text: "Complaints may be submitted via email to: contact@teehive.co.in",
            },
        ],
    },
    {
        id: "response-timeline",
        number: "4",
        title: "RESPONSE TIMELINE",
        blocks: [
            {
                type: "paragraph",
                text: "TeeHive shall acknowledge receipt of a grievance within a reasonable period and aim to resolve complaints in accordance with applicable laws and internal review procedures.",
            },
        ],
    },
    {
        id: "good-faith",
        number: "5",
        title: "GOOD FAITH REQUIREMENT",
        blocks: [
            {
                type: "paragraph",
                text: "Users are expected to submit grievances in good faith.",
            },
            {
                type: "paragraph",
                text: "Frivolous, abusive, or malicious complaints may result in account action.",
            },
        ],
    },
];
