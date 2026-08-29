# Production Readiness Checklist

Checklist này là cổng kiểm tra cuối cùng trước khi đưa StudyFlow lên production. Mỗi ô chỉ được đánh dấu sau khi đã kiểm tra trên đúng môi trường production và lưu bằng chứng tương ứng. Không ghi secret, connection string đầy đủ hoặc dữ liệu người dùng vào tài liệu kiểm thử.

## Thông tin release

| Mục | Giá trị |
| --- | --- |
| Ngày phát hành | `YYYY-MM-DD HH:mm Asia/Ho_Chi_Minh` |
| Git commit/tag |  |
| Người triển khai |  |
| Người smoke test |  |
| Frontend URL | `https://app.example.com` |
| Backend URL | `https://api.example.com` |
| Vercel deployment |  |
| Database backup/PITR mốc |  |
| Kế hoạch rollback |  |

## 1. Domain Và HTTPS

- [ ] Frontend và backend đã dùng domain production chính thức, không dùng URL Preview làm URL công khai.
- [x] HTTPS hợp lệ trên cả hai domain; HTTP được chuyển hướng sang HTTPS.
- [ ] Chứng chỉ bao phủ đúng hostname và không có mixed content trong DevTools.
- [ ] DNS production không còn trỏ tới deployment cũ ngoài kế hoạch rollback.
- [ ] Refresh trực tiếp các route SPA như `/login`, `/dashboard`, `/tasks` không trả 404.
- [ ] Nếu frontend/backend ở hai host, ưu tiên hai subdomain cùng site như `app.example.com` và `api.example.com`; login, refresh cookie và logout đã được kiểm tra trên trình duyệt thật.

Kiểm tra nhanh:

```powershell
curl.exe -I https://app.example.com/login
curl.exe -I https://api.example.com/api/health
```

Kết quả mong đợi: HTTPS không lỗi chứng chỉ, frontend trả `200`, health API trả `200` và không lộ stack trace.

### Kết quả kiểm tra lần 1 - 2026-08-09

Phạm vi kiểm tra: commit `83aca8fb6089c51de0a1cd42c129aa0706d8af11` và các deployment Production do GitHub/Vercel công bố.

| Hạng mục | Kết quả | Bằng chứng / hành động tiếp theo |
| --- | --- | --- |
| Production URL ổn định | Chưa đạt | `https://study-slow.vercel.app` đang phục vụ frontend StudyFlow, nhưng repo đồng thời kết nối project `study-flow`; `https://study-flow.vercel.app` đang phục vụ một ứng dụng Next.js khác. Chọn một project production duy nhất và gỡ kết nối/alias cũ ngoài kế hoạch rollback. |
| Deployment mới nhất | Chưa thể smoke test công khai | Hai deployment URL theo commit mới đều chuyển tới Vercel Authentication. Production phải được promote vào alias ổn định và cho phép người dùng công khai truy cập; có thể tiếp tục bảo vệ Preview. |
| HTTPS và HTTP redirect | Đạt | `study-slow.vercel.app` có TLS hợp lệ; HTTP trả `308` sang HTTPS và response HTTPS có HSTS. Chứng chỉ `CN=*.vercel.app`, hiệu lực từ `2026-06-28` đến `2026-09-26`. |
| Mixed content | Chưa kết luận đầy đủ | Quét các JavaScript bundle được trang production nạp không thấy `http://`, `localhost` hoặc `127.0.0.1`. Vẫn cần xác nhận tab Console/Security trên trình duyệt thật sau khi SPA hoạt động. |
| SPA direct refresh | Không đạt | `GET /login`, `/dashboard`, `/tasks` trên `study-slow.vercel.app` đều trả `404`. Kiểm tra Vercel Project Settings: Root Directory phải là repo root, Framework Preset phải là **Services**, sau đó redeploy để root `vercel.json` và rewrite của frontend được áp dụng. |
| Backend health | Không đạt | `GET https://study-slow.vercel.app/api/health` trả `500 FUNCTION_INVOCATION_FAILED`; chưa đạt yêu cầu health `200`. Kiểm tra Runtime Logs và các env production bắt buộc trước khi smoke test auth. |
| DNS hiện tại | Cần dọn | `study-slow.vercel.app` resolve tới hạ tầng Vercel (`64.29.17.131`, `216.198.79.131`), nhưng còn hai Vercel project cùng deploy repo nên chưa thể xác nhận đã loại bỏ deployment cũ. |
| Login/refresh/logout | Bị chặn | Chưa chạy vì SPA refresh đang `404` và backend health đang `500`. Topology dự kiến dùng chung origin `/api`, không cần cookie cross-site. |

Lệnh kiểm tra lại sau khi sửa Vercel:

```powershell
curl.exe -I http://study-slow.vercel.app/login
curl.exe -I https://study-slow.vercel.app/login
curl.exe -I https://study-slow.vercel.app/dashboard
curl.exe -I https://study-slow.vercel.app/tasks
curl.exe -i https://study-slow.vercel.app/api/health
```

Chỉ đánh dấu các mục còn lại sau khi ba route SPA và health API cùng trả `200`, deployment production không yêu cầu đăng nhập Vercel và luồng cookie đã được thử trên trình duyệt thật.

## 2. Environment, CORS Và Secret

- [ ] `FRONTEND_URL`/`CLIENT_ORIGIN` chỉ chứa origin production được phép, đúng protocol và hostname.
- [ ] `VITE_API_URL` của frontend Production trỏ tới backend production và kết thúc bằng `/api`.
- [ ] `TRUST_PROXY=true` trên Vercel hoặc reverse proxy để IP/rate limit hoạt động đúng.
- [ ] `JWT_ACCESS_SECRET` và `JWT_REFRESH_SECRET` là hai giá trị ngẫu nhiên khác nhau, tối thiểu 32 byte entropy.
- [ ] `CRON_SECRET` là giá trị ngẫu nhiên riêng, tối thiểu 32 byte entropy và không trùng JWT/storage secret.
- [ ] Các alias cũ `JWT_SECRET`/`REFRESH_TOKEN_SECRET`, nếu còn khai báo, không mâu thuẫn với biến chuẩn.
- [ ] Secret được lưu trong Vercel Project Settings hoặc GitHub Environment Secrets, không nằm trong source, build log hoặc `VITE_*`.
- [ ] Cookie refresh token có `HttpOnly`, `Secure` ở production và chính sách `SameSite` phù hợp với topology domain đã chọn.
- [ ] CORS từ origin production được cho phép; origin lạ không nhận credential hoặc `Access-Control-Allow-Origin` hợp lệ.
- [ ] Có người chịu trách nhiệm và quy trình rotate JWT, cron, Redis, database và storage credential.

Kiểm tra CORS mẫu:

```powershell
curl.exe -i -H "Origin: https://app.example.com" https://api.example.com/api/health
curl.exe -i -H "Origin: https://untrusted.example" https://api.example.com/api/health
```

Không dán output có cookie/token vào issue công khai.

## 3. Database, Backup Và Migration

- [ ] `DATABASE_URL` là Neon/PostgreSQL pooled URL dành cho runtime; `DIRECT_URL` là direct URL chỉ dành cho migration.
- [ ] Preview và Production dùng database/branch riêng.
- [ ] Automated backup hoặc point-in-time recovery của nhà cung cấp đã bật, có retention phù hợp.
- [ ] Đã tạo backup/recovery point ngay trước migration production và ghi mã/mốc thời gian ở đầu checklist.
- [ ] Đã restore thử backup gần đây vào database tạm và xác nhận đăng nhập, dữ liệu quan trọng, migration history đều đọc được.
- [ ] Workflow **Database Migration** chạy bằng GitHub Environment `production`, có reviewer và chuỗi xác nhận `MIGRATE_PRODUCTION`.
- [ ] Chỉ dùng `npm run db:migrate:deploy`; không dùng `migrate dev`, `db push` hoặc `db:reset` trên production.
- [ ] Backend chỉ nhận traffic mới sau khi migration thành công.
- [ ] Migration đã được xem xét về lock lâu, index lớn, cột bắt buộc và khả năng tương thích với phiên bản app trước đó.

### Kế hoạch rollback migration

- [ ] Đã xác định rõ điều kiện rollback, người quyết định và thời gian tối đa để ra quyết định.
- [ ] Nếu schema còn tương thích ngược: rollback deployment về commit trước và giữ migration.
- [ ] Nếu dữ liệu/schema bị hỏng: chặn ghi, khôi phục backup/PITR vào database hoặc Neon branch mới, kiểm tra dữ liệu rồi mới đổi connection string.
- [ ] Nếu chỉ cần sửa schema: tạo migration forward-fix mới; không sửa/xóa migration đã áp dụng và không tự ghép SQL rollback chưa thử nghiệm.
- [ ] Sau rollback, chạy lại smoke test và ghi rõ dữ liệu nào có thể phát sinh trong khoảng sự cố.

Lệnh kiểm tra trước khi migrate:

```powershell
cd database
npm ci
npm run db:check:connection
npm run db:migrate:status
npm run db:migrate:deploy
```

Backup thủ công bằng `database/scripts/backup.sh` dùng `pg_dump`; restore yêu cầu `CONFIRM_RESTORE=yes`. Với cloud production, ưu tiên backup/PITR của provider và luôn thử restore trên database tạm trước.

## 4. Redis, Cron Và Background Job

- [ ] `REDIS_URL` production dùng Redis cloud/TLS (`rediss://` khi provider hỗ trợ), không trỏ về `localhost`.
- [ ] Preview và Production dùng Redis riêng để OTP, timer, rate limit và notification dedupe không lẫn nhau.
- [ ] Vercel Cron đã đăng ký `/api/cron/notifications` theo lịch được plan hỗ trợ.
- [ ] Request thiếu hoặc sai `Authorization: Bearer <CRON_SECRET>` trả `401`.
- [ ] Request có secret đúng chạy thành công và log có `notification_job_started`/`notification_job_completed`.
- [ ] Redis lock ngăn hai notification scan chạy đồng thời và dedupe ngăn notification trùng.
- [ ] Local/Docker chạy scheduler từ `src/server.ts`; import Express app trên Vercel không tự khởi động job nền.

Kiểm tra bảo vệ cron:

```powershell
curl.exe -i https://api.example.com/api/cron/notifications
$headers = @{ Authorization = "Bearer $env:CRON_SECRET" }
Invoke-RestMethod https://api.example.com/api/cron/notifications -Headers $headers
```

Không đặt secret trong query string ở production vì URL có thể xuất hiện trong log hạ tầng.

## 5. Upload Và Cloud Storage

- [ ] `STORAGE_PROVIDER=s3-compatible` trên Vercel; production không ghi vào `backend/uploads/` hoặc filesystem tạm.
- [ ] `S3_REGION`, `S3_BUCKET`, access key và secret key đã khai báo đúng; `S3_ENDPOINT` có khi provider yêu cầu.
- [ ] Bucket production tách khỏi Preview, quyền credential theo nguyên tắc tối thiểu.
- [ ] Chính sách public/private và `S3_PUBLIC_BASE_URL` phù hợp với mức nhạy cảm của tài liệu người dùng.
- [ ] Upload đúng MIME/dung lượng thành công; MIME nguy hiểm và file quá giới hạn bị từ chối.
- [ ] Download/preview chỉ hoạt động với người sở hữu; đổi metadata và xóa đồng bộ cả database lẫn object storage.
- [ ] Đã kiểm tra rollback khi upload object hoặc ghi metadata thất bại giữa chừng.
- [ ] Có lifecycle, retention và backup/versioning phù hợp cho tài liệu cần giữ.

## 6. Rate Limit, Logging Và Bảo Mật

- [ ] Helmet và CORS production đang bật.
- [ ] Global, auth và AI rate limit đã bật; production dùng shared Redis store thay vì bộ nhớ từng Function.
- [ ] Gửi quá ngưỡng trả `429` nhưng health check, người dùng hợp lệ và cron không bị chặn sai.
- [ ] Mỗi response có header `x-request-id`; request log và unhandled error log có cùng `requestId`.
- [ ] Log production chỉ ghi thông tin cần thiết như method, path không query, status và duration.
- [ ] Không log password, password hash, access/refresh token, OTP, cookie, API key, database URL hoặc nội dung file nhạy cảm.
- [ ] Error `500` production không trả stack trace, Prisma error hoặc đường dẫn máy chủ cho client.
- [ ] Validation/sanitize đã bật cho form và upload; không có raw SQL ghép chuỗi trực tiếp.
- [ ] Activity log tồn tại cho đăng nhập, đổi mật khẩu, xóa tài khoản và hành động quản trị nhạy cảm.
- [ ] Nếu đã bootstrap admin, `ADMIN_BOOTSTRAP_EMAIL` chỉ từng tồn tại dưới dạng backend secret trong job thủ công; đã xóa khỏi runtime khi không còn cần và không xuất hiện trong frontend/source/log.
- [ ] Tài khoản vừa được cấp role admin đã đăng xuất rồi đăng nhập lại; `/api/admin/users` trả `200` với admin, `401` khi chưa đăng nhập và `403` với người dùng thường.
- [ ] Đã có nơi tập trung để xem/cảnh báo error log và có cách tra cứu theo `requestId`.

## 7. Tách Preview Và Production

- [ ] Một project Services dùng repository root và Framework Preset `Services`; hoặc hai project tách chọn đúng Root Directory `frontend` và `backend`.
- [ ] Vercel Environment Variables được khai báo riêng cho Preview và Production.
- [ ] Preview có `VITE_VERCEL_ENV=preview`; Production có `VITE_VERCEL_ENV=production`.
- [ ] Preview không dùng database, Redis, bucket, cron secret hoặc JWT secret production.
- [ ] Pull request tạo Preview URL; merge `main` mới tạo Production Deployment.
- [ ] Branch protection yêu cầu CI pass trước khi merge và chặn force push vào `main`.
- [ ] Không có `.env`, `.vercel`, upload local, backup hoặc dump database được Git theo dõi.

## 8. CI Và Release Gate

- [ ] Frontend lint, test và build pass.
- [ ] Backend lint, test và build pass với PostgreSQL/Redis CI.
- [ ] Prisma validate pass.
- [ ] Preview deployment đã được smoke test trước khi merge.
- [ ] Migration production hoàn thành trước khi promote backend.
- [ ] Frontend Production chỉ được promote sau khi backend health và API chính hoạt động.
- [ ] Có deployment/commit trước đó sẵn sàng rollback.

Lệnh kiểm tra tương đương local:

```powershell
cd frontend
npm ci
npm run lint
npm run test
npm run build

cd ..\backend
npm ci
npm run lint
npm run test
npm run build

cd ..\database
npm ci
npm run db:validate
```

## 9. Smoke Test Sau Deploy

Ghi người thực hiện, thời gian, kết quả và link bằng chứng cho từng bước.

| Bước | Kết quả mong đợi | Đạt |
| --- | --- | --- |
| Mở `/login`, refresh trang | Trang tải đúng, không 404 hoặc lỗi console nghiêm trọng | [ ] |
| Đăng ký tài khoản test | Tạo được user, không bắt buộc thông tin học thuật tùy chọn | [ ] |
| Đăng nhập | Vào dashboard, access/refresh flow hoạt động | [ ] |
| Đăng nhập bằng tài khoản admin đã bootstrap | Hiện chooser nội bộ; “Trang quản trị” vào `/admin`, “Trang của tôi” vào `/dashboard` và session vẫn còn hiệu lực | [ ] |
| Kiểm tra quyền admin API | `/api/admin/users` trả `401` khi chưa đăng nhập, `403` với user thường và dữ liệu phân trang khi dùng admin token mới | [ ] |
| Đăng xuất rồi đăng nhập lại | Session cũ bị revoke, phiên mới hợp lệ | [ ] |
| Tạo không gian học/semester | Bản ghi xuất hiện đúng owner | [ ] |
| Tạo môn học/subject | Liên kết đúng không gian học và hiển thị đúng | [ ] |
| Tạo task | Task xuất hiện ở danh sách/Kanban/dashboard liên quan | [ ] |
| Hoàn thành task | Trạng thái, progress plan và dashboard được cập nhật | [ ] |
| Mở dashboard | Summary/chart tải dữ liệu thật, không có mock hoặc lỗi `5xx` | [ ] |
| Upload tài liệu nhỏ hợp lệ | File lưu cloud, xem/download/xóa được đúng quyền | [ ] |
| Gọi cron không secret | Trả `401`, không tạo notification | [ ] |
| Gọi cron có secret | Trả thành công, không tạo notification trùng | [ ] |
| Kiểm tra mobile light/dark | Không tràn chữ, không mất contrast hoặc CTA | [ ] |
| Kiểm tra `/api/health` | Server, database và Redis đều báo healthy | [ ] |

Sau smoke test, xóa dữ liệu/tài khoản test theo quy trình; không xóa dữ liệu thật của người dùng khác.

## 10. Demo, Reset Và Seed

- [ ] URL demo dùng database/Redis/bucket riêng, không dùng production thật.
- [ ] Có tài khoản demo đã đổi khỏi mật khẩu mẫu công khai hoặc được reset định kỳ.
- [ ] Có người sở hữu quy trình làm mới dữ liệu demo và lịch làm mới.
- [ ] Có thể phục hồi demo bằng cách tạo lại database/Neon branch demo, chạy migration rồi seed.
- [ ] Không chạy `npm run db:reset` trên database production hoặc database demo đang chứa dữ liệu cần giữ.
- [ ] Production seed mặc định bị chặn và không nằm trong CI/deploy.

Quy trình làm mới môi trường demo an toàn:

1. Xác nhận connection string đang trỏ tới database demo và không có dữ liệu cần giữ.
2. Tạo lại database/branch demo hoặc restore một snapshot demo sạch.
3. Chạy `npm run db:migrate:deploy`.
4. Seed bằng opt-in từ xa:

```powershell
cd database
$env:SEED_TARGET="demo"
$env:ALLOW_REMOTE_SEED="true"
npm run db:seed
```

Không bật `ALLOW_PRODUCTION_SEED` cho demo. Seed production chỉ được dùng trong tình huống đã phê duyệt riêng vì seed hiện tạo tài khoản mẫu có mật khẩu đã biết.

## Phê Duyệt Phát Hành

- [ ] Tất cả mục bắt buộc phía trên đã đạt hoặc có risk acceptance bằng văn bản.
- [ ] Có thể demo toàn bộ luồng chính từ URL Vercel production.
- [ ] Có thể khôi phục production từ backup và làm mới môi trường demo khi cần.
- [ ] Owner kỹ thuật xác nhận release.
- [ ] Owner sản phẩm xác nhận smoke test.

Tài liệu liên quan: [`deployment.md`](deployment.md), [`database/PRODUCTION.md`](../database/PRODUCTION.md), [`README-security.md`](../README-security.md).
