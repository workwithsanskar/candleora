# CandleOra Production Deployment

This repo is a monorepo, so the production deployment should match the code that actually exists today:

- `frontend/`: React + Vite storefront
- `backend/`: Spring Boot API

The recommended AWS topology is:

1. Frontend static build on S3.
2. CloudFront in front of S3 for HTTPS and CDN caching.
3. Backend container on EC2, fronted by Nginx on `api.your-domain.com`.
4. PostgreSQL on RDS.
5. S3 for invoices and uploaded media.

## Included deployment assets

- [docker-compose.yml](../docker-compose.yml)
- [docker-compose.fullstack.yml](../docker-compose.fullstack.yml)
- [frontend/Dockerfile](../frontend/Dockerfile)
- [backend/Dockerfile](../backend/Dockerfile)
- [deploy/nginx/api.candleora.conf](../deploy/nginx/api.candleora.conf)
- [deploy/nginx/www.candleora.conf](../deploy/nginx/www.candleora.conf)
- [.github/workflows/deploy.yml](../.github/workflows/deploy.yml)
- [.env.production.example](../.env.production.example)
- [docs/admin-access.md](./admin-access.md)

## Admin access model

The admin dashboard does not need a separate deployment. It is served from the same frontend build as the storefront:

- storefront: `https://your-domain.com`
- admin: `https://your-domain.com/admin`
- API: `https://api.your-domain.com/api`

That is the deployment model this repo currently uses.

## 1. Prepare AWS resources

Create these AWS resources first:

1. RDS PostgreSQL instance for application data.
2. S3 bucket for the frontend build.
3. CloudFront distribution pointing at that S3 bucket.
4. S3 bucket for invoice PDFs and uploads if you move storage off-instance.
5. EC2 Ubuntu instance for the backend container and Nginx.

Recommended security group rules:

- EC2 inbound `22` only from your admin IP.
- EC2 inbound `80` and `443` from anywhere.
- RDS inbound `5432` only from the EC2 security group.

## 2. Set production environment variables

Copy the template and fill it with real values:

```bash
cp .env.production.example .env.production
```

Important values:

- `VITE_API_BASE_URL=https://api.your-domain.com/api`
- `FRONTEND_URL=https://your-domain.com`
- `BACKEND_URL=https://api.your-domain.com`
- `SPRING_DATASOURCE_URL=jdbc:postgresql://<rds-endpoint>:5432/candleora`
- `JWT_SECRET=<long-random-secret>`

Do not commit `.env.production`.

## 3. Bootstrap the EC2 host

Run these commands on a fresh Ubuntu EC2 instance:

```bash
sudo apt update
sudo apt install -y ca-certificates curl gnupg nginx certbot python3-certbot-nginx
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker "$USER"
newgrp docker
mkdir -p /opt/candleora
mkdir -p /var/www/certbot
```

## 4. Deploy the backend on EC2

Copy the repo or the GitHub Actions deployment bundle to `/opt/candleora`, then run:

```bash
cd /opt/candleora
docker compose --env-file .env.production up -d --build backend
```

Check the API health endpoint:

```bash
curl http://127.0.0.1:8080/api/health
```

If you want a temporary database on the EC2 host instead of RDS, start the bundled PostgreSQL profile:

```bash
docker compose --env-file .env.production --profile local-db up -d postgres backend
```

## 5. Optional full-stack container mode

If you want to host the frontend on the same EC2 box instead of S3 + CloudFront:

```bash
docker compose -f docker-compose.yml -f docker-compose.fullstack.yml --env-file .env.production up -d --build
```

That starts:

- backend on `127.0.0.1:8080`
- frontend on `127.0.0.1:3000`

To expose the frontend publicly from the same EC2 box, install the sample site config:

```bash
sudo cp deploy/nginx/www.candleora.conf /etc/nginx/sites-available/www.candleora.conf
sudo ln -s /etc/nginx/sites-available/www.candleora.conf /etc/nginx/sites-enabled/www.candleora.conf
sudo nginx -t
sudo systemctl reload nginx
```

Update `your-domain.com` in the config first, then issue a certificate:

```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

## 6. Configure Nginx and SSL for the API

Install the Nginx config:

```bash
sudo cp deploy/nginx/api.candleora.conf /etc/nginx/sites-available/api.candleora.conf
sudo ln -s /etc/nginx/sites-available/api.candleora.conf /etc/nginx/sites-enabled/api.candleora.conf
sudo nginx -t
sudo systemctl reload nginx
```

Update `api.your-domain.com` in the config file before enabling it.

Point your DNS `A` record for `api.your-domain.com` to the EC2 public IP, then issue the certificate:

```bash
sudo certbot --nginx -d api.your-domain.com
```

After SSL is issued, the public health check should work:

```bash
curl https://api.your-domain.com/api/health
```

## 7. Deploy the frontend to S3 + CloudFront

Build the Vite app with the production API URL:

```bash
cd frontend
npm ci
VITE_API_BASE_URL=https://api.your-domain.com/api npm run build
```

Sync the output to S3:

```bash
aws s3 sync dist s3://your-frontend-bucket --delete
```

Invalidate CloudFront so the new bundle is served immediately:

```bash
aws cloudfront create-invalidation --distribution-id <distribution-id> --paths "/*"
```

Recommended bucket setup:

- Keep the S3 bucket private.
- Use CloudFront Origin Access Control.
- Attach an ACM certificate in `us-east-1` to the CloudFront distribution.
- Point `your-domain.com` and `www.your-domain.com` to CloudFront.
- Configure CloudFront SPA fallback so deep links like `/admin` and `/admin/orders` resolve correctly:
  - `403` -> `/index.html` with HTTP `200`
  - `404` -> `/index.html` with HTTP `200`

## 8. GitHub Actions secrets

The workflow at [deploy.yml](../.github/workflows/deploy.yml) expects these secrets:

- `EC2_HOST`
- `EC2_USERNAME`
- `EC2_SSH_KEY`
- `EC2_DEPLOY_PATH`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`
- `AWS_S3_BUCKET`
- `AWS_CLOUDFRONT_DISTRIBUTION_ID`
- `VITE_API_BASE_URL`
- `VITE_GOOGLE_CLIENT_ID`
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_ENABLE_PHONE_AUTH`
- `VITE_REQUIRE_PHONE_VERIFICATION_BEFORE_ORDER`
- `VITE_PHONEPE_ENABLED`
- `VITE_SAMPLE_COUPON_CODE`
- `VITE_SAMPLE_COUPON_HINT`

The workflow builds the frontend, packages the backend deployment bundle, uploads the frontend build to S3, invalidates CloudFront, copies the deployment bundle to EC2, and restarts the backend container.

## 9. Production checks

Run these after deploy:

1. `curl https://api.your-domain.com/api/health`
2. Load the storefront on CloudFront.
3. Log in with a seeded or real account.
4. Create a test order.
5. Confirm invoice generation and email flow still work with production env vars.

## 10. Rollback

Rollback on EC2 is straightforward:

1. Restore the last known-good deployment bundle in `/opt/candleora`.
2. Restore the previous `.env.production` if the issue is config-related.
3. Restart with `docker compose --env-file .env.production up -d --build backend`.

For frontend issues, re-sync the previous `dist/` build to S3 and invalidate CloudFront again.
