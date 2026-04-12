import LegalDocumentPage from "./LegalDocumentPage";
import { returnRefundMeta, returnRefundSections } from "../../data/legal/returnRefundPolicyContent";

export default function ReturnRefundPolicyPage() {
    return (
        <LegalDocumentPage
            meta={returnRefundMeta}
            sections={returnRefundSections}
            otherDocLabel="Shipping Policy →"
            otherDocPath="/shipping-policy"
        />
    );
}
