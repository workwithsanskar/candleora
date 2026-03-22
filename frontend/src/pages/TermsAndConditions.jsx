import LegalDocumentPage from "../components/LegalDocumentPage";
import { termsSections } from "../content/legalContent";

function TermsAndConditions() {
  return (
    <LegalDocumentPage
      title="Terms & Conditions"
      intro="These Terms & Conditions outline the rules, responsibilities, and service expectations that apply when you browse CandleOra, create an account, or place an order through our ecommerce platform."
      lastUpdated="March 22, 2026"
      sections={termsSections}
    />
  );
}

export default TermsAndConditions;
