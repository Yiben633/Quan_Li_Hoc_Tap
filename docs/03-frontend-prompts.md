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
- Cấu hình design tokens bằng CSS variables, dùng được với Tailwind hoặc CSS
  hiện có; không hard-code màu trong component.
- Cấu hình proxy `/api` và `/uploads` cho môi trường local; ghi chú rõ rằng
  production phải proxy/serve được cả hai đường dẫn.

Checklist:
- Trang root render được.
- Routing hoạt động.
- API base URL đọc từ VITE_API_URL.
- SPA gọi được API và tải được avatar/file local qua `/uploads`.
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
- Dark/light/system phải có token riêng và đạt tương phản dễ đọc cho text,
  placeholder, icon, link, trạng thái active và disabled; không dùng xanh đậm
  trên nền xanh đậm.
- Icon-only button phải có accessible label/tooltip; form field phải liên kết
  đúng label, error và trạng thái loading.
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
- `remember me` lưu access token/user ở localStorage khi bật và sessionStorage
  khi tắt; logout phải xóa cả hai nơi. Không lưu password hoặc refresh token
  dạng plaintext trong storage.
- Không hiển thị lỗi chung chung nếu API trả lỗi validation, conflict hoặc
  database unavailable; map về thông báo thân thiện theo từng trường hợp.
- Sau login chuyển về Dashboard.
```

## PROMPT 3 - Settings Và Hồ Sơ Cá Nhân

Profile fields related to school, major, student code, and course year are
optional and must never block saving a profile. General-purpose context such as
occupation, learning purpose, preferred study style, or age group is optional,
collapsed by default, and should be shown only when it helps the user.

```text
Xây dựng SettingsPage với tabs:
- Hồ sơ: avatar, họ tên; trường, ngành, khóa học và mọi thông tin bối cảnh đều
  là tùy chọn. Không hỏi tuổi chính xác; nhóm tuổi/phong cách học chỉ là lựa
  chọn bổ sung, không được chặn nút lưu.
- Bảo mật: đổi mật khẩu.
- Giao diện: light/dark/system nếu muốn, lưu localStorage.
- Ngôn ngữ: cấu trúc sẵn cho vi/en.
- Múi giờ.
- Nhắc nhở: notification settings.

Yêu cầu:
- Upload avatar có crop/drag/zoom và preview trước khi gửi; khi user bấm “Dùng
  ảnh này”, tự động upload và cập nhật avatar, không yêu cầu bấm lưu lần hai.
- Khi chọn ảnh mới hoặc thay đổi profile, hiển thị nút Hủy và khôi phục đúng
  trạng thái trước đó. Nếu upload lỗi, giữ avatar cũ và hiển thị lỗi tiếng Việt.
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

## PROMPT 9 - Mục Tiêu Và Thông Báo

```text
Xây dựng module mục tiêu và thông báo dựa trên backend contract hiện có.

Goals:
- GoalListPage gọi API goals thật, có filter status/type, loading, empty, error
  và retry.
- Form tạo/sửa mục tiêu: type, targetValue, deadline; subject/topic chỉ là tùy
  chọn. Không yêu cầu academic context.
- Card hiển thị current/target, tiến độ do backend trả về, deadline và trạng
  thái. Không tự tính sai khác với backend.

Notifications:
- Topbar chỉ hiển thị notification thật từ `GET /api/notifications`.
- Không hard-code badge, số lượng hay nội dung mẫu.
- NotificationPage có phân trang, filter chưa đọc, đánh dấu một/tất cả đã đọc
  qua `PATCH /api/notifications/:id/read` và `/read-all`.
- Chỉ điều hướng đến entity nếu route của entity đó đã tồn tại; nếu chưa có,
  mở nội dung notification và không tạo link giả.
- Đồng bộ NotificationSettings trong SettingsPage với API hiện có; push chỉ bật
  sau khi người dùng cấp quyền trình duyệt.

Yêu cầu:
- React Query invalidate/sửa cache sau thao tác đọc hoặc cập nhật mục tiêu.
- Mọi empty/error state dùng ngôn ngữ trung tính, dễ hiểu.
- Không render link hoặc CTA dẫn vào ModulePlaceholderPage.
```

## PROMPT 10 - Đánh Giá Tiến Bộ Học Thuật (Tùy Chọn)

```text
Chỉ triển khai sau khi user chủ động bật academic context. Với người dùng tự
học hoặc học kỹ năng, module phải ẩn hoàn toàn thay vì hiện trạng thái thiếu dữ
liệu.

Xây dựng:
- AcademicSettings toggle có mô tả ngắn, có thể tắt mà không xóa các phần khác.
- GradeComponent table và GradeSummary theo API `/api/subjects/:subjectId` và
  `/api/grade-components` hiện có.
- GradeOverviewPage và GPA theo learning space khi có dữ liệu học thuật.

UI và logic:
- Validate điểm từ 0 đến maxScore; biểu diễn tổng weight khác 100% rõ ràng.
- Current average, required final score và tính khả thi lấy từ backend; frontend
  chỉ định dạng số và diễn giải.
- Tab Điểm số trong TopicDetailPage chỉ render khi academic context bật và API
  đã sẵn sàng. Không để tab “đang chuẩn bị”.
- Có loading, empty, error, success; mutation có toast tiếng Việt.
```

## PROMPT 11 - Phiên Tập Trung Và Pomodoro

```text
Triển khai StudyTimerWidget chỉ khi các endpoint study-session đã chạy được.
Không đưa nút “Bắt đầu học” vào dashboard/sidebar nếu luồng chưa hoàn chỉnh.

Tính năng:
- Start/pause/resume/end dùng `/api/study-sessions`; chọn chủ đề là tùy chọn.
- Pomodoro mặc định 25/5, nghỉ dài sau 4 focus sessions; cho phép cấu hình thời
  lượng với giới hạn hợp lý.
- Zustand persist/localStorage chỉ lưu trạng thái giao diện để phục hồi sau
  refresh; Postgres/Redis vẫn là nguồn trạng thái phiên chạy.
- Khi app mở lại, kiểm tra phiên active từ backend trước khi tiếp tục đếm.
- Browser notification/âm thanh là opt-in và luôn có fallback im lặng.

StudyTimeStatsPage:
- Gọi `/api/statistics/study-time`, filter day/week/month và topic tùy chọn.
- Chart không tự tạo data mẫu; hiển thị empty state khi chưa có phiên học.
```

## PROMPT 12 - Tài Liệu Và Ghi Chú

```text
Triển khai theo đúng API Documents/Notes hiện có, không tạo endpoint mới nếu
chưa có backend contract.

Documents:
- DocumentLibraryPage có search, filter learning space/topic/task/tag/type,
  phân trang và grid/list toggle.
- Upload dùng giới hạn MIME/dung lượng từ backend/env; có progress, cancel/error
  và rollback UI khi upload lỗi.
- Preview chỉ cho loại browser hỗ trợ (PDF/ảnh); download, đổi tên, tag, liên
  kết chủ đề/task và xóa đều có ownership/error state rõ ràng.

Notes:
- NoteListPage, editor rich text và pin/tag/liên kết topic/task tùy chọn.
- Sanitize preview trước khi render; autosave debounce chỉ chạy sau khi người
  dùng thay đổi và phải hiển thị “Đang lưu/Đã lưu/Lỗi lưu”.
- Chỉ thêm tab Tài liệu/Ghi chú vào TopicDetailPage khi tab có nội dung thật.
```

## PROMPT 13 - Thống Kê Và Xuất Báo Cáo

```text
Xây dựng StatisticsPage sau khi dữ liệu task, session và goals đã ổn định.

- Gọi các endpoint statistics/reports thật; kiểm tra response trước khi vẽ chart.
- Filter range, learning space và topic là tùy chọn, có query key ổn định và
  timezone `Asia/Ho_Chi_Minh` cho nhãn ngày.
- Hiển thị task hoàn thành/quá hạn, thời gian tập trung, tiến độ mục tiêu; số
  liệu điểm/GPA chỉ xuất hiện khi academic context bật.
- Export modal chỉ hiển thị format backend hỗ trợ; trạng thái đang tạo file,
  download thành công và lỗi cần rõ ràng.
- Không dùng dữ liệu mock hoặc biểu đồ trống nhưng vẫn có legend/số liệu giả.
```

## PROMPT 14 - AI Lập Kế Hoạch, Trợ Lý Và Flashcard

```text
Đây là module opt-in. Chỉ render navigation khi provider AI và các endpoint
backend tương ứng được cấu hình.

Smart schedule:
- Gọi `/api/ai/suggest-schedule` và `/api/ai/reschedule` với task/chủ đề tùy
  chọn, hạn và khung giờ rảnh.
- Hiển thị cảnh báo quá tải từ response; người dùng phải xem và xác nhận trước
  khi áp dụng thay đổi vào Calendar.

AI assistant:
- Chat có trạng thái gửi/stream/lỗi/rate-limit và nút dừng nếu backend hỗ trợ.
- Không gửi tài liệu hoặc thông tin nhạy cảm nếu chưa có consent rõ ràng.
- Nhắc hành động theo ngôn ngữ trung tính: lập kế hoạch kỹ năng, tóm tắt tài
  liệu, chia mục tiêu, tạo thẻ; “ôn thi” chỉ là một ví dụ.

Flashcard:
- CRUD bộ thẻ, review đúng/sai, due queue và optimistic update có rollback.
- Tạo từ AI chỉ là một tùy chọn; luôn có form tạo thủ công.
```

## PROMPT 15 - Nhóm Chia Sẻ Và Quản Trị

```text
StudyGroup:
- Nhóm mặc định riêng tư; mời thành viên bằng email qua flow xác nhận an toàn.
- Không hiển thị công khai email, nhóm tuổi, trường hoặc dữ liệu nhạy cảm.
- Group detail chỉ có tab nào đã có API và dữ liệu thật: task nhóm, lịch họp,
  tài liệu, thảo luận hoặc tiến độ.
- Kanban nhóm chỉ thao tác trên dữ liệu group có ownership/membership check.

Admin:
- Tất cả route, link sidebar và API mutation phải được bọc AdminRoute/
  `authorize(['admin'])`; người dùng thường không thấy mục Quản trị.
- Các trang user/template/content/feedback/activity log phải có pagination,
  search, confirm destructive action và audit feedback.
- Đổi nhãn SubjectTemplate thành TopicTemplate trong UI khi academic context
  không được dùng; không đổi backend contract trong prompt này.
```

## PROMPT 16 - Chất Lượng, Responsive, PWA Và Kiểm Thử

```text
Rà soát toàn bộ frontend sau khi các module cốt lõi đã hoạt động.

Chất lượng UX:
- Responsive mobile/tablet/desktop; sidebar mobile là drawer/bottom navigation,
  list/table chuyển card, Kanban scroll ngang và Calendar có view dễ đọc.
- Mọi destructive action có ConfirmDialog trong app, không dùng `window.confirm`.
- Mọi form có validation tiếng Việt, loading, disabled, success và error state.
- Không có navigation/link/button giả: route chưa triển khai thì không render
  CTA. Không để tab “đang chuẩn bị” trong luồng chính.
- Dùng semantic CSS variables `--canvas`, `--surface`, `--ink`, `--muted`,
  `--line`, `--blue`, `--success`, `--warning`, `--danger`; kiểm tra contrast
  cả light/dark thay vì phủ lớp màu từng component.
- Thêm ErrorBoundary/errorElement và trang offline/network error thân thiện.

PWA và quyền:
- Chỉ thêm `vite-plugin-pwa`, manifest và service worker sau khi cache strategy
  được xác định; không cache response cá nhân nhạy cảm bừa bãi.
- Web Notification API là opt-in và phải đồng bộ với notification settings.

Kiểm thử:
- Thêm Vitest, React Testing Library và jsdom, scripts `test`/`test:watch`.
- Có test tối thiểu cho route guard, greeting theo giờ Việt Nam, task form
  validation và helper timezone Calendar.
- Kiểm tra thủ công ba persona: trẻ tự học có người hỗ trợ, người trưởng thành
  học kỹ năng, và người dùng academic theo dõi GPA.

Tài liệu:
- README hướng dẫn chạy frontend/toàn stack và Vercel (root directory, env,
  preview URL). Không thu thập hoặc hiển thị dữ liệu trẻ em quá mức cần thiết.

Checklist:
- `npm run lint`, `npm run test` và `npm run build` pass.
- Không có text tràn button/card trên mobile.
- Loading, empty, error, success state đầy đủ ở các route đã công bố.
```
