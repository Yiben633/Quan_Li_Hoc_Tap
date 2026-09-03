# VIBECODE — STUDYFLOW STATIC MASCOT MOTION + LAYOUT FIX

> Project: **StudyFlow**
> Repository: `Yiben633/Quan_Li_Hoc_Tap`
>
> Mục tiêu:
>
> 1. Sửa các lỗi code/test hiện tại trước.
> 2. Loại bỏ hoàn toàn animation bằng 4 frame.
> 3. Mỗi mascot chỉ dùng **1 ảnh tĩnh transparent**.
> 4. Chuyển động bằng CSS `transform` / `opacity` để mượt hơn.
> 5. Sửa các bố cục Nature UI còn lệch.
> 6. Bổ sung thêm động vật có vai trò rõ ràng.
> 7. Không làm website nặng hoặc rối mắt.

---

# 0. KẾT QUẢ AUDIT SOURCE HIỆN TẠI

## 0.1. CI hiện đang FAIL

Latest CI trên GitHub hiện chưa xanh.

### Frontend

Test direct route `/ai-coach` đang có inconsistency.

Current route logic có dạng:

```tsx
...(aiFeaturesEnabled
  ? [
      { path: 'ai-coach', element: <AICoachPage /> },
      { path: 'assistant', element: <Navigate to="/ai-coach" replace /> },
    ]
  : [])
```

Trong CI:

```text
VITE_AI_ENABLED=false
```

nên route `/ai-coach` biến mất.

Nhưng route test vẫn kỳ vọng:

```text
/ai-coach
→ ai-coach-page
```

Kết quả:

```text
not-found-page
```

### Hướng fix khuyến nghị

Giữ route `/ai-coach` luôn tồn tại.

`aiFeaturesEnabled` chỉ quyết định:

- Sidebar có hiện AI hay không
- AI provider có usable hay không
- AICoachPage render available/unavailable state

Không nên làm direct URL `/ai-coach` thành 404.

---

## 0.2. Backend test cũng đang fail

Recent CI có backend `npm test` exit code 1.

Public GitHub log hiện không đủ để khẳng định test nào fail.

KHÔNG đoán nguyên nhân.

AI phải chạy local:

```bash
cd backend
npm test -- --reporter=verbose
npm run lint
npm run build
```

Sau đó sửa test fail đầu tiên.

---

## 0.3. NatureMascot hiện là frame animation

Current component:

```text
frontend/src/components/nature/NatureMascot.tsx
```

đang:

```text
preload 4 frame
↓
timer
↓
frameIndex
↓
đổi img src
```

Đây là nguyên nhân cảm giác không mượt.

Ngay cả khi:

```text
frame 1 = 600x700
frame 2 = 600x700
frame 3 = 600x700
frame 4 = 600x700
```

thì hình vẽ từng frame vẫn có:

- tai lệch
- mắt lệch
- tay lệch
- book lệch
- outline lệch
- ground lệch vài pixel

=> não người nhìn thấy “jump”.

---

## 0.4. Asset registry đang gắn với frame

Current:

```text
frontend/src/config/natureAssets.ts
```

có:

```text
bunny: [frame1, frame2, frame3, frame4]
fox: [...]
bear: [...]
owl: [...]
```

và bush cũng dùng frame.

Cần thay bằng single asset.

---

## 0.5. Dashboard scenic hero có mismatch

Current JSX có:

```tsx
<span className="dashboard-hero-hills" />
```

nhưng stylesheet hiện có class kiểu:

```text
dashboard-hero-cloud
dashboard-hero-mist
dashboard-hero-mountains
dashboard-hero-lake
```

`dashboard-hero-hills` không khớp hệ scene hiện tại.

=> scenic background chưa được dựng đúng.

---

## 0.6. Dashboard còn vài UX issue

### Stat

Component Stat đang dùng icon:

```text
TrendingUp
```

cho cả metadata không phải trend:

```text
Đến hạn hôm nay
Trong tuần này
Ngày liên tiếp
```

Không hợp semantics.

### AI fallback

Khi AI unavailable:

button có thể ghi:

```text
Lập kế hoạch cùng AI
```

nhưng destination lại:

```text
/study-plans
```

Wording phải đổi.

### Active Subjects

Subject panel chưa có progress đáng tin cậy như target reference.

---

## 0.7. Sidebar đã có nhiều cải tiến

Current Sidebar đã có:

```text
desktop collapse
TÀI NGUYÊN collapsible
user footer
admin role visibility
```

KHÔNG viết lại Sidebar.

Chỉ:

- migrate asset frame -> static
- polish motion
- spacing
- decoration

---

## 0.8. Admin đã được harden

Current Admin đã có:

```text
available
comingSoon
hidden
```

Không cần quay lại thiết kế menu availability từ đầu.

Chỉ tiếp tục:

- layout density
- animation policy
- static owl
- route test

---

# 1. TRIẾT LÝ ANIMATION MỚI

## CŨ — KHÔNG DÙNG

```text
4 PNG
↓
setInterval
↓
swap src
↓
fake frame animation
```

## MỚI

```text
1 PNG/WebP transparent
↓
CSS transform
↓
GPU-friendly motion
```

Ví dụ:

```text
Fox đọc sách
= ảnh fox tĩnh
+
body float nhẹ
+
rotate 0.4deg
+
shadow pulse rất nhẹ
```

Không cần fox phải thay hình.

---

# 2. TẠI SAO CÁCH MỚI MƯỢT HƠN?

Animation chỉ dùng:

```css
transform
opacity
filter
```

Browser có thể composite bằng GPU.

Không:

```text
đổi img src
decode image liên tục
layout khác nhau
frame jump
```

Kết quả:

```text
smooth
ít RAM hơn
ít network hơn
ít code JS hơn
ít bug hơn
```

---

# 3. MOTION LANGUAGE

Không phải con nào cũng nhảy/bay.

Mỗi mascot có một motion personality.

---

## Bunny

Role:

```text
Tasks
Learning
Getting started
Success
```

Motion:

```text
gentle-bob
study-breathe
tiny-tilt
```

Không bounce mạnh.

---

## Fox

Role:

```text
Subject
Study Plans
Dashboard hero
Reading
```

Motion:

```text
read-float
slow-tilt
subtle-tail illusion bằng whole-image rotate rất nhỏ
```

---

## Bear

Role:

```text
Pomodoro
Focus
Break
Rest
```

Motion:

```text
breathe
tiny-rise
steam từ mug bằng CSS pseudo-element
```

---

## Owl

Role:

```text
AI Coach
Analytics
Admin Insights
Night study
```

Motion:

```text
hover
lantern glow
tiny observation tilt
```

---

## Bush / flora

Motion:

```text
sway
```

Transform origin:

```text
bottom center
```

---

# 4. ĐỘNG VẬT MỚI

Không thêm ngẫu nhiên.

Mỗi con có purpose.

---

## Deer — Hươu

Role:

```text
Goals
Long-term Progress
Achievement
Semester completion
```

Ý nghĩa:

```text
bình tĩnh
tiến bước
trưởng thành
```

Motion:

```text
gentle-breathe
very-small head-like tilt bằng whole image
```

Use:

```text
Goals header
Goal completion
Semester progress
```

---

## Squirrel — Sóc

Role:

```text
Quick Tasks
Reminders
Inbox
Small actions
```

Ý nghĩa:

```text
nhanh nhẹn
thu thập
việc nhỏ
```

Motion:

```text
tiny-pop
hover-lift
```

Use:

```text
Quick Add
Notification empty state
Task reminder
```

Không continuous jump.

---

## Hedgehog — Nhím

Role:

```text
Notes
Flashcards
Revision
Memory
```

Ý nghĩa:

```text
ghi nhớ
thu thập kiến thức
```

Motion:

```text
slow-float
tiny-rotate
```

Use:

```text
Notes
Flashcard
Review session
```

---

## Robin / Songbird — Chim nhỏ

Role:

```text
Calendar
Morning
Streak
Daily briefing
```

Ý nghĩa:

```text
ngày mới
nhịp học
```

Motion:

```text
perch-bob
small float
```

Use:

```text
Calendar empty state
Morning greeting
Streak milestone
```

Không cho chim bay xuyên màn hình liên tục.

---

## Raccoon — Gấu mèo

Role:

```text
Study Groups
Community
Shared resources
Collaboration
```

Motion:

```text
peek
small hover
```

Use:

```text
Groups
Shared study
Community empty state
```

---

## Frog — Ếch

Role:

```text
Break
Rest
Rainy ambience
Pomodoro short break
```

Motion:

```text
breathe
tiny-up
```

Use:

```text
Pomodoro break state
Rest reminder
```

---

## Butterfly — Bướm

Không phải mascot chính.

Role:

```text
decorative effect
```

Use max:

```text
1–2
```

trong:

```text
Dashboard hero
Goal completion
```

---

# 5. PRODUCTION MASCOT SET

Production nên có tối đa:

```text
bunny
fox
bear
owl
deer
squirrel
hedgehog
robin
raccoon
frog
```

Không cần tất cả cùng xuất hiện trên một page.

---

# 6. MOTION BUDGET

## Desktop

Mỗi page:

```text
1 primary animated mascot
+
0–2 animated nature effects
```

Max:

```text
3 continuous animations
```

---

## Mobile

```text
1 mascot
0–1 effect
```

Không:

```text
falling leaves
moving clouds
fireflies
```

đồng thời trên mobile.

---

# 7. NEW ASSET STRUCTURE

Thay:

```text
mascots/
  bunny/frame-1.png
  bunny/frame-2.png
  bunny/frame-3.png
  bunny/frame-4.png
```

bằng:

```text
frontend/public/assets/nature/
├── mascots/
│   ├── bunny.webp
│   ├── fox.webp
│   ├── bear.webp
│   ├── owl.webp
│   ├── deer.webp
│   ├── squirrel.webp
│   ├── hedgehog.webp
│   ├── robin.webp
│   ├── raccoon.webp
│   └── frog.webp
│
├── flora/
│   ├── bush.webp
│   ├── grass.webp
│   ├── mushroom.webp
│   └── flower.webp
│
└── effects/
    ├── cloud.webp
    ├── leaf-green.webp
    ├── leaf-orange.webp
    ├── butterfly.webp
    ├── stars.webp
    └── moon.webp
```

Prefer:

```text
WebP transparent
```

nếu chất lượng alpha ổn.

PNG acceptable nếu asset nhỏ.

---

# PHASE A — FIX CI FIRST

# TASK 01 — FIX AI ROUTE TEST MISMATCH

## Files

```text
frontend/src/routes/config.tsx
frontend/src/routes/config.test.tsx
frontend/src/config/*
frontend/src/pages/AICoachPage.tsx
```

## Prompt

```text
Đọc AI route feature flag logic.

Current CI has:
VITE_AI_ENABLED=false

But route test expects:
/ai-coach

Current config conditionally removes route,
causing NotFound.

Fix architecture:

1. Keep /ai-coach route registered.
2. Keep /assistant redirect registered.
3. aiFeaturesEnabled controls feature availability, not route existence.
4. AICoachPage must render a safe unavailable state when AI disabled.
5. Sidebar may hide AI link when disabled if desired.
6. Direct URL must not 404.
7. No fake AI response.
8. Existing AI provider behavior preserved.
9. Update tests to reflect intentional behavior.
10. npm run test + build.

Do not disable the test just to make CI green.
```

---

# TASK 02 — BACKEND TEST FAILURE AUDIT

## Prompt

```text
Run:

cd backend
npm test -- --reporter=verbose
npm run lint
npm run build

Do not change code yet.

Return:

1. First failing test.
2. Error stack.
3. Expected vs actual.
4. Is it test regression or implementation regression?
5. File(s) involved.
6. Minimal fix.

Do not guess.
```

---

# TASK 03 — FIX BACKEND TESTS

```text
Apply minimal fix from TASK 02.

Do not:
- skip failing test
- mark todo
- weaken assertion without reason

After fix:
npm test
npm run lint
npm run build
```

---

# PHASE B — REMOVE FRAME SYSTEM

# TASK 04 — AUDIT FRAME USAGE

Search:

```text
NatureMascot
frameDurationMs
animation="idle"
useNatureFrameSequence
preloadFrames
natureAssets.mascots
natureAssets.flora.bush
frame-1
frame-2
frame-3
frame-4
```

## Prompt

```text
Audit all frame-animation dependencies.

Return:
- files importing NatureMascot
- files reading frame tuples
- direct frame paths
- bush frame usage
- tests depending on 4 frames
- CSS depending on frame class

No code.
```

---

# TASK 05 — REFACTOR natureAssets

## New type

```ts
export type NatureMascotAnimal =
  | 'bunny'
  | 'fox'
  | 'bear'
  | 'owl'
  | 'deer'
  | 'squirrel'
  | 'hedgehog'
  | 'robin'
  | 'raccoon'
  | 'frog'
```

New registry:

```ts
export const natureAssets = {
  mascots: {
    bunny: '/assets/nature/mascots/bunny.webp',
    fox: '/assets/nature/mascots/fox.webp',
    bear: '/assets/nature/mascots/bear.webp',
    owl: '/assets/nature/mascots/owl.webp',
    deer: '/assets/nature/mascots/deer.webp',
    squirrel: '/assets/nature/mascots/squirrel.webp',
    hedgehog: '/assets/nature/mascots/hedgehog.webp',
    robin: '/assets/nature/mascots/robin.webp',
    raccoon: '/assets/nature/mascots/raccoon.webp',
    frog: '/assets/nature/mascots/frog.webp'
  },

  flora: {
    bush: '/assets/nature/flora/bush.webp'
  }
}
```

## Prompt

```text
Refactor natureAssets from frame tuple to single static assets.

Requirements:
- no frame arrays
- no frame type
- add new animal type safely
- preserve existing asset groups
- do not add broken asset URLs before files exist
- temporarily allow fallback asset if new animals not copied yet
- TypeScript strict

Update natureEmptyStateAssets.
```

---

# TASK 06 — REWRITE NatureMascot

## New API

```tsx
<NatureMascot
  animal="fox"
  motion="read"
  size={180}
/>
```

Types:

```ts
type NatureMotion =
  | 'none'
  | 'float'
  | 'breathe'
  | 'study'
  | 'focus'
  | 'observe'
  | 'peek'
  | 'perch'
```

## Remove

```text
frameDurationMs
frameIndex
setInterval
setTimeout frame switch
new Image preload
useNatureFrameSequence
```

## Prompt

```text
Rewrite NatureMascot to single-image CSS-motion architecture.

Props:
animal
motion
size
className?
alt?
priority?

Requirements:
1. Only one img.
2. No JS animation loop.
3. No swapping src.
4. Explicit width/height.
5. Decorative default alt="" and aria-hidden.
6. Meaningful alt opt-in.
7. CSS class based on motion.
8. prefers-reduced-motion handled by CSS.
9. No layout shift.
10. Lazy loading by default.
11. Hero can opt into eager/high priority.
12. Remove old frame code after migration.

Maintain backwards compatibility temporarily if needed,
but final code must not use frame animation.
```

---

# PHASE C — CSS MOTION SYSTEM

# TASK 07 — CREATE nature-motion.css

Create:

```text
frontend/src/styles/nature-motion.css
```

Only animate:

```text
transform
opacity
filter sparingly
```

---

## Keyframe 1 — float

```css
@keyframes nature-float {
  0%, 100% {
    transform: translate3d(0, 0, 0) rotate(0deg);
  }

  50% {
    transform: translate3d(0, -4px, 0) rotate(.35deg);
  }
}
```

Duration:

```text
5.5s–7s
```

---

## Keyframe 2 — breathe

```css
@keyframes nature-breathe {
  0%, 100% {
    transform: translateY(0) scale(1);
  }

  50% {
    transform: translateY(-2px) scale(1.012);
  }
}
```

Duration:

```text
4.5–6s
```

---

## Keyframe 3 — study

Very subtle:

```text
translateY -2px
rotate ±0.25deg
```

6–8s.

---

## Keyframe 4 — observe / owl

```text
rotate -.4deg → .4deg
translateY 0 → -2px
```

7–9s.

---

## Keyframe 5 — perch

For bird:

```text
translateY 0 → -1.5px
```

No flying.

---

## Keyframe 6 — peek

For raccoon/squirrel:

```text
translateX 0 → 2px
rotate .3deg
```

---

## Prompt

```text
Create shared nature-motion.css.

Motions:
float
breathe
study
focus
observe
peek
perch

Rules:
- slow
- ease-in-out
- transform only where possible
- no keyframe under 3 seconds continuous
- no bounce
- no shake
- no pulse scale >1.02
- no layout property animation

prefers-reduced-motion:
all continuous motion disabled.

Do not use !important globally unless needed for reduced-motion fallback.
```

---

# TASK 08 — BUSH SWAY

```css
.nature-bush--sway {
  transform-origin: 50% 100%;
  animation: nature-bush-sway 4.8s ease-in-out infinite;
}
```

Range:

```text
-0.8deg → +0.8deg
```

Không dùng frame bush.

---

# TASK 09 — CLOUD DRIFT

Cloud:

```text
translateX 0 → 16px
```

Duration:

```text
32s
```

Do not loop visibly jumping.

Use alternate animation.

---

# TASK 10 — LEAF DRIFT

Only desktop.

Max:

```text
2–3 leaves
```

Motion:

```text
translate 0,0
→ 10px,18px
rotate 0→12deg
opacity .7→.15
```

Duration:

```text
12–18s
```

Do not create 20 DOM elements.

---

# TASK 11 — FIREFLY

Use only:

```text
AI Coach night
Pomodoro night mode
```

Max 3.

Animate opacity + tiny translate.

No canvas particle engine.

---

# TASK 12 — BEAR MUG STEAM

Do NOT alter bear image.

Create decorative pseudo-elements:

```text
2 steam lines
```

Animation:

```text
translateY(-6px)
opacity 0 → .7 → 0
```

Only when Bear displayed large enough.

---

# TASK 13 — OWL LANTERN GLOW

Use wrapper pseudo-element:

```text
radial-gradient
```

Animate:

```text
opacity .35 → .5
```

Duration:

```text
5s
```

Do not animate box-shadow strongly.

---

# PHASE D — MASCOT MAPPING

# TASK 14 — CENTRAL MASCOT ROLE CONFIG

Create optional:

```text
frontend/src/config/mascotRoles.ts
```

Example:

```ts
dashboard: {
  animal: 'fox',
  motion: 'study'
}

tasks: {
  animal: 'bunny',
  motion: 'study'
}

studyPlans: {
  animal: 'fox',
  motion: 'study'
}

subject: {
  animal: 'fox',
  motion: 'study'
}

pomodoro: {
  animal: 'bear',
  motion: 'breathe'
}

goals: {
  animal: 'deer',
  motion: 'breathe'
}

notes: {
  animal: 'hedgehog',
  motion: 'float'
}

flashcards: {
  animal: 'hedgehog',
  motion: 'study'
}

calendar: {
  animal: 'robin',
  motion: 'perch'
}

groups: {
  animal: 'raccoon',
  motion: 'peek'
}

aiCoach: {
  animal: 'owl',
  motion: 'observe'
}
```

Do not force components to use config if simpler direct props are clearer.

---

# PHASE E — DASHBOARD LAYOUT FIX

# TASK 15 — FIX HERO SCENE CLASS MISMATCH

## Prompt

```text
Read:
DashboardPage.tsx
dashboard-hero.css

Current JSX uses:
dashboard-hero-hills

Current CSS contains:
dashboard-hero-cloud
dashboard-hero-mist
dashboard-hero-mountains
dashboard-hero-lake

Resolve mismatch.

Preferred:
render the existing scene layers:

cloud
mist
mountains
lake

Remove obsolete hills reference if unused.

Requirements:
- no broken selector
- no dead CSS
- no content covered
- fox hero
- scenery aria-hidden
- responsive
- dark theme compatible
```

---

# TASK 16 — DASHBOARD HERO MASCOT

Change:

```text
Bunny
```

to:

```text
Fox
```

if target reference remains fox.

Motion:

```text
study
```

No frame.

Optional butterfly:

```text
1
```

decorative only.

---

# TASK 17 — DASHBOARD STAT SEMANTICS

Do not render TrendingUp universally.

Create metadata icon selection:

```text
deadline -> Clock/Calendar
week -> CalendarDays
streak -> Flame/Leaf
trend -> TrendingUp only when actual comparison exists
```

No fake trend indicator.

---

# TASK 18 — AI FALLBACK CTA

When AI unavailable:

Change:

```text
Lập kế hoạch cùng AI
```

if destination is `/study-plans`

to:

```text
Mở kế hoạch
```

or destination `/ai-coach` with unavailable state.

Copy must match actual action.

---

# TASK 19 — SUBJECT PROGRESS

Audit source.

If reliable progress data exists:

render:

```text
subject name
progress %
progress bar
```

If not:

do NOT fabricate.

Could derive from task completion only if:
- query already includes correct subject counts
- no N+1

Label derived metric clearly:

```text
Tiến độ công việc
```

not generic “Tiến độ môn học” if grades/study hours aren't included.

---

# TASK 20 — DASHBOARD GRID POLISH

Target desktop:

```text
Hero

Summary          Subjects        Pomodoro

Today Tasks      Weekly Calendar

Weekly Activity  Next Tasks      Plan Progress

AI Coach
```

Do not force exact reference if data unavailable.

Rules:

```text
CSS Grid
minmax(0, 1fr)
no fixed giant pixel widths
no overflow
```

At 1440–1920:
balanced.

At <=1024:
2 columns.

Mobile:
1 column.

---

# PHASE F — PAGE MOTION INTEGRATION

# TASK 21 — TASKS

Use:

```text
Bunny only:
- empty state
- create success optional

No mascot in every row.
```

Motion:

```text
study
```

Decor:

```text
bush sway at empty state bottom
```

No moving nature in scrolling task rows.

---

# TASK 22 — STUDY PLANS

Use:

```text
Fox
```

Places:

```text
header OR empty state
```

not both prominently.

Motion:

```text
study
```

Plan cards no animal.

---

# TASK 23 — SUBJECT DETAIL

Use:

```text
Fox
```

small scenic hero.

No frame.

Motion:

```text
study
```

Could add:

```text
static flowers
static grass
```

not 3 animations.

---

# TASK 24 — CALENDAR

Use new:

```text
Robin
```

only:

```text
empty state
morning/weekly header optional
```

Motion:

```text
perch
```

Cloud drift max 1–2.

Calendar grid itself static.

---

# TASK 25 — POMODORO / STUDY

Bear:

```text
breathe
```

Add:

```text
mug steam
```

Break mode:

optional Frog.

Focus mode should not have distracting continuous movement near timer.

When timer running:
bear motion can be reduced further.

---

# TASK 26 — GOALS

Use Deer.

Motion:

```text
breathe
```

Goal completion:

optional butterfly one-shot CSS transition.

Do not make confetti loop.

---

# TASK 27 — NOTES / FLASHCARDS

Use Hedgehog.

Motion:

```text
float
```

Only empty/header.

No mascot on every note/card.

---

# TASK 28 — GROUPS

Use Raccoon.

Motion:

```text
peek
```

Empty state / community intro.

---

# TASK 29 — AI COACH

Replace Owl frame animation.

Use:

```tsx
<NatureMascot
  animal="owl"
  motion="observe"
/>
```

Effects:

```text
lantern glow
0–2 fireflies
moon static
```

Do not animate message list background.

---

# TASK 30 — ADMIN

Admin:

```text
Owl static OR observe very slowly
```

Only AI insight/analytics header.

No continuous animal animation in:
- KPI
- tables
- logs
- users

Admin prioritizes readability.

---

# PHASE G — TOPBAR / SEARCH

# TASK 31 — SEARCH WORDING

Current Topbar behaves like subject search:

```text
Tìm môn học...
```

but appears across app.

Choose one intentional UX.

Option A preferred:
true global search.

Placeholder:

```text
Tìm trong StudyFlow...
```

Option B:
hide Topbar search outside subject pages.

Do not relabel it global if it still only searches subjects.

---

# PHASE H — SIDEBAR POLISH

# TASK 32

Do NOT rebuild Sidebar.

Current already has:
- collapse
- Resources
- user footer

Only:

1. Replace bush frame path with static bush.
2. Static or sway bush based on motion preference.
3. Ensure collapsed width doesn't clip logo.
4. Ensure asset doesn't intercept clicks:
   `pointer-events:none`.
5. Disable sway in reduced-motion.
6. No additional animals in Sidebar.

---

# PHASE I — ADMIN ROUTE QUALITY

# TASK 33 — ROUTE MATRIX

Test:

```text
/admin
/admin?tab=overview
/admin?tab=users
/admin?tab=templates
/admin?tab=feedback
/admin?tab=logs
/admin?tab=content
```

or actual current route system.

Ensure:

```text
comingSoon item does not crash
hidden item unavailable
refresh works
back/forward works
```

No assumption from old video; test current code.

---

# PHASE J — PERFORMANCE

# TASK 34 — REMOVE JS ANIMATION LOOP

Search final production code.

Must be zero mascot usage of:

```text
setInterval
requestAnimationFrame for static mascot
frameIndex
frameDurationMs
preloadFrames
new Image for frames
```

Unless used elsewhere for legitimate non-mascot purpose.

---

# TASK 35 — IMAGE FORMAT

Mascots:

Target:

```text
250–800px source dimension depending usage
WebP/PNG alpha
```

Avoid:

```text
2048x2048 mascot shown at 80px
```

Create sizes if useful:

```text
sm 160–256
md 384–512
lg 768
```

But don't over-engineer srcset if total assets already small.

---

# TASK 36 — LOADING POLICY

Above-fold hero mascot:

```text
eager
fetchpriority high optional
```

Below fold:

```text
loading=lazy
```

No preload all 10 animals.

---

# TASK 37 — ASSET CLEANUP

After every component migrated:

Remove production frame files:

```text
frame-1
frame-2
frame-3
frame-4
sprite strip
```

They can stay in:

```text
design-source/
```

outside deployed public folder if desired.

Do not delete until `grep` confirms no references.

---

# PHASE K — ACCESSIBILITY

# TASK 38 — REDUCED MOTION

Central rule:

```css
@media (prefers-reduced-motion: reduce) {
  .nature-motion {
    animation: none;
    transform: none;
  }
}
```

Do not use global:

```css
* { animation: none !important; }
```

if it breaks functional UI animations.

Disable only decorative motion classes.

---

# TASK 39 — DECORATIVE IMAGE SEMANTICS

Mascot if decorative:

```tsx
alt=""
aria-hidden="true"
```

Mascot if meaningful empty state:

```text
still can be decorative because text conveys meaning
```

No redundant:

```text
alt="cute fox reading a book"
```

if it adds no functional info.

---

# PHASE L — TESTS

# TASK 40 — NatureMascot Tests

Test:

```text
renders exactly one img
correct animal source
correct motion class
does not use frame timer
custom size
decorative alt
meaningful alt optional
```

No test waiting 900ms for frame change anymore.

---

# TASK 41 — ROUTE TEST

Must pass with:

```text
VITE_AI_ENABLED=false
```

Expected:

```text
/ai-coach
→ safe AI Coach unavailable page
```

not 404.

---

# TASK 42 — DASHBOARD TESTS

Verify:

```text
Hero renders fox
No dashboard-hero-hills stale class
AI fallback CTA correct
Stat metadata icon not universally TrendingUp
No fake subject progress
```

---

# TASK 43 — PERFORMANCE MANUAL TEST

Chrome DevTools:

Check:

```text
no repeated mascot image network request
no periodic src swap
no layout shift
no continuous React re-render every 900ms
```

React profiler:

NatureMascot should not rerender continuously just for animation.

---

# TASK 44 — PAGE MOTION QA

Test pages:

```text
Dashboard
Tasks
Plans
Subject
Calendar
Goals
Study/Pomodoro
Notes
Flashcards
Groups
AI Coach
Admin
```

Check:

```text
1 primary mascot max
motion not distracting
mobile reduced
reduced-motion works
```

---

# PHASE M — GIT EXECUTION

# BATCH 1 — CI

```text
TASK 01
TASK 02
TASK 03
```

Commit:

```bash
git commit -m "fix: restore green ci and stable ai routing"
```

---

# BATCH 2 — REMOVE FRAMES

```text
TASK 04
TASK 05
TASK 06
```

Commit:

```bash
git commit -m "refactor: replace mascot frames with static assets"
```

---

# BATCH 3 — MOTION SYSTEM

```text
TASK 07–13
```

Commit:

```bash
git commit -m "feat: add smooth nature css motion system"
```

---

# BATCH 4 — NEW ANIMALS

```text
TASK 14
copy new mascot assets
```

Commit:

```bash
git commit -m "feat: expand StudyFlow woodland mascot set"
```

---

# BATCH 5 — DASHBOARD

```text
TASK 15–20
```

Commit:

```bash
git commit -m "fix: align dashboard scene and study layout"
```

---

# BATCH 6 — PAGE INTEGRATION

```text
TASK 21–33
```

Commit:

```bash
git commit -m "feat: integrate smooth woodland motion across StudyFlow"
```

---

# BATCH 7 — PERFORMANCE & CLEANUP

```text
TASK 34–39
```

Commit:

```bash
git commit -m "perf: remove frame animation overhead"
```

---

# BATCH 8 — TESTS

```text
TASK 40–44
```

Commit:

```bash
git commit -m "test: cover static mascot motion and routes"
```

---

# MASTER PROMPT CHO AI VS CODE

```text
Bạn đang cải tiến StudyFlow Nature UI.

Mục tiêu lớn:
LOẠI BỎ hoàn toàn frame-based mascot animation.

Mascot mới:
1 static image
+
CSS transform/opacity motion.

TRƯỚC KHI CODE:

1. Đọc file task yêu cầu.
2. Đọc component/API liên quan.
3. Search frame references.
4. Đọc nature theme.
5. Đọc tests.
6. Không sửa ngoài scope.

RULES:

- Fix CI trước visual polish.
- Không skip test để CI xanh.
- Không fake user data.
- Không fake AI.
- Không đổi API contract nếu không cần.
- Không phá route.
- Không phá role guard.
- Không phá Kanban.
- Không phá Calendar.
- Không phá dark mode.
- Không dùng any.
- Không thêm animation package nếu CSS đủ.
- Continuous decorative animation >=3s.
- Prefer 5–9s.
- Transform/opacity only.
- 1 primary mascot/page.
- Mobile giảm motion.
- prefers-reduced-motion bắt buộc.
- No JS animation timer for mascot.
- No frame src swapping.
- No preload 4 frames.
- No giant sprite sheets in production.

AFTER CODE:

Frontend:
npm run lint
npm run test
npm run build

Backend if touched:
npm run lint
npm test
npm run build

Return:

1. Files changed
2. Bugs fixed
3. Old frame code removed
4. Motion added
5. Assets required
6. Performance impact
7. Responsive behavior
8. Accessibility
9. Test/build result
10. Remaining risks

CHỈ làm task được yêu cầu.
```

---

# PROMPT TỔNG HỢP — REMOVE FRAME ANIMATION

```text
Đọc:

frontend/src/components/nature/NatureMascot.tsx
frontend/src/config/natureAssets.ts
frontend/src/styles/nature-components.css
all NatureMascot usages

Replace frame animation with:

single image + CSS motion.

Remove:
frame arrays
frameIndex
frameDuration
frame preload
JS animation loops

Create:
nature-motion.css

Support:
none
float
breathe
study
focus
observe
peek
perch

Reduced motion.

Do not change page behavior.
Build/test pass.
```

---

# PROMPT TỔNG HỢP — DASHBOARD FIX

```text
Audit current DashboardPage.tsx and dashboard-hero.css.

Fix:
1. dashboard-hero-hills mismatch
2. render existing mountain/lake/mist/cloud scene properly
3. hero uses Fox static mascot + smooth CSS motion
4. no frame swapping
5. semantic stat icons
6. correct AI fallback CTA
7. subject progress only if real
8. balanced responsive grid

Do not invent XP/weather/progress.
```

---

# PROMPT TỔNG HỢP — NEW ANIMALS

```text
Expand NatureMascotAnimal:

deer
squirrel
hedgehog
robin
raccoon
frog

Roles:

deer -> goals/progress
squirrel -> quick tasks/reminders
hedgehog -> notes/flashcards
robin -> calendar/morning/streak
raccoon -> groups/community
frog -> break/rest

Each mascot:
ONE static transparent image.

No frame.

Assign slow CSS motion.

Do not render more than one primary mascot per page.
```

---

# PROMPT TỔNG HỢP — PERFORMANCE

```text
Audit nature animation performance.

Ensure:

- zero frame image swapping
- zero mascot intervals
- no React re-render loop for decorative motion
- images sized reasonably
- explicit dimensions
- lazy loading below fold
- only hero eager
- <=3 continuous decorative animations per desktop page
- <=1 on mobile where possible
- reduced-motion works
```

---

# FINAL DEFINITION OF DONE

## Bugs

```text
[ ] Frontend CI green
[ ] Backend CI green
[ ] /ai-coach direct route safe
[ ] no route test mismatch
[ ] no dashboard scene class mismatch
```

## Animation

```text
[ ] no frame animation
[ ] no frame preload
[ ] no frame timer
[ ] one static image per mascot
[ ] CSS motion smooth
[ ] bush CSS sway
[ ] cloud CSS drift
[ ] reduced motion
```

## Animals

```text
[ ] bunny
[ ] fox
[ ] bear
[ ] owl
[ ] deer
[ ] squirrel
[ ] hedgehog
[ ] robin
[ ] raccoon
[ ] frog
```

## Layout

```text
[ ] Dashboard scenic hero correct
[ ] balanced dashboard grid
[ ] subject progress truthful
[ ] Pomodoro not distracting
[ ] AI Coach calm
[ ] Admin restrained
[ ] Sidebar not rewritten unnecessarily
```

## Performance

```text
[ ] no periodic mascot React re-render
[ ] no giant deployed sprite sheet
[ ] mobile motion reduced
[ ] image lazy policy
[ ] no layout shift
```

## Quality

```text
[ ] lint pass
[ ] tests pass
[ ] build pass
[ ] no console errors
```

---

# PRODUCT RULE CUỐI

StudyFlow phải cảm giác như:

```text
một khu rừng đang sống
```

không phải:

```text
một trang web đầy GIF.
```

Sự sống đến từ:

```text
chuyển động chậm
nhịp thở
gió
mây
ánh sáng
mascot có cá tính
```

chứ không đến từ việc mọi thứ đều chuyển động.

Ưu tiên cuối cùng:

```text
Readability
> Functionality
> Calmness
> Personality
> Animation quantity
```
