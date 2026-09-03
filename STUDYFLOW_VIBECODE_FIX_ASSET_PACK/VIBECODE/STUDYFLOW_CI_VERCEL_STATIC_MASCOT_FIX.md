# VIBECODE — STUDYFLOW CI/VERCEL + STATIC MASCOT MOTION FIX

> Project: StudyFlow
> Repository: `Yiben633/Quan_Li_Hoc_Tap`
>
> Mục tiêu:
> - sửa CI frontend đang fail
> - audit/fix backend tests
> - sửa Vercel deployment
> - loại bỏ frame animation
> - chuyển mascot sang 1 ảnh tĩnh + CSS motion
> - chuẩn hóa asset
> - polish bố cục Dashboard/Admin/AI Coach
> - không phá API/business logic

---

# 1. FIX CI FRONTEND

## Vấn đề đã phát hiện

CI chạy với:

```text
VITE_AI_ENABLED=false
```

Route config hiện có khả năng loại bỏ hoàn toàn `/ai-coach` khi AI disabled,
trong khi route test vẫn yêu cầu direct URL `/ai-coach` hoạt động.

### Cách sửa

Giữ route:

```text
/ai-coach
/assistant -> /ai-coach
```

luôn tồn tại.

`aiFeaturesEnabled` chỉ quyết định:

- AI có usable không
- Sidebar có hiển thị AI hay không
- Page render available/unavailable state

Không để direct URL thành 404.

## Prompt

```text
Đọc:
frontend/src/routes/config.tsx
frontend/src/routes/config.test.tsx
frontend/src/pages/AICoachPage.tsx
frontend/src/config/

Fix AI route feature flag.

Requirements:
1. /ai-coach luôn registered.
2. /assistant redirect luôn registered.
3. VITE_AI_ENABLED=false không dẫn tới NotFound.
4. AICoachPage render safe unavailable state.
5. Sidebar có thể hide item nếu disabled.
6. Update tests theo behavior mới.
7. Không disable test.
8. npm run lint
9. npm run test
10. npm run build
```

---

# 2. AUDIT BACKEND TEST

Không đoán.

```bash
cd backend
npm test -- --reporter=verbose
npm run lint
npm run build
```

Prompt:

```text
Chạy backend tests verbose.
Tìm FIRST failing test.
Trả:
- test name
- stack
- expected
- actual
- implementation regression hay test regression
- minimal fix

Không sửa trước khi audit xong.
```

Sau đó sửa tối thiểu và chạy lại toàn bộ.

---

# 3. FIX VERCEL

## Audit bắt buộc

Đọc:

```text
vercel.json
frontend/package.json
backend/package.json
backend/src/app.ts
backend/src/server.ts
backend/api/ nếu có
```

### Kiểm tra entrypoint

Nếu `vercel.json` khai báo:

```json
"entrypoint": "api/index.ts"
```

nhưng file đó không tồn tại trong `backend/`,
deployment sẽ fail.

## Prompt

```text
Audit Vercel Services config.

1. Đọc vercel.json.
2. Xác nhận từng root tồn tại.
3. Xác nhận từng entrypoint tồn tại.
4. Không dùng path giả.
5. Backend Express phải export app theo cách Vercel hỗ trợ.
6. Frontend Vite root phải đúng.
7. Rewrites /api phải đi đúng backend service.
8. Không hard-code localhost production.
9. Không đưa secrets vào vercel.json.

Sau khi sửa:
npx vercel build
npm run build frontend/backend
```

---

# 4. LOẠI BỎ FRAME ANIMATION

## Xóa kiến trúc cũ

Search:

```text
NatureMascot
frameIndex
frameDurationMs
setInterval
setTimeout
preloadFrames
frame-1
frame-2
frame-3
frame-4
sprite_sheet
```

Không còn mascot animation bằng đổi `img.src`.

---

# 5. ASSET STRUCTURE MỚI

Copy pack này vào:

```text
frontend/public/assets/nature/
```

Kết quả:

```text
nature/
├── mascots/
├── leaves/
└── decorations/
```

Mascot production:

```text
fox.png
owl.png
bunny.png
deer.png
squirrel.png
raccoon.png
hedgehog.png
frog.png
robin.png
```

Optional:

```text
fox_sleep.png
bunny_laptop.png
```

Không dùng frame.

---

# 6. natureAssets.ts

Refactor:

```ts
export type NatureMascotAnimal =
  | 'fox'
  | 'owl'
  | 'bunny'
  | 'deer'
  | 'squirrel'
  | 'raccoon'
  | 'hedgehog'
  | 'frog'
  | 'robin'
```

Registry:

```ts
export const natureAssets = {
  mascots: {
    fox: '/assets/nature/mascots/fox.png',
    owl: '/assets/nature/mascots/owl.png',
    bunny: '/assets/nature/mascots/bunny.png',
    deer: '/assets/nature/mascots/deer.png',
    squirrel: '/assets/nature/mascots/squirrel.png',
    raccoon: '/assets/nature/mascots/raccoon.png',
    hedgehog: '/assets/nature/mascots/hedgehog.png',
    frog: '/assets/nature/mascots/frog.png',
    robin: '/assets/nature/mascots/robin.png'
  }
}
```

Không tuple frame.

---

# 7. NatureMascot.tsx

API mới:

```tsx
<NatureMascot
  animal="fox"
  motion="study"
  size={180}
/>
```

Motion:

```text
none
float
breathe
study
focus
observe
peek
perch
```

Requirements:

```text
ONE img
NO interval
NO src swap
NO preload frames
explicit width/height
lazy by default
hero can eager
prefers-reduced-motion
```

---

# 8. nature-motion.css

Chỉ dùng:

```text
transform
opacity
```

Ví dụ:

```css
@keyframes nature-float {
  0%, 100% {
    transform: translate3d(0,0,0) rotate(0);
  }

  50% {
    transform: translate3d(0,-4px,0) rotate(.35deg);
  }
}

.nature-motion--float {
  animation: nature-float 6.5s ease-in-out infinite;
}
```

Breathe:

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

Không bounce mạnh.
Không animation <3s continuous.

Reduced motion:

```css
@media (prefers-reduced-motion: reduce) {
  .nature-motion {
    animation: none;
    transform: none;
  }
}
```

---

# 9. MASCOT ROLE

```text
Dashboard      Fox
Tasks          Bunny
Study Plans    Fox
Subject        Fox
Pomodoro       Bear nếu asset hiện tại vẫn dùng
Goals          Deer
Notes          Hedgehog
Flashcards     Hedgehog
Calendar       Robin
Groups         Raccoon
AI Coach       Owl
Break          Frog
```

Mỗi page chỉ 1 mascot chính.

---

# 10. DASHBOARD FIX

Audit:

```text
DashboardPage.tsx
dashboard-hero.css
```

Nếu JSX còn:

```text
dashboard-hero-hills
```

nhưng CSS scene dùng:

```text
cloud
mist
mountains
lake
```

sửa mismatch.

Target:

```text
Hero
Summary
Subjects
Pomodoro
Today Tasks
Weekly Calendar
Weekly Activity
Next Tasks
Plan Progress
AI Coach
```

Không fake:

```text
XP
level
weather
AI insight
subject progress
```

---

# 11. DASHBOARD STAT SEMANTICS

Không dùng `TrendingUp` cho mọi metadata.

Mapping:

```text
deadline -> Clock/Calendar
week -> CalendarDays
streak -> Flame/Leaf
trend -> TrendingUp khi có comparison thật
```

---

# 12. AI FALLBACK CTA

Nếu destination là:

```text
/study-plans
```

button phải ghi:

```text
Mở kế hoạch
```

không phải:

```text
Lập kế hoạch cùng AI
```

---

# 13. SUBJECT PROGRESS

Chỉ render % khi có metric thật.

Nếu derive từ task:

label:

```text
Tiến độ công việc
```

không nói:

```text
Tiến độ môn học
```

nếu chưa bao gồm grade/study hours.

Không N+1.

---

# 14. PAGE MOTION POLICY

## Dashboard

```text
Fox study
1 butterfly optional
1 cloud drift
```

## Tasks

```text
Bunny empty state only
```

## Plans

```text
Fox header OR empty
```

## Calendar

```text
Robin empty/header
1 cloud
```

## Goals

```text
Deer
```

## Notes/Flashcards

```text
Hedgehog
```

## Groups

```text
Raccoon
```

## AI

```text
Owl observe
lantern glow
max 2 fireflies
```

## Admin

```text
Owl subtle only in insight
```

---

# 15. MOBILE MOTION

Mobile:

```text
1 mascot max
no falling leaves
no continuous butterfly
no multiple clouds
```

Desktop:

```text
max 3 continuous decorative animations/page
```

---

# 16. PERFORMANCE

Final production must have:

```text
0 mascot setInterval
0 frameIndex
0 frame preloader
0 periodic image src swap
```

Below fold:

```text
loading=lazy
```

Hero only:

```text
eager
```

No giant source sticker sheet in `public/`.

---

# 17. SIDEBAR

Không rewrite.

Chỉ:

```text
static plant/leaf decoration
pointer-events:none
reduced motion
no mascot in nav items
```

---

# 18. ADMIN

Test all actual admin states/routes.

Coming soon:

```text
không crash
không fake disabled state
```

Tables/KPI không có moving animal.

---

# 19. TESTS

NatureMascot tests:

```text
renders ONE img
correct source
correct motion class
no timer
size
alt
```

Route:

```text
VITE_AI_ENABLED=false
/ai-coach
→ safe page
```

Dashboard:

```text
hero fox
no stale hills class
AI CTA correct
no fake progress
```

---

# 20. EXECUTION ORDER

## Batch 1

```text
Fix frontend CI
Audit/fix backend CI
Fix Vercel
```

## Batch 2

```text
Remove frame architecture
Static natureAssets
Static NatureMascot
```

## Batch 3

```text
CSS motion
Leaves/decor
Reduced motion
```

## Batch 4

```text
Dashboard layout
```

## Batch 5

```text
Tasks
Plans
Subject
Calendar
Goals
Notes
Groups
AI
Admin
```

## Batch 6

```text
Performance
Asset cleanup
Tests
```

---

# MASTER PROMPT

```text
Bạn đang fix StudyFlow.

Ưu tiên:
1 CI xanh
2 Vercel deploy
3 bỏ frame animation
4 static mascot + CSS motion
5 layout polish

Không:
- skip test
- fake data
- fake AI
- đổi API nếu không cần
- dùng any
- animation library nặng
- src swapping
- JS mascot loop
- giant sprite sheet production

Animation:
- transform/opacity
- slow
- calm
- reduced-motion

Sau mỗi task chạy:

frontend:
npm run lint
npm run test
npm run build

backend nếu touched:
npm run lint
npm test
npm run build

Báo:
files changed
bug fixed
test result
build result
remaining risk

Chỉ làm task được yêu cầu.
```

---

# DEFINITION OF DONE

```text
[ ] Frontend CI green
[ ] Backend CI green
[ ] Vercel build green
[ ] /ai-coach không 404 do feature flag
[ ] mascot chỉ 1 ảnh
[ ] no frame
[ ] no interval
[ ] CSS motion
[ ] reduced motion
[ ] assets folder sạch
[ ] Dashboard bố cục ổn
[ ] no fake metrics
[ ] mobile ổn
[ ] dark mode ổn
[ ] no console error
```
