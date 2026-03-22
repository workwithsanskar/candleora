# CandleOra Premium D2C Ecommerce Rebuild Plan

## Summary
Transform the current partially working storefront into a polished single-brand D2C ecommerce site for CandleOra, with real customer authentication, persistent carts, real checkout via Razorpay sandbox, hybrid sign-in, and a design system driven by the supplied logo/PDF/image assets.

Implementation will be sequenced in this order so the broken core flows are fixed first:
1. Stabilize auth, user provisioning, cart persistence, and protected checkout.
2. Upgrade checkout/orders to real ecommerce behavior with Razorpay and order detail flows.
3. Align the UI to the supplied brand assets and local design boards, replacing the custom vector logo with the original image logo.
4. Complete content/detailing for Home, Occasion Picks, Styling Guides, Candle Fixes, FAQ, and profile/account pages.

## Key Changes

### Auth, Accounts, and Identity
- Keep JWT session auth in Spring Boot, but standardize the user lifecycle around three real entry paths:
  - Email/password register/login
  - Google login/signup
  - Firebase Phone OTP login/signup
- Auto-provision a CandleOra user record after first successful Google or phone authentication.
- Support both current and target auth routes during migration:
  - Keep `/api/auth/signup` working
  - Add `/api/auth/register` as the preferred alias
  - Keep `/api/auth/me`
  - Add `PUT /api/auth/me` as the preferred profile update route and keep `/api/auth/profile` as a compatibility alias until the frontend is fully switched
  - Add `POST /api/auth/phone` for Firebase token exchange and account provisioning
- Extend the user profile contract to persist and edit:
  - name, email, phone number, alternate phone number
  - address lines, city, state, postal code
  - DOB, gender
  - location label, latitude, longitude
  - auth provider metadata and verification flags
- Keep localStorage JWT storage for this project, but make token refresh/profile bootstrapping deterministic and centralize auth errors into readable UI messages.

### Cart, Checkout, Orders, and Payments
- Keep guest cart in localStorage, but replace the current per-item login merge with a backend sync endpoint:
  - add `POST /api/cart/sync`
- Keep cart available to guests, but require auth before final checkout.
- Convert checkout into a true multi-step flow:
  - Shipping details
  - Payment method
  - Review order
  - Confirmation
- Payment methods:
  - Razorpay online payment for card/UPI/netbanking
  - Cash on Delivery as an offline order path
- Use a real payment flow for online orders:
  - `POST /api/payments/razorpay/order` creates a pending backend order and Razorpay order
  - frontend opens Razorpay checkout with returned order data
  - `POST /api/payments/razorpay/verify` verifies signature and finalizes the order
- For COD:
  - `POST /api/orders` creates the order directly
- Expand order data to support real ecommerce behavior:
  - payment provider, payment method, payment status
  - gateway order/payment IDs, signature verification result
  - order status progression: `PENDING_PAYMENT`, `CONFIRMED`, `SHIPPED`, `OUT_FOR_DELIVERY`, `DELIVERED`, `CANCELLED`
  - estimated delivery window
- Add missing order APIs:
  - `GET /api/orders` preferred current-user history
  - keep `GET /api/orders/me` as compatibility alias
  - `GET /api/orders/{id}` for order detail/confirmation pages

### Catalog and Content Model
- Extend `Product` to match the richer storefront:
  - `originalPrice`
  - `scentNotes`
  - `burnTime`
  - retain category, stock, discount, rating, occasion tag, image URLs
- Keep product/category browsing public and retain existing listing/detail endpoints.
- Move local board/PDF content into backend-seeded source-of-truth records for:
  - Candle Fixes
  - FAQ
  - Styling Guides
  - Occasion Picks collections
- Use exact PDF text where available; replace the remaining placeholders with project-safe realistic copy only where the PDFs are incomplete.

### Frontend Experience and Design
- Replace the current SVG-built logo component with an image-backed brand component using the original logo asset already present in the repo:
  - use `frontend/src/assets/designer/logo-candleora-web.png`
  - keep it responsive in navbar/footer and link it to home
- Treat the local assets and supplied images as the design source of truth for this pass:
  - `hero.png`
  - the designer card images already in `frontend/src/assets/designer/`
  - the local board images in `CandleOra (NEW)`
- Align the app shell to a more real ecommerce UX:
  - sticky header with prominent search, cart badge, auth/account entry
  - stronger cart summary and checkout CTAs
  - order confirmation page
  - order detail page with status tracker
  - clearer loading, empty, and error states
- Keep the current warm palette, Playfair/Poppins typography, and editorial tone, but tighten spacing/components so pages feel cohesive rather than prototype-like.
- Add missing practical UX:
  - form validation via React Hook Form
  - toast notifications for auth, cart, checkout, and payment events
  - checkout redirect preservation after login
  - stock state messaging and disabled purchase behavior on out-of-stock items

## Public Interfaces, Types, and Env
- Frontend env:
  - `VITE_API_BASE_URL`
  - `VITE_GOOGLE_CLIENT_ID`
  - `VITE_FIREBASE_API_KEY`
  - `VITE_FIREBASE_AUTH_DOMAIN`
  - `VITE_FIREBASE_PROJECT_ID`
  - `VITE_FIREBASE_APP_ID`
  - `VITE_RAZORPAY_KEY_ID`
- Backend env:
  - existing datasource/JWT/frontend envs
  - `GOOGLE_CLIENT_ID`
  - `FIREBASE_PROJECT_ID`
  - `FIREBASE_CLIENT_EMAIL`
  - `FIREBASE_PRIVATE_KEY`
  - `RAZORPAY_KEY_ID`
  - `RAZORPAY_KEY_SECRET`
  - `RAZORPAY_WEBHOOK_SECRET`
- Preferred API surface after migration:
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - `POST /api/auth/google`
  - `POST /api/auth/phone`
  - `GET /api/auth/me`
  - `PUT /api/auth/me`
  - `GET /api/products`
  - `GET /api/products/{id}`
  - `GET /api/categories`
  - `GET /api/cart`
  - `POST /api/cart/items`
  - `PUT /api/cart/items/{id}`
  - `DELETE /api/cart/items/{id}`
  - `POST /api/cart/sync`
  - `POST /api/payments/razorpay/order`
  - `POST /api/payments/razorpay/verify`
  - `POST /api/orders`
  - `GET /api/orders`
  - `GET /api/orders/{id}`
  - content endpoints remain public
- New frontend routes:
  - keep existing storefront routes
  - add `/orders/:id`
  - add `/order-confirmation/:orderId`
- Compatibility rule:
  - existing working routes remain available until all frontend consumers are migrated

## Test Plan
- Backend integration tests:
  - email register/login returns JWT and creates a persisted user
  - Google auth provisions a user on first login and reuses it later
  - phone auth provisions a user from a verified Firebase token
  - protected endpoints reject unauthenticated access and return readable JSON errors
  - guest cart sync merges quantities correctly
  - COD order placement creates order, clears cart, and reserves stock
  - Razorpay order creation/verification updates payment and order status correctly
  - `GET /api/orders/{id}` only returns the owner’s order
- Frontend tests:
  - login/register/Google/phone auth flows update session state and redirect correctly
  - guest cart persists across reload and merges after login
  - protected checkout redirects to login, then resumes checkout
  - multi-step checkout blocks incomplete progression
  - Razorpay flow is mocked successfully in tests
  - order confirmation and order detail render status, totals, and shipping/payment info
  - navbar/cart/account state updates correctly after auth/cart events
- Manual acceptance scenarios:
  - guest browse -> add items -> login -> merged cart -> checkout -> COD order
  - guest browse -> Google login -> Razorpay payment -> order confirmation
  - phone OTP signup -> profile completion -> checkout
  - logo appears correctly in header/footer on mobile and desktop
  - Home/Occasion Picks/Styling Guides/Candle Fixes/FAQ match the local design asset direction

## Assumptions and Defaults
- CandleOra remains a single-brand D2C store, not a multi-vendor marketplace.
- Real payment means Razorpay sandbox integration in development, not live production keys in repo.
- Hybrid auth means email/password + Google + Firebase phone OTP in the same release.
- Local PDFs/images and the supplied original logo are the design source of truth for this implementation pass; the Figma link was referenced, but its contents were not retrievable from this environment.
- Admin CRUD, wishlist, and “marketplace-scale” extras are deferred unless explicitly pulled into a later phase.
- MySQL is the preferred persistent runtime database; H2 remains acceptable for tests/demo fallback.
