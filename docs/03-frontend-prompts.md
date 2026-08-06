# PROMPT VIBECODE - FRONTEND LAYER

Hệ thống: **Quản lý và lập kế hoạch học tập cho mọi người ở mọi độ tuổi**
Stack: React, Vite, TypeScript, TailwindCSS, React Query, Zustand, Docker.

Ghi chú deploy: Docker/Nginx dùng cho local hoặc self-host. Với production trên Vercel, Vite React có thể deploy trực tiếp bằng build command `npm run build`, output `dist`, và biến môi trường public phải có prefix `VITE_`.

Giả định: backend đã có API tương ứng. Làm từng prompt theo thứ tự, chạy `npm run dev` và kiểm tra UI sau mỗi bước.

## Product Scope

StudyFlow là không gian học tập và lập kế hoạch cá nhân cho mọi độ tuổi, hoàn
cảnh và mục đích. Các dữ liệu học thuật như trường, mã học viên, ngành, khóa,
học kỳ, chủ đề/môn học và điểm số đều là tùy chọn. Người dùng phải có thể đăng
ký và sử dụng task, mục tiêu, lịch, ghi chú, tài liệu và phiên học mà không cần
nhập bất kỳ thông tin trường lớp nào.

## Product Principles

- Registration and the first dashboard must work for a child, teenager, adult,
  lifelong learner, hobby learner, or professional without school information.
- Use neutral labels such as “không gian học”, “chủ đề”, “mục tiêu”, “kế hoạch”
  and “phiên học” in the primary UI. Use “học kỳ”, “môn học”, “điểm số” and
  “GPA” only when the user has enabled an academic context.
- Do not assume that every user has exams, grades, a teacher, a class, a school,
  or a fixed academic calendar.
- Optional fields must stay optional in forms, filters, empty states, API
  payloads, and navigation. An empty academic context must never look like an
  error or an incomplete account.
- Prefer age-neutral language and avoid collecting a child's exact age unless a
  future feature genuinely needs it. If a child-oriented mode is added, keep
  data collection minimal and provide clear guardian/privacy safeguards.
- Every feature should have a useful empty state for self-directed learning:
  reading, languages, skills, certifications, hobbies, work training, or exam
  preparation are all valid use cases.

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
- Dùng motion nhẹ và gradient có chủ đích: hover/focus 150-220ms, progress/card
  animation tiết chế, gradient xanh kết hợp mint/amber; không làm giảm khả năng
  đọc dữ liệu.
- Tôn trọng `prefers-reduced-motion` và giữ animation không bắt buộc để thao tác.
```

## PROMPT 2 - Auth Pages

```text
Xây dựng:
- RegisterPage: fullName, email, password, confirmPassword. Không yêu cầu và
  không hỏi thông tin trường lớp trong lúc đăng ký.
- Có thể bổ sung bối cảnh sau: studentCode, school, major, courseYear,
  occupation, learning purpose; mọi trường đều tùy chọn.
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

Profile fields related to school, major, student code, and course year are
optional and must never block saving a profile. Add general-purpose fields such
as occupation, learning purpose, preferred study style, or age group only when
they are useful to the user.

```text
Xây dựng SettingsPage với tabs:
- Hồ sơ: avatar, họ tên; trường, ngành, khóa học và các thông tin bối cảnh khác đều là tùy chọn.
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
- Chủ đề hoặc không gian học đang theo dõi, hiển thị màu theo subject.colorHex
  khi có liên kết; không yêu cầu user phải tạo subject.
- Lịch học và hạn nộp gần nhất 5 mục.
- Mục tiêu active với progress bar.
- Quick actions: tạo mục tiêu, tạo kế hoạch, tạo task, mở lịch, bắt đầu phiên
  học và mở Kanban. Chỉ hiển thị “tạo học kỳ” hoặc “tạo môn” trong academic
  context.

Yêu cầu:
- Skeleton khi loading.
- Empty state nếu user chưa có dữ liệu.
- Error state có nút thử lại.
```

## PROMPT 5 - Không Gian Học Và Chủ Đề

```text
Xây dựng:
- LearningSpaceListPage: card/table, filter status, thêm/sửa/xóa mềm, lưu trữ
  và sao chép không gian học. Có thể map tới Semester API khi user dùng
  academic context.
- TopicListPage: filter theo learning space nếu có, search, status; grid card
  theo màu chủ đề. Có thể map tới Subject API nhưng không được yêu cầu
  semesterId.
- TopicDetailPage: tabs Lịch, Bài tập, Tài liệu, Tiến độ, Ghi chú và Thời gian
  học. Tab Điểm số chỉ hiển thị khi user bật academic context.

Yêu cầu:
- Form dùng modal hoặc drawer.
- Query key rõ ràng và hỗ trợ dữ liệu không có context: ["semesters"],
  ["subjects", { learningSpaceId }], ["subject", id].
- Giữ nguyên backend contract hiện có (`/api/semesters`, `/api/subjects` và
  `semesterId`) khi gọi API; chỉ đổi nhãn hiển thị và adapter ở frontend,
  không tự ý tạo endpoint mới trong prompt này.
- Lazy-load dữ liệu tab khi user mở tab.
- Confirm dialog cho thao tác xóa.
```

## PROMPT 6 - Kế Hoạch, Task List Và Task Drawer

```text
Xây dựng:
- StudyPlanListPage: filter theo ngày/tuần/tháng, không gian học/chủ đề nếu có,
  mục tiêu, priority, status và progress.
- TaskListPage: table/list với filter topic nếu có, status, priority, dueDate,
  search; pagination; sort. Không yêu cầu user phải gắn task vào subject.
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
- Card có tên task, chủ đề hoặc không gian học nếu có, priority badge, due date,
  số subtask done/tổng.
- Thêm task nhanh ở đầu mỗi cột, không mở form học thuật bắt buộc.
- Filter theo chủ đề nếu có, priority, khoảng thời gian.
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
- Hiển thị schedule, event, task due date và exam date nếu có.
- Màu theo type hoặc subject.colorHex khi một sự kiện có liên kết chủ đề.
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

## PROMPT 10 - Đánh Giá Tiến Bộ (Tùy Chọn)

```text
Xây dựng module đánh giá tiến bộ như một tính năng tùy chọn, không xuất hiện
như lỗi thiếu dữ liệu với người dùng tự học:
- EvaluationPage trong TopicDetailPage khi academic context được bật.
- GradeOverviewPage tổng hợp các topic có grade component.
- GpaOverviewPage theo learning space chỉ dành cho người dùng muốn theo dõi
  GPA.

UI:
- Bảng GradeComponent: tên, trọng số, max score, điểm hiện tại, ngày thi.
- Cảnh báo nếu tổng trọng số khác 100%.
- Summary card: điểm hiện tại, điểm mục tiêu, điểm cần đạt, trạng thái khả thi.
- Recharts LineChart cho điểm/GPA qua các learning space khi có dữ liệu.

Yêu cầu:
- Input điểm validate trong khoảng 0 đến maxScore; không bắt buộc nhập điểm để
  sử dụng các phần còn lại của ứng dụng.
- Auto-save hoặc nút Lưu rõ ràng.
```

## PROMPT 11 - Study Timer Và Pomodoro

```text
Xây dựng StudyTimerWidget đặt trong AppLayout.

Tính năng:
- Chọn chủ đề nếu có, ghi chú, bắt đầu/tạm dừng/tiếp tục/kết thúc. Người dùng
  vẫn có thể bắt đầu phiên học mà không cần chọn chủ đề.
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
- Filter learning space/chủ đề nếu có, tag, type; search.
- Preview PDF/ảnh, download, rename, retag, delete.

Notes:
- NoteListPage dạng lưới.
- NoteEditorPage dùng TipTap.
- Hỗ trợ heading, bold, italic, list, link, image.
- Pin note, tag, gắn learning space/chủ đề/task nếu có.
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
- Điểm số theo chủ đề nếu user có bật academic context.
- Tiến độ mục tiêu.
- GPA theo learning space nếu user có sử dụng tính năng GPA.

Tính năng:
- Filter khoảng thời gian: tuần, tháng, learning space, chủ đề.
- Export report modal: weekly, monthly, learning space, by topic; PDF hoặc
  Excel. Các bộ lọc điểm/GPA là tùy chọn.
- Gọi API export và tự tải file về hoặc mở tab mới.
```

## PROMPT 14 - AI Schedule, Assistant, Flashcard

```text
SmartScheduleSuggestionPage:
- Form chọn task/chủ đề tùy chọn/hạn hoàn thành/độ khó/khung giờ rảnh.
- Gọi /api/ai/suggest-schedule.
- Hiển thị timeline theo ngày.
- Cho phép kéo chỉnh rồi áp dụng vào lịch.
- Warning khi lịch quá tải và đề xuất chia nhỏ phiên học phù hợp với thời gian
  tập trung của người dùng.

AiAssistantPage:
- UI chat, quick prompts, typing indicator, streaming nếu backend hỗ trợ.
- Gợi ý: tạo kế hoạch học một kỹ năng, tóm tắt tài liệu, tạo flashcard, chia
  mục tiêu thành các bước nhỏ. “Ôn thi” chỉ là một ví dụ tùy chọn.

Flashcard:
- FlashcardSetListPage CRUD bộ thẻ.
- FlashcardStudyPage flip card, đúng/sai, số thẻ cần ôn.
- Modal tạo flashcard bằng AI từ note/document.
```

## PROMPT 15 - Study Group Và Admin

```text
StudyGroupPage:
- Danh sách nhóm đã tham gia/tạo, với lựa chọn nhóm học riêng tư hoặc chia sẻ.
- Tạo nhóm, mời thành viên bằng email.
- StudyGroupDetailPage có tabs: task nhóm, tài liệu, lịch họp, thảo luận, tiến độ.
- Không hiển thị công khai email, tuổi hoặc thông tin trường của thành viên.
  Nếu hỗ trợ người dùng nhỏ tuổi, cần trạng thái riêng tư mặc định và cơ chế
  mời an toàn.
- Group task có Kanban nhỏ và avatar người được giao.

Admin:
- AdminDashboardPage: thống kê user, plan, task, document.
- AdminUserListPage: search, filter role/status, lock/unlock, reset password, role management.
- AdminSubjectTemplatePage: CRUD và import Excel có preview lỗi từng dòng; đổi
  tên hiển thị thành TopicTemplate nếu sản phẩm không dùng academic context.
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
- Rà soát toàn bộ copy: không mặc định user là sinh viên, không gọi mọi mục
  tiêu là ôn thi, và không ép tạo học kỳ/môn học/điểm số.
- Kiểm tra các luồng cho ba persona tối thiểu: trẻ tự học có người hỗ trợ,
  người trưởng thành học kỹ năng, và người dùng academic muốn theo dõi GPA.
- Không thu thập hoặc hiển thị dữ liệu trẻ em quá mức cần thiết; thêm privacy
  note và trạng thái lỗi thân thiện nếu một tính năng cần quyền người giám hộ.
- README hướng dẫn chạy frontend và toàn bộ stack.
- README có thêm hướng dẫn deploy Vercel: import GitHub repo, chọn root directory frontend nếu tách project, khai báo env và kiểm tra preview URL.

Checklist:
- `npm run build` pass.
- Không có text tràn khỏi button/card ở mobile.
- Loading, empty, error, success state đầy đủ.
```
