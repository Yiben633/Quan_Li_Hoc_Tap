# VIBECODE - ADMIN PORTAL VA ADMIN LOGIN FLOW

> Muc tieu: hoan thien khu vuc Quan tri StudyFlow dua tren module da co,
> cho phep tai khoan bootstrap admin chon vao trang quan tri hoac trang ca
> nhan sau khi dang nhap.

## Nguyen tac bat buoc

- Khong kiem tra email o frontend de cap quyen admin.
- Backend va database la nguon su that cho role `admin`.
- Email bootstrap la `BinN63342@gmail.com`, so sanh case-insensitive va chi
  dung de cap role mot lan qua script/migration co kiem soat.
- Khong tao tai khoan mau, khong doi password cua bat ky tai khoan nao.
- Admin API luon giu `authenticate` va `authorize('admin')`.
- Trang quan tri khong xuat hien voi user thuong.
- Khong hien thi password hash, refresh token, IP day du, hoac du lieu nhay
  cam khong can thiet trong danh sach nguoi dung.

---

## TASK 00 - Audit admin hien tai

Doc truoc khi sua:

```text
backend/src/modules/admin/
backend/src/modules/auth/
backend/src/middlewares/auth.ts
frontend/src/pages/AdminPage.tsx
frontend/src/features/admin/
frontend/src/routes/guards.tsx
frontend/src/routes/config.tsx
frontend/src/components/Sidebar.tsx
frontend/src/stores/authStore.ts
database/prisma/schema.prisma
```

Xac nhan cac phan da co: AdminRoute, `/api/admin/users`, pagination, search,
audit log va sidebar condition theo role. Khong redesign hay duplicate module.

Acceptance criteria:

- Liet ke duoc contract API va model role hien tai.
- Chi ra dung cac file can sua cho cac task sau.

---

## TASK 01 - Cap quyen bootstrap admin an toan

Them bien moi truong backend:

```text
ADMIN_BOOTSTRAP_EMAIL=BinN63342@gmail.com
```

Tao mot script backend idempotent, vi du `scripts/grant-bootstrap-admin.mjs`,
va npm script `admin:bootstrap`.

Prompt:

```text
Doc Prisma schema, auth service va convention scripts hien tai.

Tao script admin bootstrap idempotent.

Input: ADMIN_BOOTSTRAP_EMAIL.
Flow:
1. Validate email.
2. Tim user theo email case-insensitive.
3. Neu chua co user, dung voi thong bao ro rang. Khong tao user rong.
4. Upsert role `admin`.
5. Tao UserRole neu chua ton tai.
6. Ghi ActivityLog `admin.bootstrap_granted` khong kem secret.
7. In ket qua an toan: user id, email da mask va role da cap.

Khong cap role trong frontend.
Khong cap admin trong moi lan login.
Khong hard-code email trong source; chi doc env.
```

Production runbook:

```text
1. Dang ky tai khoan BinN63342@gmail.com truoc.
2. Dat ADMIN_BOOTSTRAP_EMAIL o backend Vercel Environment Variables (Secret).
3. Chay npm run admin:bootstrap mot lan trong CI co manual approval hoac local
   voi DATABASE_URL production an toan.
4. Dang xuat va dang nhap lai de access token moi co role admin.
```

Acceptance criteria:

- Chay lai script khong tao UserRole trung.
- User thuong khong the tu bien minh thanh admin.
- Access token moi tra `roles: ['student', 'admin']` cho bootstrap user.

---

## TASK 02 - Xac nhan admin API va danh sach nguoi dung

Prompt:

```text
Khong xay lai AdminPage.

Kiem tra `/api/admin/users` va AdminPage hien tai.
Hoan thien danh sach nguoi dung da dang nhap/da su dung StudyFlow:
- pagination server-side
- search case-insensitive theo fullName/email
- role, trang thai tai khoan, email verified, ngay tao, lan cap nhat gan nhat
- khong tra passwordHash, refresh token, token, thong tin hoc tap rieng tu
- admin khong the tu vo hieu hoa tai khoan cua minh
- destructive action dung ConfirmDialog
- mutation ghi ActivityLog
- loading, empty, error va retry day du

Giu authorize('admin') o backend moi route.
```

Acceptance criteria:

- `/admin` hien danh sach user that tu database.
- User thuong go URL `/admin` bi redirect va API tra 403.
- Khong co N+1 query de lay role.

---

## TASK 03 - Login destination chooser cho admin

Prompt:

```text
Doc LoginPage, auth hooks, authStore, route config, Modal va design tokens.

Sau login thanh cong:
- User khong co role admin: navigate `/dashboard` nhu hien tai.
- User co role admin: mo modal noi bo, khong dung window.confirm.

Modal:
Title: "Chao mung quay lai"
Description: "Ban muon bat dau o dau?"

Hai lua chon ro rang:
1. "Trang quan tri" - mo `/admin`, icon ShieldCheck,
   mo ta ngan ve quan ly nguoi dung va van hanh.
2. "Trang cua toi" - mo `/dashboard`, icon LayoutDashboard,
   mo ta ngan ve cong viec, lich va muc tieu ca nhan.

Yeu cau:
- Modal chi hien sau khi login tra ve roles co `admin`.
- Khong cap quyen dua tren email o client.
- Nguoi dung co the dong modal va mac dinh vao `/dashboard`.
- Keyboard accessible: focus, Escape, Enter va aria labels dung.
- Responsive, light/dark theo CSS variables hien tai.
- Khong them mot trang landing hay link gia.
```

Acceptance criteria:

- `BinN63342@gmail.com` sau khi da duoc cap role admin thay modal moi lan dang
  nhap thanh cong.
- Chon dung luong di den `/admin` hoac `/dashboard`.
- Refresh token va session dang nhap giu nguyen.

---

## TASK 04 - Admin dashboard focused on real usage

Prompt:

```text
Mo rong tab Tong quan cua AdminPage bang du lieu API that, khong mock:
- tong user active
- user moi theo khoang thoi gian
- tai khoan bi vo hieu hoa
- tong task/plan/session neu backend statistics da co contract
- hoat dong admin gan day

Chi hien metric co endpoint that. Neu chua co backend aggregate thi them mot
endpoint summary duoc authorize admin, dung Prisma aggregate/groupBy, khong
query tung user trong loop.

Khong hien noi dung ghi chu, tai lieu, password hay token cua user.
```

Acceptance criteria:

- So lieu khop database va co loading/error state.
- Dashboard admin khong lam cham dashboard nguoi dung.

---

## TASK 05 - Tests, deploy va operational checklist

Prompt:

```text
Them test focused:
- bootstrap script idempotent
- admin API 401 khi chua login, 403 khi user thuong
- admin co the list user voi pagination/search
- login admin hien destination chooser
- login user thuong di thang dashboard

Cap nhat .env.example va deployment docs:
- ADMIN_BOOTSTRAP_EMAIL la backend secret
- cach chay admin:bootstrap
- can logout/login lai sau khi cap role
- khong commit email/admin secret ngoai vi du duoc phep

Chay lint, test va build. Khong thay doi code ngoai scope admin/auth login.
```

---

## Thu tu thuc hien

```text
TASK 00 -> TASK 01 -> cap role va login lai -> TASK 02 -> TASK 03
-> TASK 04 (neu can) -> TASK 05
```

Chua bat dau TASK 02-05 khi TASK 01 chua cap role admin thanh cong cho tai
khoan bootstrap.
