# BLUEPRINT DỰ ÁN - QUẢN LÝ HỌC TẬP

Tên gợi ý: **StudyFlow**

Mục tiêu: xây dựng một ứng dụng web giúp sinh viên quản lý học kỳ, môn học, kế hoạch học tập, nhiệm vụ, lịch, điểm số, tài liệu, ghi chú, pomodoro, thống kê và gợi ý lịch học thông minh.

Stack đề xuất:
- Database: PostgreSQL 16, Prisma ORM, Redis.
- Backend: Node.js, Express, TypeScript, Prisma, JWT, Redis, Docker.
- Frontend: React, Vite, TypeScript, TailwindCSS, React Query, Zustand.
- DevOps: Docker Compose, GitHub Actions, migration runner, backup script.

## Nguyên tắc làm dự án

1. Làm theo từng giai đoạn nhỏ, chạy được rồi mới mở rộng.
2. Mỗi prompt chỉ tập trung một nhóm chức năng, không trộn database, backend và frontend trong cùng một lần.
3. Sau mỗi prompt phải có checklist nghiệm thu: build được, test được, endpoint hoạt động, migration chạy được hoặc UI render đúng.
4. Ưu tiên MVP chắc chắn trước: Auth, học kỳ, môn học, kế hoạch, task, dashboard, lịch.
5. Tính năng nâng cao như AI assistant, flashcard, nhóm học tập, PWA làm sau khi lõi ổn định.

## Giai Đoạn 0 - Nền Móng

Mục tiêu:
- Tạo cấu trúc monorepo rõ ràng.
- Có Docker Compose chạy PostgreSQL, Redis, backend, frontend.
- Có chuẩn env, logging, error handling, validation, seed dữ liệu mẫu.

Thành phẩm:
- `database/` có Prisma schema, migration, seed.
- `backend/` có Express TypeScript, health check, auth cơ bản.
- `frontend/` có Vite React, routing, layout, design system tối thiểu.

## Giai Đoạn 1 - MVP Dùng Được

Mục tiêu:
- Người dùng đăng ký, đăng nhập, quản lý hồ sơ.
- Tạo học kỳ, môn học, kế hoạch học tập, nhiệm vụ, subtask.
- Xem dashboard, lịch học, Kanban, mục tiêu và thông báo cơ bản.

Màn hình chính:
- Đăng nhập, đăng ký, quên mật khẩu.
- Dashboard.
- Học kỳ và môn học.
- Kế hoạch học tập.
- Nhiệm vụ dạng list và Kanban.
- Lịch học tập.
- Mục tiêu.
- Cài đặt cá nhân.

## Giai Đoạn 2 - Học Tập Thực Chiến

Mục tiêu:
- Theo dõi điểm số và GPA.
- Theo dõi thời gian học và Pomodoro.
- Quản lý tài liệu, ghi chú, thống kê và xuất báo cáo.
- Notification engine hoàn chỉnh.

Màn hình chính:
- Điểm số và GPA.
- Study timer.
- Thư viện tài liệu.
- Ghi chú rich text.
- Thống kê.
- Báo cáo PDF/Excel.

## Giai Đoạn 3 - Nâng Cao Và Khác Biệt

Mục tiêu:
- Gợi ý lịch học thông minh bằng thuật toán deterministic.
- AI assistant hỗ trợ tóm tắt tài liệu, tạo flashcard, lập kế hoạch ôn thi.
- Flashcard spaced repetition.
- Nhóm học tập.
- Admin dashboard.
- PWA và polish UX.

## Chuẩn Dữ Liệu Chung

Các entity lõi:
- User, Role, UserRole, RefreshToken.
- Semester, Subject.
- StudyPlan, Task, SubTask, TaskAttachment.
- Schedule, Event, Goal.
- GradeComponent, Grade.
- StudySession, PomodoroSession.
- Document, Note.
- Notification, NotificationSetting.
- FlashcardSet, Flashcard.
- StudyGroup, GroupMember, GroupTask.
- Feedback, ActivityLog.

## Chuẩn API Chung

Response thành công:

```json
{
  "success": true,
  "message": "OK",
  "data": {}
}
```

Response lỗi:

```json
{
  "success": false,
  "message": "Dữ liệu không hợp lệ",
  "errors": [
    { "field": "email", "message": "Email không đúng định dạng" }
  ]
}
```

Quy tắc:
- Tất cả endpoint cá nhân phải kiểm tra ownership.
- List endpoint phải hỗ trợ phân trang khi dữ liệu có thể lớn.
- Input validate bằng Zod.
- Không trả `passwordHash`, `tokenHash` hoặc secret ra API.
- Xóa dữ liệu người dùng nên ưu tiên soft delete với các entity nghiệp vụ quan trọng.

## Definition Of Done

Một prompt được xem là hoàn thành khi:
- Code build không lỗi.
- Migration chạy được nếu có thay đổi database.
- Endpoint chính test thủ công được bằng Postman/Thunder Client hoặc test tự động.
- Frontend render đúng loading, empty, error và success state.
- README hoặc ghi chú chạy local được cập nhật nếu thay đổi cách chạy.
- Không hardcode secret, URL môi trường hoặc tài khoản thật.

