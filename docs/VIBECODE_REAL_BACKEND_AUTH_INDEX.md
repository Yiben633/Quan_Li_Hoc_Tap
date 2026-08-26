# Vibecode - Real Backend And Persistent Auth

## Agreed guardrails

- Preserve the current Express, Prisma, React Query, and route architecture.
- Make narrow, reversible changes only after auditing the affected contract.
- Production UI and API responses must use owned database records. Test fixtures,
  demo values, and mock providers stay isolated to test/development paths.
- Authentication persistence uses an httpOnly refresh cookie. Access tokens stay
  in memory and are refreshed at application bootstrap; they are not persisted
  in localStorage or sessionStorage.
- Each prompt has a focused verification checklist before the next prompt starts.

## Audit snapshot - 2026-08-26

1. The Vercel deployment at commit `6d25a5b` fails while running the backend
   build because `backend/node_modules/prisma/build/index.js` is unavailable.
   The Prisma CLI is currently a dev dependency although `prisma generate` is
   part of the production build.
2. The backend data services use Prisma ownership queries. The remaining mock
   implementations are intentionally scoped to development/test behavior:
   password-reset email, notification channels, and the selectable AI provider.
   Production must not silently return mock AI content.
3. The frontend writes access tokens and user records to web storage. A page
   reload therefore bypasses the refresh-cookie flow and protected routes can
   redirect before a refresh request is made.
4. The backend already stores refresh tokens as hashes and rotates them. Login
   and refresh set an httpOnly cookie and a readable CSRF cookie, so the secure
   persistence contract can be completed without changing the database schema.

## Prompt order

- [Prompt 00 - Deploy baseline](VIBECODE_00_DEPLOY_BASELINE.md)
- Prompt 01 - Real-data boundary and production mock policy
- Prompt 02 - Persistent auth bootstrap and remember-me behavior
- Prompt 03 - Verification, observability, and production smoke tests

Later prompts are created only after the previous checklist passes.
