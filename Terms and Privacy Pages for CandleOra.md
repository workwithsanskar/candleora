# Terms and Privacy Pages for CandleOra

## Summary
Add a new long-form `Terms & Conditions` page and a matching `Privacy Policy` page under the existing site shell, then wire both into the signup agreement line and footer. The content should be a professional CandleOra-specific ecommerce draft rather than trying to reconstruct unreadable screenshot text.

## Key Changes
- Add two new public routes:
  - `/terms-and-conditions`
  - `/privacy-policy`
- Create two new static pages styled like the screenshot:
  - white content surface, compact top spacing, left-aligned title, long scrolling legal sections, existing navbar and black footer unchanged
  - typography should be plain and readable, not editorial-card heavy; this is a legal/info page, so favor a clean document layout
- Use CandleOra-branded draft legal content with standard ecommerce sections:
  - Terms: acceptance, eligibility, account responsibilities, product information, pricing, payment, shipping, cancellations, returns/refunds, intellectual property, limitation of liability, governing law, and contact
  - Privacy: data collected, account/profile data, payments/order data, cookies/analytics, use of personal data, sharing/disclosure, retention, customer rights, security, and contact
- Update signup page agreement copy so both `Terms of Service` and `Privacy Policy` are actual links instead of plain text
- Update footer customer-care links so `Terms & Conditions` and `Privacy Policy` navigate to the new pages
- Keep the current signup validation behavior, but do not gate signup on reading the pages; only the checkbox remains the acknowledgment control

## Public Interfaces / Routes
- Add page components for the two legal pages and register them in the router
- Link targets to standardize:
  - Signup checkbox text:
    - `Terms of Service` -> `/terms-and-conditions`
    - `Privacy Policy` -> `/privacy-policy`
  - Footer:
    - `Terms & Conditions` -> `/terms-and-conditions`
    - `Privacy Policy` -> `/privacy-policy`

## Test Cases
- Route tests:
  - `/terms-and-conditions` renders the heading and multiple legal sections
  - `/privacy-policy` renders the heading and multiple privacy sections
- Navigation tests:
  - clicking terms/privacy links in signup opens the correct routes
  - clicking footer terms/privacy opens the correct routes
- Visual/manual checks:
  - both pages read clearly on desktop and mobile
  - long content scrolls cleanly without layout breakage
  - footer and navbar still match the rest of the site

## Assumptions
- Use CandleOra-specific draft legal copy now; final lawyer-reviewed text can replace it later without structural changes
- Create both pages together because the signup agreement references both, and leaving one unlinked would look unfinished
- Keep these pages frontend-static for now; no backend/API content source is needed
