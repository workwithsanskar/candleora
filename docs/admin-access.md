# CandleOra Admin Access

The CandleOra admin dashboard is part of the same React frontend deployment as the storefront. It is not designed as a separate deployed app unless you intentionally split it later.

## Access pattern

- Storefront: `https://your-domain.com`
- Admin dashboard: `https://your-domain.com/admin`
- Backend API: `https://api.your-domain.com/api`

That means:

- customers use the normal website domain
- admin users go directly to `/admin`
- non-admin users are redirected away by the frontend route guard
- backend admin APIs remain protected by Spring Security role checks

## Local access

Start the backend first from `backend/`, then the frontend from `frontend/`.

Typical local URLs:

- frontend: `http://localhost:5173`
- admin: `http://localhost:5173/admin`
- backend API: `http://localhost:8080/api`

If the seeded data is enabled, you can use:

- admin email: `admin@candleora.com`
- password: `Password123!`

The admin route checks for the `ADMIN` role in the authenticated profile before rendering the dashboard.

## Production access

Recommended production setup:

- storefront and admin on the same frontend deployment
- API on a separate subdomain such as `api.candleora.com`

Use:

- `https://candleora.com/admin`
- `https://www.candleora.com/admin`

Do not create a second admin deployment unless you specifically need a separate operational boundary. Keeping admin inside the main frontend keeps deployment, auth, and routing simpler.

## Admin login seeding

The backend seeder at [DataSeeder.java](../backend/src/main/java/com/candleora/config/DataSeeder.java) creates this account when it does not already exist:

- `admin@candleora.com` / `Password123!`

Important production note:

- change this password immediately in any shared or real environment
- if you move to a persistent production database, the seeder will not recreate the account after it already exists
- if you want stricter production behavior later, move admin provisioning to an environment-driven bootstrap process

## Route rewrites

Single-page apps need a fallback to `index.html` for deep links like `/admin`, `/admin/orders`, and `/admin/products`. Without that fallback, browser refreshes on admin pages will return `404` or `403` from the hosting layer.

### S3 + CloudFront

For the recommended frontend deployment:

1. Set the CloudFront default root object to `index.html`.
2. Add custom error responses:
   - `403` -> `/index.html` with response code `200`
   - `404` -> `/index.html` with response code `200`
3. Keep API traffic on `api.your-domain.com` so CloudFront SPA fallbacks never interfere with backend routes.

This is what makes `https://your-domain.com/admin` load correctly even after a hard refresh.

### Nginx

If you host the frontend with Nginx, you need SPA fallback routing:

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

The frontend container already includes this in [nginx.conf](../frontend/nginx.conf).

If you run the optional full-stack EC2 setup with Nginx in front of the frontend container, use the sample config at [www.candleora.conf](../deploy/nginx/www.candleora.conf).

## Security model

Admin access is protected at two layers:

1. Frontend route guard:
   - [AdminRoute.jsx](../frontend/src/admin/components/AdminRoute.jsx)
2. Backend role checks:
   - `/api/admin/*` endpoints require the `ADMIN` role

The backend is the real security boundary. The frontend guard is there for user experience and route protection, not as the sole authorization layer.
