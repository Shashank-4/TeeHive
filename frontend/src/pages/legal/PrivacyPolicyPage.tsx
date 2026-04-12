import LegalDocumentPage from "./LegalDocumentPage";
import { privacyMeta, privacySections } from "../../data/legal/privacyPolicyContent";

export default function PrivacyPolicyPage() {
    return (
        <LegalDocumentPage
            meta={privacyMeta}
            sections={privacySections}
            otherDocLabel="Terms & Conditions →"
            otherDocPath="/terms"
        />
    );
}
