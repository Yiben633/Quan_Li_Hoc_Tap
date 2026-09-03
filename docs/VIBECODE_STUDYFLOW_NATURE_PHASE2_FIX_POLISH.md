# VIBECODE — STUDYFLOW NATURE REDESIGN PHASE 2: FIX & POLISH

> Project: **StudyFlow**
>
> Repository: `Yiben633/Quan_Li_Hoc_Tap`
>
> Mục tiêu: hoàn thiện Nature UI đã có, sửa lỗi thật trong video, đưa Dashboard gần bản thiết kế mục tiêu hơn và polish toàn bộ trải nghiệm mà KHÔNG redesign lại các phần đã ổn.
>
> Phạm vi ưu tiên:
>
> ```text
> P0  Admin error / route stability
> P1  Dashboard layout + Pomodoro + Weekly Calendar + Subject Progress
> P2  Sidebar collapse + Admin layout + Global Search + AI Coach
> P3  Empty states + Nature motion + visual polish
> ```

---

# 0. NGUYÊN TẮC CHUNG

KHÔNG:

- rewrite toàn frontend
- đổi API contract không cần thiết
- thay router hàng loạt
- phá drag/drop
- phá dark mode
- phá responsive
- phá role guard
- fake data
- fake AI insight
- fake XP/Level nếu backend chưa có
- thêm animation nặng
- dùng mascot quá nhiều

PHẢI:

- giữ Nature Design System hiện tại
- giữ palette cream/sage/moss/pine
- giữ component reusable
- giữ React Query pattern
- giữ loading/error/empty
- giữ accessibility
- giữ prefers-reduced-motion
- build/test sau mỗi batch

---

# 1. KẾT LUẬN SAU KHI XEM VIDEO

Các phần hiện đang tốt:

```text
Nature palette
Logo
Calendar
Statistics
Settings
Study Plan overall
AI Coach visual identity
Admin visual direction
```

Các phần còn thiếu/lỗi:

```text
1. Admin có lỗi "Không thể mở nội dung này"
2. Dashboard chưa giống reference đủ nhiều
3. Thiếu mini Pomodoro trên Dashboard
4. Thiếu Weekly Calendar trên Dashboard
5. Subject progress chưa rõ
6. Today tasks quá ít
7. Next tasks chưa đủ
8. Sidebar quá dài
9. Sidebar chưa collapse
10. Admin double-sidebar
11. Search wording không đúng context
12. AI Coach conversation có dấu hiệu duplicate
13. Empty state còn quá trống
14. Nature animation chưa polish đủ
```

---

# PHASE 1 — P0 STABILITY

# TASK 01 — AUDIT ADMIN ERROR

## Mục tiêu

Tìm chính xác nguyên nhân lỗi:

```text
Không thể mở nội dung này
Đã có lỗi khi tải trang
```

xuất hiện khi thao tác trong Admin.

## Files cần đọc

```text
frontend/src/pages/AdminPage.tsx
frontend/src/routes/
frontend/src/layouts/
frontend/src/components/
frontend/src/features/admin/
frontend/src/services/
```

Nếu Admin dùng lazy route:
đọc cả lazy imports.

## Prompt cho AI VS Code

```text
Đọc toàn bộ Admin routing và AdminPage.

Mục tiêu: xác định nguyên nhân gây ErrorBoundary "Không thể mở nội dung này".

KHÔNG sửa ngay.

Audit:

1. Tất cả route /admin và route con.
2. Lazy import.
3. Component import sai path.
4. Component bị undefined.
5. Hook gọi ngoài provider.
6. API throw chưa catch.
7. Query data shape mismatch.
8. Null/undefined access.
9. Menu item dẫn tới route chưa tồn tại.
10. Admin nested route không có element.
11. Suspense/lazy fallback.
12. ErrorBoundary catch point.

Trả về:

- route nào có nguy cơ lỗi
- file nào
- code line/logic gây lỗi
- cách reproduce
- fix đề xuất

Không thay đổi code trong task này.
```

---

# TASK 02 — FIX ADMIN ERROR

## Prompt

```text
Dựa trên kết quả TASK 01, sửa lỗi Admin.

Yêu cầu:

- Không xóa ErrorBoundary.
- Không che lỗi bằng try/catch vô nghĩa.
- Không redirect mọi lỗi về Dashboard.
- Route chưa triển khai thì:
  + không render menu
  hoặc
  + render ComingSoonPage an toàn
- API error phải render ErrorState thay vì crash.
- Null data phải có guard.
- Lazy import phải đúng.
- Admin role guard giữ nguyên.

Sau fix:
1. mở từng Admin menu
2. refresh từng route
3. back/forward
4. direct URL
5. logout/login
6. mobile

Build + test.
```

---

# TASK 03 — ADMIN MENU AVAILABILITY

## Mục tiêu

Không cho người dùng click vào module chưa thật sự chạy.

## Prompt

```text
Audit từng admin menu item.

Mỗi item phải có status:

available
comingSoon
hidden

Rules:

available:
click bình thường

comingSoon:
hiển thị label "Sắp có"
không navigate vào route lỗi

hidden:
không render

Không dùng màu xám nhạt để giả disabled mà không giải thích.

Không invent feature.
```

---

# PHASE 2 — DASHBOARD RESTRUCTURE

# TASK 04 — DASHBOARD LAYOUT AUDIT

## Reference target

```text
Scenic Hero
├── Greeting
├── Streak
├── XP
└── Level

Today Summary
Subjects
Pomodoro

Today Tasks
Weekly Calendar

Weekly Activity
Next Tasks
Plan Progress

AI Coach
```

## Prompt

```text
Đọc DashboardPage.tsx và toàn bộ component Dashboard hiện tại.

Không code.

Map:

- component hiện có
- API data hiện có
- data nào thiếu
- section nào duplicate
- section nào có thể reuse
- section nào cần mới

Đặc biệt audit data cho:

today tasks
weekly calendar
subject progress
Pomodoro
active plan
next tasks
streak
XP
level

Không đề xuất fake data.
```

---

# TASK 05 — DASHBOARD HERO V2

## Thiết kế

Hero phải gần reference hơn:

```text
┌─────────────────────────────────────────────────────┐
│ Xin chào, [Tên]! 🌿                                │
│ Một ngày mới, một cơ hội để tiến thêm một bước.    │
│                                                     │
│ [Chuỗi học] [XP/Level nếu thật]                    │
│                                  mountain/lake/fox  │
└─────────────────────────────────────────────────────┘
```

## Rules

- Scenic illustration chỉ desktop/tablet lớn
- Mobile giảm mạnh illustration
- Không che text
- Không fake weather
- Không fake XP/Level

## Prompt

```text
Redesign Dashboard Hero V2.

Use:
- forest/mountain/lake scenic background
- fox mascot
- cream mist overlay
- greeting
- real streak

If XP/Level backend chưa có:
KHÔNG hiển thị fake XP/Level.
Có thể giữ stat placeholder hidden.

Bunny không còn là hero mascot.
Bunny chỉ dùng empty state/task success nếu cần.

Keep:
responsive
dark mode
reduced motion
```

---

# TASK 06 — TODAY SUMMARY CARD

## Layout

```text
HÔM NAY — TÓM TẮT

[Task còn lại]
[Giờ/phút học]
[Tiến độ tuần]
[XP hoặc streak secondary]
```

## Prompt

```text
Gom các stats quan trọng vào Today Summary card.

Không làm 4 card rời lớn.

Use real data only.

Nếu không có XP:
thay bằng:
- Pomodoro hôm nay
hoặc
- Chuỗi học

Card phải responsive:
desktop 4 columns
tablet 2x2
mobile 2x2/1x4
```

---

# TASK 07 — SUBJECT PROGRESS PANEL

## Target

```text
MÔN HỌC ĐANG HỌC

Toán cao cấp       ███████░ 68%
Lập trình Python   █████░░░ 52%
...
```

## Prompt

```text
Nâng cấp ActiveSubjectsPanel.

Mỗi subject:
- icon/accent
- name
- progress bar
- percentage

Không fake progress.

Progress source ưu tiên:
1. API subject progress nếu có
2. task completion theo subject
3. plan progress aggregated

Nếu không đủ dữ liệu:
không hiển thị số % giả.
Chỉ render progress khi reliable.

No N+1 query.
```

---

# TASK 08 — MINI POMODORO DASHBOARD

## Layout

```text
POMODORO

        25:00
       Tập trung

      [Bắt đầu]

Chế độ: Tập trung sâu
```

## Prompt

```text
Tạo DashboardPomodoroCard.

Reuse Study/Pomodoro logic hiện có.

Không tạo timer logic thứ hai nếu module StudyPage đã có.

Requirements:
- current timer state sync
- start/pause/resume
- current mode
- no duplicate interval
- navigate to /study for full mode
- bear/tree decoration nhỏ
- reduced motion

Nếu Pomodoro module chưa usable:
render CTA "Mở tập trung" thay vì fake timer.
```

---

# TASK 09 — TODAY TASK LIST

## Target

Không chỉ 1 next task.

```text
CÔNG VIỆC HÔM NAY

□ Task 1     09:00
□ Task 2     11:00
□ Task 3     14:00
□ Task 4     16:00

+ Thêm công việc
```

## Prompt

```text
Đổi Dashboard nextTask-only thành TodayTaskList.

Max 4–5 task.

Sort:
overdue first
due time ascending
priority desc

Use existing TaskRow compact.

Allow complete toggle.

Không render full TasksPage toolbar.

Link:
Xem tất cả.
```

---

# TASK 10 — WEEKLY MINI CALENDAR

## Target

```text
LỊCH TUẦN NÀY

T2 T3 T4 T5 T6 T7 CN
12 13 14 15 16 17 18

event blocks
```

## Prompt

```text
Tạo DashboardWeeklyCalendar.

Reuse calendar/event API.

Range:
current week Monday–Sunday.

Render:
- day header
- max 2–3 small events/day
- today highlight
- click day -> /calendar?date=...

No drag/drop on Dashboard.
No edit here.

Responsive:
desktop 7 columns
tablet horizontal scroll
mobile compact 3-day view or horizontal scroll
```

---

# TASK 11 — NEXT TASKS PANEL

## Target

```text
VIỆC NÊN LÀM TIẾP

1. Ôn Python vòng lặp
2. Làm bài tập chương 3
3. Đọc chương 4
```

## Prompt

```text
Render 3 prioritized tasks.

Use deterministic task scoring nếu helper đã có.

Nếu chưa có:
sort by:
overdue
today
tomorrow
priority
in_progress

Không gọi AI cho panel này.

Each item:
title
subject
estimated minutes
deadline relative
open detail
```

---

# TASK 12 — PLAN PROGRESS DETAIL

## Target

```text
KẾ HOẠCH: Ôn thi giữa kỳ

█████████████░ 75%

Còn 12 ngày

✓ Hoàn thành 80% bài tập Toán
✓ Ôn tập 5 chương Python
○ Đọc 2 chương Kinh tế
○ Làm 3 đề luyện tập
```

## Prompt

```text
Nâng Active Plan card.

Show:
- title
- progress
- days remaining
- 3–4 next/important tasks
- task completion indicator

Không tạo milestone mới nếu backend chưa có milestone model.

Dùng tasks thuộc studyPlanId làm checklist.
```

---

# TASK 13 — DASHBOARD AI COACH CARD

## Prompt

```text
Giữ Owl.

Nếu backend AI briefing có dữ liệu:
render real briefing.

Nếu AI unavailable:
không hiển thị fake suggestion.

Fallback:
"Lập kế hoạch cùng AI"
button -> /ai-coach

Text không được nói:
"AI gợi ý bạn nên..."
nếu chưa có response thật.
```

---

# PHASE 3 — SIDEBAR

# TASK 14 — SIDEBAR COLLAPSE

## Behavior

```text
expanded: 256px
collapsed: 76px
```

## Prompt

```text
Thêm desktop sidebar collapse.

Requirements:
- persist preference localStorage
- icon-only collapsed
- tooltip labels
- active state
- logo mark only
- section labels hidden
- mobile drawer behavior giữ nguyên
- layout content width update smooth
- no layout jump
- no hover trap

Button:
<< / >>

aria-label rõ.
```

---

# TASK 15 — SIDEBAR INFORMATION ARCHITECTURE

## Proposed

```text
TỔNG QUAN
Dashboard

HỌC TẬP
Môn học
Kế hoạch
Công việc
Lịch

PHÁT TRIỂN
Mục tiêu
Tập trung
Thống kê

TÀI NGUYÊN ▾
Tài liệu
Ghi chú
Flashcard
Nhóm chia sẻ

HỖ TRỢ
AI Coach

TÀI KHOẢN
Cài đặt
Quản trị
```

## Prompt

```text
Refactor Sidebar nav grouping.

Không đổi route.

TÀI NGUYÊN:
collapsible group.

Persist expanded state optional.

Admin chỉ visible admin.

Không để sidebar phải scroll nhiều trên 1080p nếu có thể.
```

---

# TASK 16 — SIDEBAR USER FOOTER

## Target

```text
[Avatar] Nguyễn Yên
         Sinh viên
             v
```

## Prompt

```text
Thêm user footer ở bottom sidebar.

Use existing auth/profile data.

Expanded:
avatar + name + role.

Collapsed:
avatar only + tooltip.

Click:
profile/settings menu.

Không duplicate account dropdown logic nếu Topbar đã có reusable component.
```

---

# PHASE 4 — ADMIN LAYOUT

# TASK 17 — REMOVE DOUBLE SIDEBAR PRESSURE

## Recommended

Khi `/admin`:

```text
Global Sidebar collapsed
+
AdminSidebar
```

hoặc AdminLayout riêng.

## Prompt

```text
Thiết kế lại admin navigation width.

Goal:
không chiếm >500px navigation.

Preferred:
AdminLayout riêng với:
- admin sidebar 220–240px
- "Quay lại StudyFlow"
- main admin content

Alternative:
auto-collapse global sidebar when route startsWith('/admin').

Do not create nested router complexity unnecessary.

Preserve role guard.
```

---

# TASK 18 — ADMIN KPI + TABLE DENSITY

## Prompt

```text
Polish AdminPage.

KPI compact hơn student Dashboard.

Tables:
- clear header
- reasonable row height
- status badges
- actions in overflow
- no watercolor icons per row

Charts:
nature palette only.

No fake analytics.
```

---

# PHASE 5 — TOPBAR / SEARCH

# TASK 19 — GLOBAL SEARCH WORDING

Hiện có trường hợp topbar luôn ghi:

```text
Tìm môn học...
```

## Fix

Default:

```text
Tìm trong StudyFlow...
```

## Prompt

```text
Đổi topbar search placeholder thành global wording.

Nếu global search chưa functional:
- hoặc implement existing global search
- hoặc hide input trên page không support

Không để placeholder nói "Tìm môn học" ở Admin/Settings/Notes.

Preferred:
Tìm trong StudyFlow...
```

---

# TASK 20 — CONTEXTUAL SEARCH OPTIONAL

Nếu project đã có search routing:

```text
/tasks -> Tìm công việc
/subjects -> Tìm môn học
/notes -> Tìm ghi chú
```

Nhưng chỉ implement nếu dễ maintain.

Không bắt buộc.

---

# PHASE 6 — AI COACH FIX

# TASK 21 — CONVERSATION DUPLICATION AUDIT

## Prompt

```text
Audit AI Coach conversation lifecycle.

Kiểm tra vì sao nhiều conversation có cùng title:
"Lập kế hoạch cho tuần này".

Audit:
- new conversation creation trigger
- starter suggestion click
- send message
- current conversation state
- conversationId persistence
- query invalidation
- auto title

Không code.
```

---

# TASK 22 — FIX CONVERSATION CREATION

## Desired

```text
No active conversation
→ first message creates conversation

Active conversation exists
→ send into same conversation

+ Mới
→ explicitly creates/resets conversation
```

## Prompt

```text
Fix AI conversation lifecycle.

Starter suggestion:
nếu current conversation tồn tại,
send vào current conversation.

Không tạo conversation mới mỗi message.

+ Mới:
tạo blank/new conversation flow.

Auto title:
only once after first meaningful message.

No duplicate optimistic rows.
```

---

# TASK 23 — AI CHAT COMPOSER STICKY

## Prompt

```text
Đảm bảo ChatComposer sticky bottom trong AICoachPage.

Message list scroll độc lập.

Requirements:
- input luôn reachable
- mobile safe-area
- no overlap
- Enter send
- Shift+Enter newline
- error state không đẩy composer mất
```

---

# TASK 24 — AI UNAVAILABLE STATE

## Prompt

```text
Khi provider unavailable:

Render:
"Trợ lý AI đang tạm thời không phản hồi."

CTA:
"Thử lại"

Không để area trống 70% screen nếu không cần.

Có starter fallback:
- mở Tasks
- mở Study Plans

Không fake AI response.
```

---

# PHASE 7 — EMPTY STATE POLISH

# TASK 25 — STANDARD EMPTY STATE CARD

## Component

```text
NatureEmptyState
```

Props:

```text
title
description
action
secondaryAction?
mascot?
size
```

## Prompt

```text
Chuẩn hóa empty state.

Desktop:
max-width 640–760px.

Không để icon nhỏ giữa một màn hình trống 1500px.

Optional nature illustration.

Do not animate all empty states.
```

---

# TASK 26 — EMPTY STATE COPY

Examples:

Tasks:

```text
Hôm nay khá nhẹ nhàng.
Bạn chưa có công việc nào.
```

Plans:

```text
Chưa có hành trình nào.
Tạo một kế hoạch để bắt đầu.
```

Groups:

```text
Bạn chưa tham gia nhóm nào.
Học cùng nhau có thể giúp duy trì nhịp học.
```

Calendar:

```text
Chưa có sự kiện trong ngày này.
```

Không kết luận "bạn đang rảnh" nếu dữ liệu không đủ.

---

# PHASE 8 — NATURE MOTION

# TASK 27 — MASCOT ANIMATION INTEGRATION

Use synced frames.

Allowed places:

```text
Dashboard hero
Pomodoro
AI Coach
Empty states
```

Not every card.

## Prompt

```text
Integrate synchronized 4-frame mascot animations.

Use NatureMascot.

Frame timing:
700–1200ms/frame.

Bunny:
writing idle

Fox:
reading idle

Bear:
tea/focus idle

Owl:
reading/blink idle

Bush:
gentle sway

Rules:
- same canvas size
- no layout shift
- reduced-motion -> frame 1
- pause when document hidden
- optional pause offscreen
```

---

# TASK 28 — NATURE EFFECT BUDGET

Desktop per page:

```text
1 mascot
max 3 decorative effects
```

Mobile:

```text
1 mascot max
no falling leaves
no moving clouds
```

Prompt:

```text
Audit decorative animation count.

Remove excess continuous motion.

Use:
cloud drift
leaf drift
bush sway

No simultaneous heavy effects.
```

---

# PHASE 9 — RESPONSIVE POLISH

# TASK 29 — DASHBOARD MOBILE

## Prompt

```text
Test Dashboard at:

375
430
768
1024
1440
1920

Mobile order:

Hero
Today Summary
Today Tasks
Pomodoro
Weekly Calendar
Plan
Subjects
Next Tasks
AI

No horizontal overflow.

Hero scenic image reduced.
Fox small/static.
```

---

# TASK 30 — ADMIN RESPONSIVE

## Prompt

```text
Admin:

desktop:
admin sidebar + content

tablet:
collapsible admin nav

mobile:
drawer nav

Tables:
responsive horizontal only when necessary.

KPI:
4 -> 2 -> 1 columns.
```

---

# PHASE 10 — VISUAL CONSISTENCY

# TASK 31 — ICON POLICY

Functional icons:

```text
Lucide / existing icon system
```

Decorative icons:

```text
watercolor/nature assets
```

Do not replace:

```text
delete
edit
search
filter
sort
menu
settings
```

with ambiguous watercolor icons.

---

# TASK 32 — BORDER / SHADOW POLISH

## Prompt

```text
Audit card border/shadow.

All pages should use shared tokens.

Avoid:
strong shadow
blue shadow
inconsistent radius

Target:
14–18px card
10–12px input/button
subtle sage border
```

---

# TASK 33 — TYPOGRAPHY POLISH

Reference Dashboard has editorial heading.

Do not change all app font.

Optional:

```text
hero/page titles:
serif accent font
```

ONLY if project can load reliably and language support good.

Otherwise:
keep existing font.

Do not use handwritten font for body text.
```

---

# PHASE 11 — CLEANUP

# TASK 34 — UNUSED NATURE CSS

Audit:

```text
dashboard hero cloud class
unused nature classes
old blue theme CSS
duplicate colors
```

Remove only confirmed unused.

Do not delete classes by grep alone if dynamically generated.

---

# TASK 35 — UNUSED ASSETS

Do not ship giant sheets.

Production folder should contain only:

```text
used mascot frames
used hero
used small effects
logo
```

Other source assets stay outside deployed frontend if possible.

---

# PHASE 12 — TESTS

# TASK 36 — ROUTE TESTS

```text
/admin
/admin/*
/dashboard
/tasks
/study-plans
/calendar
/ai-coach
```

Ensure:

- refresh
- direct URL
- back/forward
- role
- no ErrorBoundary crash

---

# TASK 37 — DASHBOARD TESTS

Test:

```text
no tasks
many tasks
no plans
active plan
no subjects
many subjects
Pomodoro idle
Pomodoro running
AI unavailable
```

---

# TASK 38 — AI COACH TESTS

```text
first message creates 1 conversation
second message reuses it
starter prompt does not duplicate
new chat creates another
provider unavailable
retry
```

---

# TASK 39 — ACCESSIBILITY

Check:

```text
keyboard
focus
contrast
aria labels
reduced motion
drawer trap
modal trap
menu
```

---

# PHASE 13 — EXECUTION ORDER

## BATCH 1 — P0

```text
TASK 01
TASK 02
TASK 03
```

Commit:

```bash
git commit -m "fix: stabilize admin routes and error handling"
```

---

## BATCH 2 — DASHBOARD CORE

```text
TASK 04
TASK 05
TASK 06
TASK 07
TASK 08
```

Commit:

```bash
git commit -m "feat: align dashboard with nature reference design"
```

---

## BATCH 3 — DASHBOARD DATA

```text
TASK 09
TASK 10
TASK 11
TASK 12
TASK 13
```

Commit:

```bash
git commit -m "feat: enrich dashboard study overview"
```

---

## BATCH 4 — NAVIGATION

```text
TASK 14
TASK 15
TASK 16
TASK 17
```

Commit:

```bash
git commit -m "refactor: improve sidebar and admin navigation"
```

---

## BATCH 5 — SEARCH + AI

```text
TASK 19
TASK 20
TASK 21
TASK 22
TASK 23
TASK 24
```

Commit:

```bash
git commit -m "fix: improve search and ai coach conversation ux"
```

---

## BATCH 6 — POLISH

```text
TASK 25–35
```

Commit:

```bash
git commit -m "style: polish nature states motion and responsive ux"
```

---

## BATCH 7 — QUALITY

```text
TASK 36–39
```

Commit:

```bash
git commit -m "test: cover nature dashboard admin and ai ux"
```

---

# MASTER PROMPT CHO AI VS CODE

```text
Bạn đang làm Phase 2 Fix & Polish cho StudyFlow Nature UI.

Không redesign lại toàn bộ project.

Trước khi code:

1. Đọc file task yêu cầu.
2. Đọc API/hook liên quan.
3. Đọc shared UI.
4. Đọc nature-theme.
5. Đọc responsive styles.
6. Xác định behavior cần giữ.

Rules:

- Không đổi API nếu không cần.
- Không fake data.
- Không fake AI.
- Không phá router.
- Không phá auth/admin guard.
- Không phá Kanban.
- Không phá Calendar.
- Không phá dark mode.
- Không phá reduced motion.
- Không dùng any.
- Không thêm dependency nặng nếu không cần.
- Không duplicate component.
- Không tạo page mới nếu page có sẵn.
- Destructive actions phải confirm.
- Internal navigation dùng React Router.
- Asset decorative phải aria-hidden.
- Functional icons dùng existing icon system.

Sau code:

npm run lint
npm run test
npm run build

Báo cáo:

1. Files changed
2. Bug fixed
3. UI changed
4. Behavior preserved
5. Responsive
6. Accessibility
7. Test/build
8. Risks

CHỈ làm task được yêu cầu.
Không tự chuyển task.
```

---

# PROMPT TỔNG HỢP — ADMIN FIX

```text
Đọc toàn bộ AdminPage, Admin routes, Admin feature và ErrorBoundary.

Mục tiêu:
1. sửa crash "Không thể mở nội dung này"
2. kiểm tra mọi menu admin
3. route chưa có thì hidden/coming soon
4. không click vào route lỗi
5. giảm double-sidebar
6. giữ admin guard
7. giữ API
8. responsive
9. dark mode

Sau fix:
test direct URL + refresh + back/forward.
```

---

# PROMPT TỔNG HỢP — DASHBOARD V2

```text
Đọc DashboardPage và Dashboard components.

Align với reference:

1. scenic hero + fox
2. Today Summary
3. Subject Progress
4. mini Pomodoro
5. Today Task List
6. Weekly Calendar
7. Active Plan + checklist
8. Weekly Activity
9. Next Tasks
10. AI Coach

Không fake:
XP
Level
weather
AI insight
progress

Reuse current APIs.
No N+1.
Responsive.
Dark.
Reduced motion.
```

---

# PROMPT TỔNG HỢP — SIDEBAR

```text
Refine Sidebar:

1. collapse 256 -> 76
2. persist state
3. compact groups
4. collapsible Resources
5. user footer
6. Admin visibility
7. mobile drawer unchanged
8. tooltip collapsed
9. no unnecessary scroll at 1080p
```

---

# PROMPT TỔNG HỢP — AI COACH FIX

```text
Audit and fix AI Coach conversation UX.

1. first message creates conversation
2. subsequent messages reuse current
3. starter prompt does not create duplicate conversation
4. + Mới explicitly starts new
5. composer sticky bottom
6. unavailable state compact
7. no fake AI response
8. responsive
```

---

# DEFINITION OF DONE

## P0

```text
[ ] Admin no crash
[ ] all admin routes safe
[ ] no dead menu
```

## Dashboard

```text
[ ] hero closer to reference
[ ] fox
[ ] Today Summary
[ ] subject progress
[ ] Pomodoro
[ ] today tasks
[ ] weekly calendar
[ ] next tasks
[ ] active plan detail
[ ] AI card real/fallback
```

## Sidebar

```text
[ ] collapse
[ ] Resources group
[ ] user footer
[ ] no excessive scroll
```

## AI

```text
[ ] no duplicate conversation
[ ] sticky composer
[ ] good unavailable state
```

## Polish

```text
[ ] empty states compact
[ ] synced mascot motion
[ ] mobile
[ ] dark
[ ] reduced motion
[ ] no giant asset sheets
```

## Quality

```text
[ ] lint pass
[ ] test pass
[ ] build pass
[ ] no console error
```

---

# FINAL TARGET

Sau Phase 2, StudyFlow phải đạt cảm giác:

```text
Nature identity rõ
        +
Dashboard gần reference
        +
Admin ổn định
        +
Navigation gọn
        +
AI Coach không lỗi UX
        +
Animation nhẹ và đồng bộ
        +
Không hy sinh tính thực dụng
```
