# PROMPT VIBECODE - DATA / DATABASE LAYER

Hệ thống: **Quản lý và lập kế hoạch học tập cho sinh viên**  
Stack: PostgreSQL 16, Docker, Redis, Prisma ORM.

Cách dùng: copy từng prompt theo đúng thứ tự vào Claude Code, Cursor hoặc công cụ AI code. Sau mỗi prompt hãy chạy migration, kiểm tra schema và seed thử trước khi chuyển bước tiếp theo.

## PROMPT 0 - Khởi Tạo Hạ Tầng Database

```text
Tạo thư mục `database/` cho dự án quản lý học tập.

Yêu cầu:
- Tạo `docker-compose.yml` hoặc cập nhật compose gốc với service `db` dùng PostgreSQL 16.
- Dữ liệu phải persist bằng volume.
- Có healthcheck cho PostgreSQL.
- Cấu hình qua `.env`: POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB, DATABASE_URL.
- Thêm Redis service dùng cho cache, OTP, session timer và notification queue.
- Thêm pgAdmin trong profile `tools` để debug dữ liệu.
- Tạo `.env.example` đầy đủ biến môi trường.
- Viết `database/README.md` hướng dẫn chạy `docker compose up -d db redis`, kiểm tra kết nối và reset database.

Checklist nghiệm thu:
- `docker compose ps` hiển thị db và redis healthy.
- Kết nối được bằng `psql` hoặc Prisma.
- Không commit file `.env` thật.
```

## PROMPT 1 - Thiết Kế ERD Tổng Thể

```text
Dựa trên các entity sau, hãy tạo tài liệu `database/ERD.md` gồm mô tả text và Mermaid `erDiagram`:

Users, Roles, UserRoles, RefreshTokens, Semesters, Subjects, StudyPlans, Tasks, SubTasks, TaskAttachments, Goals, Schedules, Events, Grades, GradeComponents, StudySessions, PomodoroSessions, Documents, Notes, Notifications, NotificationSettings, FlashcardSets, Flashcards, StudyGroups, GroupMembers, GroupTasks, Feedbacks, ActivityLogs.

Quy tắc quan hệ:
- User có nhiều Role qua UserRole.
- User có nhiều Semester; Semester có nhiều Subject.
- Subject có nhiều StudyPlan, Task, GradeComponent, StudySession, Document, Note, Schedule.
- StudyPlan có nhiều Task; Task có nhiều SubTask và TaskAttachment.
- User có nhiều Goal, Event, Schedule, Notification, Document, Note.
- StudySession có nhiều PomodoroSession.
- StudyGroup có nhiều GroupMember và GroupTask.
- ActivityLog có thể thuộc User hoặc là log hệ thống.

Yêu cầu:
- Chỉ viết ERD và giải thích ngắn, chưa viết migration.
- Ghi rõ quan hệ nullable, cascade và soft delete ở những nơi quan trọng.
- Gợi ý index cho dashboard, calendar, kanban và statistics.
```

## PROMPT 2 - Prisma Schema: Auth

```text
Khởi tạo Prisma trong `database/prisma/` và kết nối PostgreSQL.

Tạo model:
- User: id uuid, fullName, email unique, studentCode unique nullable, passwordHash, avatarUrl nullable, school nullable, major nullable, courseYear nullable, timezone default "Asia/Ho_Chi_Minh", language default "vi", themeMode default "light", isEmailVerified default false, failedLoginCount default 0, lockedUntil nullable, deletedAt nullable, createdAt, updatedAt.
- Role: id uuid, name unique, description nullable, createdAt, updatedAt.
- UserRole: userId, roleId, assignedAt, khóa chính kép hoặc unique kép.
- RefreshToken: id uuid, userId, tokenHash unique, expiresAt, revokedAt nullable, createdAt.

Yêu cầu:
- Dùng `@@map` để map bảng snake_case.
- Dùng Prisma enum cho ThemeMode nếu phù hợp.
- Xóa User cascade sang RefreshToken và UserRole.
- Thêm index cho email, studentCode, deletedAt.
- Chạy migration `init_auth`.

Checklist:
- Prisma Client generate thành công.
- Bảng tạo đúng trong Postgres.
- Không lưu token hoặc password dạng plaintext.
```

## PROMPT 3 - Prisma Schema: Semester Và Subject

```text
Bổ sung model:
- Semester: id uuid, userId, name, academicYear, startDate, endDate, status enum planning/active/closed/archived, targetGpa decimal nullable, expectedCredits int nullable, note text nullable, deletedAt nullable, createdAt, updatedAt.
- Subject: id uuid, semesterId, userId, code, name, credits int, lecturer nullable, room nullable, colorHex, targetGrade decimal nullable, status enum in_progress/completed/dropped/archived, note text nullable, deletedAt nullable, createdAt, updatedAt.

Yêu cầu:
- Subject lưu `userId` để truy vấn nhanh theo owner, nhưng vẫn kiểm tra nhất quán với Semester.
- Unique mềm: một user không nên có 2 subject cùng code trong cùng semester nếu chưa bị xóa mềm.
- Index: (userId, status), (semesterId, status), (userId, deletedAt).
- Chạy migration `add_semester_subject`.
- Ghi chú rõ chiến lược soft delete cho Semester/Subject.
```

## PROMPT 4 - Prisma Schema: Plan, Task, SubTask

```text
Bổ sung model:
- StudyPlan: id uuid, userId, subjectId nullable, title, description text nullable, startDate nullable, endDate nullable, targetGoal nullable, estimatedHours decimal nullable, priority enum low/medium/high/urgent, status enum not_started/in_progress/paused/completed/overdue, progressPercent int default 0, deletedAt nullable, createdAt, updatedAt.
- Task: id uuid, userId, studyPlanId nullable, subjectId nullable, title, description text nullable, startDate nullable, dueDate nullable, estimatedMinutes int nullable, difficulty int nullable 1-5, priority enum low/medium/high/urgent, status enum todo/in_progress/waiting/done, sortOrder int default 0, completedAt nullable, deletedAt nullable, createdAt, updatedAt.
- SubTask: id uuid, taskId, title, isDone default false, sortOrder default 0, createdAt, updatedAt.
- TaskAttachment: id uuid, taskId, fileUrl, fileName, fileType nullable, sizeBytes nullable, createdAt.

Yêu cầu:
- Cascade Task -> SubTask/TaskAttachment.
- Index: (userId, status), (userId, dueDate), (studyPlanId, status), (subjectId, status), (userId, priority, dueDate).
- Chạy migration `add_plan_task_subtask`.
```

## PROMPT 5 - Prisma Schema: Calendar Và Goal

```text
Bổ sung model:
- Schedule: id uuid, userId, subjectId nullable, type enum class/self_study/exam/presentation/group_work/personal, title, dayOfWeek int nullable, startTime string, endTime string, startDate, endDate nullable, recurrenceRule enum none/daily/weekly, colorHex nullable, reminderBefore int nullable, deletedAt nullable, createdAt, updatedAt.
- Event: id uuid, userId, title, description text nullable, startAt datetime, endAt datetime nullable, isAllDay default false, colorHex nullable, reminderBefore int nullable, deletedAt nullable, createdAt, updatedAt.
- Goal: id uuid, userId, subjectId nullable, name, type enum score/study_time/task_count/course_completion/gpa, targetValue decimal, currentValue decimal default 0, deadline nullable, status enum in_progress/achieved/failed/archived, createdAt, updatedAt.

Yêu cầu:
- Index: (userId, startDate), (userId, startAt), (userId, status), (subjectId, status).
- Không lưu progressPercent cho Goal nếu có thể tính ở backend.
- Chạy migration `add_calendar_goal`.
```

## PROMPT 6 - Prisma Schema: Grade Và GPA

```text
Bổ sung model:
- GradeComponent: id uuid, subjectId, name, maxScore decimal default 10, weightPercent decimal, examDate nullable, note nullable, sortOrder int default 0, createdAt, updatedAt.
- Grade: id uuid, gradeComponentId unique, score decimal nullable, gradedAt nullable, createdAt, updatedAt.

Yêu cầu:
- Cascade Subject -> GradeComponent -> Grade.
- Index: (subjectId, sortOrder).
- Viết helper hoặc SQL view mô tả công thức điểm trung bình môn:
  SUM(score * weightPercent) / SUM(weightPercent) với các component đã có điểm.
- Ghi chú công thức "điểm cuối kỳ cần đạt" sẽ tính ở backend.
- Chạy migration `add_grade`.
```

## PROMPT 7 - Prisma Schema: Study Time, Document, Note

```text
Bổ sung model:
- StudySession: id uuid, userId, subjectId nullable, startedAt, endedAt nullable, totalMinutes int default 0, note text nullable, createdAt, updatedAt.
- PomodoroSession: id uuid, studySessionId, sessionType enum focus/short_break/long_break, plannedMinutes, actualMinutes nullable, startedAt, endedAt nullable, isCompleted default false.
- Document: id uuid, userId, subjectId nullable, taskId nullable, title, fileUrl, fileType enum pdf/word/excel/ppt/image/link/video/code/other, storageProvider enum local/s3/cloudinary/minio, sizeBytes nullable, tags string[], createdAt, updatedAt, deletedAt nullable.
- Note: id uuid, userId, subjectId nullable, taskId nullable, title, contentRichText text, isPinned default false, tags string[], createdAt, updatedAt, deletedAt nullable.

Yêu cầu:
- Index: StudySession(userId, startedAt), StudySession(subjectId, startedAt), Document(userId, subjectId), Note(userId, isPinned).
- DB chỉ lưu metadata file; validate dung lượng và MIME ở backend.
- Chạy migration `add_study_document_note`.
```

## PROMPT 8 - Prisma Schema: Notification, Flashcard, Group, Admin

```text
Bổ sung model:
- Notification: id uuid, userId, type enum deadline_soon/task_overdue/class_soon/exam_soon/plan_incomplete/goal_at_risk/goal_achieved/system, title, message, relatedEntityType nullable, relatedEntityId nullable, isRead default false, channel enum in_app/email/push, sentAt nullable, createdAt.
- NotificationSetting: id uuid, userId unique, reminderMinutesBefore int default 60, emailEnabled default false, pushEnabled default false, inAppEnabled default true, createdAt, updatedAt.
- FlashcardSet: id uuid, userId, subjectId nullable, name, description nullable, createdAt, updatedAt.
- Flashcard: id uuid, flashcardSetId, question, answer, isDifficult default false, correctCount default 0, wrongCount default 0, nextReviewAt nullable, createdAt, updatedAt.
- StudyGroup: id uuid, ownerId, name, description nullable, createdAt, updatedAt.
- GroupMember: id uuid, studyGroupId, userId, role enum leader/member, status enum pending/accepted/rejected, joinedAt nullable.
- GroupTask: id uuid, studyGroupId, assignedUserId nullable, title, description nullable, dueDate nullable, status enum todo/in_progress/done, createdAt, updatedAt.
- Feedback: id uuid, userId, type enum bug/feature_request/question, title, content, status enum open/in_progress/resolved/closed, adminReply nullable, createdAt, resolvedAt nullable.
- ActivityLog: id uuid, userId nullable, action, entityType nullable, entityId nullable, ipAddress nullable, userAgent nullable, metadata json nullable, createdAt.

Yêu cầu:
- Index notification: (userId, isRead), (userId, createdAt).
- Unique GroupMember(studyGroupId, userId).
- Chạy migration `add_advanced_entities`.
```

## PROMPT 9 - Seed, Index Và Backup

```text
Hoàn thiện database cho môi trường dev và CI.

Yêu cầu:
- Viết `database/seed.ts` dùng Prisma Client.
- Seed roles student/admin.
- Seed 1 admin và 1 sinh viên mẫu, password hash bằng bcrypt hoặc argon2.
- Seed 1 học kỳ, 4 môn học, mỗi môn có study plan, task, grade component, document/note mẫu.
- Seed goal, schedule, event và notification mẫu.
- Thêm script `db:seed`, `db:migrate`, `db:studio`, `db:reset`.
- Rà soát index cho dashboard, calendar, kanban, statistics; thêm migration `add_performance_indexes` nếu thiếu.
- Viết `database/scripts/backup.sh` và `restore.sh` dùng pg_dump/pg_restore.
- Viết README hướng dẫn backup thủ công, cron job và migration runner trong CI.

Checklist:
- `npm run db:reset` tạo lại schema và seed được.
- Dashboard query chính không cần scan quá nhiều bản ghi khi dữ liệu lớn.
```

