import LegalDocumentPage from "./LegalDocumentPage";
import { shippingMeta, shippingSections } from "../../data/legal/shippingPolicyContent";

export default function ShippingPolicyPage() {
    return (
        <LegalDocumentPage
            meta={shippingMeta}
            sections={shippingSections}
            otherDocLabel="← Return & Refund Policy"
            otherDocPath="/return-refund-policy"
        />
    );
}
