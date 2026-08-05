# PROMPT VIBECODE - BACKEND LAYER

Hệ thống: **Quản lý và lập kế hoạch học tập cho sinh viên**  
Stack: Node.js, Express, TypeScript, Prisma, PostgreSQL, Redis, JWT, Docker.

Giả định: database layer đã có Prisma schema và migration. Làm từng prompt theo thứ tự, test API sau mỗi bước.

## PROMPT 0 - Khởi Tạo Backend

```text
Khởi tạo project TypeScript Express trong `backend/`.

Yêu cầu:
- Cấu trúc: `src/{config,lib,middlewares,modules,routes,utils,validators}`.
- Cài: express, @prisma/client, prisma, zod, jsonwebtoken, bcrypt hoặc argon2, cookie-parser, cors, helmet, express-rate-limit, dotenv, winston, redis/ioredis.
- Cài dev: typescript, tsx, eslint, prettier, jest, supertest, @types/*.
- Tạo Prisma client singleton.
- Tạo Redis client singleton.
- Chuẩn response JSON: `{ success, message, data }` và `{ success, message, errors }`.
- Middleware: requestId, logger, errorHandler, notFound, validateBody, validateQuery, authenticate, authorize.
- Endpoint `GET /health` kiểm tra server, database và Redis.
- Dockerfile multi-stage và compose service `backend`.
- README backend hướng dẫn chạy local, test và build.

Checklist:
- `npm run dev` chạy được.
- `GET /health` trả 200 khi DB/Redis healthy.
- Lỗi validation trả format thống nhất.
```

## PROMPT 1 - Auth Module

```text
Xây dựng `src/modules/auth`.

Endpoints:
- POST /api/auth/register: fullName, email, studentCode, password, school, major, courseYear. Kiểm tra trùng email/studentCode, hash password, gán role student.
- POST /api/auth/login: kiểm tra password, khóa 15 phút sau 5 lần sai, trả accessToken 15 phút và refreshToken 7 ngày trong httpOnly cookie.
- POST /api/auth/refresh: rotate refreshToken, revoke token cũ, cấp accessToken mới.
- POST /api/auth/logout: revoke refreshToken hiện tại.
- POST /api/auth/forgot-password: sinh OTP 6 số, lưu Redis TTL 5 phút, gửi email bằng adapter mock ở dev.
- POST /api/auth/verify-otp.
- POST /api/auth/reset-password.
- GET /api/auth/me: trả user hiện tại.

Yêu cầu:
- Validate input bằng Zod.
- Token secret lấy từ env.
- Refresh token lưu dạng hash.
- ActivityLog cho register, login, logout, reset password.
- Unit/integration test cho register, login sai, login đúng, refresh, logout.
```

## PROMPT 2 - User Profile Và Settings

```text
Xây dựng `src/modules/users`.

Endpoints:
- GET /api/users/me.
- PATCH /api/users/me: cập nhật fullName, school, major, courseYear, timezone, language, themeMode.
- PATCH /api/users/me/avatar: upload ảnh bằng multer, giới hạn 2MB, chỉ jpg/png/webp, lưu local qua StorageProvider interface.
- PATCH /api/users/me/password: yêu cầu currentPassword và newPassword.
- DELETE /api/users/me: soft delete tài khoản hoặc đánh dấu pending deletion.

Yêu cầu:
- Không trả passwordHash/tokenHash.
- Mọi route cần authenticate.
- Ghi ActivityLog cho đổi mật khẩu, đổi avatar và xóa tài khoản.
```

## PROMPT 3 - Semester Và Subject API

```text
Xây dựng modules `semesters` và `subjects`.

Semester endpoints:
- GET /api/semesters?status=&page=&limit=&sort=
- POST /api/semesters
- GET /api/semesters/:id
- PATCH /api/semesters/:id
- DELETE /api/semesters/:id soft delete
- POST /api/semesters/:id/close
- POST /api/semesters/:id/duplicate

Subject endpoints:
- GET /api/subjects?semesterId=&search=&status=&page=&limit=
- POST /api/subjects
- GET /api/subjects/:id kèm tổng task, task done, tổng phút học, điểm trung bình hiện tại.
- PATCH /api/subjects/:id
- DELETE /api/subjects/:id soft delete
- PATCH /api/subjects/:id/complete

Yêu cầu:
- Kiểm tra ownership mọi truy vấn.
- Service layer tách khỏi controller.
- Query list có pagination, search và sort.
- Test ít nhất create/list/detail/update/delete.
```

## PROMPT 4 - Study Plan, Task, SubTask Và Kanban

```text
Xây dựng modules `study-plans`, `tasks`, `kanban`.

StudyPlan:
- CRUD /api/study-plans với filter subjectId, status, priority, startDate, endDate.
- Tự tính lại progressPercent theo tỷ lệ task done.

Task:
- CRUD /api/tasks với filter studyPlanId, subjectId, status, priority, dueDate, search.
- PATCH /api/tasks/:id/status.
- PATCH /api/tasks/:id/complete.
- POST /api/tasks/:id/duplicate.
- POST /api/tasks/reorder nhận mảng {id, sortOrder}.
- CRUD /api/tasks/:id/subtasks.
- GET /api/tasks/today.
- GET /api/tasks/overdue.

Kanban:
- GET /api/kanban/board?subjectId=&priority= trả 4 cột todo, in_progress, waiting, done.
- PATCH /api/kanban/move nhận {taskId, toStatus, newIndex} và cập nhật bằng Prisma transaction.

Yêu cầu:
- Optimistic UI phía frontend sẽ dựa vào response mới nhất, nên API phải trả task/board sau cập nhật.
- Test transaction move task và reorder.
```

## PROMPT 5 - Calendar, Dashboard Và Goals

```text
Xây dựng modules `schedules`, `events`, `calendar`, `dashboard`, `goals`.

Schedule/Event:
- CRUD /api/schedules và /api/events.
- GET /api/calendar?view=day|week|month&date= trả schedule occurrences, event, task due date và exam date trong cùng format.
- Hỗ trợ recurrence none/daily/weekly trong khoảng ngày được yêu cầu.

Dashboard:
- GET /api/dashboard/summary trả: task hôm nay, task done, task quá hạn, giờ học tuần này, môn đang học, lịch gần nhất, goal active.
- GET /api/dashboard/progress-chart?range=week|month.

Goals:
- CRUD /api/goals.
- GET /api/goals/:id/progress tính progress theo type.
- Cron mỗi ngày tạo notification goal_at_risk hoặc goal_achieved.

Yêu cầu:
- Dùng Promise.all cho các truy vấn dashboard độc lập.
- Calendar output phải có type, title, startAt, endAt, colorHex, sourceEntity.
```

## PROMPT 6 - Grade Và GPA

```text
Xây dựng module `grades`.

Endpoints:
- CRUD /api/subjects/:subjectId/grade-components.
- PUT /api/grade-components/:id/grade để nhập hoặc sửa điểm.
- GET /api/subjects/:subjectId/grade-summary trả currentAverage, targetGrade, requiredFinalScore, isTargetPossible, missingComponents.
- GET /api/gpa/:semesterId trả GPA học kỳ.

Yêu cầu:
- Công thức currentAverage chỉ tính component đã có score.
- Công thức requiredFinalScore:
  (target * totalWeight - sum(scoredScore * scoredWeight)) / remainingWeight.
- Cảnh báo nếu requiredFinalScore > maxScore hoặc remainingWeight = 0.
- Test các case: thiếu điểm, tổng weight khác 100, target không khả thi, đủ điểm.
```

## PROMPT 7 - Study Time Và Pomodoro

```text
Xây dựng module `study-sessions`.

Endpoints:
- POST /api/study-sessions/start.
- POST /api/study-sessions/:id/pause.
- POST /api/study-sessions/:id/resume.
- POST /api/study-sessions/:id/end.
- POST /api/study-sessions/:id/pomodoro/start.
- POST /api/study-sessions/:id/pomodoro/:pomodoroId/end.
- GET /api/statistics/study-time?range=day|week|month&subjectId=.

Yêu cầu:
- Redis lưu trạng thái phiên đang chạy để không mất khi refresh.
- Khi end session, đồng bộ tổng phút về Postgres.
- Chặn user mở nhiều session active cùng lúc nếu không chủ động cho phép.
```

## PROMPT 8 - Documents Và Notes

```text
Xây dựng modules `documents` và `notes`.

Documents:
- StorageProvider interface: local, s3-compatible.
- POST /api/documents/upload với multer, giới hạn dung lượng qua env, chặn MIME nguy hiểm.
- GET /api/documents?subjectId=&taskId=&tag=&search=&page=&limit=.
- GET /api/documents/:id/download.
- PATCH /api/documents/:id đổi tên, tag, subjectId, taskId.
- DELETE /api/documents/:id xóa metadata và file trên storage.

Notes:
- CRUD /api/notes.
- PATCH /api/notes/:id/pin.
- Sanitize HTML bằng sanitize-html hoặc DOMPurify server-side trước khi lưu.

Yêu cầu:
- Ownership check nghiêm ngặt.
- Upload lỗi phải rollback metadata nếu lưu file thất bại.
```

## PROMPT 9 - Notification Engine

```text
Xây dựng module `notifications`.

Endpoints:
- GET /api/notifications?isRead=&page=&limit=.
- PATCH /api/notifications/:id/read.
- PATCH /api/notifications/read-all.
- GET /api/notification-settings.
- PATCH /api/notification-settings.

Cron:
- Chạy mỗi 5 phút.
- Quét task sắp đến hạn, task quá hạn, lịch học/thi sắp tới, study plan gần deadline, goal at risk.
- Tạo notification theo setting của từng user.
- Tránh tạo trùng bằng khóa logic hoặc kiểm tra relatedEntity + type + time window.
- Gửi email qua adapter khi emailEnabled.

Yêu cầu:
- Tách NotificationChannel interface để sau này thêm WebSocket/PWA push.
```

## PROMPT 10 - Reports, AI, Flashcard, Group, Admin

```text
Hoàn thiện các module nâng cao.

Reports:
- GET /api/statistics/overview.
- GET /api/reports/weekly, /monthly, /semester, /by-subject/:id.
- POST /api/reports/export?format=pdf|excel dùng pdfkit/puppeteer và exceljs.

AI schedule suggestion:
- POST /api/ai/suggest-schedule dùng thuật toán greedy/bin-packing, không dùng LLM cho lõi xếp lịch.
- POST /api/ai/reschedule khi task trễ.
- Trả warning nếu tổng thời gian cần học vượt khung giờ rảnh.

AI assistant:
- POST /api/ai/chat gọi provider qua env, rate limit riêng.
- POST /api/ai/summarize-document.
- POST /api/ai/generate-flashcards.
- Log usage vào ActivityLog.

Flashcard:
- CRUD FlashcardSet/Flashcard.
- POST /api/flashcards/:id/review cập nhật correct/wrong và nextReviewAt.
- GET /api/flashcards/due.

Study group:
- CRUD group, member invitation, group task, group progress.

Admin:
- User management, subject template import Excel, system content, feedback, activity logs, statistics.
- Tất cả route admin dùng authorize(["admin"]).
```

## PROMPT 11 - Security, CI Và Docker Compose Hoàn Chỉnh

```text
Rà soát backend trước khi bàn giao.

Security:
- Helmet, CORS theo FRONTEND_URL, rate limit auth và global.
- CSRF double-submit token cho refreshToken cookie nếu cần.
- Validate và sanitize mọi input.
- Không có raw SQL ghép chuỗi trực tiếp.
- ActivityLog cho hành động nhạy cảm.
- Upload limit toàn cục.

CI/Docker:
- Compose gốc gồm db, redis, backend, frontend.
- Healthcheck và depends_on hợp lý.
- docker-compose.override.yml cho dev hot reload.
- GitHub Actions: install, lint, test, build.
- README hướng dẫn chạy toàn hệ thống.
- `README-security.md` checklist bảo mật.

Checklist:
- Test pass.
- Docker compose build sạch.
- Không hardcode secret.
```

