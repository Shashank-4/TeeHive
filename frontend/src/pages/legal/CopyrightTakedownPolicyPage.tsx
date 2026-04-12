import LegalDocumentPage from "./LegalDocumentPage";
import {
    copyrightTakedownMeta,
    copyrightTakedownSections,
} from "../../data/legal/copyrightTakedownPolicyContent";

export default function CopyrightTakedownPolicyPage() {
    return (
        <LegalDocumentPage
            meta={copyrightTakedownMeta}
            sections={copyrightTakedownSections}
            otherDocLabel="Grievance Redressal →"
            otherDocPath="/grievance-redressal"
        />
    );
}
