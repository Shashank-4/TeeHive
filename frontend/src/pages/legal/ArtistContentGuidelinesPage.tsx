import LegalDocumentPage from "./LegalDocumentPage";
import {
    artistContentGuidelinesMeta,
    artistContentGuidelinesSections,
} from "../../data/legal/artistContentGuidelinesContent";

export default function ArtistContentGuidelinesPage() {
    return (
        <LegalDocumentPage
            meta={artistContentGuidelinesMeta}
            sections={artistContentGuidelinesSections}
            otherDocLabel="Tax & Payout Policy →"
            otherDocPath="/artist-tax-payout-policy"
        />
    );
}
