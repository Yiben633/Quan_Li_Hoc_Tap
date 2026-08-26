# PROMPT 00 - Vercel Backend Build Baseline

## Goal

Restore a deployable backend function without redesigning the backend or changing
database contracts.

## Files in scope

- `backend/package.json`
- `backend/package-lock.json`
- `backend/scripts/generate-client.mjs`
- `vercel.json`
- `backend/src/package.json`

## Prompt

```text
Audit the Vercel Services backend build at the current commit.

The backend runs `prisma generate` during its production build. Ensure the
Prisma CLI is installed in the backend service build environment, including
when Vercel omits dev dependencies. Do not add a migration to server startup.

Keep the existing ESM Express application and the Vercel Services route. Do
not rewrite routes, controllers, or Prisma models.

Verify locally:
- npm run build from backend/
- generated Prisma client is resolved by backend TypeScript
- no secret is written to source control

Verify after deploy:
- deployment builds successfully
- GET /api/health invokes the backend instead of failing before application
  middleware executes
```

## Acceptance checklist

- [ ] Vercel backend build no longer reports a missing Prisma CLI.
- [ ] Vercel creates a callable backend function.
- [ ] `/api/health` returns a JSON envelope (200 or 503 service-health result),
      never `FUNCTION_INVOCATION_FAILED` from module loading.
- [ ] Local backend build still passes.
