# Triển khai StudyFlow

Tài liệu này mô tả cách chạy monorepo ở local và hai phương án triển khai backend. Không đưa PostgreSQL, Redis hoặc file upload local vào Vercel frontend.

Trước mỗi lần phát hành production, hoàn thành và lưu bằng chứng theo [`production-checklist.md`](production-checklist.md).

## Kiến trúc triển khai

| Thành phần  | Local                      | Preview/Production khuyến nghị                       |
| ----------- | -------------------------- | ---------------------------------------------------- |
| `frontend/` | Vite hoặc Docker/Nginx     | Vercel Services hoặc project Vite riêng              |
| `backend/`  | Express trong Docker       | Vercel Services/Functions hoặc dịch vụ Node riêng    |
| `database/` | PostgreSQL 16 trong Docker | PostgreSQL cloud có pooling                          |
| Redis       | Redis 7 trong Docker       | Redis cloud, ưu tiên kết nối TLS                     |
| Upload      | `backend/uploads/`         | Object storage; không dùng filesystem tạm của Vercel |

Phương án khuyến nghị là một Vercel project dùng preset **Services** và root [`vercel.json`](../vercel.json), để frontend/API có chung domain. Nếu tài khoản chưa dùng Services, tạo hai Vercel project độc lập với Root Directory lần lượt là `frontend` và `backend`.

## Chạy local bằng Docker Compose

Yêu cầu: Git, Docker Desktop và Docker Compose v2.

```powershell
git clone https://github.com/Yiben633/Quan_Li_Hoc_Tap.git
cd Quan_Li_Hoc_Tap
Copy-Item .env.example .env
```

Thay toàn bộ giá trị `change_me` và `replace_with` trong `.env`, đặc biệt là mật khẩu PostgreSQL/Redis, hai JWT secret và `CRON_SECRET`.

Khởi tạo hạ tầng, build ứng dụng và chạy migration:

```powershell
docker compose up -d db redis
docker compose build backend frontend
docker compose run --rm backend npm run prisma:migrate
docker compose up -d backend frontend
docker compose ps
```

Địa chỉ local:

- Frontend Docker: `http://localhost:3000`
- Backend health: `http://localhost:4000/health`
- PostgreSQL: `localhost:55432`
- Redis: `localhost:6379`
- pgAdmin tùy chọn: `docker compose --profile tools up -d pgadmin`, sau đó mở `http://localhost:5050`

Xem log khi một service chưa healthy:

```powershell
docker compose logs --tail 100 db redis backend frontend
```

Không dùng `docker compose down -v` trừ khi chủ động muốn xóa dữ liệu PostgreSQL, Redis và pgAdmin local.

## Phân chia file môi trường

- `/.env.example`: Docker Compose và toàn stack local.
- `/frontend/.env.example`: Vite chạy riêng hoặc biến public trên Vercel frontend.
- `/backend/.env.example`: Express chạy riêng hoặc biến secret trên backend host.
- `/database/.env.example`: Prisma CLI, migration và backup/restore.

Chỉ các biến bắt đầu bằng `VITE_` mới được đưa vào bundle trình duyệt. Không đặt password, token, database URL hoặc API key bí mật trong biến `VITE_*`.

## Cấp quyền quản trị ban đầu

`ADMIN_BOOTSTRAP_EMAIL` là secret chỉ dành cho backend và chỉ dùng trong thao tác cấp quyền quản trị có chủ đích. Ứng dụng không cấp quyền theo email ở frontend hoặc trong mỗi lần đăng nhập.

Quy trình an toàn:

1. Đăng ký tài khoản cần cấp quyền qua luồng đăng ký bình thường trước.
2. Đặt `ADMIN_BOOTSTRAP_EMAIL` trong môi trường backend đang trỏ đúng database mục tiêu. Trên Vercel hoặc GitHub, lưu biến này dưới dạng **Secret** và chỉ cấp cho job thủ công đã được phê duyệt.
3. Từ thư mục `backend/`, chạy:

```powershell
npm run admin:bootstrap
```

4. Script sẽ dừng nếu tài khoản chưa tồn tại, upsert role `admin`, tạo quan hệ role theo cách idempotent và ghi `admin.bootstrap_granted` đúng một lần.
5. Xóa `ADMIN_BOOTSTRAP_EMAIL` khỏi runtime environment sau khi hoàn tất nếu không còn nhu cầu vận hành.
6. Đăng xuất rồi đăng nhập lại để access token mới nhận role `admin`. Token đã phát hành trước đó không tự đổi quyền.

Có thể chạy lại lệnh an toàn: nếu người dùng đã có role `admin`, script không tạo `UserRole` hoặc ActivityLog trùng. Không đặt email thật, database URL hay admin secret trong source, commit, issue hoặc build log. File `.env.example` chỉ để giá trị trống làm hướng dẫn.

## Deploy một project bằng Vercel Services (khuyến nghị)

Root `vercel.json` định nghĩa hai service độc lập:

- `frontend`: root `frontend/`, framework `vite`;
- `backend`: root `backend/`, framework `express`, entrypoint `api/index.ts`;
- `/api/*` được route tới backend, mọi route còn lại tới frontend;
- cron `/api/cron/notifications` được đăng ký ở cấp project.

Trong Vercel Dashboard:

1. Import repository `Yiben633/Quan_Li_Hoc_Tap` một lần.
2. Giữ Root Directory là repository root.
3. Chọn Framework Preset **Services**. Nếu không chọn preset này, Vercel sẽ không build theo khối `services`.
4. Production Branch là `main` và bật Git Preview Deployment.
5. Khai báo env riêng cho Preview/Production. Với cùng domain, dùng `VITE_API_URL=/api`.
6. Chạy migration bằng workflow **Database Migration** trước khi promote backend; không thêm migration vào Build Command.

Biến tối thiểu của project Services:

```text
VITE_API_URL=/api
VITE_APP_NAME=StudyFlow
VITE_VERCEL_ENV=preview hoặc production
NODE_ENV=production
DATABASE_URL=<pooled PostgreSQL URL>
DIRECT_URL=<direct PostgreSQL URL, migration only>
REDIS_URL=<rediss:// cloud Redis URL>
JWT_ACCESS_SECRET=<random secret>
JWT_REFRESH_SECRET=<different random secret>
FRONTEND_URL=https://<deployment-or-custom-domain>
TRUST_PROXY=true
CRON_SECRET=<random secret>
STORAGE_PROVIDER=s3-compatible
S3_REGION=<region>
S3_BUCKET=<bucket>
S3_ACCESS_KEY_ID=<access key>
S3_SECRET_ACCESS_KEY=<secret key>
S3_PUBLIC_BASE_URL=https://<cdn-or-bucket-domain>
```

`VERCEL=1` do nền tảng tự cung cấp, không khai báo thủ công. Sau deploy, kiểm tra `GET /api/health`, refresh trực tiếp `/dashboard`, login/refresh cookie và cron unauthorized trả `401`.

## Deploy bằng hai Vercel project (phương án dự phòng)

### Frontend

Tạo một Vercel project từ repository và cấu hình:

- Root Directory: `frontend`
- Framework Preset: Vite
- Install Command: `npm install`
- Build Command: `npm run build`
- Output Directory: `dist`

`frontend/vercel.json` đã có SPA rewrite để refresh trực tiếp các route như `/dashboard`, `/tasks` hoặc `/offline` không trả 404.

Biến frontend tối thiểu:

```text
VITE_API_URL=https://api.example.com/api
VITE_APP_NAME=StudyFlow
VITE_VERCEL_ENV=preview hoặc production
VITE_AI_ENABLED=true
VITE_AI_PROVIDER=mock
```

Khai báo giá trị riêng trong Vercel cho Preview và Production. `VITE_API_URL` phải có `/api` và trỏ tới backend tương ứng; không dùng backend production cho preview nếu preview có thể tạo hoặc xóa dữ liệu.

`vite.config.ts` nạp các biến public bằng `loadEnv` và dùng `VITE_APP_NAME` cho manifest PWA. API client mặc định dùng `/api`, phù hợp project Services cùng domain. Với hai project khác domain, phải khai báo `VITE_API_URL` đầy đủ trong cả Preview và Production.

### Backend Vercel Functions

AI Coach supports `POST /api/ai/coach/chat/stream` through Server-Sent Events. The Vercel Node.js runtime supports streaming, but every Function still has a plan-dependent execution limit. Draft data is only sent in the final SSE event after backend validation. The frontend falls back to `POST /api/ai/coach/chat` when streaming is unavailable before the response begins.

Tạo Vercel project thứ hai trong cùng repository:

- Root Directory: `backend`
- Entry point: `backend/api/index.ts`
- Cấu hình function/route: `backend/vercel.json`
- Health check sau deploy: `GET https://<backend-domain>/api/health` (`/health` vẫn được giữ cho Docker/local)

Biến backend tối thiểu:

```text
NODE_ENV=production
DATABASE_URL=<pooled PostgreSQL URL>
DIRECT_URL=<direct PostgreSQL URL used only by migration jobs>
REDIS_URL=<cloud Redis URL>
JWT_ACCESS_SECRET=<random secret tối thiểu 16 ký tự>
JWT_REFRESH_SECRET=<random secret tối thiểu 16 ký tự>
FRONTEND_URL=https://<frontend-domain>
TRUST_PROXY=true
CRON_SECRET=<random secret>
DOCUMENT_MAX_UPLOAD_BYTES=20971520
STORAGE_PROVIDER=s3-compatible
S3_ENDPOINT=https://<s3-compatible-endpoint>
S3_REGION=auto
S3_BUCKET=studyflow
S3_ACCESS_KEY_ID=<storage-access-key>
S3_SECRET_ACCESS_KEY=<storage-secret-key>
S3_PUBLIC_BASE_URL=https://<public-cdn-or-bucket-domain>
S3_FORCE_PATH_STYLE=false
AI_PROVIDER=mock
# For Gemini, set AI_PROVIDER=gemini and configure the following backend-only variables:
# GEMINI_API_KEY=<Google AI Studio key>
# GEMINI_MODEL=gemini-2.5-flash
```

Lưu ý bắt buộc:

- Không chạy migration trong mỗi serverless request hoặc trong `api/index.ts`.
- Chạy `prisma migrate deploy` bằng CI hoặc migration job một lần cho mỗi release.
- Không dùng `backend/uploads/` trong production Vercel vì filesystem không bền vững. Backend có adapter `s3-compatible`; startup Vercel production sẽ từ chối `STORAGE_PROVIDER=local` hoặc cấu hình S3 thiếu biến bắt buộc.
- Dùng PostgreSQL pooling và Redis cloud phù hợp serverless để tránh quá nhiều connection.
- Vercel Cron gọi HTTP endpoint đã bảo vệ bằng `CRON_SECRET`; không khởi động worker dài hạn khi import Express app.
- Kiểm tra thực tế login, refresh token và logout trên domain preview. Cookie hiện dùng `SameSite=Lax`; với frontend/backend khác site, nên dùng hai subdomain chung một domain, ví dụ `app.example.com` và `api.example.com`, hoặc hoàn thiện chính sách cookie cross-site trước khi production.

## Redis cloud, cron và background jobs

Backend dùng một Redis chung cho OTP, rate limit phân tán, trạng thái study timer, khóa notification job và khóa dedupe notification. Với Vercel, cấu hình được chọn là **Upstash Redis qua TCP/TLS bằng `ioredis`**, vì vậy chỉ cần biến `REDIS_URL`; không khai báo đồng thời REST URL/token nếu ứng dụng chưa chuyển sang `@upstash/redis`.

1. Tạo một database trên Upstash gần region chạy backend Vercel.
2. Trong Upstash Console, sao chép TCP connection string có dạng:

   ```text
   rediss://default:<password>@<database>.upstash.io:6379
   ```

3. Khai báo URL đó thành `REDIS_URL` cho Preview và Production. Dùng database riêng cho hai môi trường.
4. Tạo `CRON_SECRET` ngẫu nhiên tối thiểu 16 ký tự, khuyến nghị 32 ký tự trở lên, rồi khai báo trong Vercel backend project.

Root `vercel.json` và `backend/vercel.json` dùng lịch tương thích Vercel Hobby:

```json
{
  "crons": [
    { "path": "/api/cron/notifications", "schedule": "0 0 * * *" }
  ]
}
```

Lịch trên chạy một lần mỗi ngày lúc `00:00 UTC` (`07:00 Asia/Ho_Chi_Minh`). Vercel Hobby sẽ từ chối deployment nếu cron chạy nhiều hơn một lần/ngày. Khi project dùng Pro/Enterprise, có thể đổi thành `*/5 * * * *` để quét mỗi 5 phút; scheduler local/Docker vẫn chạy mỗi 5 phút độc lập với cấu hình Vercel.

Vercel tự gửi `Authorization: Bearer <CRON_SECRET>` khi gọi cron. Endpoint cũng nhận `x-cron-secret` và `?secret=` để debug tương thích, nhưng production nên dùng Bearer để secret không xuất hiện trong URL. Request logger chỉ ghi path, không ghi query string chứa secret.

Business logic nằm tại `backend/src/jobs/notificationJob.ts`. Job dùng Redis `SET ... NX EX` để:

- chỉ một notification scan chạy tại một thời điểm, kể cả khi nhiều Function được gọi đồng thời;
- chặn notification trùng theo user, type và related entity trong time window;
- vẫn kiểm tra database làm lớp fallback khi Redis key vừa hết TTL.

Local/Docker long-running server khởi động `node-cron` từ `src/server.ts`; import `src/app.ts` hoặc `api/index.ts` không khởi động job nền. Có thể kiểm tra endpoint local bằng PowerShell:

```powershell
$headers = @{ Authorization = "Bearer $env:CRON_SECRET" }
Invoke-RestMethod http://localhost:4000/api/cron/notifications -Headers $headers
```

Sau khi deploy, mở Vercel Project > Settings > Cron Jobs để xác nhận lịch đã được đăng ký. Log thành công có `notification_job_started` và `notification_job_completed`; request từ Vercel có User-Agent `vercel-cron/1.0` và được ghi nguồn `vercel`. Không log nội dung `CRON_SECRET`.

## Backend trên dịch vụ Node/Docker riêng

Deploy `backend/Dockerfile` lên một nền tảng chạy Node/Docker lâu dài. Phương án này phù hợp hơn khi cần worker, job chạy nền, xử lý file lớn hoặc connection lâu.

Cấu hình cần giữ:

- Container nghe cổng từ `PORT`, mặc định `4000`.
- Health check là `GET /health`.
- Các secret giống phương án Vercel Functions.
- `FRONTEND_URL` phải khớp domain frontend để CORS và cookie hoạt động.
- Chạy migration bằng release command riêng trước khi chuyển traffic.
- Backend hiện dùng `LocalStorageProvider`. Chỉ dùng local disk khi host có persistent volume và đã có backup; nếu không, phải triển khai adapter object storage trước khi bật upload production.

Sau khi backend có domain, cập nhật `VITE_API_URL` của Vercel frontend rồi redeploy frontend.

## Database, migration và backup production

Vercel không chạy container PostgreSQL/Redis của `docker-compose.yml`. StudyFlow chọn **Neon Postgres** cho production và khuyến nghị một branch/project riêng cho Preview. Hướng dẫn chi tiết nằm tại [`database/PRODUCTION.md`](../database/PRODUCTION.md).

Quy trình migration:

```powershell
cd database
Copy-Item .env.example .env
npm install
npm run db:deploy
```

Trên Neon, đặt `DATABASE_URL` thành URL pooled có hostname chứa `-pooler`; `DIRECT_URL` dùng hostname direct không có `-pooler` và chỉ dành cho Prisma migration. Không dùng direct URL cho mỗi serverless request.

Quy trình release chọn migration trước khi promote backend: chạy workflow **Database Migration**, chờ kiểm tra kết nối và `prisma migrate deploy` thành công, sau đó mới deploy/promote backend. Workflow không gọi seed và production được bảo vệ bằng GitHub Environment approval cùng chuỗi xác nhận `MIGRATE_PRODUCTION`.

Trước migration production, tạo backup và xác nhận có thể restore. Không tự động seed tài khoản mẫu vào production.

## GitHub và Vercel Preview workflow

GitHub repository là nguồn chính. Không chạy `vercel deploy` trong GitHub Actions vì frontend/backend đã được import trực tiếp bằng Vercel Git Integration; cách này để Vercel tự tạo deployment URL và trạng thái kiểm tra trên pull request.

### 1. Kết nối repository

Với Services, import repository một lần, giữ Root Directory ở root và chọn Framework Preset **Services**. Với phương án tách, import cùng repository thành các project độc lập:

| Project | Root Directory | Production Branch | Mục đích |
| --- | --- | --- | --- |
| StudyFlow Frontend | `frontend` | `main` | React/Vite SPA |
| StudyFlow Backend | `backend` | `main` | Express Vercel Functions, nếu chọn phương án Vercel |

Nếu backend nằm trên dịch vụ Node/Docker riêng, chỉ tạo project frontend và đặt `VITE_API_URL` trỏ tới API staging/production tương ứng.

Sau khi bật Git Integration:

- push lên branch khác `main` hoặc mở/cập nhật pull request sẽ tạo Preview Deployment;
- merge/push vào `main` sẽ tạo Production Deployment;
- project Services phải dùng repository root; các project tách phải chọn đúng Root Directory của package.

### 2. Tách môi trường Preview và Production

Khai báo biến trong **Vercel Project Settings > Environment Variables**, không ghi giá trị thật vào repository:

- Frontend Preview: `VITE_API_URL` trỏ tới backend staging/preview ổn định; `VITE_VERCEL_ENV=preview`.
- Frontend Production: `VITE_API_URL` trỏ tới backend production; `VITE_VERCEL_ENV=production`.
- Backend Preview: PostgreSQL branch/database staging, Redis staging, bucket staging và secret Preview riêng.
- Backend Production: PostgreSQL, Redis, bucket và secret Production riêng.

Không để frontend Preview ghi vào database production. Nếu backend Vercel tạo URL ngẫu nhiên theo từng branch, dùng một staging API/domain ổn định hoặc cấu hình biến Preview theo branch; không hard-code một deployment URL ngẫu nhiên vào source.

### 3. GitHub Actions CI

Workflow [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) chạy khi có pull request vào `main` và khi cập nhật `main`, gồm ba required checks:

- `Frontend lint, test and build`: `npm ci`, lint/typecheck, Vitest và Vite build.
- `Prisma validate`: validate schema bằng placeholder URL, không kết nối production.
- `Backend lint, test and build`: tạo PostgreSQL 16 và Redis 7 tạm thời, migrate schema, lint, test và build.

Các password trong service CI chỉ sống trong runner tạm thời và không phải credential staging/production. Workflow CI không đọc Vercel secret hoặc database cloud secret, nên vẫn chạy an toàn cho pull request không tin cậy. Chỉ workflow migration thủ công dùng GitHub Environments `preview`/`production` và các secret `DATABASE_URL`, `DIRECT_URL`.

Trong GitHub repository Settings > Branches/Rulesets, bảo vệ `main` và yêu cầu ba checks trên pass trước khi merge. Khuyến nghị thêm yêu cầu pull request review và chặn force push vào `main`.

### 4. Kiểm tra một pull request

1. Tạo branch và push commit lên GitHub.
2. Mở pull request vào `main`.
3. Chờ ba GitHub Actions checks pass.
4. Mở URL Preview do Vercel gửi trong pull request và smoke test login, dashboard, task, lịch và health API.
5. Xác nhận Preview đang dùng database/Redis staging.
6. Merge vào `main`; theo dõi cả frontend và backend Production Deployment trước khi đóng release.

## Checklist Preview

- [ ] Tạo PostgreSQL/Redis staging riêng, không dùng dữ liệu production.
- [ ] Pull request có đủ ba CI checks và Vercel Preview URL.
- [ ] Project Services dùng repository root và Framework Preset `Services`; hoặc hai project tách dùng root `frontend`/`backend`.
- [ ] Deploy backend preview và kiểm tra `/api/health` trả `200`.
- [ ] Chạy migration trên staging đúng một lần.
- [ ] Khai báo Vercel Preview env, nhất là `VITE_API_URL` và `FRONTEND_URL`.
- [ ] Mở trực tiếp `/login`, `/dashboard`, `/tasks` và refresh không bị 404.
- [ ] Test register, login, refresh token, logout và CORS/cookie trên domain thật.
- [ ] Nếu bật upload, adapter object storage thật đã được triển khai và test; không ghi file vào filesystem Vercel.
- [ ] Xác nhận endpoint cron từ chối request thiếu hoặc sai `CRON_SECRET`.
- [ ] Kiểm tra responsive, dark/light, offline page và manifest PWA.
- [ ] Không có secret xuất hiện trong log build hoặc source bundle.

## Checklist Production

- [ ] Domain và HTTPS đã hoạt động cho frontend/backend.
- [ ] Vercel Production env tách khỏi Preview env.
- [ ] Secret production là giá trị ngẫu nhiên mới, không sao chép từ `.env.example`.
- [ ] Database backup, retention và quy trình restore đã được kiểm tra.
- [ ] Migration production đã chạy thành công trước khi release nhận traffic.
- [ ] `FRONTEND_URL`, CORS, cookie và `VITE_API_URL` khớp domain production.
- [ ] Object storage, Redis cloud, rate limit, request log và cảnh báo lỗi đã bật.
- [ ] Smoke test login, dashboard, tạo công việc, lịch, tài liệu và thông báo.
- [ ] Có deployment trước đó để rollback; migration có kế hoạch tương thích ngược.
- [ ] Merge vào `main` chỉ sau khi Preview deployment và CI đều xanh.

## An toàn repository

`.gitignore` loại trừ `node_modules`, build output, `.env*`, `.vercel`, upload local, backup và file dump. Chỉ commit các file `*.env.example` chứa placeholder.

Kiểm tra trước khi push:

```powershell
git status --short
git ls-files | Select-String -Pattern '(^|/)(\.env($|\.)|\.vercel/|uploads/|backups/)'
```

Nếu một secret từng được commit, xóa file khỏi Git là chưa đủ: phải rotate secret ngay và làm sạch lịch sử repository theo quy trình của đội dự án.
