# VIBECODE — STUDYFLOW NATURE VISUAL POLISH + AUTH REDESIGN + LANDING PAGE

Project: StudyFlow  
Repo chính: Yiben633/Quan_Li_Hoc_Tap  
Repo phụ: Yiben633/Fe_skill

## Mục tiêu
1. xử lý mascot đang quá rõ nét, không đồng bộ với nền giao diện;
2. chuẩn hóa lại bộ mascot theo style soft watercolor / woodland / pastel;
3. bỏ hoàn toàn frame-based asset architecture;
4. thiết kế lại Login / Register theo phong cách thiên nhiên;
5. thêm trang giới thiệu / landing page;
6. gom toàn bộ thành một file VibeCode để triển khai.

---

## A. AUDIT NGẮN

### 1) Nature asset hiện chưa đồng nhất
Repo hiện vẫn còn tư duy frame animation:
- `frontend/src/config/natureAssets.ts` đang để Bunny / Fox / Bear / Owl và bush dưới dạng 4 frame.
- Trong khi `frontend/src/components/nature/NatureMascot.tsx` đang render theo kiểu 1 ảnh duy nhất.

=> Cần sửa triệt để về **single static asset architecture**.

### 2) Auth UI hiện đúng chức năng nhưng chưa đúng trải nghiệm
- `LoginPage.tsx` và `RegisterPage.tsx` đang có form logic ổn.
- `AuthLayout.tsx` còn quá mỏng, chỉ bọc children.
=> Cần nâng cấp AuthLayout thành một bố cục có visual nature riêng.

### 3) Route AI Coach cần ổn định hơn
Route `/ai-coach` hiện đang dễ bị phụ thuộc feature flag.
=> Nên giữ route tồn tại, còn unavailable thì render trạng thái an toàn thay vì 404.

### 4) Fe_skill public hiện chưa có nhiều tài liệu
README public của repo Fe_skill hiện chỉ là tiêu đề repo.
=> Chỉ dùng như repo phụ, không dựa vào đó làm guideline chính.

---

## B. VẤN ĐỀ THỊ GIÁC HIỆN TẠI

Vấn đề bạn thấy là đúng:

UI đang mềm, nhẹ, ít tương phản  
nhưng mascot lại:
- nét quá rõ,
- outline hơi dày,
- contrast hơi cao,
- saturation hơi nổi,
- cảm giác như sticker dán lên card.

### Mục tiêu mới
StudyFlow phải tạo cảm giác:
- calm
- soft
- airy
- pastel woodland
- storybook nhẹ

không phải:
- sticker dashboard
- mascot nổi hơn nội dung học tập

---

## C. PRINCIPLES CHO MASCOT MỚI

### 1) Không dùng frame nữa
Từ giờ mascot chỉ dùng:
- 1 ảnh tĩnh / 1 con
- CSS motion nhẹ

Không dùng:
- frame-1 → frame-4
- preload nhiều ảnh
- setInterval / swap src

### 2) Style bắt buộc
Tất cả mascot phải:
- transparent background
- pastel color
- outline mảnh hơn
- viền nâu-xanh mềm
- watercolor texture nhẹ
- saturation vừa phải
- contrast vừa phải
- edges mềm
- bóng đổ rất nhẹ

### 3) Kích thước
Hero mascot:
- desktop: 120–180px
- tablet: 96–140px
- mobile: 72–110px

Không phóng to mascot quá mức.

---

## D. TASKS — MASCOT VISUAL POLISH

### TASK 01 — Chuẩn hóa bộ mascot
Danh sách:
- fox
- bunny
- bear
- owl
- deer
- squirrel
- hedgehog
- robin
- raccoon
- frog

Prompt:
"""
Chuẩn hóa toàn bộ mascot StudyFlow.

Yêu cầu:
1. Không dùng frame animation nữa.
2. Mỗi mascot chỉ còn 1 file ảnh tĩnh transparent.
3. Tất cả cùng style:
   - soft watercolor
   - pastel woodland
   - subtle texture
   - reduced saturation
   - soft outline
   - gentle edges
4. Kích thước export đồng nhất:
   - 512x512 hoặc 640x640 transparent canvas
5. Ground/base và prop cùng phong cách:
   - sách, lá, cốc trà, đèn nhỏ, cỏ, hoa
6. Không làm mascot quá sắc cạnh.
7. Không dùng highlight gắt hoặc outline đen đậm.
8. Giữ readability ở kích thước nhỏ.

Đầu ra:
- /public/assets/nature/mascots/*.webp hoặc *.png
"""

### TASK 02 — Softening tạm thời bằng CSS
```css
.nature-mascot img {
  opacity: 0.96;
  filter: saturate(0.88) contrast(0.94) brightness(1.01);
}
```

Optional:
```css
.nature-mascot-soft img {
  filter: saturate(0.85) contrast(0.92) brightness(1.02);
}
```

Prompt:
"""
Audit mascot rendering.

Mục tiêu:
- giảm cảm giác sticker quá nét
- làm mascot hòa vào nền UI hơn

Thực hiện:
1. Kiểm tra kích thước render thực tế.
2. Không upscale asset quá mức.
3. Giảm saturation/contrast nhẹ bằng CSS utility class.
4. Nếu asset vẫn quá sắc:
   - thay asset mới
   - không cố cứu bằng blur mạnh
5. Không áp dụng filter khác nhau lung tung trên từng page.
6. Tạo một token class dùng chung:
   .nature-mascot-soft
"""

### TASK 03 — Outline / shadow policy
Không dùng:
- viền đen đậm
- drop shadow kiểu sticker
- glow mạnh

Prompt:
"""
Chuẩn hóa outline và shadow của mascot.

Requirements:
- không viền đen quá đậm
- không drop shadow kiểu sticker
- bóng đổ subtle
- đảm bảo mascot hòa vào card/background

Tạo token dùng chung cho image wrappers.
"""

---

## E. REFACTOR ASSET ARCHITECTURE

### TASK 04 — Refactor `natureAssets.ts`
Target:
```ts
export type NatureMascotAnimal =
  | 'fox'
  | 'bunny'
  | 'bear'
  | 'owl'
  | 'deer'
  | 'squirrel'
  | 'hedgehog'
  | 'robin'
  | 'raccoon'
  | 'frog'

export const natureAssets = {
  brand: {
    logoMark: '/assets/nature/brand/logo-mark.webp',
    logoFull: '/assets/nature/brand/logo-full.webp',
  },
  mascots: {
    fox: '/assets/nature/mascots/fox.webp',
    bunny: '/assets/nature/mascots/bunny.webp',
    bear: '/assets/nature/mascots/bear.webp',
    owl: '/assets/nature/mascots/owl.webp',
    deer: '/assets/nature/mascots/deer.webp',
    squirrel: '/assets/nature/mascots/squirrel.webp',
    hedgehog: '/assets/nature/mascots/hedgehog.webp',
    robin: '/assets/nature/mascots/robin.webp',
    raccoon: '/assets/nature/mascots/raccoon.webp',
    frog: '/assets/nature/mascots/frog.webp',
  },
  flora: {
    bush: '/assets/nature/flora/bush.webp',
    grass: '/assets/nature/flora/grass.webp',
    flower: '/assets/nature/flora/flower.webp',
  },
  effects: {
    cloud01: '/assets/nature/effects/cloud-01.webp',
    leaf01: '/assets/nature/effects/leaf-01.webp',
    leaf02: '/assets/nature/effects/leaf-02.webp',
  },
} as const
```

Prompt:
"""
Refactor frontend/src/config/natureAssets.ts.

Mục tiêu:
- bỏ hoàn toàn frame-array
- chuyển sang static asset registry
- thêm animal mới:
  deer, squirrel, hedgehog, robin, raccoon, frog
- bush/flora cũng dùng ảnh tĩnh

Không để bất kỳ type nào còn phụ thuộc:
NatureAssetFrameSet
frame-1
frame-2
frame-3
frame-4
"""

### TASK 05 — Polish `NatureMascot.tsx`
API:
```tsx
<NatureMascot animal="fox" motion="study" size="xl" />
```

Allowed motion:
- none
- float
- breathe
- study
- focus
- observe
- peek
- perch

Prompt:
"""
Polish NatureMascot.tsx.

Requirements:
1. Dùng single static mascot source.
2. Không logic frame.
3. Không timer.
4. Không preload nhiều ảnh.
5. Hỗ trợ motion class bằng CSS.
6. Có class mềm mặc định cho mascot:
   nature-mascot-soft
7. width/height explicit.
8. lazy loading by default.
9. hero mascot có thể priority/eager.
10. aria-hidden đúng nếu chỉ decorative.
"""

### TASK 06 — Tạo `nature-motion.css`
Prompt:
"""
Tạo nature-motion.css.

Chỉ dùng:
transform
opacity

Tạo các motion:
- float
- breathe
- study
- focus
- observe
- peek
- perch

Rules:
- duration 4.5s – 8s
- ease-in-out
- amplitude nhỏ
- reduced motion bắt buộc
- không layout shift
"""

---

## F. DASHBOARD VISUAL POLISH

### Mục tiêu
- mascot hòa vào scene
- card ưu tiên dữ liệu
- decorative elements nhạt hơn
- tổng thể dịu hơn

### Việc cần làm
1. Hero fox nhỏ hơn 10–18%.
2. Bush/cloud opacity giảm nhẹ.
3. Thêm haze/mist rất nhẹ.
4. Decorative elements aria-hidden.
5. Không đặt mascot ở quá nhiều card.
6. Mỗi màn hình chỉ 1 mascot chính.

Prompt:
"""
Polish Dashboard visual hierarchy.

Mục tiêu:
- giảm cảm giác mascot dán lên card
- mascot hòa vào scene
- ưu tiên dữ liệu học tập hơn là hình minh họa

Thực hiện:
1. Hero mascot nhỏ hơn 10–18%.
2. Bush/cloud opacity giảm nhẹ.
3. Thêm atmospheric haze/mist thật nhẹ.
4. Decorative elements aria-hidden.
5. Dashboard cards ưu tiên nội dung.
6. Không đặt mascot trong tất cả card.
7. Mỗi màn hình chỉ 1 mascot chính.
"""

---

## G. AUTH REDESIGN

### TASK 07 — Refactor `AuthLayout`
Layout đề xuất:

Desktop:
- 2 cột
- trái: nature showcase
- phải: form card

Mobile:
- 1 cột
- visual rút gọn

Prompt:
"""
Refactor AuthLayout thành nature-auth layout.

Requirements:
1. Desktop 2-column.
2. Left side có:
   - scenic illustration nhẹ
   - 1 mascot nhỏ
   - brand statement
   - 2–3 value highlights
3. Right side:
   - auth card
   - surface sáng
   - border mềm
   - shadow subtle
4. Mobile:
   - collapse thành 1 cột
   - visual rút gọn
5. Không để mascot lớn hơn form.
6. Không dùng visual quá rực.
"""

### TASK 08 — Redesign `LoginPage`
Giữ nguyên:
- react-hook-form
- validation
- mutation
- admin destination chooser

Chỉnh:
- brand mark dùng logo StudyFlow nature
- copy dịu hơn
- spacing tốt hơn
- button pine
- background leaves nhẹ
- fox hoặc owl nhỏ

Prompt:
"""
Polish LoginPage theo nature style.

Giữ nguyên:
- react-hook-form
- validation
- mutation logic
- admin destination chooser

Chỉnh:
1. brand mark dùng logo StudyFlow mới.
2. copy dịu hơn, ngắn hơn.
3. form spacing tốt hơn.
4. button primary đúng màu pine.
5. secondary links rõ nhưng không chói.
6. thêm subtle background leaves.
7. nếu có art panel thì fox hoặc owl nhỏ.
8. không dùng mascot quá nét hoặc quá to.
"""

### TASK 09 — Redesign `RegisterPage`
Prompt:
"""
Polish RegisterPage theo nature onboarding style.

Giữ nguyên:
- schema
- mutation
- navigate('/login', { state: { registered: true } })

Chỉnh:
1. form card mềm hơn
2. aside visual đồng bộ login
3. dùng bunny hoặc fox nhỏ
4. password fields dễ đọc hơn
5. CTA rõ
6. spacing thoáng
7. mobile vẫn ưu tiên form
8. không nhồi quá nhiều text marketing
"""

### TASK 10 — Brand consistency
Prompt:
"""
Audit toàn bộ auth branding.

Thay icon thương hiệu tạm thời bằng logo StudyFlow nature chính thức.

Đảm bảo:
- cùng tone
- cùng spacing
- cùng wordmark
- không trộn 2 brand mark khác nhau
"""

---

## H. THÊM TRANG GIỚI THIỆU / LANDING PAGE

### TASK 11 — Tạo `LandingPage`
Sections:
1. Hero
2. Feature band
3. Nature learning experience
4. Workflow section
5. Showcase
6. Soft product voice block
7. CTA cuối
8. Footer

Prompt:
"""
Tạo LandingPage public cho StudyFlow.

Requirements:
1. Nature style nhất quán.
2. Hero rõ ràng, nhẹ nhàng.
3. CTA chính: đăng ký.
4. CTA phụ: đăng nhập / khám phá.
5. Có section giới thiệu tính năng.
6. Có section workflow học tập.
7. Có section visual showcase.
8. Có section AI Coach / Pomodoro / Calendar.
9. Responsive tốt.
10. Không fake review người thật.
11. Không làm trang quá dài hoặc nặng.
12. Mascot chỉ điểm xuyết, không chiếm vai trò chính.
"""

### TASK 12 — Landing navbar
Prompt:
"""
Tạo public landing navbar.

Sticky nhẹ.
Background blur rất nhẹ.
CTA "Bắt đầu" nổi bật hơn "Đăng nhập".
Không dùng nhiều icon trang trí trong navbar.
"""

### TASK 13 — Landing hero visual
Prompt:
"""
Thiết kế hero visual của LandingPage.

Không dùng ảnh mascot quá nét.
Visual phải cùng tone với dashboard.
Ưu tiên:
- scenic softness
- app card preview
- small mascot accent
"""

### TASK 14 — Landing feature cards
Features:
- Quản lý môn học
- Lập kế hoạch học tập
- Theo dõi công việc
- Lịch học trực quan
- Pomodoro tập trung
- AI Coach hỗ trợ

Không để card nào có mascot riêng.

---

## I. ROUTING / IA

Public:
- /
- /login
- /register
- /forgot-password

Protected:
- /dashboard
- /subjects
- /tasks
- /study-plans
- /calendar
- /study
- /goals
- /notes
- /flashcards
- /groups
- /ai-coach
- /settings
- /admin

### TASK 15 — Fix `/ai-coach`
Prompt:
"""
Fix ai-coach routing architecture.

Target:
1. /ai-coach always registered
2. /assistant always redirects to /ai-coach
3. when feature disabled:
   - render unavailable state
   - not 404
4. sidebar link may hide/disable intentionally
5. tests update accordingly
"""

---

## J. FILES CẦN ĐỌC TRƯỚC KHI CODE

StudyFlow:
- frontend/src/config/natureAssets.ts
- frontend/src/components/nature/NatureMascot.tsx
- frontend/src/styles/nature-*.css
- frontend/src/styles/dashboard-hero.css
- frontend/src/layouts/AuthLayout.tsx
- frontend/src/pages/LoginPage.tsx
- frontend/src/pages/RegisterPage.tsx
- frontend/src/pages/DashboardPage.tsx
- frontend/src/pages/AICoachPage.tsx
- frontend/src/routes/config.tsx
- frontend/public/assets/nature/**

---

## K. EXECUTION ORDER

### Batch 1 — Foundation
- TASK 04
- TASK 05
- TASK 15

Commit:
`git commit -m "refactor: stabilize nature assets and ai coach routing"`

### Batch 2 — Mascot visual
- TASK 01
- TASK 02
- TASK 03
- TASK 06

Commit:
`git commit -m "style: unify soft watercolor mascot system"`

### Batch 3 — Dashboard polish
- Dashboard visual hierarchy

Commit:
`git commit -m "style: soften dashboard nature visuals"`

### Batch 4 — Auth redesign
- TASK 07
- TASK 08
- TASK 09
- TASK 10

Commit:
`git commit -m "feat: redesign auth experience with nature theme"`

### Batch 5 — Landing page
- TASK 11
- TASK 12
- TASK 13
- TASK 14

Commit:
`git commit -m "feat: add StudyFlow public landing page"`

### Batch 6 — QA
- responsive
- dark mode
- reduced motion
- test
- build

Commit:
`git commit -m "test: polish responsive and accessibility for nature ui"`

---

## L. MASTER PROMPT CHO AI VS CODE

"""
Bạn đang nâng cấp StudyFlow.

Mục tiêu lần này:
1. xử lý mascot quá sắc nét và không đồng bộ với giao diện
2. bỏ hoàn toàn frame asset architecture
3. chuẩn hóa mascot static + CSS motion
4. thiết kế lại login/register theo thiên nhiên
5. thêm landing page public
6. fix ai-coach route behavior

TRƯỚC KHI CODE:
- đọc file task
- đọc routes
- đọc auth pages
- đọc nature assets
- đọc dashboard hero styles
- đọc feature flag

RULES:
- không fake data
- không fake AI
- không phá logic form hiện có
- không đổi API nếu không cần
- không dùng frame animation
- không dùng timer đổi ảnh
- không thêm thư viện animation nặng nếu CSS đủ
- không để mascot chiếm spotlight hơn dữ liệu
- không làm landing page quá dài
- mỗi màn hình chỉ 1 mascot chính
- reduced motion bắt buộc
- responsive bắt buộc
- dùng same visual language cho dashboard, auth, landing

SAU KHI CODE:
frontend:
npm run lint
npm run test
npm run build

Nếu có chạm route/config:
kiểm tra direct URL:
/
 /login
 /register
 /dashboard
 /ai-coach

BÁO CÁO:
1. files changed
2. route changes
3. auth redesign changes
4. landing page sections
5. mascot asset changes
6. motion system changes
7. responsive
8. accessibility
9. test/build result
10. remaining risks

CHỈ làm task được yêu cầu.
"""

---

## M. DEFINITION OF DONE

Mascot:
- [ ] không còn frame architecture
- [ ] mascot là ảnh tĩnh
- [ ] cùng style
- [ ] ít sắc hơn
- [ ] hòa vào giao diện
- [ ] CSS motion nhẹ

Dashboard:
- [ ] mascot không còn quá nổi
- [ ] bush/cloud mềm hơn
- [ ] visual hierarchy rõ

Auth:
- [ ] login nature style
- [ ] register nature style
- [ ] brand đồng nhất
- [ ] responsive

Landing:
- [ ] có trang giới thiệu public
- [ ] hero rõ
- [ ] feature sections rõ
- [ ] CTA rõ

Routing:
- [ ] /ai-coach không biến mất vì feature flag
- [ ] /assistant redirect ổn

Quality:
- [ ] lint pass
- [ ] test pass
- [ ] build pass
- [ ] no console errors

---

## KẾT LUẬN

StudyFlow đang đi đúng hướng.
Vấn đề hiện tại chủ yếu là **độ đồng bộ thị giác** và **kiến trúc asset**.

Lần tối ưu này nên hướng tới cảm giác:

"một cuốn sổ học tập yên tĩnh giữa thiên nhiên"

chứ không phải:

"một dashboard gắn thêm sticker mascot".
