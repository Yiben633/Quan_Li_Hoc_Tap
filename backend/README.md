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

## Toàn hệ thống Docker

```bash
cp .env.example .env
docker compose up -d --build
docker compose ps
```

Frontend mở tại `http://localhost:3000`, backend tại `http://localhost:4000`, và frontend proxy các request `/api` tới backend. Dev hot reload dùng `docker compose -f docker-compose.yml -f docker-compose.override.yml up --build`.

CI chạy `prisma migrate deploy`, lint, test và build. Migration không chạy trong mỗi request/serverless function; Vercel dùng `backend/vercel.json` cho build và Cron, còn migration chạy từ GitHub Actions hoặc CLI riêng.

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

## Semester và Subject API

Các route yêu cầu `Authorization: Bearer <accessToken>` và đều giới hạn theo owner hiện tại:

```text
GET|POST /api/semesters
GET|PATCH|DELETE /api/semesters/:id
POST /api/semesters/:id/close
POST /api/semesters/:id/duplicate
GET|POST /api/subjects
GET|PATCH|DELETE /api/subjects/:id
PATCH /api/subjects/:id/complete
```

List endpoint hỗ trợ pagination, filter/search và sort. Delete là soft delete; Subject detail trả `taskTotal`, `taskDone`, `totalStudyMinutes` và `currentAverage`.

## Study Plan, Task và Kanban

Các route yêu cầu access token:

```text
GET|POST /api/study-plans
GET|PATCH|DELETE /api/study-plans/:id
GET|POST /api/tasks
GET|PATCH|DELETE /api/tasks/:id
PATCH /api/tasks/:id/status
PATCH /api/tasks/:id/complete
POST  /api/tasks/:id/duplicate
POST  /api/tasks/reorder
GET|POST /api/tasks/:id/subtasks
PATCH|DELETE /api/tasks/:id/subtasks/:subtaskId
GET /api/tasks/today
GET /api/tasks/overdue
GET /api/kanban/board
PATCH /api/kanban/move
```

Study Plan tự đồng bộ `progressPercent` theo số Task `done`. Reorder và Kanban move chạy trong Prisma transaction, sau đó trả lại danh sách/board mới nhất để frontend cập nhật optimistic UI.

## Calendar, Dashboard và Goals

```text
GET|POST /api/schedules
GET|PATCH|DELETE /api/schedules/:id
GET|POST /api/events
GET|PATCH|DELETE /api/events/:id
GET /api/calendar?view=day|week|month&date=YYYY-MM-DD
GET /api/dashboard/summary
GET /api/dashboard/progress-chart?range=week|month
GET|POST /api/goals
GET|PATCH|DELETE /api/goals/:id
GET /api/goals/:id/progress
POST /api/goals/cron/daily
```

Calendar chuẩn hóa schedule recurrence, event, task due date và exam date về `{ type, title, startAt, endAt, colorHex, sourceEntity }`. Cron goal cần header `x-cron-secret` khi `CRON_SECRET` được cấu hình.

## Grades và GPA

```text
GET|POST /api/subjects/:subjectId/grade-components
PATCH|DELETE /api/grade-components/:id
PUT /api/grade-components/:id/grade
GET /api/subjects/:subjectId/grade-summary
GET /api/gpa/:semesterId
```

Grade summary chỉ tính component đã có điểm. `requiredFinalScore` dùng tổng weight thực tế, đồng thời trả `isTargetPossible`, `missingComponents` và `warnings`.

## Study Time và Pomodoro

```text
POST /api/study-sessions/start
POST /api/study-sessions/:id/pause
POST /api/study-sessions/:id/resume
POST /api/study-sessions/:id/end
POST /api/study-sessions/:id/pomodoro/start
POST /api/study-sessions/:id/pomodoro/:pomodoroId/end
GET  /api/statistics/study-time?range=day|week|month&subjectId=
```

Session đang chạy được giữ trong Redis để khôi phục trạng thái sau refresh. Khi end, tổng phút được đồng bộ vào `study_sessions.total_minutes`; mỗi user chỉ có một session active.

## Documents và Notes

```text
POST   /api/documents/upload
GET    /api/documents?subjectId=&taskId=&tag=&search=&page=&limit=
GET    /api/documents/:id/download
PATCH  /api/documents/:id
DELETE /api/documents/:id
GET|POST       /api/notes
GET|PATCH|DELETE /api/notes/:id
PATCH  /api/notes/:id/pin
```

Document upload dùng `StorageProvider` với adapter `local | s3-compatible`. Local lưu trong `uploads/` cho Docker/dev; production Vercel bắt buộc dùng object storage qua các biến `S3_*`. Giới hạn file lấy từ `DOCUMENT_MAX_UPLOAD_BYTES`; MIME nguy hiểm bị chặn, file lưu thất bại sẽ rollback file/metadata. Nội dung Note được sanitize server-side bằng `sanitize-html` trước khi ghi database.

## Notifications

```text
GET   /api/notifications?isRead=&page=&limit=
PATCH /api/notifications/:id/read
PATCH /api/notifications/read-all
GET   /api/notification-settings
PATCH /api/notification-settings
GET   /api/cron/notifications
```

Local server chạy notification scan mỗi 5 phút bằng `node-cron`. Vercel dùng `/api/cron/notifications` với `CRON_SECRET`; `backend/vercel.json` đã cấu hình lịch Cron 5 phút. Logic dùng chung nằm trong `src/jobs/notificationJob.ts`, có distributed lock và dedupe TTL qua Redis cùng lớp kiểm tra database, đồng thời tôn trọng in-app/email/push settings.

Gọi thủ công bằng Bearer token:

```powershell
$headers = @{ Authorization = "Bearer $env:CRON_SECRET" }
Invoke-RestMethod http://localhost:4000/api/cron/notifications -Headers $headers
```

Rate limit global, auth và AI cũng dùng Redis store thay cho bộ nhớ từng process. Production Vercel dùng Upstash TCP/TLS URL dạng `rediss://default:<password>@<database>.upstash.io:6379` trong `REDIS_URL`; không dùng URL Redis local trên Vercel.

## Reports, AI, Flashcards, Groups và Admin

```text
GET  /api/statistics/overview
GET  /api/reports/weekly
GET  /api/reports/monthly
GET  /api/reports/semester/:semesterId
GET  /api/reports/by-subject/:id
POST /api/reports/export?format=pdf|excel
POST /api/ai/suggest-schedule
POST /api/ai/reschedule
POST /api/ai/chat
POST /api/ai/summarize-document
POST /api/ai/generate-flashcards
GET|POST /api/flashcard-sets
GET|POST /api/flashcard-sets/:setId/flashcards
POST /api/flashcards/:id/review
GET  /api/flashcards/due
GET|POST /api/study-groups
GET  /api/study-groups/:id/progress
```

AI schedule dùng greedy allocation theo các slot rảnh và trả warning khi không đủ phút. Provider AI lấy tên từ `AI_PROVIDER`, hiện adapter mock; mọi AI usage được ghi ActivityLog. Các route `/api/admin/*` bắt buộc role `admin`, gồm user management, feedback, activity logs, statistics và import subject template Excel.

## User Profile

Các route dưới đây yêu cầu `Authorization: Bearer <accessToken>`:

```text
GET    /api/users/me
PATCH  /api/users/me
PATCH  /api/users/me/avatar   multipart field: avatar
PATCH  /api/users/me/password
DELETE /api/users/me
```

Avatar dùng cùng `StorageProvider` với tài liệu và giới hạn 2MB với MIME `image/jpeg`, `image/png` hoặc `image/webp`. Local lưu vào `backend/uploads/avatars`; Vercel production dùng S3-compatible storage và không ghi filesystem tạm.

## Vercel

Đặt Vercel Project Root Directory là `backend`. `backend/vercel.json` dùng `api/index.ts` làm Function entrypoint; file này export cùng Express app với server local. Smoke test bằng `GET /api/health`; `/health` vẫn dành cho local/Docker.

Khai báo `DATABASE_URL` là URL pooled runtime, `DIRECT_URL` là URL trực tiếp cho migration, cùng Upstash `REDIS_URL`, JWT secrets, `FRONTEND_URL` và `CRON_SECRET` tối thiểu 16 ký tự. Không chạy migration trong Function. Production Vercel phải dùng `STORAGE_PROVIDER=s3-compatible` cùng các biến `S3_*`; filesystem `uploads/` chỉ dành cho local/Docker. Cron chạy qua `GET /api/cron/notifications`, không khởi động process nền khi import app.
