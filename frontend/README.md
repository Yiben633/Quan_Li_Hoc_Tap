# StudyFlow Frontend

React 18 + TypeScript + Vite frontend cho StudyFlow. Giao diện phục vụ nhiều bối cảnh tự học; thông tin trường, chuyên ngành và độ tuổi luôn là tùy chọn.

## Chạy local

Yêu cầu Node.js 20+ và backend chạy tại `http://localhost:4000`.

```powershell
cd frontend
Copy-Item .env.example .env
npm install
npm run dev
```

Mở `http://localhost:5173`. Vite proxy `/api` và `/uploads` sang backend local.

## Biến môi trường

```env
VITE_API_URL=/api
VITE_APP_NAME=StudyFlow
VITE_VERCEL_ENV=development
VITE_AI_ENABLED=false
VITE_AI_PROVIDER=disabled
```

Chỉ bật AI khi backend provider và endpoint tương ứng đã được cấu hình. Không đặt secret trong biến bắt đầu bằng `VITE_` vì chúng được nhúng vào bundle trình duyệt.

## Kiểm tra

```powershell
npm run lint
npm run test
npm run test:watch
npm run build
npm run preview
```

Vitest dùng jsdom và React Testing Library. Test hiện bao phủ route guard, lời chào theo giờ Việt Nam, validation Task và helper timezone Calendar.

## PWA và dữ liệu riêng tư

Service worker chỉ precache app shell gồm HTML, CSS, JavaScript, font và icon. `/api` và `/uploads` luôn dùng mạng, không cache response tài khoản hoặc tệp cá nhân. Browser Notification chỉ được bật sau khi người dùng chủ động cấp quyền trong Cài đặt.

## Deploy Vercel

Tạo Vercel project cho frontend với:

- Root Directory: `frontend`
- Framework Preset: Vite
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`
- Preview Environment: `VITE_API_URL`, `VITE_APP_NAME`, `VITE_VERCEL_ENV=preview`
- Production Environment: `VITE_API_URL`, `VITE_APP_NAME`, `VITE_VERCEL_ENV=production`

Ví dụ `VITE_API_URL=https://api.example.com/api`. Khai báo env riêng cho Preview và Production; build Vercel sẽ dừng với thông báo rõ ràng nếu thiếu `VITE_API_URL`. `vercel.json` đã rewrite route SPA về `index.html`; không rewrite `/api` nếu API dùng domain riêng.

## Nguyên tắc dữ liệu

Không yêu cầu mã sinh viên, trường, chuyên ngành, năm nhập học hoặc nhóm tuổi để sử dụng tính năng cốt lõi. Không hiển thị công khai email, tuổi hay thông tin trường lớp trong nhóm chia sẻ.
