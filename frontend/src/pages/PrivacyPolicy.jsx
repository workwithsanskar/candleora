import LegalDocumentPage from "../components/LegalDocumentPage";
import { privacySections } from "../content/legalContent";

function PrivacyPolicy() {
  return (
    <LegalDocumentPage
      title="Privacy Policy"
      intro="This Privacy Policy explains how CandleOra collects, uses, stores, and protects customer information when you use our website, create an account, save preferences, or place an order."
      lastUpdated="March 22, 2026"
      sections={privacySections}
    />
  );
}

export default PrivacyPolicy;
