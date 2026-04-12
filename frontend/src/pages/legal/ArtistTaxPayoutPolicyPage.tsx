import LegalDocumentPage from "./LegalDocumentPage";
import { taxPayoutMeta, taxPayoutSections } from "../../data/legal/taxPayoutPolicyContent";

export default function ArtistTaxPayoutPolicyPage() {
    return (
        <LegalDocumentPage
            meta={taxPayoutMeta}
            sections={taxPayoutSections}
            otherDocLabel="← Artist Agreement"
            otherDocPath="/artist-agreement"
        />
    );
}
