import LegalDocumentPage from "./LegalDocumentPage";
import { termsMeta, termsSections } from "../../data/legal/termsAndConditionsContent";

export default function TermsAndConditionsPage() {
    return (
        <LegalDocumentPage
            meta={termsMeta}
            sections={termsSections}
            otherDocLabel="← Privacy Policy"
            otherDocPath="/privacy-policy"
        />
    );
}
