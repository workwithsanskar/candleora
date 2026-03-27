# CandleOra Monorepo

CandleOra is a full-stack e-commerce project for handmade candles. This workspace is organized as a monorepo with a React storefront in `frontend/` and a Spring Boot API in `backend/`.

## Structure

```text
candleora-frontend/
|- frontend/   # React + Vite + Tailwind storefront
|- backend/    # Spring Boot 3 + Spring Security + JPA API
```

## Frontend

- Stack: React 19, React Router, Axios, Tailwind CSS
- Run from `frontend/`
- Required env:
  - `VITE_API_BASE_URL`
  - `VITE_GOOGLE_CLIENT_ID`
  - `VITE_FIREBASE_API_KEY`
  - `VITE_FIREBASE_AUTH_DOMAIN`
  - `VITE_FIREBASE_PROJECT_ID`
  - `VITE_FIREBASE_APP_ID`
  - `VITE_RAZORPAY_KEY_ID`

## Backend

- Stack: Spring Boot 3, Spring Security with JWT, Spring Data JPA
- Run from `backend/`
- Common env:
  - `SPRING_DATASOURCE_URL`
  - `SPRING_DATASOURCE_DRIVER`
  - `SPRING_DATASOURCE_USERNAME`
  - `SPRING_DATASOURCE_PASSWORD`
  - `JWT_SECRET`
  - `FRONTEND_URL`
  - `FRONTEND_ORIGIN_PATTERNS`
  - `GOOGLE_CLIENT_ID`
  - `FIREBASE_PROJECT_ID`
  - `RAZORPAY_KEY_ID`
  - `RAZORPAY_KEY_SECRET`

## Local setup

1. Install Node.js 20+ and npm.
2. Install Java 17+ and Maven 3.9+.
3. Create `frontend/.env` from `frontend/.env.example`.
4. Create `backend/.env` or export the backend environment variables.
5. Start the backend from `backend/` with `mvn spring-boot:run`.
6. Keep that backend terminal open while you work.
7. Run the frontend from `frontend/`.

## Vercel + Render deployment

- Frontend on Vercel should use:
  - `VITE_API_BASE_URL=https://candleora.onrender.com/api`
- Backend on Render should use:
  - `SPRING_DATASOURCE_URL=jdbc:postgresql://<render-postgres-host>:5432/<database>`
  - `SPRING_DATASOURCE_DRIVER=org.postgresql.Driver`
  - `SPRING_DATASOURCE_USERNAME=<render-postgres-user>`
  - `SPRING_DATASOURCE_PASSWORD=<render-postgres-password>`
  - `FRONTEND_URL=https://candleora.vercel.app`
  - `FRONTEND_ORIGIN_PATTERNS=https://*.vercel.app`
- The Render root URL may return `403` because it is an API service. Validate the backend with routes such as:
  - `https://candleora.onrender.com/api/products`
  - `https://candleora.onrender.com/api/categories`

## AWS production deployment

- Production deployment assets now live at:
  - `docker-compose.yml`
  - `docker-compose.fullstack.yml`
  - `frontend/Dockerfile`
  - `backend/Dockerfile`
  - `deploy/nginx/api.candleora.conf`
  - `deploy/nginx/www.candleora.conf`
  - `.github/workflows/deploy.yml`
  - `docs/production-deployment.md`
  - `docs/admin-access.md`
- The recommended AWS topology is:
  - frontend static build on S3 + CloudFront
  - backend container on EC2 behind Nginx
  - PostgreSQL on RDS
  - invoices and uploads on S3
- Copy `.env.production.example` to `.env.production` before running Docker Compose.
- Follow the step-by-step runbook in [docs/production-deployment.md](docs/production-deployment.md).

## Render Postgres setup

If you want accounts, carts, and orders to survive redeploys, do not keep the backend on the H2 fallback. Create a persistent PostgreSQL database in Render and wire the backend to it.

1. In Render, create a PostgreSQL database.
2. Copy the connection details from Render.
3. In the CandleOra backend service, set:
   - `SPRING_DATASOURCE_URL=jdbc:postgresql://<host>:5432/<database>`
   - `SPRING_DATASOURCE_DRIVER=org.postgresql.Driver`
   - `SPRING_DATASOURCE_USERNAME=<user>`
   - `SPRING_DATASOURCE_PASSWORD=<password>`
   - `JWT_SECRET=<long-random-secret>`
   - `FRONTEND_URL=https://candleora.vercel.app`
   - `FRONTEND_ORIGIN_PATTERNS=https://*.vercel.app`
4. Redeploy the backend.
5. Verify the database switch in the Render logs. You should no longer see `jdbc:h2:mem:candleora`.
6. Test with:
   - `https://candleora.onrender.com/api/products`
   - signup on `https://candleora.vercel.app/signup`
   - login on `https://candleora.vercel.app/login`

Notes:
- Spring Boot now infers the JDBC driver from the datasource URL automatically, so switching between H2 locally and Postgres on Render is simpler.
- Render Postgres connection strings must be provided as JDBC URLs here. Use the host, database, username, and password values from Render rather than a raw `postgres://` URL.

## Local backend behavior

- Local development works out of the box with the file-backed H2 database configured in `backend/src/main/resources/application.properties`.
- PostgreSQL is recommended for deployment when you need persistent accounts and orders.
- Start the backend once and reuse that same process during development.
- If `mvn spring-boot:run` says `Port 8080 was already in use`, CandleOra may already be running on `http://localhost:8080`.
- You can quickly check by opening `http://localhost:8080/api/products`. If it returns CandleOra product JSON, reuse that backend instead of starting another one.

## Auth and payment setup

- Email/password signup and login use:
  - `POST /api/public/auth/register`
  - `POST /api/public/auth/signup`
  - `POST /api/public/auth/login`
- Google sign-in uses the client ID in both frontend and backend env files.
- Phone OTP uses Firebase Authentication on the frontend and Firebase project token verification on the backend.
- For Firebase OTP to work end to end:
  - frontend needs `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, and `VITE_FIREBASE_APP_ID`
  - backend needs `FIREBASE_PROJECT_ID`
  - Firebase Authentication must have Phone sign-in enabled
  - Firebase authorized domains must include `localhost` for local development and your deployed frontend domain such as `candleora.vercel.app`
- Razorpay online payment uses sandbox credentials and the backend verification endpoints:
  - `POST /api/payments/razorpay/order`
  - `POST /api/payments/razorpay/verify`
- Cash on Delivery remains available as a non-gateway checkout path.

## Tests

- Frontend:
  - `cd frontend`
  - `npm install`
  - `npm run test`
  - `npm run test:coverage`
- Backend:
  - `cd backend`
  - `mvn test`
  - `mvn verify` for the JaCoCo coverage report

## Notes

- Seed data is created at backend startup.
- JWT token generation now supports both Base64 secrets and plain-text local dev secrets.
- Seeded demo accounts:
  - `demo@candleora.com` / `Password123!`
  - `admin@candleora.com` / `Password123!`
- Admin access lives inside the same frontend deployment at `/admin`, not a separate app by default.
- Production admin access guidance lives in [docs/admin-access.md](docs/admin-access.md).
- Frontend cart persists for guests and syncs into the backend cart after login.
- Checkout now supports multi-step shipping, payment selection, order review, and order confirmation pages.
- Admin dashboard routes are protected by the frontend admin route and backend `/api/admin/*` role checks.
- Google auth is intentionally hidden on the local login and signup screens until the OAuth client allows `http://localhost:5173` as an authorized JavaScript origin.
- This environment did not have Node.js or Maven available, so dependency installation and runtime verification were not executed here.
- Run `npm install` inside `frontend/` before starting the storefront because `package.json` was updated for Axios and Tailwind.
