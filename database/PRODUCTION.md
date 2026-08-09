# Production Database With Neon

StudyFlow uses Neon Postgres for the recommended Vercel production setup. Runtime requests use a pooled connection, while migration jobs use a direct connection.

## 1. Create Neon Environments

Create separate Neon branches or projects for `preview` and `production`. Do not point preview deployments at production data.

From the Neon **Connect** dialog, copy both connection strings:

```text
DATABASE_URL=postgresql://USER:PASSWORD@ep-example-pooler.REGION.aws.neon.tech/studyflow?sslmode=require
DIRECT_URL=postgresql://USER:PASSWORD@ep-example.REGION.aws.neon.tech/studyflow?sslmode=require
```

The pooled hostname contains `-pooler`; the direct hostname does not. Add both secrets to the backend Vercel project and to the matching GitHub `preview`/`production` Environment. Never expose them as `VITE_*` variables.

If the Neon Vercel integration creates `DATABASE_URL_UNPOOLED`, copy that value to StudyFlow's `DIRECT_URL`; keep the pooled integration value as `DATABASE_URL`.

## 2. Verify Connections

Install dependencies without Docker and check both URLs:

```powershell
cd database
npm ci
$env:DATABASE_URL="<Neon pooled URL>"
$env:DIRECT_URL="<Neon direct URL>"
npm run db:check:connection
```

The command prints only host, database and role; it never prints passwords or complete URLs.

## 3. Migration Commands

Create migrations only against a local development database:

```powershell
cd database
npm run db:migrate -- --name describe_the_change
```

Apply committed migrations to preview or production without Docker:

```powershell
cd database
$env:DATABASE_URL="<Neon pooled URL>"
$env:DIRECT_URL="<Neon direct URL>"
npm run db:migrate:status
npm run db:migrate:deploy
```

Never run `prisma migrate dev`, `prisma migrate reset` or `prisma db push` against production. Migration is not executed from `api/index.ts`, a serverless request, or the Vercel build command.

## 4. Release Workflow

StudyFlow chooses **migration before backend promotion**:

1. Configure GitHub Environments named `preview` and `production` with `DATABASE_URL` and `DIRECT_URL` secrets.
2. Add required reviewers to the `production` Environment.
3. Run the **Database Migration** workflow manually.
4. For production, enter `MIGRATE_PRODUCTION` and approve the Environment gate.
5. Deploy or promote the backend only after the migration workflow succeeds.

The workflow checks both connections and runs only `prisma migrate deploy`. `prisma.config.ts` directs Prisma CLI migrations through `DIRECT_URL`; it never seeds data.

## 5. Protected Seed

Local development remains simple:

```powershell
npm run db:seed
```

Remote demo or staging databases require explicit opt-in:

```powershell
$env:SEED_TARGET="demo"
$env:ALLOW_REMOTE_SEED="true"
npm run db:seed
```

Production additionally requires a second flag and an exact confirmation:

```powershell
$env:SEED_TARGET="production"
$env:ALLOW_REMOTE_SEED="true"
$env:ALLOW_PRODUCTION_SEED="true"
$env:SEED_CONFIRM="SEED_STUDYFLOW_PRODUCTION"
npm run db:seed
```

Production seed is never part of CI or deployment. The sample accounts use known passwords, so production seeding should normally remain disabled.
