# VIBECODE — STUDYFLOW FRONTEND FIX PLAN

> Dự án: StudyFlow — Website quản lý kế hoạch học tập cá nhân cho sinh viên  
> Repository: `Yiben633/Quan_Li_Hoc_Tap`  
> Phạm vi: `frontend/`  
> Mục tiêu: sửa lỗi hiện có, làm navigation rõ ràng hơn, hoàn thiện các trang quan trọng và tối ưu UX mà không phá vỡ API/backend hiện tại.

---

# 0. NGUYÊN TẮC CHUNG CHO AI

Trước khi sửa bất kỳ file nào:

1. Đọc cấu trúc `frontend/src`.
2. Không tự ý đổi API endpoint.
3. Không đổi cấu trúc response từ backend.
4. Không xóa chức năng đang hoạt động.
5. Không đổi tên field backend nếu chưa cần thiết.
6. Không refactor toàn bộ project trong một lần.
7. Chỉ sửa đúng phạm vi task đang thực hiện.
8. Giữ nguyên stack hiện tại:
   - React
   - TypeScript
   - React Router
   - React Query
   - Zustand
   - React Hook Form
   - Zod
9. Tận dụng component dùng chung hiện có trước khi tạo component mới.
10. Sau mỗi task:
    - kiểm tra TypeScript
    - kiểm tra lint
    - kiểm tra build
    - không để console error
    - không để unused import
11. Giao diện phải responsive.
12. Các button chưa có chức năng thật:
    - hoặc triển khai
    - hoặc tạm ẩn
    - không để người dùng click vào chức năng giả.
13. Không hard-code dữ liệu nếu API tương ứng đã tồn tại.
14. Không thay đổi backend trong các task frontend trừ khi được yêu cầu rõ.
15. Khi sửa xong mỗi task, liệt kê:
    - file đã sửa
    - nội dung đã sửa
    - lỗi đã xử lý
    - bước test thủ công.

---

# PHASE 1 — SỬA LỖI NỀN TẢNG

## TASK 01 — Sửa duplicate routes

### File cần kiểm tra

```text
frontend/src/routes/config.tsx
```

### Prompt cho AI

```text
Đọc toàn bộ frontend/src/routes/config.tsx.

Hiện project có khả năng khai báo trùng route:
- /tasks
- /study-plans

Hãy:

1. Tìm tất cả route có path `tasks`.
2. Chỉ giữ route sử dụng `TasksPage`.
3. Xóa route placeholder trùng.
4. Tìm tất cả route có path `study-plans`.
5. Chỉ giữ route sử dụng `StudyPlansPage`.
6. Xóa route placeholder trùng.
7. Không thay đổi các route khác nếu không cần thiết.
8. Không đổi logic ProtectedRoute hoặc role guard.
9. Kiểm tra lại import sau khi xóa route để không còn unused import.
10. Chạy TypeScript/build check.

Sau khi hoàn tất, giải thích ngắn:
- route nào bị trùng
- route nào được giữ
- route nào bị xóa.
```

### Acceptance Criteria

- `/tasks` chỉ có một route.
- `/study-plans` chỉ có một route.
- Không còn route conflict.
- Build thành công.
- Không có unused import.

---

## TASK 02 — Sửa lỗi `subjectId` trong Kanban

### File

```text
frontend/src/pages/KanbanPage.tsx
```

### Prompt cho AI

```text
Đọc toàn bộ KanbanPage.tsx.

Kiểm tra component `KanbanColumn`.

Hiện component có prop `subjectId?: string`, nhưng cần kiểm tra xem `subjectId`
đã được destructure từ props hay chưa trước khi sử dụng bên trong component.

Hãy:

1. Sửa destructuring props của KanbanColumn để nhận đúng:
   - column
   - tasks
   - subjectId
2. Không đổi logic drag-and-drop hiện tại.
3. Không đổi kiểu dữ liệu KanbanTask nếu không cần.
4. Không đổi API.
5. Kiểm tra tất cả nơi gọi KanbanColumn.
6. Đảm bảo `subjectId` có thể undefined.
7. Không thêm `any`.
8. Chạy TypeScript/build check.

Nếu phát hiện lỗi liên quan khác trong cùng component gây build fail,
được phép sửa nhưng phải ghi rõ.
```

### Acceptance Criteria

- Không còn lỗi `subjectId is not defined`.
- Kanban vẫn drag-and-drop bình thường.
- Tạo task từ cột vẫn hoạt động.
- Build thành công.

---

## TASK 03 — Chuẩn hóa timezone Calendar

### File

```text
frontend/src/pages/CalendarPage.tsx
```

### Mục tiêu

Toàn bộ thời gian hiển thị cho người dùng dùng:

```text
Asia/Ho_Chi_Minh
```

Backend/API có thể lưu UTC nhưng UI phải luôn hiển thị đúng giờ Việt Nam.

### Prompt cho AI

```text
Đọc toàn bộ CalendarPage.tsx và các helper date/time mà file đang sử dụng.

Hãy kiểm tra đặc biệt:
- getUTCHours()
- getUTCMinutes()
- new Date(...)
- chuỗi timezone +07:00
- format ngày giờ khi edit event
- format ngày giờ khi tạo event
- drag/drop event

Mục tiêu:
- API/backend có thể dùng UTC.
- Form trên frontend phải hiển thị giờ Việt Nam.
- Khi submit phải chuyển đổi nhất quán.
- Edit một event không được làm thay đổi giờ nếu người dùng không sửa thời gian.

Ví dụ:
Event hiển thị 09:00.
Mở Edit phải vẫn là 09:00.
Save không sửa gì thì event vẫn là 09:00.

Yêu cầu:

1. Tạo hoặc tái sử dụng helper rõ ràng để:
   - chuyển API datetime -> local form datetime
   - chuyển local form datetime -> API datetime
2. Không rải logic timezone ở nhiều nơi nếu có thể gom helper.
3. Không dùng getUTCHours() trực tiếp để fill input local nếu điều đó gây lệch giờ.
4. Giữ nguyên timezone Asia/Ho_Chi_Minh.
5. Kiểm tra create.
6. Kiểm tra edit.
7. Kiểm tra drag/drop.
8. Kiểm tra event qua ngày mới.
9. Kiểm tra event 00:00.
10. Kiểm tra event 23:30.
11. Không đổi API endpoint.
12. Không đổi UI ngoài phần cần thiết.

Sau khi sửa hãy mô tả cách xử lý timezone mới.
```

### Test Cases bắt buộc

```text
TC01
Tạo event 09:00 → hiển thị 09:00.

TC02
Mở event 09:00 → Edit → form hiển thị 09:00.

TC03
Edit event 09:00 → không đổi gì → Save → vẫn 09:00.

TC04
Event 23:30 không bị chuyển sang ngày khác.

TC05
Event 00:00 hiển thị đúng ngày.

TC06
Drag event sang ngày khác giữ nguyên giờ nếu logic hiện tại yêu cầu.
```

---

# PHASE 2 — NAVIGATION & LAYOUT

## TASK 04 — Sửa Sidebar

### File

```text
frontend/src/components/Sidebar.tsx
```

### Mục tiêu UX

Sidebar cần rõ ràng hơn và phù hợp với website dành cho sinh viên.

### Cấu trúc mong muốn

```text
TỔNG QUAN
- Tổng quan

HỌC TẬP
- Kế hoạch
- Công việc
- Lịch
- Môn học

TIẾN ĐỘ
- Mục tiêu
- Tập trung
- Thống kê

TÀI KHOẢN
- Cài đặt

QUẢN TRỊ
- Quản trị
  chỉ hiển thị nếu user có role admin
```

### Prompt cho AI

```text
Đọc Sidebar.tsx và kiểm tra route hiện tại trước khi sửa.

Hãy tối ưu sidebar theo yêu cầu:

1. Giữ Dashboard/Tổng quan.
2. Thêm link Kế hoạch tới `/study-plans`.
3. Giữ Công việc.
4. Không cần để Kanban là mục cấp 1 nếu Kanban sẽ được đưa thành tab của Công việc.
5. Giữ Lịch.
6. Đổi label "Không gian học" thành "Môn học" nếu route hiện tại vẫn dùng URL cũ thì chỉ đổi label UI, không bắt buộc đổi URL.
7. Thêm Mục tiêu chỉ khi route có thể sử dụng.
8. Giữ Tập trung nếu module hoạt động; nếu đang placeholder thì tạm ẩn.
9. Thêm Thống kê khi route thực tế tồn tại; nếu chưa có thì tạm ẩn.
10. Giữ Cài đặt.
11. Chỉ hiển thị `Quản trị` khi user có role `admin`.
12. Không để user thường nhìn thấy link admin.
13. Giữ responsive/mobile sidebar đang có.
14. Giữ active state.
15. Không đổi auth store nếu không cần.

Nếu route Goals/Study/Statistics vẫn chỉ là placeholder,
ưu tiên TẠM ẨN khỏi sidebar thay vì hiển thị chức năng chưa hoạt động.

Không xóa route, chỉ thay đổi navigation.
```

### Acceptance Criteria

- User thường không thấy Admin.
- Admin vẫn thấy Admin.
- Có Kế hoạch.
- Navigation không dẫn tới placeholder từ sidebar.
- Mobile sidebar vẫn hoạt động.

---

## TASK 05 — Gộp List + Kanban thành cùng module Công việc

### Files cần kiểm tra

```text
frontend/src/pages/TasksPage.tsx
frontend/src/pages/KanbanPage.tsx
frontend/src/routes/config.tsx
frontend/src/components/Sidebar.tsx
```

### Mục tiêu

Không để người dùng hiểu `Tasks` và `Kanban` là hai chức năng khác nhau.

### UX mong muốn

```text
CÔNG VIỆC

[ Danh sách ] [ Kanban ]

--------------------------------
Nội dung view tương ứng
```

### Prompt cho AI

```text
Hãy thiết kế lại navigation của module Công việc theo hướng:

- `/tasks` là entry chính.
- Người dùng có thể chuyển giữa:
  - Danh sách
  - Kanban

Ưu tiên phương án ít thay đổi code nhất.

Có thể chọn một trong hai:
A. Tabs bên trong TasksPage.
B. Route con `/tasks` và `/tasks/kanban`.

Yêu cầu:

1. Không duplicate logic task.
2. Không copy toàn bộ KanbanPage vào TasksPage.
3. Tái sử dụng component/page hiện có.
4. Sidebar chỉ có một mục `Công việc`.
5. Khi chuyển List ↔ Kanban phải rõ active state.
6. Giữ nguyên chức năng drag-and-drop Kanban.
7. Giữ nguyên filter/list hiện tại.
8. Không phá deep-link cũ `/kanban` nếu đang được sử dụng:
   - có thể redirect `/kanban` -> `/tasks/kanban`
   - hoặc giữ compatibility route.
9. Không đổi API.
10. Responsive trên mobile.
```

---

# PHASE 3 — DASHBOARD

## TASK 06 — Tối ưu Dashboard

### File

```text
frontend/src/pages/DashboardPage.tsx
```

### Mục tiêu

Dashboard phải trả lời được 3 câu:

```text
1. Hôm nay tôi cần làm gì?
2. Việc nào sắp đến hạn?
3. Tiến độ học tập hiện tại thế nào?
```

### Prompt cho AI

```text
Đọc DashboardPage.tsx.

Không redesign toàn bộ.
Giữ style hiện tại nhưng tối ưu hierarchy.

Yêu cầu:

1. Greeting theo thời gian:
   - 05:00–11:59: Chào buổi sáng
   - 12:00–17:59: Chào buổi chiều
   - 18:00–04:59: Chào buổi tối

2. Giữ 4 stat cards quan trọng.
3. DashboardSkeleton phải có đúng 4 stat cards.
4. Ưu tiên section `Việc cần làm hôm nay`.
5. Giữ `Lịch sắp tới`.
6. Giữ chart tiến độ nếu data thật đang có.
7. Giảm hoặc bỏ section Quick Actions nếu bị lặp navigation.
8. Không hiển thị CTA dẫn tới placeholder.
9. Nếu Goals/Study chưa hoàn thiện:
   - tạm ẩn CTA `Tạo mục tiêu`
   - tạm ẩn CTA `Bắt đầu học` hoặc `Tập trung`
10. Không hard-code dữ liệu giả nếu API đã có.
11. Empty state phải có CTA phù hợp.
12. Responsive.

Không thay đổi API.
```

### Dashboard đề xuất

```text
Xin chào, [Tên]

[Việc hôm nay] [Hoàn thành] [Quá hạn] [Giờ học]

Việc cần làm hôm nay
- Task A
- Task B
- Task C

Tiến độ tuần         Lịch sắp tới
[Chart]               [Events]

Mục tiêu đang theo dõi
```

---

# PHASE 4 — TASKS

## TASK 07 — Tối ưu form tạo Task

### File

```text
frontend/src/pages/TasksPage.tsx
```

### Prompt cho AI

```text
Đọc form tạo/edit task hiện tại trong TasksPage.tsx.

Giữ các field hiện có và bổ sung nếu backend/API đã hỗ trợ:

- subjectId / môn học
- studyPlanId / kế hoạch học tập

Form đề xuất:

Tên công việc *
Mô tả
Môn học
Kế hoạch
Hạn hoàn thành
Độ ưu tiên

Yêu cầu:

1. Không thêm field nếu backend hoàn toàn không hỗ trợ mà không có cách an toàn.
2. Nếu type/API đã có subjectId hoặc studyPlanId thì kết nối vào form.
3. Dropdown môn học lấy dữ liệu thật.
4. Dropdown kế hoạch lấy dữ liệu thật.
5. Cho phép không chọn.
6. Edit task hiển thị đúng giá trị hiện tại.
7. Validation bằng Zod nếu project đang dùng Zod.
8. Không tạo duplicate form component nếu đã có component chung.
```

---

## TASK 08 — Confirm khi Bulk Delete

### File

```text
frontend/src/pages/TasksPage.tsx
```

### Prompt cho AI

```text
Hiện bulk delete task cần được bảo vệ bằng confirmation.

Hãy:

1. Khi user chọn nhiều task và bấm Delete:
   - không xóa ngay.
2. Hiển thị ConfirmDialog.
3. Nội dung:
   `Xóa {n} công việc?`
4. Mô tả:
   `{n} công việc được chọn sẽ bị xóa.`
5. Button:
   - Hủy
   - Xóa {n} công việc
6. Chỉ toast success khi tất cả request delete hoàn tất thành công.
7. Nếu có request fail:
   - hiển thị error phù hợp
   - không báo success giả.
8. Disable button khi đang processing.
9. Clear selection sau khi thao tác thành công.
10. Không thay đổi delete single task.
```

---

# PHASE 5 — STUDY PLANS

## TASK 09 — Hoàn thiện StudyPlansPage

### File

```text
frontend/src/pages/StudyPlansPage.tsx
```

### Đây là TASK lớn, nên làm riêng.

### Chức năng tối thiểu

```text
- Danh sách kế hoạch
- Tạo
- Sửa
- Xóa
- Xem chi tiết
- Filter status
- Progress
```

### Prompt cho AI

```text
Đọc StudyPlansPage.tsx và API/service/type liên quan đến study plan.

Không viết backend mới nếu API đã tồn tại.

Hãy hoàn thiện StudyPlansPage theo MVP:

1. Button `+ Tạo kế hoạch` phải hoạt động.
2. Empty state button `Tạo kế hoạch` phải hoạt động.
3. Tạo modal/drawer form.
4. Field:
   - name/title *
   - description
   - startDate
   - endDate
   - priority
   - subjectId nếu backend hỗ trợ
5. Validation:
   - tên bắt buộc
   - endDate >= startDate
6. Edit plan.
7. Delete plan có confirmation.
8. Card hiển thị:
   - tên
   - ngày bắt đầu/kết thúc
   - priority
   - status
   - progress
   - số task hoàn thành / tổng task nếu dữ liệu có
9. Click card hoặc button `Xem chi tiết`.
10. Không hard-code progress nếu API có data.
11. Loading state.
12. Error state.
13. Empty state.
14. React Query invalidation sau create/update/delete.
15. Toast thành công/thất bại.
16. Responsive.

Không tạo mock API.
Không đổi backend response.
```

---

# PHASE 6 — MÔN HỌC

## TASK 10 — Đổi wording "Không gian học / Chủ đề"

### Files cần tìm

```text
LearningSpacesPage.tsx
TopicDetailPage.tsx
Sidebar.tsx
các component liên quan
```

### Mục tiêu

UI dành cho sinh viên nên dùng terminology quen thuộc:

```text
Không gian học → Học kỳ hoặc Môn học
Chủ đề → Môn học
```

### Prompt cho AI

```text
Tìm toàn bộ text hiển thị:
- Không gian học
- Chủ đề

Không tự ý đổi database entity hoặc API field.

Chỉ đổi wording UI để sinh viên dễ hiểu hơn.

Ưu tiên mapping:

Nếu LearningSpace đại diện một học kỳ:
- "Không gian học" -> "Học kỳ"

Nếu Topic đại diện môn học:
- "Chủ đề" -> "Môn học"

Không đổi URL/API/type name trong lần này nếu điều đó có nguy cơ phá code.

Ví dụ:
`topicId` vẫn giữ nguyên trong code.
Nhưng UI có thể hiển thị `Môn học`.

Kiểm tra:
- sidebar
- heading
- empty state
- button
- breadcrumb
- modal
- toast
```

---

## TASK 11 — Tối giản TopicDetailPage

### File

```text
frontend/src/pages/TopicDetailPage.tsx
```

### Prompt cho AI

```text
TopicDetailPage hiện có nhiều tab nhưng nhiều tab chỉ là placeholder.

Hãy:

1. Xác định tab nào có chức năng thật.
2. Chỉ hiển thị tab hoạt động.
3. Tạm ẩn các tab chưa hoàn thiện.
4. Không xóa code backend/service.
5. Không xóa route liên quan nếu chưa cần.
6. Không hiển thị "Khu vực đang được chuẩn bị" cho 5-6 tab cùng lúc.
7. Giữ `Tổng quan`.
8. Nếu task integration đã hoạt động thì giữ `Công việc/Bài tập`.
9. Các tab sau chỉ bật khi có functionality thật:
   - Điểm
   - Tài liệu
   - Ghi chú
   - Thời gian học
   - Lịch
10. Responsive.

Mục tiêu: người dùng không thấy chức năng giả.
```

---

# PHASE 7 — TOPBAR

## TASK 12 — Sửa Topbar

### File

```text
frontend/src/components/Topbar.tsx
```

### Prompt cho AI

```text
Đọc Topbar.tsx.

Hãy sửa các vấn đề UX sau:

1. Nếu link Settings đang dùng:
   <a href="/settings">
   hãy đổi sang React Router:
   <Link to="/settings">

2. Search:
   - nếu chưa có logic search thật, tạm ẩn input search.
   - không để input trông hoạt động nhưng không làm gì.

3. Notification:
   - nếu notification đang hard-code, không hiển thị số "2 mới" giả.
   - nếu API notification đã tồn tại, kết nối dữ liệu thật.
   - nếu chưa có API, tạm ẩn dropdown notification hoặc hiển thị state "Chưa có thông báo".

4. Không phá profile dropdown.
5. Không phá logout.
6. Responsive.
7. Không full-page reload khi đi tới Settings.
```

---

# PHASE 8 — PLACEHOLDER MODULES

## TASK 13 — Xử lý Goals / Study / Statistics placeholder

### Files

Tìm trong:

```text
frontend/src/routes/
frontend/src/pages/
DashboardPage.tsx
Sidebar.tsx
```

### Prompt cho AI

```text
Tìm các route đang render ModulePlaceholderPage.

Với các module:
- Goals
- Study / Focus
- Statistics
hoặc module khác

hãy kiểm tra xem có navigation/CTA nào đang dẫn tới đó.

Nguyên tắc:

1. Nếu module chưa làm:
   - tạm ẩn khỏi sidebar.
   - tạm ẩn CTA nổi bật trên Dashboard.
2. Không xóa route.
3. Không xóa placeholder component.
4. Không để người dùng tưởng chức năng đã hoàn thiện.
5. Có thể giữ route để developer truy cập trực tiếp khi phát triển.

Không triển khai module mới trong task này.
```

---

# PHASE 9 — DARK MODE

## TASK 14 — Chuẩn hóa màu CSS

### File chính

```text
frontend/src/styles/index.css
```

### Prompt cho AI

```text
Kiểm tra index.css và các component CSS.

Không đổi toàn bộ design.

Tìm các màu hard-code được lặp lại nhiều lần, ví dụ:
- #fff
- #f7f9fc
- #586477
- màu border
- màu secondary text

Chuyển dần sang CSS variables semantic:

--background
--surface
--surface-hover
--text-primary
--text-secondary
--border
--primary
--danger
--warning
--success

Yêu cầu:

1. Light mode không thay đổi đáng kể.
2. Dark mode phải có contrast tốt.
3. Không đổi màu brand nếu không cần.
4. Không tạo quá nhiều variable.
5. Ưu tiên component chính:
   - Sidebar
   - Topbar
   - Card
   - Modal
   - Drawer
   - Input
   - Table/List
6. Không sửa mọi file trong một lần nếu phạm vi quá lớn.
```

---

# PHASE 10 — COMPONENT REFACTOR

## TASK 15 — Tách TasksPage

### Chỉ thực hiện sau khi chức năng ổn định

### Cấu trúc đề xuất

```text
frontend/src/features/tasks/components/
├── TaskToolbar.tsx
├── TaskFilters.tsx
├── TaskList.tsx
├── TaskRow.tsx
├── TaskForm.tsx
├── TaskDrawer.tsx
└── BulkTaskToolbar.tsx
```

### Prompt

```text
Refactor TasksPage.tsx mà KHÔNG thay đổi behavior.

Mục tiêu:
- TasksPage chỉ orchestration/data fetching.
- UI lớn tách thành component.

Không:
- đổi API
- đổi route
- đổi state model
- redesign UI

Sau refactor phải hoạt động giống trước 100%.
```

---

## TASK 16 — Tách SettingsPage

### Cấu trúc đề xuất

```text
frontend/src/features/settings/components/
├── ProfileSettings.tsx
├── SecuritySettings.tsx
├── AppearanceSettings.tsx
└── NotificationSettings.tsx
```

### Prompt

```text
Refactor SettingsPage thành các section component.

Không thay đổi giao diện và behavior.

Giữ:
- avatar crop
- profile form
- password form
- theme
- notification preferences

Chỉ tách code để dễ maintain.
```

---

# PHASE 11 — TESTING

## TASK 17 — Thêm Vitest

### Files

```text
frontend/package.json
frontend/vite.config.*
frontend/src/**/*.test.tsx
```

### Prompt

```text
Kiểm tra setup frontend hiện tại.

Thêm:
- Vitest
- React Testing Library
- jsdom

Không dùng Jest nếu không cần.

Tạo test ban đầu cho:

1. route guard
2. dashboard greeting
3. task form validation
4. calendar timezone helper

Không cần coverage toàn bộ project.

Thêm scripts:

"test"
"test:watch"

Không phá Vite config hiện tại.
```

---

# THỨ TỰ THỰC HIỆN KHUYẾN NGHỊ

Thực hiện đúng thứ tự dưới đây:

```text
01 routes/config.tsx
        ↓
02 KanbanPage.tsx
        ↓
03 CalendarPage.tsx
        ↓
04 Sidebar.tsx
        ↓
05 Tasks + Kanban navigation
        ↓
06 DashboardPage.tsx
        ↓
07 TasksPage form
        ↓
08 Tasks bulk delete
        ↓
09 StudyPlansPage
        ↓
10 Learning Spaces terminology
        ↓
11 TopicDetailPage
        ↓
12 Topbar
        ↓
13 Placeholder cleanup
        ↓
14 Dark mode
        ↓
15 Component refactor
        ↓
16 Tests
```

---

# GIT WORKFLOW

Không gom tất cả thay đổi vào một commit.

## Branch

```bash
git checkout main
git pull origin main

git checkout -b fix/frontend-ux-core
```

---

## Commit 1

Sau TASK 01–03:

```bash
git add frontend/src/routes/config.tsx
git add frontend/src/pages/KanbanPage.tsx
git add frontend/src/pages/CalendarPage.tsx

git commit -m "fix: resolve routes kanban and calendar issues"
```

---

## Commit 2

Sau Sidebar + Navigation:

```bash
git add frontend/src/components/Sidebar.tsx
git add frontend/src/routes/
git add frontend/src/pages/

git commit -m "refactor: improve frontend navigation"
```

Chỉ add đúng file thực sự đã sửa nếu có thể.

---

## Commit 3

Dashboard:

```bash
git add frontend/src/pages/DashboardPage.tsx

git commit -m "refactor: improve dashboard usability"
```

---

## Commit 4

Tasks:

```bash
git add frontend/src/pages/TasksPage.tsx

git commit -m "feat: improve task management experience"
```

---

## Commit 5

Study Plans:

```bash
git add frontend/src/pages/StudyPlansPage.tsx

git commit -m "feat: complete study plan management"
```

---

## Commit 6

Subjects / Topic Detail:

```bash
git add frontend/src/pages/
git add frontend/src/components/

git commit -m "refactor: simplify subject learning workflow"
```

---

## Commit 7

Topbar + placeholders:

```bash
git add frontend/src/components/Topbar.tsx
git add frontend/src/components/Sidebar.tsx
git add frontend/src/pages/DashboardPage.tsx

git commit -m "fix: hide unfinished navigation actions"
```

---

## Commit 8

Styles:

```bash
git add frontend/src/styles/

git commit -m "style: improve theme consistency"
```

---

## Commit 9

Tests:

```bash
git add frontend/package.json
git add frontend/src/
git add frontend/vite.config.*

git commit -m "test: add frontend core tests"
```

---

# KIỂM TRA TRƯỚC KHI PUSH

Từ thư mục frontend:

```bash
npm install
npm run lint
npm run build
npm run test
```

Nếu project chưa có test script ở giai đoạn đầu:

```bash
npm run lint
npm run build
```

Chạy app:

```bash
npm run dev
```

Kiểm tra thủ công:

```text
[ ] Login
[ ] Register
[ ] Dashboard
[ ] Sidebar desktop
[ ] Sidebar mobile
[ ] Tasks list
[ ] Create task
[ ] Edit task
[ ] Delete task
[ ] Bulk delete
[ ] Kanban drag/drop
[ ] Calendar create
[ ] Calendar edit
[ ] Calendar timezone
[ ] Study plan
[ ] Subject
[ ] Settings
[ ] Admin visibility
[ ] Dark mode
```

---

# PUSH

```bash
git status
git log --oneline -10

git push -u origin fix/frontend-ux-core
```

Sau khi kiểm tra ổn định mới merge vào `main`.

---

# PROMPT TỔNG HỢP DÙNG CHO AI VS CODE

Nếu muốn AI tự đọc task hiện tại trước khi bắt đầu, dùng prompt này:

```text
Bạn đang làm việc trong dự án StudyFlow.

Hãy đọc:
- cấu trúc frontend/src
- package.json
- routes
- component
- types
- services/API liên quan đến task hiện tại

Không sửa ngay trước khi hiểu luồng dữ liệu.

Quy tắc:
- không đổi backend API
- không thêm mock data nếu có API
- không refactor ngoài phạm vi
- không dùng any
- không phá responsive
- không phá dark mode
- không làm mất chức năng đang hoạt động
- ưu tiên tái sử dụng component
- dùng pattern hiện có của project
- sau khi sửa phải build được

Chỉ thực hiện TASK được đưa ra tiếp theo.

Sau khi hoàn thành hãy trả về:
1. Files changed
2. What was fixed
3. Why
4. Manual test steps
5. Remaining risks
```

---

# MỤC TIÊU SAU KHI HOÀN THÀNH FILE NÀY

Luồng sử dụng chính của StudyFlow phải rõ ràng:

```text
Đăng nhập
   ↓
Dashboard
   ↓
Học kỳ / Môn học
   ↓
Kế hoạch học tập
   ↓
Công việc
   ↓
Lịch
   ↓
Hoàn thành
   ↓
Theo dõi tiến độ
```

Không ưu tiên AI, chatbot hoặc tính năng quá nâng cao trước khi luồng trên hoạt động ổn định.
