# Database Layer

Hạ tầng database local cho dự án **StudyFlow - Quản lý học tập**.

## Thành Phần

- PostgreSQL 16: database chính.
- Redis 7: cache, OTP, session timer và notification queue.
- pgAdmin 4: UI debug database, chỉ bật khi dùng profile `tools`.

## Chuẩn Bị

Tạo file `.env` từ file mẫu:

```powershell
Copy-Item .env.example .env
```

Sau đó chỉnh lại các mật khẩu trong `.env`.

## Chạy PostgreSQL Và Redis

```powershell
docker compose up -d db redis
```

Kiểm tra trạng thái:

```powershell
docker compose ps
```

Hai service `db` và `redis` cần ở trạng thái healthy.

## Bật pgAdmin

```powershell
docker compose --profile tools up -d pgadmin
```

Mở pgAdmin tại:

```text
http://localhost:5050
```

Thông tin đăng nhập lấy từ:

- `PGADMIN_DEFAULT_EMAIL`
- `PGADMIN_DEFAULT_PASSWORD`

Kết nối server PostgreSQL trong pgAdmin:

- Host: `db`
- Port: `5432`
- Maintenance database: giá trị `POSTGRES_DB`
- Username: giá trị `POSTGRES_USER`
- Password: giá trị `POSTGRES_PASSWORD`

## Kiểm Tra Kết Nối PostgreSQL

Nếu máy có `psql`:

```powershell
psql "postgresql://studyflow:change_me_strong_password@localhost:55432/studyflow_dev"
```

Hoặc dùng container:

```powershell
docker compose exec db psql -U studyflow -d studyflow_dev
```

## Kiểm Tra Redis

```powershell
docker compose exec redis redis-cli -a change_me_redis_password ping
```

Kết quả mong đợi:

```text
PONG
```

## Prisma Auth Schema

Các file Prisma nằm trong `database/prisma/`.

Chạy generate Prisma Client:

```powershell
cd database
$env:DATABASE_URL="postgresql://studyflow:change_me_strong_password@localhost:55432/studyflow_dev?schema=public"
npm run db:generate
```

Kiểm tra migration:

```powershell
cd database
$env:DATABASE_URL="postgresql://studyflow:change_me_strong_password@localhost:55432/studyflow_dev?schema=public"
npm exec prisma -- migrate status
```

Kiểm tra Prisma Client đọc được các bảng auth:

```powershell
cd database
$env:DATABASE_URL="postgresql://studyflow:change_me_strong_password@localhost:55432/studyflow_dev?schema=public"
npm run db:check:auth
```

## Seed Dữ Liệu Mẫu

Seed tạo roles, tài khoản mẫu, học kỳ, 4 môn học, study plan, task, grade, document, note, goal, schedule, event và notification mẫu.

```powershell
cd database
$env:DATABASE_URL="postgresql://studyflow:change_me_strong_password@localhost:55432/studyflow_dev?schema=public"
npm run db:seed
```

Tài khoản mẫu:

- Admin: `admin@studyflow.local` / `Admin@123456`
- Student: `student@studyflow.local` / `Student@123456`

Reset toàn bộ database local, chạy lại migration và seed:

```powershell
cd database
$env:DATABASE_URL="postgresql://studyflow:change_me_strong_password@localhost:55432/studyflow_dev?schema=public"
npm run db:reset
```

`db:reset` dùng `prisma migrate reset --force`; Prisma sẽ gọi seed command đã khai báo trong `package.json`.

## Soft Delete Cho Semester Và Subject

`Semester` và `Subject` dùng trường `deletedAt` để xóa mềm. Khi người dùng xóa học kỳ hoặc môn học, backend nên set `deletedAt = now()` thay vì xóa cứng ngay.

Lý do:

- Giữ lại lịch sử học tập để thống kê, báo cáo và khôi phục khi xóa nhầm.
- Tránh mất dây chuyền dữ liệu liên quan như kế hoạch, task, điểm số, tài liệu và ghi chú.
- Cho phép áp dụng unique mềm: một user không thể có 2 môn cùng `code` trong cùng học kỳ nếu môn cũ chưa bị xóa mềm, nhưng có thể dùng lại code đó sau khi môn cũ đã có `deletedAt`.

Database hiện có partial unique index:

```sql
CREATE UNIQUE INDEX subjects_active_user_semester_code_key
ON subjects(user_id, semester_id, code)
WHERE deleted_at IS NULL;
```

## Grade Và GPA

Điểm trung bình hiện tại của từng môn được mô tả bằng SQL view `subject_grade_summaries`.

Công thức:

```text
SUM(score * weight_percent) / SUM(weight_percent)
```

Chỉ các `GradeComponent` đã có `Grade.score` mới được tính vào tử số và mẫu số. Component chưa có điểm, ví dụ điểm cuối kỳ chưa nhập, sẽ không kéo trung bình hiện tại xuống.

Công thức "điểm cuối kỳ cần đạt" không lưu trong database. Backend sẽ tính khi gọi API grade summary:

```text
(targetGrade * totalWeight - SUM(scoredScore * scoredWeight)) / remainingWeight
```

## Study Time, Document Và Note

`StudySession` lưu phiên học tổng thể; `PomodoroSession` lưu các phiên con như `focus`, `short_break`, `long_break`. Khi xóa cứng một `StudySession`, các `PomodoroSession` con sẽ cascade theo.

`Document` chỉ lưu metadata:

- `fileUrl`
- `fileType`
- `storageProvider`
- `sizeBytes`
- `tags`

Database không xử lý nội dung file. Backend phải validate dung lượng, MIME type, quyền truy cập storage và bảo mật upload trước khi lưu metadata.

## Advanced Entities

`Notification.relatedEntityType` và `Notification.relatedEntityId` là polymorphic reference mềm. Database không enforce foreign key cho cặp trường này; backend phải kiểm tra entity liên quan trước khi tạo notification.

`GroupMember` có unique constraint `(studyGroupId, userId)` để một user không bị thêm trùng vào cùng một nhóm học.

`ActivityLog.userId` nullable để ghi log hệ thống, cron job hoặc tác vụ nền không gắn trực tiếp với một user cụ thể.

## Performance Indexes

Migration `20260805220000_add_performance_indexes` bổ sung các index cho truy vấn thường gặp:

- Dashboard task count: `tasks(user_id, status, due_date, deleted_at)`.
- Kanban board: `tasks(user_id, subject_id, status, sort_order)`.
- Calendar event range: `events(user_id, start_at, end_at, deleted_at)`.
- Calendar schedule range: `schedules(user_id, start_date, end_date, recurrence_rule, deleted_at)`.
- Study statistics: `study_sessions(user_id, subject_id, started_at)`.
- Completed task statistics: `tasks(user_id, subject_id, completed_at)`.
- Active goals: `goals(user_id, status, deadline)`.

Những index này giúp dashboard query chính không phải scan rộng khi dữ liệu task, lịch và study session tăng lên.

## Backup Và Restore

Các script backup nằm trong `database/scripts`.

Backup thủ công:

```bash
cd database
export DATABASE_URL="postgresql://studyflow:change_me_strong_password@localhost:55432/studyflow_dev?schema=public"
./scripts/backup.sh
```

Mặc định backup lưu vào `database/backups/` với tên theo timestamp UTC.

Restore thủ công:

```bash
cd database
export DATABASE_URL="postgresql://studyflow:change_me_strong_password@localhost:55432/studyflow_dev?schema=public"
export BACKUP_FILE="./backups/studyflow_20260805T120000Z.dump"
export CONFIRM_RESTORE="yes"
./scripts/restore.sh
```

Restore là thao tác phá hủy dữ liệu hiện tại; script yêu cầu `CONFIRM_RESTORE=yes`.

Cron job backup hằng ngày:

```cron
0 2 * * * cd /path/to/Quan_Ly_Hoc_Tap/database && DATABASE_URL="postgresql://..." BACKUP_DIR="./backups" ./scripts/backup.sh >> ./backups/backup.log 2>&1
```

## Migration Runner Cho CI

Build migration runner:

```bash
cd database
docker build -f Dockerfile.migrate -t studyflow-migration-runner .
```

Chạy migration deploy:

```bash
docker run --rm \
  -e DATABASE_URL="postgresql://..." \
  studyflow-migration-runner
```

Trong GitHub Actions hoặc CI khác, dùng lệnh tương đương:

```bash
cd database
npm ci
npx prisma migrate deploy
```

Không chạy `prisma migrate dev` trong CI production; dùng `prisma migrate deploy`.

## Reset Database Local

Xóa container và volume database local:

```powershell
docker compose down -v
```

Sau đó chạy lại:

```powershell
docker compose up -d db redis
```

Lưu ý: `down -v` sẽ xóa toàn bộ dữ liệu local trong PostgreSQL, Redis và pgAdmin.

## Biến Môi Trường Quan Trọng

- `POSTGRES_USER`: user PostgreSQL.
- `POSTGRES_PASSWORD`: mật khẩu PostgreSQL.
- `POSTGRES_DB`: database mặc định.
- `POSTGRES_PORT`: port expose ra máy host.
- `DATABASE_URL`: connection string dùng cho Prisma/backend.
- `REDIS_PASSWORD`: mật khẩu Redis local.
- `REDIS_URL`: connection string Redis.
- `PGADMIN_DEFAULT_EMAIL`: email đăng nhập pgAdmin.
- `PGADMIN_DEFAULT_PASSWORD`: mật khẩu pgAdmin.
- `PGADMIN_PORT`: port pgAdmin trên máy host.

Không commit file `.env` thật lên GitHub.

## Ghi Chú Về Port

PostgreSQL trong Docker network luôn chạy ở `db:5432`. Port trên máy host mặc định dùng `55432` để tránh đụng PostgreSQL cài sẵn trên Windows. Nếu máy bạn không có PostgreSQL local và muốn dùng `5432`, đổi `POSTGRES_PORT=5432` trong `.env`.
