# StudyFlow — VibeCode Redesign & UI Fix Prompt

> Mục tiêu: sửa trực tiếp frontend hiện tại của `Yiben633/Quan_Li_Hoc_Tap` để giao diện StudyFlow có hệ thống card rõ ràng hơn, mascot/con vật và asset thiên nhiên có kích thước cân đối với layout, đồng thời giữ nguyên logic/API/backend hiện có.

Repository:
- https://github.com/Yiben633/Quan_Li_Hoc_Tap
- Frontend: `frontend/`
- Asset pack hiện có: `STUDYFLOW_NATURE_ASSET_PACK/`

Stack đã xác nhận từ repository:
- React 18
- TypeScript
- Vite
- React Query
- PWA
- Backend Express/TypeScript
- PostgreSQL + Prisma
- Redis

Không được tự ý đổi stack hoặc viết lại backend nếu không cần thiết.

---

# 1. NGUYÊN TẮC QUAN TRỌNG

## 1.1. Không phá logic hiện tại

Trước khi sửa UI:

1. Đọc cấu trúc `frontend/src`.
2. Tìm layout dùng chung, sidebar, header, page components, UI primitives và các file CSS/Tailwind/theme.
3. Tìm tất cả nơi đang render mascot/nature assets.
4. Tìm component dùng cho:
   - Dashboard
   - Tasks/Công việc
   - Plans/Kế hoạch
   - Subjects/Môn học
   - Calendar/Lịch
   - Pomodoro
   - AI Coach
   - Empty states
5. Không xóa API call, React Query hooks, router, auth guard, state management hoặc type hiện tại chỉ vì mục đích redesign.
6. Ưu tiên chỉnh component dùng chung thay vì copy CSS sang từng page.

Nếu một component hiện tại đã có business logic đúng thì giữ logic, chỉ refactor phần presentation.

---

# 2. VẤN ĐỀ CẦN SỬA

Hiện tại mascot/con vật nhìn nhỏ hơn không gian giao diện và có cảm giác "dán vào" UI.

Cần sửa:

- Mascot không được quá nhỏ.
- Mascot phải có vùng hiển thị riêng.
- Không ép ảnh vào một kích thước cố định làm méo ảnh.
- Không dùng `width: 100%` cho mascot nếu khiến ảnh phình hoặc mất tỷ lệ.
- Dùng `object-fit: contain`.
- Không crop mất tai, chân, đuôi hoặc phụ kiện.
- Không thêm border/card nặng xung quanh mascot nếu thiết kế đang muốn cảm giác minh họa tự nhiên.
- Hình minh họa phải có cùng visual language: màu pastel, nét vẽ mềm, hơi texture, không quá sắc nét.
- Không sử dụng frame animation nữa.
- Không cần GIF/sprite animation cho mascot.
- Chỉ dùng ảnh tĩnh + CSS motion rất nhẹ.

---

# 3. QUẢN LÝ ASSET

Asset pack hiện có trong:

`STUDYFLOW_NATURE_ASSET_PACK/`

Hãy kiểm tra asset trước khi tạo file mới.

Tổ chức rõ ràng nếu cần refactor:

```text
frontend/
  public/
    studyflow/
      animals/
        bear.png
        bunny.png
        fox.png
        owl.png
        deer.png
        squirrel.png
        cat.png
      nature/
        bushes/
        grass/
        leaves/
        flowers/
        mushrooms/
        branches/
        clouds/
        rocks/
        stars/
      icons/
        studyflow-leaf.svg
        studyflow-logo.svg
```

Nếu asset đã tồn tại thì dùng lại, không tạo duplicate.

Nếu tên file hiện tại khác, tạo một lớp mapping hoặc barrel asset constants thay vì sửa hàng loạt import thủ công.

---

# 4. QUY TẮC HIỂN THỊ MASCOT

Tạo một reusable component:

```text
Mascot
```

hoặc tên tương đương phù hợp với code hiện tại.

API nên có concept tương tự:

```ts
type MascotProps = {
  animal: 'bear' | 'bunny' | 'fox' | 'owl' | 'deer' | 'squirrel' | 'cat';
  size?: 'sm' | 'md' | 'lg' | 'hero';
  className?: string;
  motion?: 'none' | 'float' | 'breathe' | 'sway';
  alt?: string;
};
```

Không bắt buộc dùng đúng API trên nếu architecture hiện tại có convention khác.

## Kích thước gợi ý

### Dashboard hero
- desktop: 220–300px
- tablet: 170–230px
- mobile: 120–170px

### Plan/Kế hoạch header
- 100–150px

### Empty state
- 150–220px

### Task/Subject card decoration
- 48–80px

### Sidebar decoration
- 70–110px

Không để mascot hero dưới khoảng 140px trên desktop nếu khu vực hero đủ rộng.

---

# 5. KHÔNG DÙNG FRAME ANIMATION

Loại bỏ logic kiểu:

```text
frame_1
frame_2
frame_3
frame_4
animation_strip
```

khỏi UI runtime nếu đang được dùng.

Không cần chuyển frame.

Thay bằng CSS animation nhẹ.

## Floating

```css
@keyframes studyflow-float {
  0%, 100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-6px);
  }
}
```

## Breathing

```css
@keyframes studyflow-breathe {
  0%, 100% {
    transform: scale(1);
  }

  50% {
    transform: scale(1.015);
  }
}
```

## Sway cho lá/cành

```css
@keyframes studyflow-sway {
  0%, 100% {
    transform: rotate(0deg);
  }

  50% {
    transform: rotate(1.5deg);
  }
}
```

Animation phải chậm và tự nhiên.

Không dùng:
- bounce mạnh
- shake
- spin
- animation quá nhanh
- parallax nặng
- continuous animation trên mọi element

Tôn trọng:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

# 6. DASHBOARD — REDESIGN

Dashboard cần có hierarchy rõ ràng:

```text
┌─────────────────────────────────────────────────────────────┐
│ Header                                                      │
├───────────────┬─────────────────────────────────────────────┤
│               │ Hero / Greeting                            │
│   Sidebar     │                                             │
│               │ mascot + greeting + quick actions           │
│               ├─────────────────────────────────────────────┤
│               │ Summary Cards                               │
│               ├───────────────────────┬─────────────────────┤
│               │ Today's Tasks         │ Pomodoro            │
│               ├───────────────────────┼─────────────────────┤
│               │ Weekly Calendar        │ Study Progress      │
│               ├───────────────────────┴─────────────────────┤
│               │ AI Coach / Next Actions                     │
└───────────────┴─────────────────────────────────────────────┘
```

Hero:

- background cream → pale sage gradient
- subtle mountain/forest illustration
- fox/bear/bunny mascot rõ ràng
- mascot nằm ở vùng illustration riêng
- không để text chồng lên mascot
- mascot không vượt quá hero container

---

# 7. CARD SYSTEM — QUAN TRỌNG

Tất cả Task, Plan, Subject, Pomodoro, Progress, AI Coach phải dùng một card system thống nhất.

Tạo hoặc chuẩn hóa component:

```text
Card
CardHeader
CardTitle
CardDescription
CardContent
CardFooter
```

Nếu project đã có UI primitive tương đương thì dùng lại.

## Card style

Mục tiêu:

- border rõ nhưng nhẹ
- nền cream/off-white
- radius 18–24px
- shadow rất nhẹ
- hover nhẹ
- padding thống nhất

Ví dụ concept:

```css
.studyflow-card {
  background: rgba(255, 253, 246, 0.92);
  border: 1px solid rgba(83, 111, 78, 0.18);
  border-radius: 20px;
  box-shadow: 0 8px 28px rgba(55, 76, 52, 0.06);
}
```

Không copy đúng giá trị nếu project đang có design token; ưu tiên đưa thành CSS variables/design tokens.

---

# 8. TASK CARD

Task hiện tại không được cảm giác như text rời.

Thiết kế:

```text
┌────────────────────────────────────────────────────────┐
│ □  Bài tập chương 3                     09:00          │
│    Toán cao cấp                                      │
│                                                       │
│    ● Ưu tiên cao       📅 Hôm nay        →            │
└────────────────────────────────────────────────────────┘
```

Yêu cầu:

- checkbox rõ ràng
- title nổi bật
- subject nhỏ hơn
- deadline/time rõ
- priority badge
- status badge
- hover border
- click toàn card
- keyboard accessible
- completed state có line-through nhẹ

Không để task chỉ là một dòng text trên background.

---

# 9. PLAN / KẾ HOẠCH CARD

Kế hoạch cần có "container" rõ:

```text
┌─────────────────────────────────────────────────────────┐
│ 🌿  Ôn thi giữa kỳ                                     │
│                                                         │
│ Tiến độ                                      75%        │
│ ███████████████████░░░░                                 │
│                                                         │
│ ✓ Toán chương 1                                        │
│ ✓ Python cơ bản                                        │
│ ○ Kinh tế vi mô                                        │
│                                                         │
│ 12 ngày còn lại                     Xem kế hoạch →     │
└─────────────────────────────────────────────────────────┘
```

Thêm:

- progress bar
- status
- deadline
- number of tasks
- subject
- priority
- CTA

Không dùng một panel quá rộng nhưng trống.

---

# 10. SUBJECT CARD

Mỗi môn học:

```text
┌──────────────────────────────────────┐
│ [icon]  Lập trình Python             │
│        12 nhiệm vụ                   │
│                                      │
│ ███████████████░░░░░   68%           │
│                                      │
│ Học tiếp →                           │
└──────────────────────────────────────┘
```

Mascot/nature decoration chỉ chiếm 10–20% visual area.

---

# 11. EMPTY STATE

Không để:

```text
Chưa có hành trình nào.
Tạo một kế hoạch để bắt đầu.
```

trôi giữa màn hình.

Dùng:

```text
┌──────────────────────────────────────────────┐
│                                              │
│             [fox / bunny illustration]       │
│                                              │
│          Chưa có kế hoạch nào                │
│                                              │
│    Tạo kế hoạch đầu tiên để bắt đầu.         │
│                                              │
│             [+ Tạo kế hoạch]                 │
│                                              │
└──────────────────────────────────────────────┘
```

Mascot khoảng 160–220px desktop.

---

# 12. PLAN PAGE

Header:

```text
Kế hoạch
Biến mục tiêu thành những chặng nhỏ có thể hoàn thành.

                              [+ Tạo kế hoạch]
                                  🦊
```

Các filter phải nằm trong một toolbar/card:

```text
┌─────────────────────────────────────────────────────────────┐
│ 🔍 Tìm kế hoạch...     [Bộ lọc] [Mới tạo ▼]                │
└─────────────────────────────────────────────────────────────┘
```

Danh sách plan dùng grid:

Desktop:

```text
3 columns
```

Tablet:

```text
2 columns
```

Mobile:

```text
1 column
```

Không để một card empty state rộng quá mức nếu chỉ có vài dòng text.

---

# 13. TASK PAGE

Desktop:

```text
┌─────────────────────────────────────────────────────────────┐
│ Công việc                                    [+ Công việc]  │
│                                                             │
│ [Tất cả] [Hôm nay] [Sắp tới] [Hoàn thành]                  │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Task card                                               │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Task card                                               │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

Nếu có Kanban hiện tại thì giữ functionality, nhưng mỗi task phải có card container rõ.

---

# 14. CALENDAR

Calendar cần:

- card wrapper
- header rõ
- current day highlight
- event chip pastel
- spacing thoáng
- không dùng border quá đậm

Event:

```text
┌───────────────┐
│ 🟢 Python     │
│ 09:00         │
└───────────────┘
```

---

# 15. POMODORO

Pomodoro phải là một card nổi bật:

```text
┌──────────────────────────────┐
│ POMODORO                     │
│ Tập trung                    │
│                              │
│           25:00              │
│                              │
│        [ ▶ Bắt đầu ]         │
│                              │
│ Chế độ: Tập trung            │
└──────────────────────────────┘
```

Có thể thêm mascot nhỏ ở góc dưới nhưng không che CTA.

---

# 16. AI COACH

AI Coach:

```text
┌──────────────────────────────────────────┐
│ ✨ AI Coach                              │
│                                          │
│ 🦉  Hôm nay bạn nên bắt đầu bằng         │
│     Python trong 45 phút.                │
│                                          │
│     [Áp dụng gợi ý]                      │
└──────────────────────────────────────────┘
```

Owl/bear mascot có thể được dùng cho AI Coach.

---

# 17. SIDEBAR

Sidebar cần đồng bộ với theme:

- cream background
- sage active state
- icon màu olive
- logo StudyFlow + leaf
- không quá nhiều decoration

Menu:

```text
Dashboard
Môn học
Công việc
Lịch học
Kế hoạch
Pomodoro
Mục tiêu
AI Coach
Cài đặt
```

Active:

```css
background: soft sage
color: deep forest
```

Không dùng shadow quá mạnh.

---

# 18. HỆ THỐNG MÀU

Dùng design tokens thay vì hard-code rải rác.

Gợi ý:

```css
:root {
  --sf-forest: #365C45;
  --sf-forest-deep: #294936;
  --sf-sage: #78956F;
  --sf-sage-soft: #DCE7D5;

  --sf-cream: #F7F4E9;
  --sf-paper: #FFFDF7;
  --sf-sand: #E8DCC4;

  --sf-brown: #806044;
  --sf-orange: #D99143;

  --sf-text: #24372C;
  --sf-muted: #68756C;

  --sf-border: rgba(73, 97, 76, 0.18);
}
```

Không bắt buộc đúng hex nếu hệ thống theme hiện tại đã có token tương đương.

---

# 19. HÌNH ẢNH PHẢI HÒA VỚI UI

Vấn đề chính hiện tại là mascot quá "rõ nét" so với UI.

Không làm ảnh mờ bằng CSS blur.

Thay vào đó:

- dùng asset có texture mềm
- opacity khoảng 0.94–1 tùy vị trí
- tránh shadow đen
- tránh outline quá tương phản
- background minh họa cùng palette
- nếu asset có viền quá đậm, ưu tiên thay asset phù hợp thay vì blur
- không thêm filter `blur()`
- không dùng `drop-shadow()` mạnh

Mascot phải giống một phần của illustration chứ không giống sticker PNG dán lên trang.

---

# 20. NATURE DECORATION

Có thể thêm:

- lá
- bụi cỏ
- hoa
- nấm
- cành cây
- mây
- đá
- đom đóm / hạt sáng
- chim nhỏ
- bướm
- sóc
- hươu

Nhưng decoration phải có hierarchy.

Quy tắc:

```text
UI content = 100% ưu tiên
Mascot = 20–30% visual attention
Nature decoration = 5–10%
```

Không để cây/lá che button hoặc text.

---

# 21. RESPONSIVE

Desktop:

- content max-width khoảng 1440px
- grid 12 columns hoặc layout tương đương
- sidebar cố định/collapsible

Tablet:

- giảm mascot
- 2-column card layout

Mobile:

- sidebar chuyển thành drawer/bottom navigation tùy architecture hiện tại
- card 1 column
- mascot nhỏ hơn
- không overflow ngang
- toolbar wrap
- task title không bị cắt

Test tối thiểu:

```text
360px
390px
768px
1024px
1280px
1440px
```

---

# 22. TYPOGRAPHY

Giữ cảm giác học tập + thiên nhiên.

Heading:
- serif mềm hoặc font heading hiện tại nếu đã có

Body:
- sans-serif dễ đọc

Không dùng quá nhiều font.

Heading hierarchy:

```text
H1: 32–42px desktop
H2: 24–30px
H3: 18–22px
Body: 14–16px
Caption: 12–13px
```

Mobile giảm hợp lý.

---

# 23. ACCESSIBILITY

Bắt buộc:

- alt text cho mascot
- icon button có aria-label
- focus-visible
- keyboard navigation
- contrast đủ đọc
- reduced motion
- button không chỉ dựa vào icon
- form label rõ ràng

---

# 24. KHÔNG LÀM

Không:

- đổi database
- đổi API contract
- xóa task logic
- xóa plan logic
- xóa authentication
- thay router nếu không cần
- thêm dependency lớn chỉ để làm animation
- dùng GIF mascot
- dùng sprite frame animation
- dùng animation quá mạnh
- dùng ảnh stock không đồng bộ
- tạo 5 biến thể CSS gần giống nhau cho cùng một card

Nếu cần animation, ưu tiên CSS hoặc animation library đã có trong project.

---

# 25. REFACTOR COMPONENT

Nếu code hiện tại chưa có design system rõ, tạo layer:

```text
frontend/src/
  components/
    ui/
      Card
      Badge
      Button
      Progress
      EmptyState
      SectionHeader
    nature/
      Mascot
      NatureDecoration
      FloatingLeaves
      ForestIllustration
```

Tên thư mục phải phù hợp với architecture hiện tại; không ép buộc nếu project đang dùng cấu trúc khác.

---

# 26. ASSET CONSTANTS

Tạo một nơi quản lý asset:

```ts
export const studyflowAssets = {
  animals: {
    bear: '/studyflow/animals/bear.png',
    bunny: '/studyflow/animals/bunny.png',
    fox: '/studyflow/animals/fox.png',
    owl: '/studyflow/animals/owl.png',
  },
  nature: {
    bush: '/studyflow/nature/bush.png',
    leaf: '/studyflow/nature/leaf.png',
    cloud: '/studyflow/nature/cloud.png',
  },
};
```

Không hard-code đường dẫn asset ở hàng chục component.

---

# 27. IMAGE RENDERING

Dùng:

```css
img {
  max-width: 100%;
  height: auto;
}
```

Mascot:

```css
.mascot {
  width: auto;
  height: auto;
  object-fit: contain;
  object-position: center bottom;
}
```

Không dùng:

```css
object-fit: cover;
```

cho mascot.

Hero mascot có thể dùng:

```css
.mascot--hero {
  width: clamp(180px, 22vw, 300px);
  max-height: 300px;
}
```

Nhưng phải điều chỉnh theo asset thực tế.

---

# 28. KIỂM TRA VISUAL

Sau khi sửa:

1. Chạy frontend.
2. Mở Dashboard.
3. Mở Tasks.
4. Mở Plans.
5. Mở Subjects.
6. Mở Calendar.
7. Mở Pomodoro.
8. Mở AI Coach.
9. Kiểm tra empty state.
10. Kiểm tra mobile.

Đặc biệt kiểm tra:

- mascot có bị nhỏ không
- mascot có bị crop không
- card có rõ khung không
- text có bị overflow không
- button có bị che không
- decoration có che content không
- grid có đều không
- spacing có nhất quán không

---

# 29. TEST / BUILD

Sau mỗi phase quan trọng chạy:

```bash
cd frontend
npm run lint
npm run test
npm run build
```

Sau khi hoàn thành toàn bộ:

```bash
cd backend
npm run lint
npm test
npm run build

cd ../frontend
npm run lint
npm run test
npm run build
```

Không kết luận hoàn thành nếu build fail.

Nếu test fail do code cũ, phân biệt rõ:

```text
Existing failure
New regression
```

Không sửa test để che lỗi.

---

# 30. GIT / CI

Repository hiện có CI và Vercel.

Không sửa workflow chỉ để bypass lỗi.

Không:

```text
eslint-disable toàn file
@ts-ignore hàng loạt
skip test
skip build
```

Mọi lỗi phải được xử lý đúng nguyên nhân.

---

# 31. IMPLEMENTATION ORDER

Làm theo thứ tự:

## Phase 1 — Audit

- inspect frontend structure
- inspect current asset usage
- inspect theme/CSS
- inspect layout
- inspect existing Card/Button/Badge components
- ghi lại các file sẽ sửa

## Phase 2 — Design tokens

- colors
- spacing
- radius
- shadows
- typography
- animation timing

## Phase 3 — Shared UI

- Card
- SectionHeader
- Badge
- Progress
- EmptyState
- Mascot
- NatureDecoration

## Phase 4 — Dashboard

- hero
- summary
- tasks
- subjects
- Pomodoro
- calendar
- AI Coach

## Phase 5 — Tasks

- filter
- task cards
- empty state
- responsive

## Phase 6 — Plans

- plan cards
- filters
- progress
- empty state

## Phase 7 — Subjects / Calendar / Pomodoro / AI Coach

Đồng bộ card system.

## Phase 8 — Responsive

Test 360 → 1440px.

## Phase 9 — Animation polish

Chỉ thêm motion nhẹ sau khi layout ổn định.

## Phase 10 — Validation

```bash
npm run lint
npm run test
npm run build
```

---

# 32. DEFINITION OF DONE

Chỉ hoàn thành khi:

- [ ] Mascot lớn và cân đối với từng context.
- [ ] Không còn frame animation.
- [ ] Mascot dùng ảnh tĩnh + motion nhẹ.
- [ ] Task có card/container rõ.
- [ ] Plan có card/container rõ.
- [ ] Subject có card/container rõ.
- [ ] Calendar nằm trong layout card rõ.
- [ ] Pomodoro có card riêng.
- [ ] AI Coach có card riêng.
- [ ] Empty states có mascot minh họa.
- [ ] Dashboard hero có mascot đủ lớn.
- [ ] Sidebar đồng bộ palette.
- [ ] Nature decoration không che content.
- [ ] Responsive tốt.
- [ ] Reduced-motion hoạt động.
- [ ] Không phá API/backend.
- [ ] Lint pass.
- [ ] Test pass.
- [ ] Build pass.

---

# 33. YÊU CẦU ĐỐI VỚI AI CODING AGENT

Bạn đang làm việc trên codebase hiện có.

Đừng chỉ tạo mockup.

Hãy:

1. đọc code hiện tại;
2. xác định component thực tế;
3. sửa trực tiếp component/style/asset mapping;
4. tái sử dụng logic hiện tại;
5. tạo shared components nếu cần;
6. chạy lint/test/build;
7. sửa lỗi phát sinh;
8. cuối cùng báo cáo:
   - file đã thay đổi
   - component đã tạo
   - asset đã dùng
   - lỗi đã sửa
   - lint result
   - test result
   - build result

Không dừng ở việc đưa ra code mẫu.

Mục tiêu cuối cùng là:

> StudyFlow phải trông giống một "khu rừng học tập" yên tĩnh, tự nhiên và có chiều sâu, trong đó task/plan/subject là nội dung chính còn mascot và thiên nhiên đóng vai trò hỗ trợ trải nghiệm.

