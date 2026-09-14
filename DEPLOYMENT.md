# Production deployment — mentimentor.com

Single-VM stack for Ubuntu 24.04 LTS using Docker Engine + Docker Compose.

```text
Internet
   |
   | HTTPS :443 / HTTP :80
   v
 Nginx (public)
   |------ React/Vite SPA (frontend container)
   |
   |------ /api/*  ->  Spring Boot (backend)
                         |
                         |--> PostgreSQL (private)
                         |
                         |--> Redis (private)
```

This guide prepares and runs the stack. It does **not** configure DNS or cloud providers for you.

---

## Prerequisites (Ubuntu VM)

- Ubuntu 24.04 LTS
- Docker Engine + Docker Compose plugin
- DNS A/AAAA records for `mentimentor.com` (and optionally `www`) pointing at the VM
- Open firewall ports **80** and **443** only (do not expose 5432, 6379, or 8080)

Recommended VM size for this compose file: **2 vCPU / 4 GB RAM / 40 GB NVMe**.

---

## Ports

| Port | Published on host? | Service | Purpose |
|------|--------------------|---------|---------|
| 80 | Yes | nginx | HTTP (and later ACME / redirect) |
| 443 | Yes | nginx | HTTPS (enable after real certificates exist) |
| 8080 | No | backend | Spring Boot (Compose network only) |
| 5432 | No | postgres | PostgreSQL (Compose network only) |
| 6379 | No | redis | Redis (Compose network only) |

PostgreSQL and Redis are on an **internal** Docker network and are not reachable from the internet or from the edge Nginx container.

---

## How Nginx routes traffic

Config file: `deploy/nginx/default.conf`

| Browser path | Upstream |
|--------------|----------|
| `/api/...` | `backend:8080/...` (the `/api` prefix is stripped) |
| `/healthz` | `backend:8080/actuator/health` |
| everything else | `frontend:80` (SPA; client-side routes fall back to `index.html` inside the frontend Nginx) |

The SPA is built with `VITE_API_BASE_URL=/api`, so the browser calls same-origin `/api/...` and never needs a hardcoded backend public port.

HTTPS / Let's Encrypt is intentionally **commented** in the Nginx config. Add real certificates later; do not create fake ones.

---

## Environment variables

1. Copy the template and edit secrets:

```bash
cp .env.example .env
nano .env   # or vim / your editor
```

2. Required production values (at minimum):

| Variable | Purpose |
|----------|---------|
| `POSTGRES_PASSWORD` | PostgreSQL superuser password |
| `DB_PASSWORD` | Spring datasource password (**must match** `POSTGRES_PASSWORD`) |
| `JWT_SECRET` | Strong random secret (≥ 32 characters) |
| `GOOGLE_CLIENT_ID` | Google OAuth Web client ID (backend) |
| `VITE_GOOGLE_CLIENT_ID` | Same ID (baked into the frontend build) |

3. Important optional values: Twilio (`TWILIO_*`), admin bootstrap (`ADMIN_*`), `CORS_ALLOWED_ORIGINS`, `OTP_LOG_CODE` (keep `false` in real production).

See `.env.example` for the full list. **Never commit `.env`.**

---

## Database initialization / migrations

This project does **not** use Flyway or Liquibase.

- Schema is managed by **Hibernate** with `spring.jpa.hibernate.ddl-auto=update` (see `src/main/resources/application.yml`).
- On first start against an empty Postgres volume, Hibernate creates/updates tables automatically.
- `Repo_detail.sql` is a reference dump only; it is **not** applied by Compose.

Production note: `ddl-auto=update` is convenient for early production but is not a substitute for versioned migrations. Plan a Flyway/Liquibase adoption before complex schema changes. Do **not** switch to `create`/`create-drop` in production — that would wipe data.

Redis stores OTP / availability data. Compose enables AOF persistence (`redis_data` volume). Losing Redis does not wipe Postgres, but in-flight OTPs may be lost.

---

## Local development vs production Compose

| Goal | Command |
|------|---------|
| Local Postgres + Redis with host ports (API run via Maven on the host) | `docker compose -f docker-compose.dev.yml up -d` then `./mvnw spring-boot:run -Dspring-boot.run.profiles=docker` |
| Full production stack | `docker compose up -d` (uses root `docker-compose.yml`) |

Do not run both stacks on the same host without adjusting ports/resources.

---

## Build and start (production)

```bash
git clone <your-repo-url> mentimentor
cd mentimentor

cp .env.example .env
# Edit .env with real secrets before continuing

docker compose build
docker compose up -d
```

First backend start can take a minute while Hibernate updates the schema and dependencies become healthy.

---

## Stop / restart

```bash
# Stop containers (keeps named volumes / data)
docker compose stop

# Start again
docker compose start

# Full recreate from current images
docker compose up -d

# Tear down containers and networks (volumes retained unless -v is used)
docker compose down

# DANGEROUS: also deletes Postgres/Redis data volumes
# docker compose down -v
```

---

## Logs

```bash
docker compose logs -f
docker compose logs -f backend
docker compose logs -f nginx
docker compose logs -f postgres
docker compose logs -f redis
docker compose logs -f frontend
```

---

## Health checks

```bash
docker compose ps
docker compose exec backend curl -fsS http://127.0.0.1:8080/actuator/health
curl -fsS http://127.0.0.1/healthz
curl -fsS -o /dev/null -w "%{http_code}\n" http://127.0.0.1/
```

Expected: backend / `healthz` returns JSON with status `UP`; `/` returns HTTP 200 (SPA).

---

## Update after pulling new code

```bash
cd mentimentor
git pull

# If .env.example gained new keys, merge them into your .env manually
docker compose build
docker compose up -d
```

Frontend env such as `VITE_GOOGLE_CLIENT_ID` / `VITE_API_BASE_URL` is applied at **image build** time. Changing those in `.env` requires `docker compose build frontend` (or a full rebuild).

---

## Database backup considerations

Postgres data lives in the named volume `postgres_data`.

Logical backup example:

```bash
docker compose exec -T postgres \
  pg_dump -U "$DB_USERNAME" "$POSTGRES_DB" > backup-$(date +%F).sql
```

Restore example (destructive to existing objects as applicable — review before use):

```bash
cat backup-YYYY-MM-DD.sql | docker compose exec -T postgres \
  psql -U "$DB_USERNAME" -d "$POSTGRES_DB"
```

Also back up Redis if you rely on persisted OTP/availability keys (`redis_data` volume), understanding Redis is not the system of record for bookings/users.

Keep backups **off-box**. Never commit dump files that may contain PII.

---

## Enabling HTTPS later

1. Obtain certificates (e.g. Certbot) for `mentimentor.com`.
2. Mount the certificate paths into the `nginx` service.
3. Uncomment/adjust the HTTPS `server { ... }` block in `deploy/nginx/default.conf`.
4. Optionally enable HTTP→HTTPS redirect.
5. Reload Nginx: `docker compose exec nginx nginx -s reload` (or recreate the nginx service).

Do not generate self-signed certificates for public production unless you fully understand the trust implications.

---

## Google OAuth checklist

In Google Cloud Console, authorized JavaScript origins should include your public site URLs, for example:

- `https://mentimentor.com`
- `https://www.mentimentor.com`

`GOOGLE_CLIENT_ID` and `VITE_GOOGLE_CLIENT_ID` must be the same Web client ID.

---

## Security checklist (quick)

- [ ] `.env` exists only on the server and is gitignored
- [ ] `JWT_SECRET` is unique and strong
- [ ] `OTP_LOG_CODE=false` in production
- [ ] Postgres/Redis host ports are **not** published
- [ ] Only 80/443 are open on the VM firewall
- [ ] Admin bootstrap passwords are strong (or unset after first login)
- [ ] Twilio credentials are set only if SMS OTP is required
