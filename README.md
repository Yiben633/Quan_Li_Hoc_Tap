# StudyFlow

StudyFlow là ứng dụng tổ chức việc học và phát triển kỹ năng cho nhiều độ tuổi, không giới hạn ở sinh viên. Dự án gồm React frontend, Express backend, PostgreSQL, Redis và Prisma.

## Cấu trúc

- `frontend/`: React 18, TypeScript, Vite, React Query, PWA.
- `backend/`: Express, TypeScript, Prisma, Redis và REST API.
- `database/`: Prisma schema, migrations, seed, backup/restore.
- `docs/`: blueprint và prompt triển khai từng giai đoạn.

## Chạy toàn stack bằng Docker

Yêu cầu Docker Desktop đang chạy.

```powershell
Copy-Item .env.example .env
docker compose up -d db redis
docker compose build backend frontend
docker compose run --rm backend npm run prisma:migrate
docker compose up -d backend frontend
docker compose ps
```

- Frontend: `http://localhost:3000`
- Backend health: `http://localhost:4000/health`
- PostgreSQL: `localhost:55432`
- Redis: `localhost:6379`

Chỉ chạy hạ tầng dữ liệu:

```powershell
docker compose up -d db redis
```

## Chạy local

Yêu cầu Node.js 20+, PostgreSQL 16 và Redis 7. Tạo `.env` từ các file `.env.example`; không commit secret thật.

```powershell
cd database
npm install
npm run db:migrate
npm run db:seed

cd ..\backend
npm install
npm run dev

cd ..\frontend
npm install
npm run dev
```

## Kiểm tra trước khi bàn giao

```powershell
cd backend
npm run lint
npm test
npm run build

cd ..\frontend
npm run lint
npm run test
npm run build
```

## Vercel

Hướng dẫn đầy đủ cho local, Preview, Production, migration và hai phương án backend nằm tại [docs/deployment.md](docs/deployment.md).

Nên tạo hai Vercel project trong cùng repository:

### Frontend

- Root Directory: `frontend`
- Build Command: `npm run build`
- Output Directory: `dist`
- Env: `VITE_API_URL`, `VITE_APP_NAME`, `VITE_VERCEL_ENV`

### Backend

- Root Directory: `backend`
- Khai báo `DATABASE_URL`, `DIRECT_URL`, `REDIS_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `FRONTEND_URL`, `CRON_SECRET`.
- Không chạy migration trong serverless request. Chạy Prisma migration qua GitHub Actions, CLI hoặc migration job riêng trước deployment.

Frontend và backend có thể nằm trên hai domain Vercel khác nhau; `FRONTEND_URL` và CORS backend phải trỏ đúng production/preview domain được phép.

Repository dùng Vercel Git Integration: pull request/branch tạo Preview Deployment, còn merge vào `main` tạo Production Deployment. GitHub Actions tại `.github/workflows/ci.yml` kiểm tra frontend lint/test/build, backend lint/test/build và Prisma schema trước khi merge. Bật branch protection cho `main` và không lưu Vercel/database secret trong workflow CI.

## Quyền riêng tư

Thông tin trường, chuyên ngành, năm học và nhóm tuổi là tùy chọn. Tính năng cốt lõi không yêu cầu dữ liệu trẻ em quá mức cần thiết; nhóm chia sẻ không công khai email hoặc dữ liệu hồ sơ nhạy cảm.

Xem thêm [docs/deployment.md](docs/deployment.md), [docs/production-checklist.md](docs/production-checklist.md), [frontend/README.md](frontend/README.md), [database/README.md](database/README.md), [database/PRODUCTION.md](database/PRODUCTION.md) và [README-security.md](README-security.md).
