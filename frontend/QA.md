# Frontend QA

## Viewport

- Mobile 360x800: sidebar mở dạng drawer; Tasks và Plans một cột; scope cuộn ngang; toolbar không tràn.
- Tablet 768x1024: form và thống kê co về 1-2 cột; Calendar vẫn đọc được.
- Desktop 1440x900: dashboard, Kanban, Calendar và drawer giữ chiều rộng ổn định.
- Light/Dark: focus ring, trạng thái, warning và danger đều có chữ hoặc icon, không chỉ dựa vào màu.

## Persona

### Trẻ tự học có người hỗ trợ

1. Đăng ký chỉ bằng họ tên, email và mật khẩu.
2. Tạo task độc lập, đặt thời gian ngắn và đánh dấu hoàn thành.
3. Không bị yêu cầu trường, chuyên ngành, năm học hay nhóm tuổi.
4. Nhóm chia sẻ không công khai email hoặc thông tin hồ sơ nhạy cảm.

### Người trưởng thành học kỹ năng

1. Tạo không gian học kỹ năng, kế hoạch và công việc không cần học kỳ.
2. Dùng Kanban, Calendar, Pomodoro, tài liệu và ghi chú.
3. Xem thống kê thật; khi mất mạng nhận trạng thái rõ ràng thay vì dữ liệu mẫu.

### Người dùng academic

1. Tạo không gian học và môn học có tín chỉ.
2. Theo dõi task, kế hoạch, thời gian học và mục tiêu theo môn.
3. Chỉ hiển thị dữ liệu điểm/GPA khi academic context và backend contract hỗ trợ.

## Destructive actions

Các thao tác xóa/lưu trữ công việc, kế hoạch, môn học, không gian học, tài liệu, ghi chú, mục tiêu, flashcard và nhóm đều phải dùng `ConfirmDialog`; không sử dụng hộp thoại native của trình duyệt.

## Offline/PWA

1. Build production tạo `manifest.webmanifest`, `sw.js` và workbox bundle.
2. App shell có thể mở lại khi offline.
3. Request `/api` và `/uploads` phải thất bại rõ ràng khi offline và không trả dữ liệu cache cá nhân.
4. Notification permission chỉ được hỏi sau thao tác bật của người dùng.
