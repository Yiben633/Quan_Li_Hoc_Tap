# StudyFlow Backend

Backend TypeScript/Express của hệ thống quản lý học tập. Express app được dùng chung cho local, Docker và Vercel Functions.

## Local

```bash
cd backend
cp .env.example .env
npm install
npm run prisma:generate
npm run dev
```

Khởi động hạ tầng trước bằng `docker compose up -d db redis` từ thư mục gốc. Kiểm tra `http://localhost:4000/health`; response healthy có dạng `{ success, message, data }`.

Các biến `JWT_ACCESS_SECRET` và `JWT_REFRESH_SECRET` phải là chuỗi đủ dài khi chạy thật. Không commit `.env`.

## Test và build

```bash
npm test
npm run build
npm start
```

## Docker

Từ thư mục gốc:

```bash
docker compose up -d backend
```

Service backend dùng multi-stage Dockerfile, chờ database/Redis healthy rồi chạy server cổng `4000`.

## Vercel

Đặt Vercel Project Root Directory là `backend`. `backend/vercel.json` dùng `api/index.ts` làm Function entrypoint; file này export cùng Express app với server local. Khai báo `DATABASE_URL`, `REDIS_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `CLIENT_ORIGIN` trong Vercel Environment Variables. Vercel không chạy process nền dài hạn, nên cron/queue sẽ được triển khai bằng endpoint ở các prompt sau.
