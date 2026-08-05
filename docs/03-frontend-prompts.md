# PROMPT VIBECODE - FRONTEND LAYER

Hệ thống: **Quản lý và lập kế hoạch học tập cho sinh viên**  
Stack: React, Vite, TypeScript, TailwindCSS, React Query, Zustand, Docker.

Ghi chú deploy: Docker/Nginx dùng cho local hoặc self-host. Với production trên Vercel, Vite React có thể deploy trực tiếp bằng build command `npm run build`, output `dist`, và biến môi trường public phải có prefix `VITE_`.

Giả định: backend đã có API tương ứng. Làm từng prompt theo thứ tự, chạy `npm run dev` và kiểm tra UI sau mỗi bước.

## PROMPT 0 - Khởi Tạo Frontend

```text
Khởi tạo React + TypeScript bằng Vite trong `frontend/`.

Yêu cầu:
- Cài: react-router-dom, @tanstack/react-query, zustand, axios, tailwindcss, react-hook-form, zod, @hookform/resolvers, date-fns, lucide-react, recharts, dnd-kit hoặc @hello-pangea/dnd, react-hot-toast.
- Cấu trúc: `src/{components,features,pages,layouts,hooks,stores,services,types,utils,routes}`.
- Tạo `services/apiClient.ts` với axios instance, attach accessToken, refresh token khi 401 và xử lý logout khi refresh thất bại.
- Tạo route config, ProtectedRoute, AdminRoute.
- Tạo Dockerfile multi-stage và nginx.conf fallback React Router.
- Tạo cấu hình Vercel-ready:
  - `vercel.json` với rewrite fallback về `/index.html` nếu cần cho SPA.
  - Build command: `npm run build`.
  - Output directory: `dist`.
  - Env: `VITE_API_URL`, `VITE_APP_NAME`, `VITE_VERCEL_ENV` nếu dùng.
- Cấu hình Tailwind design tokens bằng CSS variables.

Checklist:
- Trang root render được.
- Routing hoạt động.
- API base URL đọc từ VITE_API_URL.
- Deploy preview trên Vercel đọc đúng env theo Preview/Production.
```

## PROMPT 1 - Design System Và App Layout

```text
Xây dựng component nền trong `src/components/ui`:
- Button, IconButton, Input, Textarea, Select, Checkbox, Switch, Modal, Drawer, Dropdown, Badge, Tabs, Tooltip, Skeleton, EmptyState, Avatar, ProgressBar, DatePicker, Pagination, ConfirmDialog.

Layout:
- AuthLayout cho đăng nhập/đăng ký/quên mật khẩu, responsive tốt.
- AppLayout gồm sidebar, topbar, notification dropdown, user menu, theme toggle.
- Mobile: sidebar thành drawer hoặc bottom navigation.

Phong cách:
- Giao diện học tập hiện đại, rõ ràng, dễ đọc lâu.
- Không dùng palette một màu đơn điệu.
- Dùng lucide-react cho icon.
- Tất cả form có loading, disabled, error và success state.
```

## PROMPT 2 - Auth Pages

```text
Xây dựng:
- RegisterPage: fullName, email, studentCode, password, confirmPassword, school, major, courseYear.
- LoginPage: email, password, remember me, Google login placeholder, forgot password link.
- ForgotPasswordPage: stepper 3 bước gồm nhập email, nhập OTP, đặt mật khẩu mới.

State:
- `useAuthStore` lưu accessToken, user, roles và trạng thái authenticated.
- React Query mutation cho login/register/reset.
- ProtectedRoute redirect về login nếu chưa đăng nhập.
- AdminRoute chỉ cho role admin.

Yêu cầu:
- Validate real-time bằng Zod + react-hook-form.
- Hiển thị lỗi API rõ ràng bằng tiếng Việt.
- Sau login chuyển về Dashboard.
```

## PROMPT 3 - Settings Và Hồ Sơ Cá Nhân

```text
Xây dựng SettingsPage với tabs:
- Hồ sơ: avatar, họ tên, trường, ngành, khóa học.
- Bảo mật: đổi mật khẩu.
- Giao diện: light/dark/system nếu muốn, lưu localStorage.
- Ngôn ngữ: cấu trúc sẵn cho vi/en.
- Múi giờ.
- Nhắc nhở: notification settings.

Yêu cầu:
- Upload avatar có preview trước khi gửi.
- React Query invalidate user profile sau khi cập nhật.
- Toast thành công/thất bại.
```

## PROMPT 4 - Dashboard

```text
Xây dựng DashboardPage gọi `/api/dashboard/summary` và `/api/dashboard/progress-chart`.

UI gồm:
- Stat cards: task hôm nay, đã hoàn thành, quá hạn, giờ học tuần này.
- Biểu đồ tiến độ tuần/tháng bằng Recharts, có segmented control.
- Môn học đang theo dõi, hiển thị màu theo subject.colorHex.
- Lịch học và hạn nộp gần nhất 5 mục.
- Mục tiêu active với progress bar.
- Quick actions: tạo học kỳ, tạo môn, tạo task, mở Kanban.

Yêu cầu:
- Skeleton khi loading.
- Empty state nếu user chưa có dữ liệu.
- Error state có nút thử lại.
```

## PROMPT 5 - Học Kỳ Và Môn Học

```text
Xây dựng:
- SemesterListPage: card/table, filter status, thêm/sửa/xóa mềm/đóng học kỳ/sao chép học kỳ.
- SubjectListPage: filter theo semester, search, status; grid card theo màu môn học.
- SubjectDetailPage: tabs Lịch học, Bài tập, Tài liệu, Điểm số, Tiến độ, Ghi chú, Thời gian học.

Yêu cầu:
- Form dùng modal hoặc drawer.
- Query key rõ ràng: ["semesters"], ["subjects", semesterId], ["subject", id].
- Lazy-load dữ liệu tab khi user mở tab.
- Confirm dialog cho thao tác xóa.
```

## PROMPT 6 - Kế Hoạch, Task List Và Task Drawer

```text
Xây dựng:
- StudyPlanListPage: filter theo ngày/tuần/tháng/học kỳ/môn/mục tiêu, hiển thị priority, status và progress.
- TaskListPage: table/list với filter subject, status, priority, dueDate, search; pagination; sort.
- TaskDetailDrawer: mô tả, subtask checklist, file đính kèm, note liên quan, duplicate task, delete task.

Yêu cầu:
- Tick task/subtask dùng optimistic update và rollback nếu API lỗi.
- Bulk action: đổi trạng thái hoặc xóa nhiều task.
- Dùng responsive card list trên mobile.
```

## PROMPT 7 - Kanban Board

```text
Xây dựng KanbanPage bằng dnd-kit hoặc @hello-pangea/dnd.

UI:
- 4 cột: Chưa bắt đầu, Đang thực hiện, Đang chờ, Hoàn thành.
- Card có tên task, môn học, priority badge, due date, số subtask done/tổng.
- Thêm task nhanh ở đầu mỗi cột.
- Filter theo môn, priority, khoảng thời gian.
- Mobile scroll ngang.

Logic:
- GET /api/kanban/board.
- PATCH /api/kanban/move khi kéo thả.
- Optimistic update, đồng bộ lại nếu server lỗi.
```

## PROMPT 8 - Lịch Học Tập

```text
Xây dựng CalendarPage bằng FullCalendar React hoặc react-big-calendar.

Tính năng:
- View ngày/tuần/tháng.
- Hiển thị schedule, event, task due date, exam date.
- Màu theo type hoặc subject.colorHex.
- Click ô trống để tạo sự kiện.
- Kéo thả để đổi ngày/giờ.
- Modal thêm/sửa/xóa event/schedule.
- Thiết lập lặp none/daily/weekly và reminder.

Yêu cầu:
- Event detail popover hoặc drawer.
- Calendar trên mobile phải dễ đọc, không vỡ layout.
```

## PROMPT 9 - Goals Và Notifications

```text
Xây dựng:
- GoalListPage: card mục tiêu, progress bar, target/current, deadline countdown, filter status/type.
- Goal form: type, subject optional, targetValue, deadline.
- NotificationDropdown trong topbar.
- NotificationPage: list phân trang, filter unread, mark read, mark all read.
- Notification settings trong SettingsPage.

Yêu cầu:
- Click notification điều hướng đến entity liên quan nếu có.
- Empty state thân thiện.
```

## PROMPT 10 - Điểm Số Và GPA

```text
Xây dựng:
- GradePage trong SubjectDetailPage.
- GradeOverviewPage tổng hợp mọi môn.
- GpaOverviewPage theo học kỳ.

UI:
- Bảng GradeComponent: tên, trọng số, max score, điểm hiện tại, ngày thi.
- Cảnh báo nếu tổng trọng số khác 100%.
- Summary card: điểm hiện tại, điểm mục tiêu, điểm cần đạt, trạng thái khả thi.
- Recharts LineChart cho GPA qua các học kỳ.

Yêu cầu:
- Input điểm validate trong khoảng 0 đến maxScore.
- Auto-save hoặc nút Lưu rõ ràng.
```

## PROMPT 11 - Study Timer Và Pomodoro

```text
Xây dựng StudyTimerWidget đặt trong AppLayout.

Tính năng:
- Chọn môn học, ghi chú, bắt đầu/tạm dừng/tiếp tục/kết thúc.
- Pomodoro 25/5, nghỉ dài sau 4 phiên, tùy chỉnh phút.
- Thông báo trình duyệt hoặc âm thanh khi hết phiên.
- Persist trạng thái timer bằng Zustand persist/localStorage.
- Đồng bộ server định kỳ và khi kết thúc phiên.

Xây dựng StudyTimeStatsPage:
- Biểu đồ thời gian học theo ngày/tuần/tháng.
- Thời gian theo môn.
- Số phiên Pomodoro hoàn thành.
```

## PROMPT 12 - Tài Liệu Và Ghi Chú

```text
Documents:
- DocumentLibraryPage và tab Document trong SubjectDetailPage.
- Drag-drop upload bằng react-dropzone.
- Progress bar upload.
- Grid/list toggle.
- Filter subject, tag, type; search.
- Preview PDF/ảnh, download, rename, retag, delete.

Notes:
- NoteListPage dạng lưới.
- NoteEditorPage dùng TipTap.
- Hỗ trợ heading, bold, italic, list, link, image.
- Pin note, tag, gắn subject/task.
- Auto-save debounce 1-2 giây, hiển thị trạng thái đã lưu.
```

## PROMPT 13 - Statistics Và Export Report

```text
Xây dựng StatisticsPage.

Biểu đồ:
- Tiến độ học tập theo tuần.
- Tỷ lệ hoàn thành task.
- Thời gian học theo môn.
- Task hoàn thành vs quá hạn.
- Điểm số từng môn.
- Tiến độ mục tiêu.
- GPA theo học kỳ.

Tính năng:
- Filter khoảng thời gian: tuần, tháng, học kỳ, môn.
- Export report modal: weekly, monthly, semester, by subject; PDF hoặc Excel.
- Gọi API export và tự tải file về hoặc mở tab mới.
```

## PROMPT 14 - AI Schedule, Assistant, Flashcard

```text
SmartScheduleSuggestionPage:
- Form chọn task/môn/hạn nộp/độ khó/khung giờ rảnh.
- Gọi /api/ai/suggest-schedule.
- Hiển thị timeline theo ngày.
- Cho phép kéo chỉnh rồi áp dụng vào lịch.
- Warning khi lịch quá tải.

AiAssistantPage:
- UI chat, quick prompts, typing indicator, streaming nếu backend hỗ trợ.
- Gợi ý: tạo kế hoạch ôn thi, tóm tắt tài liệu, tạo flashcard.

Flashcard:
- FlashcardSetListPage CRUD bộ thẻ.
- FlashcardStudyPage flip card, đúng/sai, số thẻ cần ôn.
- Modal tạo flashcard bằng AI từ note/document.
```

## PROMPT 15 - Study Group Và Admin

```text
StudyGroupPage:
- Danh sách nhóm đã tham gia/tạo.
- Tạo nhóm, mời thành viên bằng email.
- StudyGroupDetailPage có tabs: task nhóm, tài liệu, lịch họp, thảo luận, tiến độ.
- Group task có Kanban nhỏ và avatar người được giao.

Admin:
- AdminDashboardPage: thống kê user, plan, task, document.
- AdminUserListPage: search, filter role/status, lock/unlock, reset password, role management.
- AdminSubjectTemplatePage: CRUD và import Excel có preview lỗi từng dòng.
- AdminContentPage: FAQ, guide, sample documents, system notification.
- AdminFeedbackPage: trả lời feedback, đổi trạng thái.
- AdminActivityLogPage: filter user/action/date.
```

## PROMPT 16 - Responsive, PWA Và Polish

```text
Rà soát toàn bộ frontend.

Yêu cầu:
- Responsive mobile/tablet/desktop.
- Sidebar mobile thành drawer hoặc bottom nav.
- Table thành card list trên mobile.
- Kanban scroll ngang.
- Calendar có mobile view dễ dùng.
- Thêm 404, ErrorBoundary, offline/network error page.
- Thêm vite-plugin-pwa, manifest, service worker cơ bản.
- Web Notification API cho notification mới nếu user cho phép.
- Tất cả destructive actions có confirm.
- Tất cả form có thông báo lỗi tiếng Việt rõ ràng.
- README hướng dẫn chạy frontend và toàn bộ stack.
- README có thêm hướng dẫn deploy Vercel: import GitHub repo, chọn root directory frontend nếu tách project, khai báo env và kiểm tra preview URL.

Checklist:
- `npm run build` pass.
- Không có text tràn khỏi button/card ở mobile.
- Loading, empty, error, success state đầy đủ.
```
