# VIBECODE — TỐI ƯU KẾ HOẠCH, CÔNG VIỆC VÀ CÔNG VIỆC TRONG MÔN HỌC

> Project: StudyFlow  
> Repository: `Yiben633/Quan_Li_Hoc_Tap`  
> Scope: `StudyPlansPage`, `TasksPage`, `TopicDetailPage` và các API/hook/component liên quan.

## Mục tiêu tổng thể

Biến ba màn hình hiện tại thành một luồng thống nhất:

`Môn học → Kế hoạch → Công việc → Học → Hoàn thành → Tiến độ`

Không viết lại toàn bộ dự án. Ưu tiên tận dụng code và API đang có.

---

# 1. Những gì backend hiện đã hỗ trợ

Task hiện có các field:

- `studyPlanId`
- `subjectId`
- `title`
- `description`
- `startDate`
- `dueDate`
- `estimatedMinutes`
- `difficulty` từ 1–5
- `priority`
- `status`
- `sortOrder`

Task API đã có:

- danh sách
- hôm nay
- quá hạn
- create/update/delete
- đổi status
- complete
- duplicate
- reorder
- subtask
- attachment

Study Plan hiện có:

- `subjectId`
- `title`
- `description`
- `startDate`
- `endDate`
- `targetGoal`
- `estimatedHours`
- `priority`
- `status`
- `progressPercent`

Backend đã tự đồng bộ `progressPercent` theo tỷ lệ task `done`.

**Không tạo migration nếu chức năng có thể dùng field hiện có.**

---

# 2. Các vấn đề UX cần sửa

## 2.1. Kế hoạch

Hiện tại card khá trống và khi chỉ có một plan thì phần bên phải màn hình bị dư quá nhiều.

Cần bổ sung:

- môn học
- mục tiêu
- còn bao nhiêu ngày
- số task đã hoàn thành / tổng task
- thời gian dự kiến
- trạng thái tiến độ
- action chính `Tiếp tục`
- search
- filter môn học
- filter priority
- sort
- trang chi tiết kế hoạch

Edit/Delete không nên là action nổi bật nhất.

---

## 2.2. Công việc

Vấn đề lớn nhất là checkbox bên trái đang dùng để **select bulk**, nhưng người dùng thường hiểu đó là **đánh dấu hoàn thành**.

Cần sửa:

- checkbox mặc định = complete task
- multi-select chỉ xuất hiện khi bật `Chọn nhiều`
- task row hiển thị thêm:
  - môn học
  - kế hoạch
  - deadline tương đối
  - thời gian dự kiến
  - độ khó
  - progress subtask
- delete chuyển vào menu `...`
- thêm `Hôm nay / Sắp tới / Quá hạn / Tất cả`
- thêm quick create
- filter gọn hơn
- sort
- nút bắt đầu học nếu Study Session thật sự hoạt động

---

## 2.3. Công việc trong môn học

Hiện Overview và tab Công việc đang lặp nhiều nội dung.

Cần sửa:

- đổi text UI `Chủ đề` → `Môn học`
- `đơn vị theo dõi` → `tín chỉ`
- Overview chỉ hiển thị tối đa 3–5 việc cần ưu tiên
- tab Công việc dùng cùng TaskList với `/tasks`
- quick create phải tự gắn `subjectId`
- quick create có thể mở thêm:
  - deadline
  - priority
  - estimatedMinutes
  - difficulty
- không copy một TaskRow khác riêng cho môn học

---

# 3. Kiến trúc UX mới

Task chỉ có **một trải nghiệm chung**.

Task có thể xuất hiện trong:

- `/tasks`
- `/tasks/kanban`
- `/study-plans/:id`
- `/topics/:id`
- Dashboard

Nhưng phải reuse cùng component.

Đề xuất:

```text
frontend/src/features/tasks/components/
├── TaskRow.tsx
├── TaskList.tsx
├── TaskQuickCreate.tsx
├── TaskFilters.tsx
├── TaskDrawer.tsx
├── TaskForm.tsx
├── TaskBulkToolbar.tsx
├── TaskMeta.tsx
└── TaskModuleTabs.tsx
```

---

# PHASE 1 — FOUNDATION

## TASK 01 — Tách Task component dùng chung

### Files cần đọc

```text
frontend/src/pages/TasksPage.tsx
frontend/src/pages/TopicDetailPage.tsx
frontend/src/pages/KanbanPage.tsx
frontend/src/features/tasks/
frontend/src/components/ui/
```

### Prompt cho AI

```text
Đọc toàn bộ các file liên quan Task.

Refactor mà chưa redesign.

Yêu cầu:
1. Tách TaskRow khỏi TasksPage.
2. Tách TaskDrawer.
3. Tách TaskForm.
4. Tạo TaskList reusable.
5. TopicDetail phải có thể reuse TaskList.
6. StudyPlanDetail sau này cũng reuse TaskList.
7. Không duplicate API request.
8. Không đổi backend API.
9. Không dùng any.
10. Giữ React Query pattern hiện tại.
11. Build phải pass.

TaskRow hỗ trợ:
- mode="default"
- mode="compact"
```

### Acceptance Criteria

- `/tasks` chạy như trước.
- Topic detail chưa bị lỗi.
- Kanban không bị ảnh hưởng.
- Không còn TaskRow riêng nằm trong page nếu có thể reuse.

---

## TASK 02 — Tận dụng field Task backend đã có

### Files

```text
frontend/src/features/tasks/tasks.api.ts
frontend/src/features/tasks/tasks.hooks.ts
TaskForm.tsx
```

### Prompt

```text
Kiểm tra backend tasks schema.

Backend đã hỗ trợ:
startDate
estimatedMinutes
difficulty

Bổ sung frontend create/update input cho các field này.

Task Form:

Tên công việc *
Mô tả

Môn học
Kế hoạch

Ngày bắt đầu
Hạn hoàn thành

Thời gian dự kiến
Độ khó

Độ ưu tiên
Trạng thái

estimatedMinutes preset:
15
25
30
45
60
90

Difficulty:
1 Rất dễ
2 Dễ
3 Trung bình
4 Khó
5 Rất khó

Validation:
dueDate >= startDate
estimatedMinutes >= 0
difficulty 1..5

Không migration database.
```

---

## TASK 03 — Chuẩn hóa constants

Tạo:

```text
frontend/src/features/tasks/task.constants.ts
```

Chứa:

```text
TASK_STATUS_LABELS
PRIORITY_LABELS
PLAN_STATUS_LABELS
DIFFICULTY_LABELS
```

Không khai báo các object label giống nhau ở nhiều page.

---

# PHASE 2 — REDESIGN TRANG CÔNG VIỆC

## TASK 04 — Smart Scope

Đầu trang:

```text
[Hôm nay 3] [Sắp tới 8] [Quá hạn 2] [Tất cả 24]
```

### Yêu cầu

- Hôm nay: tận dụng `/tasks/today`
- Quá hạn: tận dụng `/tasks/overdue`
- Sắp tới: 7 ngày tiếp theo
- Tất cả: endpoint list hiện tại

Nếu `Sắp tới` chưa được backend hỗ trợ theo range thì thêm:

```text
dueFrom
dueTo
```

vào task list schema/service.

Không lấy toàn bộ task về client để filter.

### Prompt

```text
Nâng cấp TasksPage với smart scope:
Hôm nay / Sắp tới / Quá hạn / Tất cả.

Giữ state trong URL query:
?scope=today
?scope=upcoming
?scope=overdue
?scope=all

Không mất scope khi search/filter.

Nếu cần date range:
thêm dueFrom/dueTo vào backend list task.
Giữ backwards compatibility với dueDate hiện tại.
```

---

## TASK 05 — Toolbar mới

Thay vì luôn hiện:

```text
Search | Status | Priority | Date
```

đổi thành:

```text
Search                               [Bộ lọc 2] [Sắp xếp ▼]

[Đang làm ×] [Java ×] [Cao ×]               Xóa bộ lọc
```

Filter panel:

- status
- priority
- môn học
- kế hoạch
- deadline
- difficulty

Sort:

- Thứ tự tùy chỉnh
- Deadline gần nhất
- Deadline xa nhất
- Ưu tiên cao
- Mới tạo
- Tên A–Z

Không fake sort. Map đúng API hiện tại.

---

## TASK 06 — Sửa checkbox semantics

### Default mode

Control bên trái:

```text
○ Task
```

Click:

```text
todo/in_progress/waiting → done
```

Task done:

```text
✓ Task
```

### Multi select mode

Button:

```text
Chọn nhiều
```

Lúc này mới hiển thị:

```text
☐ Task A
☐ Task B
```

Bulk toolbar:

- Hoàn thành
- Đang làm
- Chuyển môn
- Chuyển kế hoạch
- Xóa
- Thoát chọn

### Prompt

```text
Không dùng checkbox selection ở default mode.

Default left control = complete toggle.

Multi select chỉ xuất hiện sau khi user bật "Chọn nhiều".

Accessibility:
complete và selection phải có aria-label khác nhau.
```

---

## TASK 07 — Redesign TaskRow

### Desktop

```text
┌─────────────────────────────────────────────────────────────────┐
│ ○  Ôn React Hooks                              [Đang làm]  ⋮   │
│    Lập trình Web · Ôn giữa kỳ                                  │
│    Hôm nay · 45 phút · Khó · Cao                   ▶ Bắt đầu   │
│    Checklist 2/4 ███████░░ 50%                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Hiển thị theo thứ tự ưu tiên

Level 1:

- complete
- title
- status
- overflow menu

Level 2:

- subject
- study plan

Level 3:

- deadline tương đối
- estimatedMinutes
- difficulty
- priority
- subtask progress

Không hiển thị field trống.

### Overflow menu

```text
Mở chi tiết
Chỉnh sửa
Nhân bản
Xóa
```

Delete không còn luôn hiện ở cuối row.

---

## TASK 08 — Relative deadline

Tạo helper:

```text
frontend/src/utils/taskDate.ts
```

Output:

```text
Hôm nay
Ngày mai
Còn 2 ngày
Quá hạn 1 ngày
12/08/2026
Chưa đặt hạn
```

Không tô đỏ task đã hoàn thành dù deadline cũ đã qua.

---

## TASK 09 — Quick Add

Ngay dưới toolbar:

```text
+ Thêm công việc nhanh...
```

Khi focus:

```text
Tên công việc...

[Môn] [Deadline] [Priority] [30 phút] [Thêm]
```

Advanced:

- studyPlan
- difficulty
- description

### Reusable props

```text
subjectId?
studyPlanId?
defaultPriority?
onCreated?
```

Trong TopicDetail:
`subjectId` cố định.

Trong StudyPlanDetail:
`studyPlanId` cố định.

---

# PHASE 3 — TASK DRAWER

## TASK 10 — Nâng cấp Task Drawer

Layout:

```text
TASK TITLE

Status        Priority

Môn học
Kế hoạch
Ngày bắt đầu
Deadline
Thời gian dự kiến
Độ khó

Mô tả

CHECKLIST
2 / 5
☑ ...
☐ ...
+ Thêm việc nhỏ

TỆP ĐÍNH KÈM

[Bắt đầu học] nếu flow thật sự có

Chỉnh sửa
Nhân bản
Xóa
```

Môn học và Kế hoạch phải click được để điều hướng.

---

## TASK 11 — Create/Delete Subtask

Backend đã hỗ trợ create/delete subtask.

Nếu frontend chưa có:

```text
createSubtask(taskId, title)
deleteSubtask(taskId, subtaskId)
```

và hooks tương ứng.

Drawer:

```text
+ Thêm việc nhỏ
```

Enter để tạo.

Delete icon subtask chỉ hiện hover/focus.

---

# PHASE 4 — REDESIGN TRANG KẾ HOẠCH

## TASK 12 — Plan Summary

Đầu trang:

```text
[Đang thực hiện 3] [Sắp hết hạn 1] [Hoàn thành 8]
```

Compact, không làm thành card Dashboard lớn.

Count phải thật.

Nếu pagination không cho tính chính xác thì tạo:

```text
GET /study-plans/summary
```

Response gợi ý:

```json
{
  "active": 3,
  "dueSoon": 1,
  "completed": 8,
  "overdue": 2
}
```

---

## TASK 13 — Search + Filter + Sort Plan

Toolbar:

```text
🔎 Tìm kế hoạch...                     [Bộ lọc] [Sắp xếp]
```

Filter:

- status
- subject
- priority

Sort:

- mới tạo
- tên
- ngày bắt đầu
- deadline
- priority

Backend hiện chưa có search thì thêm:

```text
search
```

match case-insensitive:

- title
- description
- targetGoal

Debounce khoảng 300ms.

---

## TASK 14 — Redesign StudyPlanCard

### Layout

```text
┌─────────────────────────────────────┐
│ Đang thực hiện                 ⋮    │
│                                     │
│ Ôn thi Java                         │
│ Java · Mục tiêu ≥ 8                 │
│                                     │
│ 10/08 → 25/08 · Còn 6 ngày         │
│                                     │
│ █████████████░░ 72%                 │
│ 8/11 công việc · 9h dự kiến        │
│                                     │
│ Cần chú ý             Tiếp tục →   │
└─────────────────────────────────────┘
```

### Menu

```text
Xem chi tiết
Chỉnh sửa
Tạm dừng
Xóa
```

Edit/Delete không hiển thị thành hai icon lớn luôn luôn.

### Grid

Dùng grid kiểu:

```text
repeat(auto-fill, minmax(320px, 1fr))
```

Card có max width phù hợp để một card không kéo quá rộng.

---

## TASK 15 — Task count cho Plan

Plan card cần:

```text
taskTotal
taskDone
```

Không tạo N+1:

```text
for each plan -> GET tasks
```

Backend list/detail cần aggregate counts hiệu quả.

Giữ `progressPercent` logic hiện tại.

---

# PHASE 5 — STUDY PLAN DETAIL

## TASK 16 — Tạo StudyPlanDetailPage

Route:

```text
/study-plans/:id
```

Page:

```text
← Kế hoạch

ÔN THI JAVA
Lập trình Java

[Đang thực hiện] [Cao]

████████████░░ 72%

8/11 công việc
Còn 6 ngày
9 giờ dự kiến

[+ Thêm công việc] [⋮]

[Tổng quan] [Công việc]
```

### Overview

- description
- targetGoal
- subject
- date range
- estimated hours
- progress
- 3 task tiếp theo

### Công việc

Reuse:

```text
TaskQuickCreate
TaskList
TaskDrawer
```

Query:

```text
useTasksQuery({ studyPlanId: id })
```

Không copy UI Task.

---

## TASK 17 — Sau khi tạo Plan

Sau `createPlan` success:

```text
navigate /study-plans/{id}
```

Detail page empty state:

```text
Kế hoạch chưa có công việc.

+ Thêm công việc đầu tiên
```

Không chỉ đóng modal rồi để user tự đoán bước tiếp theo.

---

## TASK 18 — Chia nhỏ kế hoạch

Feature sáng tạo, phiên bản đầu **không AI**.

Button:

```text
Chia nhỏ kế hoạch
```

Modal:

```text
Mỗi dòng là một công việc:

Ôn chương 1
Ôn chương 2
Làm bài tập chương 2
Làm đề thử

Thời gian mỗi việc: 45 phút
Phân bố:
- mỗi ngày
- cách ngày
- phân bố đều
```

Preview:

```text
□ Ôn chương 1 — 10/08 — 45p
□ Ôn chương 2 — 12/08 — 45p
...
```

Sau confirm mới create.

Mỗi task tự gắn:

```text
studyPlanId
subjectId nếu plan có
```

Không tạo task trước bước preview.

---

# PHASE 6 — REDESIGN CHI TIẾT MÔN HỌC

## TASK 19 — Đổi wording UI

Không cần đổi internal type ngay.

UI:

```text
Chủ đề → Môn học
Quay lại chủ đề → Quay lại môn học
2 đơn vị theo dõi → 2 tín chỉ
```

Nếu `credits` thật sự là số tín chỉ.

Header:

```text
JS
JavaScript
3 tín chỉ · Đang học
Giảng viên: ...
Mục tiêu: 8.0

[Bắt đầu học] [+ Công việc]
```

Field không có thì không render.

---

## TASK 20 — Overview môn học

Không hiển thị full task list.

Layout:

```text
██████████████░ 68%

[Việc còn lại] [Hoàn thành] [Giờ học] [Điểm]

VIỆC CẦN ƯU TIÊN

○ Assignment React       Hôm nay
○ Ôn Hooks               Ngày mai
○ Quiz JSX               Còn 3 ngày

Xem tất cả công việc →
```

Chỉ 3–5 task.

Order:

1. overdue
2. due today
3. due soon
4. urgent/high
5. in_progress

Không gọi đây là AI.

---

## TASK 21 — Quick Create trong Môn học

Bỏ form task riêng trong TopicDetail.

Reuse:

```text
<TaskQuickCreate subjectId={id} />
```

Advanced:

- deadline
- priority
- estimatedMinutes
- difficulty
- studyPlanId

Plan dropdown nên ưu tiên:

```text
usePlansQuery({ subjectId: id })
```

Task không thể vô tình bị tạo ngoài subject đang xem.

---

## TASK 22 — Tab Công việc Môn học

Layout:

```text
Công việc

[Chưa hoàn thành] [Đang làm] [Hoàn thành] [Tất cả]

+ Thêm công việc cho JavaScript...

<TaskList compact>
```

Không cần toolbar full giống `/tasks`.

Nếu Kanban hỗ trợ `subjectId` query thì thêm:

```text
Xem trong Kanban →
```

Nếu chưa hỗ trợ thì không tạo link giả.

---

# PHASE 7 — CHỨC NĂNG SÁNG TẠO

## TASK 23 — Plan Health

Không AI.

Hiển thị:

```text
Đúng tiến độ
Cần chú ý
Có nguy cơ trễ
```

Dựa trên:

```text
% thời gian đã trôi qua
so với
progressPercent
```

Rule tham khảo:

```text
gap <= 10%        Đúng tiến độ
gap 10–25%        Cần chú ý
gap > 25%         Có nguy cơ trễ
```

Chỉ tính khi có startDate và endDate.

Tooltip:

```text
Đánh giá dựa trên thời gian đã trôi qua và tiến độ công việc.
```

Không gọi là AI prediction.

---

## TASK 24 — Việc nên làm tiếp theo

Ở TasksPage có compact suggestion:

```text
VIỆC NÊN LÀM TIẾP

Ôn React Hooks
Lập trình Web · 45 phút · Hạn hôm nay

[Bắt đầu]
```

Rule deterministic:

```text
overdue      +100
today        +80
tomorrow     +60
urgent       +40
high         +25
in_progress  +15
<=30 phút     +8
```

Không random.
Không AI.

Viết unit test helper.

---

## TASK 25 — Bắt đầu học

Chỉ làm sau khi đọc module Study Session.

Nếu API thật hoạt động:

Task:

```text
▶ Bắt đầu
```

Subject:

```text
▶ Bắt đầu học
```

Nếu backend Study Session chưa support `taskId` thì:

- không migration vội
- start theo subject
- task chỉ đưa context tới focus page nếu hỗ trợ

Không tạo nút giả.

---

# PHASE 8 — DATE & UI CONSISTENCY

## TASK 26 — Generic DatePicker

StudyPlansPage hiện đã có date picker riêng.

Refactor thành:

```text
components/ui/DatePicker
```

Reuse cho:

- Plan Form
- Task Form
- Task Filter

Locale:

```text
vi-VN
```

Week bắt đầu thứ Hai.

Keyboard accessibility.

---

## TASK 27 — Subject/Plan label map

TasksPage đã lấy topics và plans.

Tạo maps bằng `useMemo`:

```text
subjectById
planById
```

TaskRow không nên `.find()` nhiều lần.

Pass metadata xuống component.

Internal route dùng React Router Link.

---

# PHASE 9 — RESPONSIVE

## TASK 28 — Mobile Tasks

Mobile:

```text
○ Task title                         ⋮
  ReactJS
  Hôm nay · 45p · Cao
  [Đang làm]
```

Scope:

horizontal scroll.

Toolbar:

```text
Search
[Filter] [Sort]
```

Không overflow ngang.

---

## TASK 29 — Mobile Plan

1 column.

Header button không đẩy title.

Card full width nhưng không quá cao.

---

## TASK 30 — Mobile Subject Detail

Header stack.

Stats:

```text
2 columns
```

Quick create stack khi nhỏ.

---

# PHASE 10 — ACCESSIBILITY & PERFORMANCE

## TASK 31 — Accessibility

Bắt buộc:

- visible focus
- icon button có aria-label
- status không chỉ phân biệt bằng màu
- priority không chỉ phân biệt bằng màu
- `aria-current` cho tabs
- overflow menu keyboard usable
- complete control có label rõ

---

## TASK 32 — Không N+1

Không:

```text
plan.map(plan => GET /tasks?studyPlanId=...)
```

để lấy count.

Aggregate backend.

---

## TASK 33 — React Query invalidation

Sau task create/update/delete/status:

- tasks
- kanban
- dashboard
- study-plans

Nếu subjectId:

- subject detail

Không invalidate toàn app.

---

## TASK 34 — Search debounce

Tasks search:

```text
300ms
```

Plan search:

```text
300ms
```

Select không cần debounce.

---

# PHASE 11 — BACKEND THAY ĐỔI TỐI THIỂU

## TASK 35 — dueFrom / dueTo

Backend:

```text
tasks.schemas.ts
tasks.service.ts
```

Thêm:

```text
dueFrom
dueTo
```

Giữ `dueDate` exact filter để backwards compatibility.

---

## TASK 36 — Study Plan Search

Thêm `search` vào:

```text
study-plans.schemas.ts
study-plans.service.ts
```

Match:

- title
- description
- targetGoal

case-insensitive.

---

## TASK 37 — Plan count

Study Plan response bổ sung:

```text
taskTotal
taskDone
```

Không thay `progressPercent`.

Không query loop.

---

# 4. MOCK LAYOUT CUỐI

## Công việc

```text
NHỊP TIẾN ĐỘ CỦA BẠN
Công việc                               + Tạo công việc

[Danh sách] [Kanban]

[Hôm nay 4] [Sắp tới 7] [Quá hạn 1] [Tất cả 24]

🔎 Tìm công việc...                   [Bộ lọc] [Sắp xếp]

+ Thêm công việc nhanh...

─────────────────────────────────────────────────────────
○ Ôn React Hooks                         [Đang làm]  ⋮
  Lập trình Web · Ôn giữa kỳ
  Hôm nay · 45 phút · Khó · Cao              ▶ Bắt đầu
  Checklist 2/4 ███████░ 50%
─────────────────────────────────────────────────────────
```

---

## Kế hoạch

```text
LỘ TRÌNH TIẾN BỘ
Kế hoạch                               + Tạo kế hoạch

[Đang thực hiện 3] [Sắp hết hạn 1] [Hoàn thành 8]

🔎 Tìm kế hoạch...                    [Bộ lọc] [Sắp xếp]


┌──────────────────────────────┐
│ Đang thực hiện          ⋮    │
│ Ôn thi Java                  │
│ Java · Mục tiêu ≥ 8          │
│ Còn 6 ngày                   │
│ █████████████░ 72%           │
│ 8/11 task · 9h dự kiến       │
│ Cần chú ý      Tiếp tục →    │
└──────────────────────────────┘
```

---

## Môn học

```text
← Môn học

JS
JavaScript
3 tín chỉ · Đang học · Mục tiêu 8.0

█████████████░ 68%

[Bắt đầu học] [+ Công việc]

[Tổng quan] [Công việc]

[Việc còn lại] [Hoàn thành] [Giờ học] [Điểm]

VIỆC CẦN ƯU TIÊN
○ Assignment React       Hôm nay
○ Ôn Hooks               Ngày mai
○ Quiz JSX               Còn 3 ngày

Xem tất cả công việc →
```

---

# 5. MASTER PROMPT CHO AI VS CODE

```text
Bạn đang làm việc trong project StudyFlow.

Trước khi code:

1. Đọc file được chỉ định.
2. Đọc type/API/hook liên quan.
3. Nếu task liên quan API, đọc backend schema/route/service trước.
4. Xác nhận field/API nào đã tồn tại.
5. Không migration nếu field đã có.

Quy tắc:

- Không rewrite toàn project.
- Không mock khi có API thật.
- Không dùng any.
- Không duplicate Task component.
- Không tạo button không hoạt động.
- Không hard-code count/progress.
- Không N+1 request.
- Không phá Kanban.
- Không phá Dashboard.
- Không phá auth.
- Không phá dark mode.
- Không phá responsive.
- Internal navigation dùng React Router.
- Destructive actions phải confirm.
- Giữ React Query pattern hiện tại.
- Chỉ làm TASK được yêu cầu.
- Không tự làm task tiếp theo.

Sau khi code:

npm run lint
npm run build

Nếu có test:
npm run test

Báo cáo:

1. Files changed
2. What changed
3. API changes
4. Database changes
5. Manual test
6. Remaining risks
```

---

# 6. PROMPT TỔNG HỢP — TASKS PAGE

```text
Đọc kỹ:

frontend/src/pages/TasksPage.tsx
frontend/src/features/tasks/tasks.api.ts
frontend/src/features/tasks/tasks.hooks.ts
frontend/src/features/tasks/components/
backend/src/modules/tasks/

Tối ưu trang Công việc:

1. Giữ tabs Danh sách / Kanban.
2. Thêm Hôm nay / Sắp tới / Quá hạn / Tất cả.
3. Search.
4. Filter: status, priority, subject, plan, difficulty.
5. Sort.
6. Default checkbox = complete.
7. Multi selection chỉ khi bật Chọn nhiều.
8. TaskRow hiển thị subject, plan, deadline relative,
   priority, estimatedMinutes, difficulty.
9. Delete đưa vào overflow.
10. Thêm reusable TaskQuickCreate.
11. Tận dụng startDate, estimatedMinutes, difficulty backend đã có.
12. Drawer bổ sung metadata và add subtask.
13. Không duplicate component với TopicDetail.
14. Không fake data.
15. Responsive.
16. Accessibility.
17. Build pass.

Không redesign Kanban ngoài compatibility filter.
```

---

# 7. PROMPT TỔNG HỢP — STUDY PLAN

```text
Đọc:

StudyPlansPage.tsx
tasks.api.ts
tasks.hooks.ts
backend study-plans
backend tasks

Tối ưu Kế hoạch:

1. Summary compact.
2. Search.
3. Filter status/subject/priority.
4. Sort.
5. Redesign plan card.
6. Hiển thị subject, goal, date, days remaining,
   progress, priority, task done/total.
7. Edit/Delete vào overflow.
8. Primary CTA Tiếp tục.
9. Tạo /study-plans/:id.
10. Detail có Tổng quan + Công việc.
11. Reuse TaskList + TaskQuickCreate.
12. Sau create navigate detail.
13. Empty plan hướng tạo task.
14. Chia nhỏ kế hoạch rule-based có preview.
15. Không AI.
16. Không N+1.
17. Build pass.
```

---

# 8. PROMPT TỔNG HỢP — SUBJECT DETAIL

```text
Đọc:

TopicDetailPage.tsx
learning.api.ts
learning.hooks.ts
Task components
Tasks API/hooks
backend subjects
backend tasks

Tối ưu chi tiết môn học:

1. UI text Chủ đề -> Môn học.
2. credits -> tín chỉ.
3. Header hiển thị code/name/credits/lecturer/target grade/status.
4. Tabs chỉ Tổng quan + Công việc.
5. Overview không render full task list.
6. Overview có progress, stats, max 5 việc ưu tiên.
7. Link xem tất cả công việc.
8. Tab Công việc reuse TaskList.
9. Quick create reuse TaskQuickCreate.
10. subjectId cố định.
11. Filter nhỏ cho task.
12. Không duplicate TaskRow.
13. Bắt đầu học chỉ khi study-session chạy thật.
14. Không placeholder.
15. Responsive.
16. Build pass.
```

---

# 9. TEST CASES

## Tasks

```text
[ ] Create chỉ title
[ ] Create subject + plan
[ ] Create estimated time + difficulty
[ ] Complete task
[ ] Reopen task
[ ] Multi select
[ ] Bulk complete
[ ] Bulk delete confirm
[ ] Today scope
[ ] Upcoming scope
[ ] Overdue scope
[ ] Search
[ ] Filter subject
[ ] Filter plan
[ ] Sort deadline
[ ] Open drawer
[ ] Add subtask
[ ] Toggle subtask
[ ] Delete subtask
[ ] Attachment vẫn chạy
[ ] Kanban vẫn chạy
```

## Plan

```text
[ ] Create plan
[ ] Navigate detail
[ ] Create task trong plan
[ ] Progress tự update
[ ] Count đúng
[ ] Search plan
[ ] Filter subject
[ ] Filter priority
[ ] Delete confirm
[ ] Deadline quá hạn
[ ] Plan Health đúng
[ ] Chia nhỏ plan preview
[ ] Không duplicate task nếu double click
```

## Subject

```text
[ ] Header đúng
[ ] Tín chỉ đúng
[ ] Overview không duplicate full task list
[ ] Việc ưu tiên max 5
[ ] Quick create tự gắn subject
[ ] Task tab chỉ có task môn hiện tại
[ ] Complete task cập nhật stats
[ ] Mobile không overflow
```

---

# 10. DỮ LIỆU DEMO NÊN DÙNG

Không demo bằng dữ liệu khó đọc như:

```text
ká
nmaps
trnag
Đá
```

Nên test:

```text
Môn:
Lập trình Web

Plan:
Ôn thi giữa kỳ React

Tasks:
Ôn React Hooks
Hoàn thành bài tập REST API
Review Zustand và React Query
Làm đề ôn tập chương 1–4
Chuẩn bị slide thuyết trình
```

Có thêm title dài để test responsive:

```text
Hoàn thành báo cáo phân tích yêu cầu và thiết kế cơ sở dữ liệu cho đồ án học kỳ
```

---

# 11. THỨ TỰ THỰC HIỆN

```text
01 Shared Task components
02 Task API fields
03 Constants
04 Checkbox semantics
05 Task Row
06 Quick Add
07 Smart Scope
08 Filter + Sort
09 Task Drawer/Subtask
10 Study Plan Card
11 Study Plan Search/Count
12 Study Plan Detail
13 Break Down Plan
14 Subject Overview
15 Subject Task Tab
16 Plan Health
17 Next Task Suggestion
18 Responsive
19 Accessibility
20 Tests
```

---

# 12. GIT WORKFLOW

```bash
git checkout main
git pull origin main
git checkout -b feat/task-planning-ux
```

Commit theo nhóm:

```bash
git commit -m "refactor: extract reusable task components"

git commit -m "feat: improve task management experience"

git commit -m "feat: enhance task details and subtasks"

git commit -m "feat: redesign study plan workflow"

git commit -m "feat: add study plan detail page"

git commit -m "feat: unify subject task experience"

git commit -m "fix: improve planning responsive ux"
```

Trước push:

```bash
cd frontend
npm run lint
npm run build
npm run test
```

Nếu test chưa setup:

```bash
npm run lint
npm run build
```

---

# 13. DEFINITION OF DONE

```text
[ ] Một Task UI thống nhất ở mọi nơi
[ ] Checkbox không còn gây hiểu nhầm
[ ] Có Today / Upcoming / Overdue
[ ] Task có subject + plan
[ ] Task có estimatedMinutes
[ ] Task có difficulty
[ ] Quick create hoạt động
[ ] Add subtask hoạt động
[ ] Plan có detail page
[ ] Plan card có task count
[ ] Plan progress cập nhật đúng
[ ] Subject Overview không duplicate task tab
[ ] Không N+1
[ ] Không hard-code count
[ ] Không button giả
[ ] Desktop tốt
[ ] Mobile tốt
[ ] Dark mode tốt
[ ] lint pass
[ ] build pass
```

---

# 14. TRIẾT LÝ SẢN PHẨM

StudyFlow không nên chỉ là:

```text
Todo App + tên môn học
```

Mà phải trả lời được:

```text
Tôi đang học MÔN nào?
        ↓
Tôi muốn đạt MỤC TIÊU gì?
        ↓
Tôi có KẾ HOẠCH nào?
        ↓
VIỆC tiếp theo là gì?
        ↓
Tôi cần bao nhiêu THỜI GIAN?
        ↓
Tôi đã hoàn thành bao nhiêu?
        ↓
Tôi có đang ĐÚNG TIẾN ĐỘ không?
```

Mọi thay đổi trong ba màn hình phải phục vụ luồng này.
