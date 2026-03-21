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
- Required env: `VITE_API_BASE_URL`

## Backend

- Stack: Spring Boot 3, Spring Security with JWT, Spring Data JPA, MySQL
- Run from `backend/`
- Required env:
  - `SPRING_DATASOURCE_URL`
  - `SPRING_DATASOURCE_USERNAME`
  - `SPRING_DATASOURCE_PASSWORD`
  - `JWT_SECRET`
  - `FRONTEND_URL`

## Local setup

1. Install Node.js 20+ and npm.
2. Install Java 17+ and Maven 3.9+.
3. Create `frontend/.env` from `frontend/.env.example`.
4. Create `backend/.env` or export the backend environment variables.
5. Start MySQL and create the configured database.
6. Run the backend from `backend/`.
7. Run the frontend from `frontend/`.

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
- Seeded demo accounts:
  - `demo@candleora.com` / `Password123!`
  - `admin@candleora.com` / `Password123!`
- Admin CRUD is intentionally deferred.
- This environment did not have Node.js or Maven available, so dependency installation and runtime verification were not executed here.
- Run `npm install` inside `frontend/` before starting the storefront because `package.json` was updated for Axios and Tailwind.
