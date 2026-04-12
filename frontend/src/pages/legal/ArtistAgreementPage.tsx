import LegalDocumentPage from "./LegalDocumentPage";
import { artistAgreementMeta, artistAgreementSections } from "../../data/legal/artistAgreementContent";

export default function ArtistAgreementPage() {
    return (
        <LegalDocumentPage
            meta={artistAgreementMeta}
            sections={artistAgreementSections}
            otherDocLabel="Content Guidelines →"
            otherDocPath="/artist-content-guidelines"
        />
    );
}
