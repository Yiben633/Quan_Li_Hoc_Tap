# Quản Lý Học Tập - Vibe Code Pack

Bộ tài liệu này là “bản thiết kế + prompt triển khai” cho một dự án web quản lý học tập dành cho sinh viên.

Tên gợi ý: **StudyFlow**

## Cách Bắt Đầu

Đọc theo thứ tự:

1. `docs/00-project-blueprint.md` - hiểu mục tiêu, phạm vi, giai đoạn và chuẩn chung.
2. `docs/01-database-prompts.md` - dựng PostgreSQL, Redis, Prisma schema, seed và backup.
3. `docs/02-backend-prompts.md` - dựng Express API, auth, CRUD, dashboard, notification, AI, admin.
4. `docs/03-frontend-prompts.md` - dựng React UI, layout, dashboard, task, calendar, report, PWA.

## Nguyên Tắc Dùng Prompt

- Copy từng prompt một, không chạy nhiều prompt lớn cùng lúc.
- Sau mỗi prompt phải build/test ngay.
- Database chạy ổn rồi mới làm backend.
- Backend endpoint ổn rồi mới nối frontend.
- Ghi lại lỗi, quyết định kỹ thuật và thay đổi quan trọng vào README tương ứng của từng layer.

## Thứ Tự Triển Khai Đề Xuất

MVP đầu tiên:

1. Database prompt 0-5.
2. Backend prompt 0-5.
3. Frontend prompt 0-9.

Sau khi MVP chạy được:

1. Database prompt 6-9.
2. Backend prompt 6-9.
3. Frontend prompt 10-13.

Tính năng xịn:

1. Backend prompt 10-11.
2. Frontend prompt 14-16.

## Definition Of Done

Một phần được xem là xong khi:

- Chạy được local.
- Có dữ liệu mẫu để demo.
- API hoặc UI có loading, error và success state.
- Không hardcode secret.
- Có checklist nghiệm thu rõ ràng.
- Có hướng dẫn chạy lại từ đầu cho người khác.

