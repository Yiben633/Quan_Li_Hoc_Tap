# VIBECODE — REDESIGN STUDYFLOW THEO GIAO DIỆN THIÊN NHIÊN HOANG DÃ

> Project: **StudyFlow**
>
> Repository: `Yiben633/Quan_Li_Hoc_Tap`
>
> Phạm vi chính: `frontend/`
>
> Mục tiêu: redesign toàn bộ trải nghiệm StudyFlow theo phong cách **calm woodland / wild nature / cozy study**, sử dụng bộ mascot và asset thiên nhiên đã chuẩn bị, nhưng **không biến ứng dụng thành website trẻ em** và **không phá logic/API hiện tại**.

---

# 0. BỐI CẢNH SOURCE HIỆN TẠI

Frontend hiện là:

```text
React 18
TypeScript
Vite
React Query
PWA
Vitest
React Testing Library
```

Cấu trúc chính:

```text
frontend/src/
├── components/
├── config/
├── features/
├── hooks/
├── layouts/
├── pages/
├── routes/
├── services/
├── stores/
├── styles/
├── test/
├── types/
└── utils/
```

Các page liên quan đã tồn tại:

```text
AICoachPage.tsx
AdminPage.tsx
CalendarPage.tsx
DashboardPage.tsx
GoalsPage.tsx
KanbanPage.tsx
LearningSpacesPage.tsx
SettingsPage.tsx
StatisticsPage.tsx
StudyPage.tsx
StudyPlanDetailPage.tsx
StudyPlansPage.tsx
TasksPage.tsx
TopicDetailPage.tsx
TopicsPage.tsx
```

**Không tạo page mới nếu page tương ứng đã tồn tại.**

---

# 1. TRIẾT LÝ THIẾT KẾ

StudyFlow mới phải mang cảm giác:

```text
Rừng
Sương
Cây
Lá
Đá
Mây
Nấm
Ánh nắng nhẹ
Không gian học yên tĩnh
```

nhưng vẫn là:

```text
một productivity app nghiêm túc
```

Không được biến thành:

```text
game UI quá nhiều
trang trẻ em
màu sắc quá sặc sỡ
mascot xuất hiện mọi card
animation chạy liên tục
```

Tỷ lệ đề xuất:

```text
80% UI chức năng sạch
20% nature personality
```

---

# 2. PRODUCT METAPHOR

Có thể dùng metaphor nhẹ:

```text
Môn học       = khu vực học tập
Kế hoạch      = hành trình
Task          = bước tiếp theo
Pomodoro      = trạm tập trung
Progress      = tiến độ hành trình
Goal          = cột mốc
AI Coach      = người dẫn đường
```

Không đổi tên database/entity chỉ để theo metaphor.

UI vẫn dùng từ rõ ràng:

```text
Môn học
Kế hoạch
Công việc
Lịch
Mục tiêu
Tập trung
AI Coach
```

---

# 3. DESIGN TOKENS

Tạo file:

```text
frontend/src/styles/nature-theme.css
```

hoặc tích hợp vào design token system hiện tại nếu đã có.

## 3.1 Light palette

```css
:root {
  --nature-bg: #f2f3eb;
  --nature-bg-warm: #f6f1e6;

  --nature-surface: #fffdf7;
  --nature-surface-soft: #edf2e8;
  --nature-surface-sage: #dfe9dd;

  --nature-primary: #456b52;
  --nature-primary-hover: #385945;
  --nature-primary-soft: #d6e3d5;

  --nature-sage: #8da78c;
  --nature-moss: #6e825f;
  --nature-pine: #304f3c;

  --nature-sky: #dce9e8;
  --nature-sand: #eadcbf;
  --nature-bark: #84654c;

  --nature-coral: #df8266;
  --nature-amber: #d7a550;

  --nature-text: #26352c;
  --nature-text-secondary: #6f7b72;
  --nature-text-muted: #929b94;

  --nature-border: #d8ded4;
  --nature-border-strong: #c6cfc3;

  --nature-success: #5f8465;
  --nature-warning: #bf8a45;
  --nature-danger: #b9655b;
}
```

Không bắt buộc exact hex nếu existing theme cần điều chỉnh contrast,
nhưng phải giữ tinh thần palette này.

---

## 3.2 Dark palette

Dark mode không chuyển thành black/blue SaaS.

```css
[data-theme='dark'] {
  --nature-bg: #16221b;
  --nature-bg-warm: #1c261f;

  --nature-surface: #202e25;
  --nature-surface-soft: #26382c;
  --nature-surface-sage: #304537;

  --nature-primary: #91b195;
  --nature-primary-hover: #a7c4aa;
  --nature-primary-soft: #294234;

  --nature-text: #eef3ec;
  --nature-text-secondary: #b8c5ba;
  --nature-text-muted: #88978b;

  --nature-border: #34483a;
  --nature-border-strong: #435a49;
}
```

---

# 4. SHAPE / ELEVATION

Không làm card quá tròn kiểu mobile.

```text
Page container: max-width 1500–1600px
Card radius: 14–18px
Button radius: 10–12px
Pill/chip: full radius
Input radius: 10–12px
```

Shadow:

```css
box-shadow:
  0 1px 2px rgba(...),
  0 8px 24px rgba(54, 76, 58, 0.06);
```

Không dùng shadow xanh/neon.

---

# 5. TYPOGRAPHY

Giai đoạn đầu:

**giữ font hiện tại của project** để tránh thay đổi dependency không cần thiết.

Hierarchy:

```text
Page eyebrow
12–13px
uppercase
letter-spacing: .08em
primary/moss

Page title
32–40px
font-weight 700

Section title
18–22px

Body
14–16px

Metadata
12–14px
```

Có thể tạo cảm giác cozy bằng:
- spacing
- màu
- illustration

không cần font viết tay.

---

# 6. ASSET ARCHITECTURE

Đưa asset production vào:

```text
frontend/public/assets/nature/
│
├── brand/
│   ├── logo-mark.png
│   └── logo-full.png
│
├── mascots/
│   ├── bunny/
│   │   ├── frame-1.png
│   │   ├── frame-2.png
│   │   ├── frame-3.png
│   │   └── frame-4.png
│   ├── fox/
│   ├── bear/
│   └── owl/
│
├── effects/
│   ├── cloud-01.png
│   ├── cloud-02.png
│   ├── leaf-green.png
│   ├── leaf-orange.png
│   ├── wind-01.png
│   ├── stars.png
│   └── moon.png
│
├── flora/
│   ├── bush-01.png
│   ├── grass-01.png
│   ├── mushroom-01.png
│   ├── flower-01.png
│   ├── rock-01.png
│   └── foliage-corner-01.png
│
└── icons/
    ├── book.png
    ├── calendar.png
    ├── checklist.png
    ├── timer.png
    ├── leaf.png
    └── ai-coach.png
```

---

# 7. QUY TẮC ASSET

## DO

```text
Header illustration
Empty state
Sidebar bottom decoration
AI Coach mascot
Pomodoro mascot
Small success state
Decorative page corner
```

## DON'T

```text
mascot trong mọi task
mushroom trong mọi card
cloud trên mọi page
background image toàn màn hình
animation chồng animation
```

Asset không được làm giảm:
- readability
- accessibility
- scroll performance

---

# 8. MASCOT MAPPING

## Bunny

Ý nghĩa:

```text
học tập
viết
bắt đầu ngày
```

Dùng:

```text
Dashboard welcome
Empty task
Study Plan create success
```

---

## Fox

Ý nghĩa:

```text
đọc
khám phá
môn học
```

Dùng:

```text
Subject Detail
Documents/Notes
Study Plan
```

---

## Bear

Ý nghĩa:

```text
nghỉ
focus
cozy
Pomodoro
```

Dùng:

```text
StudyPage
Pomodoro
Break state
```

---

## Owl

Ý nghĩa:

```text
AI
phân tích
ban đêm
tri thức
```

Dùng:

```text
AI Coach
Analytics
Admin insights
```

---

# 9. MOTION PRINCIPLES

Animation phải nhẹ.

## Mascot

Frame animation:

```text
4 frames
700–1200ms/frame
loop chậm
```

Không chạy nhanh kiểu game sprite.

Ví dụ:

```text
bunny viết → blink → pencil lift → viết
fox đọc → blink → book tilt → tail sway
bear → sip → scarf sway → idle
owl → blink → page movement → lantern sway
```

---

## Nature effects

Cloud:

```text
translateX 8–20px
20–45s
```

Leaf:

```text
fall / drift
10–20s
chỉ 2–5 lá
```

Grass/Bush:

```text
rotate ±1deg
3–5s
transform-origin bottom center
```

---

## Reduced Motion

Bắt buộc:

```css
@media (prefers-reduced-motion: reduce) {
  animation: none !important;
  transition-duration: 0.01ms !important;
}
```

Không ẩn nội dung nếu animation bị tắt.

---

# 10. TẠO SHARED NATURE COMPONENTS

Tạo:

```text
frontend/src/components/nature/
├── NaturePageHeader.tsx
├── NatureMascot.tsx
├── NatureDecoration.tsx
├── NatureEmptyState.tsx
├── NatureProgress.tsx
├── NatureSection.tsx
└── NatureStatCard.tsx
```

Không tạo component nếu chỉ dùng một lần.

---

# TASK 01 — AUDIT DESIGN TRƯỚC KHI REDESIGN

## PROMPT

```text
Đọc toàn bộ frontend trước khi sửa:

frontend/src/styles/
frontend/src/layouts/
frontend/src/components/Sidebar.tsx
frontend/src/components/Topbar.tsx
frontend/src/components/ui/
frontend/src/pages/DashboardPage.tsx
frontend/src/pages/TasksPage.tsx
frontend/src/pages/StudyPlansPage.tsx
frontend/src/pages/StudyPlanDetailPage.tsx
frontend/src/pages/TopicDetailPage.tsx
frontend/src/pages/CalendarPage.tsx
frontend/src/pages/AICoachPage.tsx
frontend/src/pages/AdminPage.tsx
frontend/src/pages/StudyPage.tsx

Không code.

Trả về:

1. Existing CSS architecture.
2. Existing theme/dark mode.
3. Existing reusable cards/buttons/input.
4. Existing responsive breakpoints.
5. Existing layout max width.
6. Which components are shared.
7. Which pages contain page-specific hard-coded CSS.
8. Any CSS duplication.
9. Proposed exact files to change.
10. Risk of redesign breaking behavior.

Không sửa logic/API.
```

---

# TASK 02 — NATURE DESIGN TOKENS

## PROMPT

```text
Tạo nature design tokens dựa trên palette trong VibeCode.

Không redesign page ở task này.

Requirements:

- semantic CSS variables
- light
- dark
- border
- surface
- primary
- text
- danger/warning/success
- nature decorative colors

Map existing generic variables sang token mới nếu an toàn.

Không để một component vừa dùng --primary cũ vừa dùng #456b52 hard-code.

Không phá current theme switch.

Kiểm tra contrast:
button primary
body text
muted text
alert state.

Build pass.
```

---

# TASK 03 — NATURE ASSET REGISTRY

Tạo:

```text
frontend/src/config/natureAssets.ts
```

Ví dụ:

```ts
export const natureAssets = {
  mascots: {
    bunny: [...],
    fox: [...],
    bear: [...],
    owl: [...]
  },
  flora: {},
  effects: {},
  icons: {}
}
```

## PROMPT

```text
Tạo natureAssets registry.

Không hard-code asset path ở 12 page khác nhau.

Assets phải dùng /assets/nature/....

Nếu file chưa tồn tại:
không import broken path.
Tạo registry sau khi assets production đã được copy.

Không bundle giant sticker sheet vào app.
Chỉ dùng cropped asset thật.
```

---

# TASK 04 — MASCOT FRAME COMPONENT

Tạo:

```text
NatureMascot.tsx
```

API:

```tsx
<NatureMascot
  animal="bunny"
  animation="idle"
  size="md"
/>
```

Không bắt buộc Canvas.

Có thể dùng `<img>` đổi frame bằng timer/CSS.

## PROMPT

```text
Tạo NatureMascot.

Requirements:
- type-safe animal
- 4-frame idle sequence
- preload frame
- no layout shift
- configurable size
- aria-hidden nếu purely decorative
- alt nếu meaningful
- pause khi tab hidden nếu JS animation
- prefers-reduced-motion -> frame 1 static
- không animation chạy khi mascot offscreen nếu dễ implement
- không dependency animation nặng

Không thêm framer-motion chỉ vì mascot nếu project chưa cần.
```

---

# TASK 05 — GLOBAL APP SHELL

Phạm vi:

```text
Sidebar
Topbar
MainLayout
```

---

# 11. SIDEBAR REDESIGN

Visual:

```text
warm sage background
cream active item
pine text
small leaf logo
small forest decoration bottom
```

Desktop width:

```text
240–264px
```

Collapsed:

```text
72–80px
```

Active item:

```text
cream surface
subtle inner border
no bright blue
```

Sections:

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

HỖ TRỢ
AI Coach

TÀI KHOẢN
Cài đặt
```

Admin only:

```text
Quản trị
```

Mascot/decor:

chỉ ở bottom sidebar.

---

## PROMPT SIDEBAR

```text
Redesign Sidebar theo StudyFlow Nature.

Do not change route behavior.

Replace strong blue visual identity with nature token system.

Requirements:
- sage panel
- cream active nav
- pine text
- icon + label
- section labels
- role-based Admin stays correct
- mobile drawer unchanged behavior
- collapsed mode if existing
- bottom decorative foliage image
- logo from nature brand asset
- do not put mascot next to every nav item
- dark mode
- keyboard focus
- aria current
```

---

# 12. TOPBAR REDESIGN

Topbar:

```text
transparent / subtle surface
breadcrumb optional
search
notification
profile
```

Không cần illustration trong topbar.

Nature detail:

```text
small leaf divider
soft cream dropdown
sage focus ring
```

Không fake weather.

---

# TASK 06 — APP BACKGROUND

Main content:

```text
background:
very soft grey-green / warm cream
```

Optional:

```text
subtle radial gradients
```

Không dùng forest image full screen.

Example:

```css
background:
 radial-gradient(circle at 90% 0%, rgba(...), transparent 28rem),
 var(--nature-bg);
```

---

# PHASE DASHBOARD

# TASK 07 — DASHBOARD NATURE HERO

Current page:

```text
DashboardPage.tsx
```

## Hero layout

Desktop:

```text
┌──────────────────────────────────────────────────────────────┐
│ Chào buổi chiều, Yên 🌿                                     │
│ Hôm nay bạn muốn tiến thêm một bước nào?                     │
│                                                              │
│ [Xem công việc] [Bắt đầu tập trung]        forest scene      │
│                                             bunny             │
└──────────────────────────────────────────────────────────────┘
```

Hero background:

```text
mist sage
cream
subtle mountain/trees/cloud
```

Không để illustration che text.

Mobile:

illustration nhỏ dưới text hoặc hide decorative pieces.

---

# TASK 08 — DASHBOARD INFORMATION ARCHITECTURE

Layout:

```text
Hero

4 compact stats

Việc nên làm tiếp theo      Lịch hôm nay

Kế hoạch đang tiến hành     Hoạt động tuần

Môn học đang học            AI Coach
```

Không nhồi 10 cards cùng size.

---

## Stats

```text
Việc hôm nay
Đã hoàn thành
Phút tập trung
Chuỗi học
```

Icon có thể dùng regular app icons.
Không bắt buộc watercolor icon cho KPI.

---

# TASK 09 — NEXT TASK CARD

Card:

```text
VIỆC NÊN LÀM TIẾP

Ôn React Hooks
Lập trình Web

Hôm nay · 45 phút · Cao

[Bắt đầu] [Mở chi tiết]
```

Nature:

```text
tiny leaf accent
no mascot required
```

---

# TASK 10 — STUDY PLAN CARD DASHBOARD

Metaphor:

```text
trail progress
```

Nhưng UI vẫn là progress bar rõ.

```text
Ôn giữa kỳ React
72%
8/11 công việc
Còn 6 ngày
```

Có thể thêm tiny plant/tree at progress end,
nhưng không dùng path map phức tạp.

---

# TASK 11 — DASHBOARD WEEKLY ACTIVITY

Chart palette:

```text
pine
sage
moss
sand
```

Không chỉ dùng green nếu cần nhiều series.

Heatmap:

```text
empty = surface-soft
low = pale sage
medium = sage
high = pine
```

Tooltip readable.

---

# TASK 12 — DASHBOARD AI COACH CARD

Use owl mascot.

```text
AI COACH

Tuần này bạn có 2 công việc gần hạn.
Mình có thể giúp bạn chia lịch.

[Hỏi AI]
```

Nếu AI unavailable:

```text
không fake suggestion
```

Render normal static CTA:

```text
Lập kế hoạch cùng AI
```

---

# PROMPT DASHBOARD TỔNG

```text
Redesign DashboardPage theo Nature StudyFlow.

Giữ toàn bộ data fetching và API behavior hiện tại.

Design:
- nature hero
- bunny illustration
- greeting
- compact stats
- next task
- today's schedule
- active plans
- weekly activity
- subjects
- AI Coach card with owl

Rules:
- no fake weather
- no fake counts
- no fake AI insight
- no giant illustration on mobile
- no horizontal overflow
- no API change in this task
- current loading/error/empty states stay functional
- redesign skeleton to match final layout
- dark mode
- reduced motion
```

---

# PHASE TASKS

# 13. TASKS PAGE VISUAL DIRECTION

Tasks page phải sạch hơn Dashboard.

Không scenic hero lớn.

Header:

```text
CÔNG VIỆC
Từng bước nhỏ cho một hành trình dài.

                              + Tạo công việc
```

Small accent:

```text
leaf + branch corner
```

---

# TASK 13 — TASK SCOPE BAR

```text
[Hôm nay] [Sắp tới] [Quá hạn] [Tất cả]
```

Style:

```text
cream container
active moss/pine
```

Count badge subdued.

---

# TASK 14 — TASK TOOLBAR

```text
Search                             Bộ lọc  Sort

active filter chips
```

Nature theme:
- cream field
- sage border
- pine focus
- no bright blue

---

# TASK 15 — TASK ROW/CARD

Default list should not become massive nature cards.

```text
○ Ôn React Hooks                        Đang làm   ⋮
  Lập trình Web · Ôn giữa kỳ

  Hôm nay · 45 phút · Khó · Cao
  Checklist 2/4 ███████░
```

Nature only:
- priority edge line
- small subject color dot
- muted leaf marker optional

No animal.

---

# TASK 16 — TASK EMPTY STATE

When no tasks:

Use bunny static frame:

```text
Mọi thứ đang yên ắng.

Bạn chưa có công việc nào cho hôm nay.

[+ Thêm công việc]
```

Do not animate if empty state is below fold.

---

# TASK 17 — KANBAN

Kanban columns:

```text
Chưa làm
Đang làm
Chờ xử lý
Hoàn thành
```

Each column:
- subtle different nature tint
- no saturated color
- same TaskCard system

Column header tiny flora detail only if not cluttered.

---

# PROMPT TASKS TỔNG

```text
Redesign TasksPage + Kanban visual layer.

Do not rewrite task logic.

Use:
- nature page header
- compact scope pills
- cream toolbar
- reusable task row
- subtle priority accents
- bunny empty state
- restrained flora

Do NOT:
- put plants inside every task
- use texture behind text
- replace functional icons with ambiguous decorative icons

Maintain:
search
filters
selection
bulk actions
drawer
create/edit
Kanban drag/drop
responsive
dark mode
```

---

# PHASE STUDY PLANS

# TASK 18 — STUDY PLANS HEADER

Page:

```text
LỘ TRÌNH HỌC TẬP
Kế hoạch
Biến mục tiêu thành những chặng nhỏ có thể hoàn thành.

+ Tạo kế hoạch
```

Fox small illustration at right,
not more than ~160px desktop.

---

# TASK 19 — PLAN SUMMARY

Compact:

```text
Đang thực hiện
Sắp hết hạn
Hoàn thành
```

Use icon:
- leaf
- amber leaf
- check

No huge KPI card.

---

# TASK 20 — STUDY PLAN CARD

Nature trail concept lightly:

```text
status
plan title
subject
goal
date
progress
tasks
time
health
```

Example:

```text
Ôn thi Java
Java · Mục tiêu ≥ 8

Còn 6 ngày

██████████████░ 72%
8/11 công việc

Cần chú ý                    Tiếp tục →
```

Decorative:

```text
tiny pine/tree at bottom right
```

Only one tiny asset.

---

# TASK 21 — STUDY PLAN DETAIL

Page layout:

```text
← Kế hoạch

Plan Hero
------------------------------------------------
Fox / forest decoration

Title
Subject
Goal
Progress
Date
Health

[Tiếp tục] [+ Công việc] [⋯]


[Tổng quan] [Công việc]
```

Overview:

```text
Mục tiêu
Tiến độ
Việc tiếp theo
Thời gian
```

Task tab:
reuse Tasks UI.

---

# TASK 22 — PLAN EMPTY STATE

Use fox reading.

```text
Kế hoạch này chưa có công việc.

Hãy chia hành trình thành những bước nhỏ.

[Thêm công việc đầu tiên]
```

---

# PROMPT STUDY PLAN TỔNG

```text
Redesign StudyPlansPage + StudyPlanDetailPage.

Use nature journey metaphor only visually.

Required:
- fox mascot
- compact summary
- responsive grid
- nature plan cards
- detail hero
- progress
- next tasks
- existing CRUD works
- TaskList reused

Do not change backend/API contract.
Do not fake plan health or counts.
Keep accessibility.
```

---

# PHASE SUBJECT DETAIL

# TASK 23 — SUBJECT HEADER

Page:

```text
← Môn học

JS
Lập trình Web

3 tín chỉ · Đang học
Giảng viên...
Mục tiêu...

[+ Công việc] [Bắt đầu học]
```

Visual:

```text
small scenic strip:
pine
grass
fox
```

Use subject accent color,
but keep palette muted.

---

# TASK 24 — SUBJECT OVERVIEW

```text
Progress bar

4 stats:
Việc còn lại
Hoàn thành
Giờ học
Điểm

VIỆC CẦN ƯU TIÊN
max 5

KẾ HOẠCH CỦA MÔN
active plans
```

No duplicate full task list.

---

# TASK 25 — SUBJECT TASK TAB

Same TaskList design.

Compact.

No mascot in list.

Empty:
fox illustration.

---

# PROMPT SUBJECT

```text
Redesign TopicDetailPage as the StudyFlow nature Subject Detail.

Internal names may stay Topic/topicId if refactor risky.
UI uses Môn học.

Use:
- forest strip hero
- subject code/name
- stats
- priority tasks
- plans
- TaskList reuse

No duplicate task component.
No fake lecturer/grade.
If data missing, hide field.
```

---

# PHASE CALENDAR

# 14. CALENDAR VISUAL DIRECTION

Calendar should feel like:

```text
quiet paper planner
```

not illustrated poster.

Page header may have:
- cloud
- leaf
- tiny branch

Calendar itself stays clean.

---

# TASK 26 — CALENDAR HEADER

```text
LỊCH HỌC
Tháng 8, 2026

[Hôm nay]
[Ngày] [Tuần] [Tháng]
                       + Sự kiện
```

Use warm cream toolbar.

---

# TASK 27 — MONTH VIEW

Grid:

```text
surface
soft borders
weekend subtle sand tint
today sage circle
```

Event colors:

```text
class      pine
study      sage
deadline   coral
exam       amber
personal   sky
```

Each event must include label,
not color-only.

---

# TASK 28 — WEEK/DAY VIEW

Time axis clear.

Busy event:
solid low-saturation block.

Study AI planned event:
optional leaf icon,
not special neon color.

---

# TASK 29 — CALENDAR SIDE AGENDA

Desktop optional:

```text
HÔM NAY

09:00 Class
14:00 Assignment deadline
19:30 Study session
```

Decorative tiny branch at footer only.

Mobile:
agenda below/accessible through sheet.

---

# TASK 30 — CALENDAR EMPTY

No events:
small cloud + bush.

```text
Một ngày khá thoáng.

Bạn có thể dành một khoảng cho việc học.

[+ Thêm lịch học]
```

Do not claim user is free if calendar data incomplete.
Use wording:
`Chưa có sự kiện trong ngày này`.

---

# PROMPT CALENDAR

```text
Redesign CalendarPage into a calm paper-planner nature UI.

Do not touch timezone logic unless necessary for UI integration.

Keep:
create/edit/delete
drag/drop
day/week/month
event types

Nature:
subtle clouds/leaf in header,
cream paper grid,
sage focus,
muted category colors.

No illustrated background behind calendar cells.
Responsive and dark mode.
```

---

# PHASE AI COACH

# 15. AI COACH VISUAL IDENTITY

Mascot:

```text
Owl
```

Theme:

```text
quiet forest at night
moon
lantern
pine
```

But chat body remains highly readable.

---

# TASK 31 — AI COACH HEADER

```text
AI COACH
Người bạn đồng hành trong hành trình học tập.

owl + branch + moon
```

Header can use slightly darker sage/pine.

Not dark black.

---

# TASK 32 — CONVERSATION LIST

Desktop left panel:
- surface sage
- conversation groups
- active cream

No giant illustration.

Bottom small moon/stars optional.

---

# TASK 33 — CHAT MESSAGES

User:

```text
warm cream / sand
```

Assistant:

```text
soft sage surface
```

Do not use pure green chat bubbles.

Message max-width readable.

---

# TASK 34 — STARTER PROMPTS

Render as nature cards:

```text
🌿 Hôm nay nên học gì?
📚 Lập kế hoạch tuần này
🍂 Sắp xếp việc quá hạn
🌙 Tôi có 2 tiếng tối nay
```

Use actual app icon or tiny watercolor asset.
Do not rely on emoji if current design system avoids emoji.

---

# TASK 35 — AI PLAN DRAFT

Make plan preview feel like:

```text
trail itinerary
```

But still clear:

```text
Thứ Hai
19:00–19:45
Ôn React Hooks

20:00–20:45
REST API
```

Timeline line can be moss.

Apply button:
pine.

Warnings:
amber.

---

# TASK 36 — AI TYPING STATE

Owl:
small blink/static.

Text:

```text
AI Coach đang sắp xếp...
```

Avoid fake 5-second animation if response already ready.

---

# PROMPT AI COACH

```text
Redesign AICoachPage according to StudyFlow Nature.

Identity:
owl
moon
lantern
quiet night forest

But:
chat content readability > illustration.

Use:
- nature header
- conversation sidebar
- clean message bubbles
- suggestion cards
- plan draft timeline
- applied state
- conflict state

Do not change AI API logic in redesign task.
Do not expose provider key.
Responsive.
Dark mode should feel intentional, not simply invert colors.
```

---

# PHASE ADMIN

# 16. ADMIN DESIGN PRINCIPLE

Admin phải cùng family StudyFlow nhưng:

```text
less cute
more operational
denser
more restrained
```

Use:

```text
pine
sage
cream
bark
```

Mascot:
owl only in Insights section,
not dashboard hero character.

---

# TASK 37 — ADMIN SHELL

Admin sidebar:

```text
STUDYFLOW
Admin

Tổng quan
Người dùng
Môn học
Công việc
Kế hoạch
Lịch
AI Coach
Phân tích
Báo cáo
Cài đặt
```

If current AdminPage is single page without nested admin routes:
do not invent routes immediately.

First redesign existing AdminPage.

---

# TASK 38 — ADMIN HEADER

Header:

```text
QUẢN TRỊ STUDYFLOW

Tổng quan hệ thống
Theo dõi hoạt động học tập và tình trạng nền tảng.
```

Right:
small mountain/forest line art or pine illustration.

No bunny.

---

# TASK 39 — ADMIN KPI

```text
Tổng người dùng
Hoạt động hôm nay
Công việc đang mở
Kế hoạch đang chạy
```

Card style:

```text
white/cream
small nature icon
sparkline optional if data exists
```

No fake percentage.

---

# TASK 40 — ADMIN ANALYTICS

Chart palette:

```text
pine
sage
amber
coral
sky
```

Charts:
- user growth
- activity
- task completion
- plan adoption

Only render data backend actually has.

Do not generate hard-coded demo analytics in production.

---

# TASK 41 — ADMIN TABLES

Tables:
- users
- recent activity
- plans requiring attention

Style:
- cream surface
- sticky header if needed
- subtle zebra optional
- actions menu
- status badges nature palette

No watercolor icons in dense table rows.

---

# TASK 42 — ADMIN ATTENTION PANEL

```text
CẦN CHÚ Ý

AI errors
plans overdue
system warnings
reported content
```

Only show modules that exist.

Do not invent moderation feature.

---

# TASK 43 — ADMIN AI INSIGHTS

Owl card:

```text
AI / PHÂN TÍCH

Hoạt động học tập cao nhất...
```

If AI/backend insight unavailable:
show CTA or hide.

Never hard-code an AI conclusion.

---

# PROMPT ADMIN

```text
Redesign AdminPage as a professional nature-themed StudyFlow admin dashboard.

Same product family:
sage/pine/cream.

More operational:
- restrained illustration
- KPI
- charts
- tables
- attention panel
- AI insight only if real

No student mascot.
Owl only as subtle analytics/AI identity.
No decorative backgrounds behind tables.
Keep current admin APIs/role protection.
Responsive.
Dark mode.
```

---

# PHASE COMMON EMPTY / ERROR / LOADING

# TASK 44 — NATURE EMPTY STATES

Create mapping:

```text
Tasks empty       bunny
Plan empty        fox
Calendar empty    cloud/bush
AI empty          owl
Focus empty       bear
Subject empty     fox
Admin empty       no mascot / simple leaf
```

Do not animate error state.

---

# TASK 45 — ERROR STATES

Error UI:

```text
simple
not cute
```

Example:

```text
Không thể tải dữ liệu.
Thử lại sau một chút.

[Thử lại]
```

Small wilted leaf optional,
not sad animal.

---

# TASK 46 — LOADING

Prefer skeleton.

No full-page mascot spinner.

Can add tiny leaf pulse only if not distracting.

---

# PHASE RESPONSIVE

# TASK 47 — BREAKPOINTS

Target:

```text
mobile  < 640
tablet  640–1024
desktop > 1024
wide    > 1440
```

Respect project existing breakpoints where possible.

---

# TASK 48 — MOBILE NATURE RULES

On mobile:

```text
hide large scenic decoration
keep one mascot max
reduce asset opacity/size
no floating clouds
no falling leaves
```

Performance > decoration.

---

# TASK 49 — TABLET

Sidebar:
drawer/collapsible.

Dashboard:
2 columns.

Admin:
2-column KPI.
tables horizontal scroll only when unavoidable.

---

# PHASE ACCESSIBILITY

# TASK 50

Requirements:

```text
WCAG contrast
focus visible
text not over illustration
decorative img alt=""
meaningful img alt descriptive
status not color only
charts legend
keyboard menus
reduced motion
```

Mascot:
if purely decorative:

```tsx
alt=""
aria-hidden="true"
```

---

# PHASE PERFORMANCE

# TASK 51 — IMAGE OPTIMIZATION

Rules:

```text
PNG transparency only when needed
WebP preferred for larger static scene if acceptable
lazy load below fold
explicit width/height
avoid >500KB icon
preload only hero asset
```

Do not import giant sticker sheet and render with CSS background-position for normal icons.

Sprite frame assets:
small enough for animation.

---

# TASK 52 — DECORATION BUDGET

Per page desktop:

```text
1 primary illustration
0–3 small decorative assets
```

Not:

```text
20 falling leaves
```

---

# PHASE DARK MODE

# TASK 53

Nature dark:

```text
night forest
```

Not:
- pure black
- neon green

Images:
- no CSS invert
- lower brightness/opacity where needed
- moon/lantern assets can become more visible

Ensure:
card borders still visible.

---

# PHASE DESIGN COMPONENT CONSISTENCY

# TASK 54

Audit:
- Button
- Select
- Input
- Modal
- Drawer
- Tabs
- Badge
- Card

Apply theme centrally.

Do not style each page's button separately.

---

# PHASE PAGE-BY-PAGE EXECUTION ORDER

Do NOT redesign everything at once.

## BATCH 1 — FOUNDATION

```text
TASK 01 Audit
TASK 02 Tokens
TASK 03 Assets
TASK 04 Mascot
TASK 05 Sidebar
TASK 06 App background
```

Commit:

```bash
git commit -m "feat: introduce StudyFlow nature design system"
```

---

## BATCH 2 — DASHBOARD

```text
TASK 07–12
```

```bash
git commit -m "feat: redesign dashboard with nature experience"
```

---

## BATCH 3 — TASKS

```text
TASK 13–17
```

```bash
git commit -m "feat: redesign task management nature ui"
```

---

## BATCH 4 — STUDY PLANS

```text
TASK 18–22
```

```bash
git commit -m "feat: redesign study plan journey ui"
```

---

## BATCH 5 — SUBJECT

```text
TASK 23–25
```

```bash
git commit -m "feat: redesign subject detail nature ui"
```

---

## BATCH 6 — CALENDAR

```text
TASK 26–30
```

```bash
git commit -m "feat: redesign calendar as calm study planner"
```

---

## BATCH 7 — AI COACH

```text
TASK 31–36
```

```bash
git commit -m "feat: redesign ai coach woodland experience"
```

---

## BATCH 8 — ADMIN

```text
TASK 37–43
```

```bash
git commit -m "feat: redesign admin nature dashboard"
```

---

## BATCH 9 — QUALITY

```text
TASK 44–54
```

```bash
git commit -m "fix: polish nature theme accessibility and responsive ux"
```

---

# MASTER PROMPT — DÙNG TRƯỚC MỖI TASK

```text
Bạn đang redesign project StudyFlow.

Repository đã có frontend hoạt động.
Không được rewrite business logic.

TRƯỚC KHI CODE:

1. Đọc page/component được yêu cầu.
2. Đọc hooks/API mà page đang dùng.
3. Đọc shared UI components.
4. Đọc global styles.
5. Tìm cách reuse trước khi tạo component mới.

MỤC TIÊU:

Calm woodland / wild nature / cozy study.

DESIGN:

- warm cream
- sage
- moss
- pine
- soft sky
- bark
- subtle coral/amber
- rounded but professional
- watercolor illustration only as accents

RULES:

- Không đổi API contract.
- Không đổi route nếu task không yêu cầu.
- Không xóa chức năng đang chạy.
- Không mock data.
- Không hard-code count.
- Không dùng mascot quá nhiều.
- Không đặt illustration dưới text.
- Không ảnh hưởng readability.
- Không ảnh hưởng drag/drop.
- Không ảnh hưởng form validation.
- Không ảnh hưởng auth/role.
- Không phá dark mode.
- Không phá responsive.
- Không dùng any.
- Không thêm dependency animation nặng nếu không cần.
- Tôn trọng prefers-reduced-motion.
- Asset decorative phải aria-hidden.
- Image phải có width/height để tránh layout shift.

SAU KHI CODE:

npm run lint
npm run test
npm run build

Báo cáo:
1. Files changed
2. UI changes
3. Behavior preserved
4. Responsive changes
5. Accessibility
6. Assets used
7. Test/build result
8. Risks

CHỈ làm task được yêu cầu.
Không tự chuyển task.
```

---

# PROMPT — FOUNDATION TỔNG HỢP

```text
Redesign nền tảng visual StudyFlow sang nature theme.

Đọc:
styles
Sidebar
Topbar
MainLayout
components/ui
theme store/settings

Thực hiện:

1. nature semantic tokens
2. light/dark nature theme
3. surface/card/input/button consistency
4. Sidebar sage
5. active cream nav
6. page background
7. nature asset registry
8. NatureMascot reusable
9. reduced motion
10. maintain all existing behavior

Chưa redesign individual pages.
```

---

# PROMPT — DASHBOARD TỔNG HỢP

```text
Redesign DashboardPage theo calm woodland StudyFlow.

Use bunny + forest accent.

Layout:
- nature welcome hero
- 4 compact stats
- next task
- today schedule
- active plan
- weekly activity
- subjects
- AI Coach CTA

Do not fake:
weather
AI insights
stats

Preserve all API logic/loading/error.
Responsive + dark + reduced-motion.
```

---

# PROMPT — TASKS TỔNG HỢP

```text
Redesign TasksPage + Kanban visuals.

Nature must remain restrained.

Use:
- clean header
- scope pills
- search/filter/sort
- cream task rows
- sage/pine status
- subtle priority accents
- bunny empty state

No mascots in each row.
Delete/menus remain functional.
Drag/drop remains functional.
Task drawer remains functional.
```

---

# PROMPT — STUDY PLANS TỔNG HỢP

```text
Redesign StudyPlansPage + StudyPlanDetailPage.

Visual concept:
learning journey / forest trail.

Use fox only in page hero/empty state.

Cards show:
title
subject
goal
date
progress
task counts
health if real
CTA Continue

Detail:
hero
progress
overview
next tasks
task tab

Preserve CRUD and query logic.
```

---

# PROMPT — SUBJECT DETAIL TỔNG HỢP

```text
Redesign TopicDetailPage as nature Subject Detail.

Header:
subtle scenic forest
subject code/name
metadata
actions

Overview:
progress
stats
priority tasks
study plans

Tasks:
reuse existing TaskList.

Use fox only in header/empty state.

Do not fake metadata.
```

---

# PROMPT — CALENDAR TỔNG HỢP

```text
Redesign CalendarPage as a calm nature paper planner.

Use:
cream calendar surface
soft border
today sage
muted event colors
cloud/leaf header accents
agenda panel

Keep:
month/week/day
drag/drop
create/edit/delete
timezone behavior

No illustrated calendar cell background.
```

---

# PROMPT — AI COACH TỔNG HỢP

```text
Redesign AICoachPage.

Visual identity:
owl
moon
lantern
quiet forest night

Keep chat readable.

Use:
header illustration
conversation panel
chat messages
starter prompts
draft preview
timeline
apply/conflict states

Do not change AI API logic.
No fake typing delay.
```

---

# PROMPT — ADMIN TỔNG HỢP

```text
Redesign AdminPage with a professional nature operations style.

Same StudyFlow family:
pine/sage/cream.

More restrained than student pages.

Layout:
header
KPI
analytics
tables
attention panel
AI insight if real

No bunny/fox/bear.
Owl only subtle in AI/Insights.

Do not invent admin data or feature.
Keep admin guard/API behavior.
```

---

# ASSET PLACEMENT MAP

## Dashboard

```text
Hero:
bunny

Decor:
cloud
pine/tree
small bush

AI:
owl tiny
```

---

## Tasks

```text
Header:
leaf/branch

Empty:
bunny

No animated fauna in task rows
```

---

## Study Plans

```text
Hero:
fox

Plan cards:
tiny pine / leaf

Empty:
fox
```

---

## Subject Detail

```text
Header:
fox OR forest foliage
not both large

Empty:
fox
```

---

## Calendar

```text
Header:
cloud + leaf

Empty:
cloud + bush
```

---

## AI Coach

```text
Primary:
owl

Secondary:
moon
stars
branch
lantern

No bunny
```

---

## Pomodoro/Study

```text
Primary:
bear

Decor:
mushroom / grass
```

---

## Admin

```text
Header:
pine/mountain scene

Insights:
owl small

No animated mascot in KPI/table
```

---

# DEFINITION OF DONE

## Global

```text
[ ] Blue SaaS identity mostly removed
[ ] Nature palette globally consistent
[ ] Sidebar redesigned
[ ] Dark mode nature
[ ] Asset registry
[ ] Mascot reduced-motion
[ ] No giant sticker sheets shipped
```

## Dashboard

```text
[ ] Nature hero
[ ] bunny
[ ] responsive
[ ] data remains real
[ ] skeleton matches
```

## Tasks

```text
[ ] nature toolbar
[ ] list readable
[ ] Kanban readable
[ ] no mascot overload
```

## Plans

```text
[ ] forest journey identity
[ ] fox
[ ] plan detail consistent
```

## Subject

```text
[ ] subject hero
[ ] no duplicate task UI
```

## Calendar

```text
[ ] paper-planner feel
[ ] event colors accessible
```

## AI

```text
[ ] owl identity
[ ] readable chat
[ ] draft clear
```

## Admin

```text
[ ] professional nature style
[ ] data density preserved
[ ] tables/charts readable
```

## Quality

```text
[ ] mobile
[ ] tablet
[ ] desktop
[ ] wide
[ ] dark
[ ] reduced motion
[ ] keyboard
[ ] contrast
[ ] lint
[ ] tests
[ ] build
```

---

# GIT WORKFLOW

```bash
git checkout main
git pull origin main
git checkout -b feat/nature-redesign
```

Do not make one giant commit.

Final:

```bash
cd frontend

npm run lint
npm run test
npm run build

git status
git push -u origin feat/nature-redesign
```

---

# FINAL PRODUCT DIRECTION

StudyFlow phải có cảm giác:

```text
Bạn mở website
        ↓
không thấy áp lực bởi dashboard khô cứng
        ↓
thấy một không gian yên tĩnh
        ↓
biết hôm nay cần làm gì
        ↓
có một hành trình học rõ ràng
        ↓
nature visuals giúp giảm cảm giác "quản lý công việc"
        ↓
nhưng dữ liệu, task, deadline vẫn luôn rõ ràng
```

Nature là **bản sắc**.

Productivity vẫn là **chức năng cốt lõi**.
