import { Link } from "react-router-dom";
import type { LegalBlock, LegalDocMeta, LegalSection } from "../../data/legal/types";
import { useAuth } from "../../context/AuthContext";

function TermsTitleHeading({ title }: { title: string }) {
    const [a, b] = title.split("&").map((s) => s.trim());
    return (
        <h1 className="font-display text-[clamp(2rem,5vw,3.25rem)] font-black leading-[0.95] tracking-tight">
            <span className="block text-white">
                {a} &
            </span>
            <span className="block text-primary italic">{b}</span>
        </h1>
    );
}

function renderBlocks(blocks: LegalBlock[]) {
    return blocks.map((b, i) => {
        if (b.type === "paragraph") {
            return (
                <p
                    key={i}
                    className="font-body text-[15px] leading-relaxed text-neutral-black/85 whitespace-pre-line mb-4 last:mb-0"
                >
                    {b.text}
                </p>
            );
        }
        return (
            <ul
                key={i}
                className="list-disc pl-5 space-y-2 font-body text-[15px] leading-relaxed text-neutral-black/85 mb-4"
            >
                {b.items.map((item, j) => (
                    <li key={j}>{item}</li>
                ))}
            </ul>
        );
    });
}

function LegalHeader({ meta }: { meta: LegalDocMeta }) {
    const titleBlock =
        meta.titleLines && meta.titleLines.length > 0 ? (
            <h1 className="font-display text-[clamp(2rem,5vw,3.25rem)] font-black leading-[0.95] tracking-tight">
                {meta.titleLines.map((line, i) => (
                    <span
                        key={`${line}-${i}`}
                        className={i % 2 === 0 ? "block text-white" : "block text-primary italic"}
                    >
                        {line}
                    </span>
                ))}
            </h1>
        ) : meta.docTitle === "Privacy Policy" ? (
            <h1 className="font-display text-[clamp(2rem,5vw,3.25rem)] font-black leading-[0.95] tracking-tight">
                <span className="block text-white">Privacy</span>
                <span className="block text-primary italic">Policy</span>
            </h1>
        ) : meta.docTitle.includes("&") ? (
            <TermsTitleHeading title={meta.docTitle} />
        ) : (
            <h1 className="font-display text-[clamp(2rem,5vw,3.25rem)] font-black leading-[0.95] tracking-tight text-white">
                {meta.docTitle}
            </h1>
        );

    return (
        <header className="relative border-b-[3px] border-neutral-black bg-neutral-black text-white px-6 py-10 md:px-12 md:py-14 overflow-hidden">
            <div className="absolute top-0 right-0 w-[min(420px,90vw)] h-[min(420px,90vw)] bg-primary/[0.12] blur-[100px] rounded-full translate-x-1/3 -translate-y-1/3 pointer-events-none" />
            <div className="relative z-10 space-y-6">
                <p className="font-display text-[11px] md:text-[12px] font-black tracking-[0.45em] text-primary">TEEHIVE</p>
                <p className="font-body text-[14px] md:text-[15px] leading-relaxed text-white/75 max-w-xl">
                    {meta.brandLine}
                </p>
                <div className="space-y-1">{titleBlock}</div>
                <div className="flex flex-wrap gap-x-3 gap-y-1 font-display text-[11px] font-black tracking-[0.12em] text-white/50 uppercase">
                    <span>Version {meta.version}</span>
                    <span className="text-white/25">|</span>
                    <span>{meta.publicLabel}</span>
                </div>
                <div className="pt-4 border-t border-white/10 font-display text-[12px] md:text-[13px] font-bold text-white/90 space-y-1">
                    <p>
                        <a href={`mailto:${meta.contactEmail}`} className="text-primary hover:underline">
                            {meta.contactEmail}
                        </a>
                        <span className="text-white/40 mx-2">|</span>
                        <span>{meta.phoneDisplay}</span>
                    </p>
                    <p className="text-white/60">{meta.website}</p>
                    <p className="text-primary/90 pt-1 font-black tracking-wide uppercase text-[11px]">
                        Effective date: {meta.effectiveDate}
                    </p>
                </div>
                <p className="font-display text-[10px] font-black tracking-[0.25em] text-white/35 uppercase pt-2">
                    {meta.shortName} · On-file reference
                </p>
            </div>
        </header>
    );
}

function SectionView({ section }: { section: LegalSection }) {
    return (
        <section id={section.id} className="scroll-mt-24 py-8 border-b border-neutral-black/10 last:border-b-0">
            <h2 className="font-display text-[13px] md:text-[14px] font-black tracking-[0.2em] text-neutral-black mb-4">
                <span className="text-primary">{section.number}.</span> {section.title}
            </h2>
            <div className="space-y-4">{renderBlocks(section.blocks)}</div>
            {section.subsections?.map((sub) => (
                <div key={sub.label} className="mt-6 pl-0 md:pl-2 border-l-[3px] border-primary/80 pl-4">
                    <h3 className="font-display text-[12px] font-black tracking-wide text-neutral-black mb-3">
                        {sub.label}. {sub.title}
                    </h3>
                    {renderBlocks(sub.blocks)}
                </div>
            ))}
        </section>
    );
}

type LegalDocumentPageProps = {
    meta: LegalDocMeta;
    sections: LegalSection[];
    otherDocLabel: string;
    otherDocPath: string;
};

export default function LegalDocumentPage({ meta, sections, otherDocLabel, otherDocPath }: LegalDocumentPageProps) {
    const { user } = useAuth();
    const backHref = user?.isAdmin ? "/admin/dashboard" : user?.isArtist ? "/artist/dashboard" : "/";
    const backLabel = user?.isAdmin
        ? "← Back to admin"
        : user?.isArtist
          ? "← Back to artist dashboard"
          : "← Back to site";

    return (
        <article className="normal-case bg-neutral-g1 min-h-[70vh] py-10 md:py-14 px-4 md:px-8">
            <div className="max-w-3xl mx-auto">
                <div className="mb-6 flex justify-between items-center gap-4 flex-wrap">
                    <Link
                        to={backHref}
                        className="font-display text-[10px] font-black uppercase tracking-[0.2em] text-neutral-black/40 hover:text-primary transition-colors no-underline"
                    >
                        {backLabel}
                    </Link>
                    <Link
                        to={otherDocPath}
                        className="font-display text-[10px] font-black uppercase tracking-[0.2em] text-neutral-black hover:text-primary transition-colors border-b-2 border-primary pb-0.5 no-underline"
                    >
                        {otherDocLabel}
                    </Link>
                </div>

                <div className="bg-white border-[3px] border-neutral-black rounded-[4px] shadow-[10px_10px_0px_0px_rgba(255,222,0,1)] overflow-hidden">
                    <LegalHeader meta={meta} />

                    {meta.intro && meta.intro.length > 0 && (
                        <div className="px-6 md:px-12 py-8 bg-neutral-g1/40 border-b border-neutral-black/10">
                            {meta.intro.map((p, i) => (
                                <p
                                    key={i}
                                    className="font-body text-[15px] leading-relaxed text-neutral-black/85 mb-4 last:mb-0"
                                >
                                    {p}
                                </p>
                            ))}
                        </div>
                    )}

                    <div className="px-6 md:px-12 pb-12 pt-4">
                        {sections.map((s) => (
                            <SectionView key={s.id} section={s} />
                        ))}
                    </div>

                    <footer className="px-6 md:px-12 py-8 bg-neutral-black text-center border-t-[3px] border-neutral-black">
                        <p className="font-display text-[10px] font-black tracking-[0.35em] text-primary/90 uppercase">
                            — — — — — THE END — — — — —
                        </p>
                    </footer>
                </div>
            </div>
        </article>
    );
}
