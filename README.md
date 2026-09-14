# Mentor Marketplace - Spring Boot Skeleton

Spring Boot backend scaffold for a mentor marketplace platform.

## Tech Stack

- Spring Boot
- PostgreSQL
- Redis
- JWT-ready security configuration

## Architecture

- Layered module structure: `controller`, `service`, `repository`
- Base package: `com.mentormarketplace`
- Global REST exception handling
- Centralized logging configuration

## Run Locally

1. Set environment variables as needed (see `.env.example`):
   - `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`
   - `REDIS_HOST`, `REDIS_PORT`
   - `JWT_SECRET`, `JWT_ISSUER`
2. Optional local Postgres + Redis (published host ports):

```bash
docker compose -f docker-compose.dev.yml up -d
./mvnw spring-boot:run -Dspring-boot.run.profiles=docker
```

3. Or start the API against a local Postgres on `5432`:

```bash
./mvnw spring-boot:run
```

Frontend (Vite): see `mentor-marketplace-web/`.

## Production deployment

Full stack (Nginx + frontend + backend + Postgres + Redis) is documented in [DEPLOYMENT.md](DEPLOYMENT.md).
