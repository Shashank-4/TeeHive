export type LegalBulletBlock = { type: "bullets"; items: string[] };
export type LegalParagraphBlock = { type: "paragraph"; text: string };
export type LegalBlock = LegalBulletBlock | LegalParagraphBlock;

export type LegalSubsection = {
    label: string;
    title: string;
    blocks: LegalBlock[];
};

export type LegalSection = {
    id: string;
    number: string;
    title: string;
    blocks: LegalBlock[];
    subsections?: LegalSubsection[];
};

export type LegalDocMeta = {
    brandLine: string;
    /** Plain document name (SEO / header tagline). */
    docTitle: string;
    /**
     * Multi-line hero title (PDF cover). Lines alternate: white, primary italic, white, …
     * If omitted, header falls back to Privacy / Terms-style rules using `docTitle`.
     */
    titleLines?: string[];
    /** Shown as “{shortName} · On-file reference” under the header contact strip. */
    shortName: string;
    version: string;
    contactEmail: string;
    phoneDisplay: string;
    website: string;
    publicLabel: string;
    effectiveDate: string;
    intro?: string[];
};
