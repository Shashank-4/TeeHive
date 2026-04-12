import type { LegalDocMeta, LegalSection } from "./types";

export const shippingMeta: LegalDocMeta = {
    brandLine: "Teehive is a brand operated by Karuna Innovations Sole Proprietorship - India.",
    docTitle: "Shipping Policy",
    shortName: "Shipping Policy",
    titleLines: ["Shipping", "Policy"],
    version: "1.0",
    contactEmail: "contact@teehive.co.in",
    phoneDisplay: "+91 92467 59898",
    website: "teehive.co.in",
    publicLabel: "Public Policy Document",
    effectiveDate: "5th April, 2026",
    intro: [
        "This Shipping Policy applies to all orders placed through www.teehive.co.in, operated by Karuna Innovations under the brand name TeeHive.",
        "By placing an order, you agree to this Shipping Policy.",
    ],
};

export const shippingSections: LegalSection[] = [
    {
        id: "order-processing",
        number: "1",
        title: "ORDER PROCESSING TIME",
        blocks: [
            { type: "paragraph", text: "All products on TeeHive are printed on demand." },
            { type: "paragraph", text: "Order processing typically takes:" },
            { type: "bullets", items: ["1–3 business days"] },
            {
                type: "paragraph",
                text: "Processing time includes:",
            },
            {
                type: "bullets",
                items: ["Design printing", "Quality check", "Packaging"],
            },
            {
                type: "paragraph",
                text: "Orders are not shipped on Sundays or public holidays.",
            },
        ],
    },
    {
        id: "delivery-timeline",
        number: "2",
        title: "DELIVERY TIMELINE",
        blocks: [
            { type: "paragraph", text: "Estimated delivery timelines after dispatch:" },
            {
                type: "bullets",
                items: ["Metro cities: 3–6 business days", "Non-metro / other regions: 5–8 business days"],
            },
            { type: "paragraph", text: "Delivery timelines are estimates and may vary depending on:" },
            {
                type: "bullets",
                items: ["Location", "Courier partner", "Weather conditions", "Public holidays", "Unexpected logistical delays"],
            },
        ],
    },
    {
        id: "shipping-charges",
        number: "3",
        title: "SHIPPING CHARGES",
        blocks: [
            {
                type: "paragraph",
                text: "Shipping charges, if applicable, will be displayed during checkout before payment.",
            },
            {
                type: "paragraph",
                text: "Any promotional free shipping offers will be clearly communicated on the Website.",
            },
        ],
    },
    {
        id: "order-tracking",
        number: "4",
        title: "ORDER TRACKING",
        blocks: [
            {
                type: "paragraph",
                text: "Once dispatched, tracking details (if available) will be shared via:",
            },
            { type: "bullets", items: ["Email", "SMS (if provided)"] },
            {
                type: "paragraph",
                text: "Customers are responsible for monitoring shipment updates.",
            },
        ],
    },
    {
        id: "delivery-address",
        number: "5",
        title: "DELIVERY ADDRESS RESPONSIBILITY",
        blocks: [
            { type: "paragraph", text: "Customers must ensure that:" },
            {
                type: "bullets",
                items: ["The shipping address entered is accurate and complete", "Contact details are correct"],
            },
            {
                type: "paragraph",
                text: "TeeHive shall not be responsible for delays or failed deliveries caused by incorrect address details provided by the customer.",
            },
            {
                type: "paragraph",
                text: "If an order is returned due to incorrect address or non-availability of the customer, re-shipping charges may apply.",
            },
        ],
    },
    {
        id: "failed-delivery",
        number: "6",
        title: "FAILED DELIVERY / REFUSED ORDERS",
        blocks: [
            { type: "paragraph", text: "If delivery fails due to:" },
            {
                type: "bullets",
                items: ["Customer unavailability", "Refusal to accept delivery", "Incorrect address"],
            },
            { type: "paragraph", text: "Karuna Innovations reserves the right to:" },
            {
                type: "bullets",
                items: ["Cancel the order", "Deduct shipping and handling costs from any applicable refund"],
            },
        ],
    },
    {
        id: "delays-beyond-control",
        number: "7",
        title: "DELAYS BEYOND CONTROL",
        blocks: [
            {
                type: "paragraph",
                text: "Karuna Innovations shall not be liable for delivery delays caused by circumstances beyond reasonable control, including but not limited to:",
            },
            {
                type: "bullets",
                items: [
                    "Natural disasters",
                    "Government restrictions",
                    "Strikes",
                    "Courier disruptions",
                    "Public emergencies",
                ],
            },
        ],
    },
    {
        id: "marketplace-shipping",
        number: "8",
        title: "MARKETPLACE CLARIFICATION",
        blocks: [
            {
                type: "paragraph",
                text: "TeeHive operates as a print-on-demand marketplace featuring independent artist designs.\nProducts are manufactured after order confirmation.",
            },
            { type: "paragraph", text: "Because of this model:" },
            {
                type: "bullets",
                items: [
                    "Express delivery options may not always be available",
                    "Delivery timelines include production time",
                ],
            },
        ],
    },
    {
        id: "contact-shipping",
        number: "9",
        title: "CONTACT INFORMATION",
        blocks: [
            {
                type: "paragraph",
                text: "For shipping-related inquiries: contact@teehive.co.in | +91 92467 59898",
            },
        ],
    },
];
