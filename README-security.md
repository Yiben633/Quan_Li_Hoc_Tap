# StudyFlow Security Checklist

## Runtime

- [x] Helmet and credentialed CORS restricted to `FRONTEND_URL`/`CLIENT_ORIGIN`.
- [x] Global rate limit and stricter auth/AI rate limits use a shared Redis store in multi-instance deployments.
- [x] Refresh cookie is `httpOnly`, `secure` in production, `sameSite=lax`, and protected by a CSRF double-submit token.
- [x] JSON, URL-encoded, document and avatar upload limits are enforced.
- [x] Zod validates request bodies and queries; rich text Notes are sanitized server-side.
- [x] Database access uses Prisma parameters; no user-controlled SQL string concatenation.
- [x] Ownership checks protect user data and admin routes require `authorize('admin')`.
- [x] Sensitive auth, user, file, AI and admin actions write ActivityLog entries.

## Secrets

Never commit `.env`. Configure `DATABASE_URL`, optional `DIRECT_URL`, `REDIS_URL`, `JWT_SECRET`, `REFRESH_TOKEN_SECRET`, `FRONTEND_URL`, `CRON_SECRET`, `DOCUMENT_MAX_UPLOAD_BYTES`, and `AI_PROVIDER` in the deployment environment. `JWT_ACCESS_SECRET`/`JWT_REFRESH_SECRET` and `CLIENT_ORIGIN` remain supported compatibility names. Vercel may additionally use `DIRECT_URL` for migration tooling; the application does not run migrations during a serverless request.

## Deployment

- Run migrations from GitHub Actions, a release job, or manually with Prisma CLI.
- Keep Vercel Cron protected with `CRON_SECRET`; local long-running mode uses `node-cron`. Notification jobs use a Redis distributed lock and per-entity dedupe key.
- Use S3-compatible storage for production uploads. Local filesystem uploads are ephemeral on Vercel.
- Review dependency audit output and rotate secrets after incidents.
