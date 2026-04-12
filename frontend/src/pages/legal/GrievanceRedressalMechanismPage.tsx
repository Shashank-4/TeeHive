import LegalDocumentPage from "./LegalDocumentPage";
import { grievanceRedressalMeta, grievanceRedressalSections } from "../../data/legal/grievanceRedressalContent";

export default function GrievanceRedressalMechanismPage() {
    return (
        <LegalDocumentPage
            meta={grievanceRedressalMeta}
            sections={grievanceRedressalSections}
            otherDocLabel="← Copyright Takedown"
            otherDocPath="/copyright-takedown-policy"
        />
    );
}
