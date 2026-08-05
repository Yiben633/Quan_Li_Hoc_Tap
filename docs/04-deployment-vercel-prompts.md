# PROMPT VIBECODE - DEPLOYMENT / VERCEL LAYER

Hệ thống: **Quản lý và lập kế hoạch học tập cho sinh viên**  
Mục tiêu: chuẩn bị dự án chạy local bằng Docker nhưng deploy production/preview bằng Vercel.

## Có Kết Nối Với Vercel Được Không?

Có. Cách khuyến nghị:
- Frontend React/Vite deploy lên Vercel.
- Database không chạy bằng Docker trên Vercel; dùng PostgreSQL cloud như Neon, Supabase hoặc dịch vụ Postgres tương thích.
- Redis không chạy container trên Vercel; dùng Upstash Redis hoặc Redis cloud.
- Backend Express có thể deploy lên Vercel Functions cho MVP/API thông thường, nhưng nếu cần WebSocket dài hạn, worker chạy nền nặng, xử lý file lớn hoặc queue phức tạp thì nên deploy backend riêng.

Chiến lược tốt cho dự án này:
- Local/dev: Docker Compose.
- Preview: Vercel frontend + Vercel Functions backend hoặc backend cloud riêng.
- Production: Vercel frontend, PostgreSQL cloud, Redis cloud, storage cloud.

## PROMPT 0 - Chuẩn Hóa Monorepo Cho Vercel

```text
Rà soát cấu trúc dự án để sẵn sàng deploy Vercel.

Yêu cầu:
- Nếu monorepo gồm `frontend/`, `backend/`, `database/`, hãy tạo tài liệu `docs/deployment.md` giải thích:
  - Local chạy bằng Docker Compose.
  - Frontend deploy Vercel với root directory `frontend`.
  - Backend có 2 lựa chọn: Vercel Functions hoặc deploy service riêng.
- Thêm `.env.example` ở root và từng package nếu cần.
- Thêm `.gitignore` chuẩn: node_modules, dist, build, .env*, .vercel, uploads local, backups.
- Thêm checklist deploy preview và production.

Checklist:
- Người mới clone repo biết chạy local và deploy Vercel từ README.
- Không commit `.vercel` hoặc secret thật.
```

## PROMPT 1 - Frontend Vercel Config

```text
Chuẩn bị frontend React/Vite để deploy Vercel.

Yêu cầu:
- Trong `frontend/`, đảm bảo:
  - `package.json` có script `build`, `preview`, `lint`.
  - `vite.config.ts` đọc env Vite đúng cách.
  - API base URL lấy từ `import.meta.env.VITE_API_URL`.
- Tạo `frontend/vercel.json` nếu cần rewrite SPA:
  {
    "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
  }
- Ghi vào README:
  - Framework preset: Vite.
  - Build command: `npm run build`.
  - Output directory: `dist`.
  - Env Preview/Production: VITE_API_URL, VITE_APP_NAME.

Checklist:
- `npm run build` tạo thư mục `dist`.
- Refresh trực tiếp route như `/dashboard` không 404 trên Vercel.
```

## PROMPT 2 - Backend Express Trên Vercel Functions

```text
Chuẩn bị backend Express để có thể deploy lên Vercel Functions.

Yêu cầu:
- Tách app khỏi server listen:
  - `src/app.ts`: tạo và export Express app.
  - `src/server.ts`: import app và `app.listen()` cho local/Docker.
  - `api/index.ts`: export default app hoặc handler tương thích Vercel.
- Không khởi động job nền trực tiếp khi import app trong môi trường Vercel.
- Tạo `backend/vercel.json`:
  - Build/route đến `api/index.ts`.
  - Cấu hình function runtime Node.js nếu cần.
- Health check `/api/health` phải hoạt động trên Vercel.
- Prisma Client phải dùng connection pooling phù hợp cloud database.

Lưu ý:
- Không chạy `prisma migrate dev` trong serverless function.
- Không lưu file upload vào filesystem local trong production Vercel; dùng S3/Cloudinary/MinIO cloud.
- Cron dùng endpoint HTTP riêng, không dựa vào process chạy nền.

Checklist:
- Local vẫn chạy bằng `npm run dev`.
- Docker vẫn chạy bằng `src/server.ts`.
- Vercel deploy gọi được `/api/health`.
```

## PROMPT 3 - Database Cloud Và Prisma Migration

```text
Chuẩn bị database production.

Yêu cầu:
- Chọn PostgreSQL cloud: Neon, Supabase hoặc dịch vụ Postgres tương thích.
- Cấu hình env:
  - DATABASE_URL: URL có pooling dùng cho runtime.
  - DIRECT_URL: URL direct dùng cho migration nếu provider yêu cầu.
- Cập nhật Prisma schema nếu cần:
  datasource db {
    provider = "postgresql"
    url      = env("DATABASE_URL")
    directUrl = env("DIRECT_URL")
  }
- Thêm script:
  - `db:migrate:deploy`: `prisma migrate deploy`.
  - `db:seed`: seed dữ liệu mẫu dev/demo, không tự chạy trên production nếu chưa xác nhận.
- Viết hướng dẫn migration:
  - Local: `prisma migrate dev`.
  - Production: `prisma migrate deploy`.
  - CI: chạy migration trước hoặc sau deploy theo quy trình đã chọn.

Checklist:
- Kết nối cloud DB thành công.
- Migration production không phụ thuộc Docker.
- Seed production được bảo vệ bằng xác nhận hoặc flag rõ ràng.
```

## PROMPT 4 - Redis, Cron Và Background Jobs Trên Vercel

```text
Chuẩn bị Redis và cron cho production.

Yêu cầu:
- Dùng Redis cloud hoặc Upstash cho OTP, rate limit, timer state, notification dedupe.
- Tạo env:
  - REDIS_URL hoặc UPSTASH_REDIS_REST_URL.
  - UPSTASH_REDIS_REST_TOKEN nếu dùng REST client.
  - CRON_SECRET.
- Tách cron logic:
  - `src/jobs/notificationJob.ts` chứa business logic.
  - Local gọi bằng node-cron từ `src/server.ts`.
  - Vercel gọi qua endpoint `GET /api/cron/notifications`.
- Endpoint cron kiểm tra:
  - Header Authorization Bearer CRON_SECRET hoặc query secret.
  - User-Agent cron nếu muốn log.
- Tạo `vercel.json` cron:
  {
    "crons": [
      { "path": "/api/cron/notifications", "schedule": "*/5 * * * *" }
    ]
  }

Checklist:
- Local cron chạy được.
- Vercel cron gọi endpoint được.
- Không tạo notification trùng.
```

## PROMPT 5 - GitHub Và Vercel Preview Workflow

```text
Thiết lập workflow deploy qua GitHub.

Yêu cầu:
- Repo GitHub là nguồn chính.
- Vercel import repo và bật preview deployment cho pull request.
- Nếu monorepo:
  - Project frontend chọn root `frontend`.
  - Project backend chọn root `backend` nếu deploy backend bằng Vercel.
  - Hoặc chỉ tạo frontend project và trỏ VITE_API_URL đến backend cloud riêng.
- Thêm GitHub Actions:
  - Lint frontend/backend.
  - Test backend.
  - Build frontend.
  - Prisma validate.
- Không đưa secret vào GitHub repo; khai báo trong Vercel Project Settings hoặc GitHub Secrets.

Checklist:
- Push lên branch tạo preview URL.
- Merge main tạo production deployment.
- Preview dùng database/staging env riêng nếu có.
```

## PROMPT 6 - Production Readiness Checklist

```text
Viết `docs/production-checklist.md`.

Nội dung cần có:
- Domain và HTTPS.
- FRONTEND_URL/CORS đúng production domain.
- JWT_SECRET, REFRESH_TOKEN_SECRET, CRON_SECRET đủ mạnh.
- Database backup bật.
- Migration deploy có quy trình rollback.
- Upload dùng cloud storage.
- Rate limit bật.
- Error logging có requestId.
- Không log password/token/API key.
- Vercel env tách Preview và Production.
- Smoke test sau deploy:
  - Mở trang login.
  - Register/login.
  - Tạo semester/subject/task.
  - Dashboard load dữ liệu.
  - Cron endpoint được bảo vệ.

Checklist:
- Có thể demo dự án từ URL Vercel production.
- Có thể reset hoặc seed môi trường demo khi cần.
```

