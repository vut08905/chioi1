# CHANGELOG.md — Lịch sử thay đổi Chị Ơi!

> AI Agent cập nhật file này sau MỖI session làm việc.

---

## [1.2.3] — 2026-05-13

### 🐛 Phase 4 — FE+BE bug verify + fix (final)

#### Đã verify 36 bug FE+BE
**31 bug đã fix sẵn** (xem chi tiết verify report). Bao gồm: 1.11, 1.12, 1.14, 1.15, 2.1 (logic), 2.4, 2.6 (đổi MK), 2.9, 2.10, 3.1, 3.6, 4.2, 4.3, 4.6, 4.8, 5.2, 5.3, 5.4, 7.1, 7.2, 7.3, 8.1, 8.3, 8.4, 9.1, 9.2, 9.6 (bio), 9.7, 9.8 (BE guard), 10.1, 10.3, 10.4, 11.1, 11.2.

#### Schema migration (Bug 5.1+6.3 phần Tasker)
- `prisma/schema.prisma` — thêm column `address String?` vào model `taskers`
- `prisma/migrations/manual_20260513_add_tasker_address.sql` — SQL thủ công cho user chạy
- `src/api/api.service.ts` — thêm logic save `tasker.address`, ưu tiên `customer.default_address` → `tasker.address` → input
- ⚠️ **User cần chạy migration:** `npx prisma migrate dev --name add_tasker_address` hoặc `psql -f` script SQL

#### Fixed
1. **Bug 1.3** — `frontend/khachhang/datdichvudonnha.html:360` — Đổi endpoint sai `/api/orders/my` → `/api/orders/customer/history` (chức năng cảnh báo trùng đơn nay hoạt động).
2. **Bug 9.8 (FE check)** — `frontend/giupviec/trangchutasker.html:453` — Đổi endpoint sai `/api/taskers/order-history` → `/api/taskers/history` (check tasker có đơn active hoạt động).
3. **Bug 2.1** — `frontend/khachhang/trangchu.html:149,288` — Thêm `id="home-balance"` cho span số dư + đổi JS `querySelector('.text-body-lg.font-bold')` → `getElementById('home-balance')` (tránh fragile selector match nhầm).
4. **Bonus: BE drop `notes` field** — `src/orders/orders.service.ts:12-29` thêm `notes` vào INSERT raw SQL. Đồng thời sửa 3 FE booking files (`datdichvudonnha`, `datdichvutrongtre`, `datdichvumuaho`) đổi field `note` → `notes` để khớp `BookOrderDto` (vì `forbidNonWhitelisted=true` ở Phase 1 sẽ reject field thừa).

#### Deferred (cần thiết kế lớn hơn)
- **Bug 9.6 (avatar upload)** — Cần thiết kế: chọn storage (S3/Cloudinary/local), thêm `POST /api/users/avatar` với multipart form-data, FE đổi sang FormData. Hiện FE chỉ preview ảnh local.
- **Bug 2.6 (logout-all-devices)** — Cần thay đổi JWT strategy (thêm `tokenVersion` vào DB hoặc Redis blacklist), đụng `auth.service.ts` + `jwt.strategy.ts` (cả 2 đều PROTECTED). Hiện FE chỉ logout local.

#### Files ảnh hưởng
- Backend: `prisma/schema.prisma`, `src/api/api.service.ts`, `src/orders/orders.service.ts`
- Migration: `prisma/migrations/manual_20260513_add_tasker_address.sql` (mới)
- Frontend: `khachhang/trangchu.html`, `khachhang/datdichvudonnha.html`, `khachhang/datdichvutrongtre.html`, `khachhang/datdichvumuaho.html`, `giupviec/trangchutasker.html`
- Build verify: `npm run build` PASS

#### TỔNG KẾT 4 PHASE (1 session)
| Phase | Bug count | Đã fix sẵn | Fix mới | Defer |
|-------|-----------|-----------|---------|-------|
| 1 (hardening) | — | — | DTOs, Throttler, Integrations | — |
| 2 (FE-only) | 19 | 17 | 2 | — |
| 3 (BE-only) | 8 | 6 | 1 | 1 (đã hoàn tất Phase 4) |
| 4 (FE+BE) | 36 | 31 | 4 (3 endpoint + bonus) | 2 |
| **Tổng** | **63** | **54** | **7 + scaffolding** | **2** |

---

## [1.2.2] — 2026-05-13

### 🐛 Phase 3 — BE-only bug verify + fix

#### Đã verify 8 BE-only bugs
**6 bug đã fix sẵn:**
- Bug 2.8 — Data orders DB khớp UI (orders.service.ts:227-238)
- Bug 3.2 — `PUT /api/users/profile` (api.controller.ts:20-32)
- Bug 3.3 — `GET /api/wallets/balance` đúng plural ở BE và FE (4 file)
- Bug 3.5 — `POST /api/auth/change-password` (auth.controller.ts:53-61)
- Bug 4.7 — `POST /api/packages/subscribe` đúng (không có typo "packeages")
- Bug 9.3 — Đơn COMPLETED auto trừ tiền ví (orders.service.ts:115-127)
- Bug 5.1+6.3 (phần Customer) — email + address customer lưu đúng (api.service.ts:28-45)

#### Fixed
1. **Bug 5.5** — `wallets.service.ts` không tạo notification cho user khi nạp/rút/giao dịch ví
   - Thêm `prisma.notifications.create()` trong `deposit()`, `withdraw()`, `addTransaction()` — atomic trong cùng `$transaction`
   - Title theo loại: "Nạp tiền thành công", "Đã nhận thu nhập", "Phí nền tảng", "Rút tiền", "Thanh toán dịch vụ", "Hoàn tiền"
   - Content tự động format số tiền VND + số dư mới

#### Deferred (cần duyệt sửa PROTECTED file)
- **Bug 5.1+6.3 (phần Tasker address)** — Model `taskers` không có column `address` trong `prisma/schema.prisma`. Tasker submit địa chỉ → BE im lặng nuốt, không lưu. Cần thêm `address String?` vào model `taskers` và chạy migration. **CHƯA FIX** vì `schema.prisma` là PROTECTED.

#### Files ảnh hưởng
- `backend/src/wallets/wallets.service.ts` — thêm 3 notification creates
- Build verify: `npm run build` PASS

---

## [1.2.1] — 2026-05-13

### 🐛 Phase 2 — FE-only bug verify + fix

#### Đã verify 19 FE-only bugs trong reportloi/
**17 bug đã fix sẵn từ trước** (có comment "Lỗi N FIX" trong code):
- datdichvudonnha.html: bug 1.1, 1.2, 1.4, 1.5, 1.6, 4.5
- datdichvutrongtre.html: bug 1.7, 1.8, 1.9, 4.4
- datdichvumuaho.html: bug 1.10, 2.3
- vivalichsu.html: bug 1.13
- goigiadinh.html: bug 2.5
- lichsuhoatdong.html: bug 2.7, 9.5
- taikhoan.html: bug 3.4
- naptienqr.html: bug 4.1
- giupviec/trangchutasker.html: bug 8.2, 8.5
- giupviec/lichsudonhang.html: bug 11.3

#### Fixed — 2 bug còn lại
1. **trangchu.html (Bug 2.2)** — Xóa nút "Xem tất cả" trong section "Tasker gần bạn"; JS handler `view-all-taskers` được wrap với null check để tránh crash.
2. **theodoidon.html (Bug 9.4)** — Đổi nút chat trong header từ link đến `chatvoitasker.html` → mở modal liên hệ Admin/CSKH (icon `support_agent`). Modal có form tạo support ticket (gọi `POST /api/support/tickets` có sẵn) + hotline `1900 1234`.

#### Files ảnh hưởng
- `frontend/khachhang/trangchu.html`
- `frontend/khachhang/theodoidon.html`

---

## [1.2.0] — 2026-05-13

### 🛡️ Backend Hardening (Phase 1)

#### Added — Dependencies
- `@nestjs/throttler` — rate limiting
- `class-validator` + `class-transformer` — DTO validation

#### Added — Throttler config (`src/common/throttler.config.ts`)
- Bucket `short`: 100 requests / phút (default cho mọi endpoint)
- Bucket `auth`: 5 requests / phút (chống brute-force login)
- Bucket `register`: 3 requests / phút (chống spam đăng ký)
- Bucket `otp`: 3 requests / 30 phút (chống spam OTP)

#### Added — Input Validation DTOs (15 file)
- `auth/dto/`: login, register, forgot-password, reset-password, change-password
- `orders/dto/`: book-order, update-status, review
- `wallets/dto/`: deposit, withdraw
- `api/dto/`: update-profile, subscribe-package, create-ticket, manage-service, manage-package
- Toàn bộ dùng `whitelist + forbidNonWhitelisted + transform` ở `main.ts`

#### Added — Integration scaffolding (chưa kết nối thật)
- **SMS** (`src/integrations/sms/`):
  - Interface `SmsProvider` + `SmsService` wrapper
  - Providers: Mock (default), FPT, VNPT (stub)
  - README hướng dẫn swap sang real provider
- **KYC** (`src/integrations/kyc/`):
  - Interface `KycProvider` + `KycService`
  - Providers: Mock, FPT.AI eKYC (stub)
  - README + flow nghiệp vụ
- **Payments** (`src/integrations/payments/`):
  - Interface `PaymentProvider` + `PaymentsService` + `PaymentsController` (webhook)
  - Providers: Mock (sinh QR từ VietQR public), Casso, Sepay (stub)
  - Webhook endpoint: `POST /api/payments/webhook` (verify chữ ký provider)
  - README + flow nạp tiền

#### Changed — Controllers (chỉ thêm DTO + decorator, KHÔNG đổi business logic)
- `auth.controller.ts` — DTO + `@Throttle` cho login/register/forgot-password/reset-password
- `orders.controller.ts` — DTO cho book/update-status/review
- `wallets.controller.ts` — DTO cho deposit/withdraw
- `api.controller.ts` — DTO cho profile/ticket/service/package endpoints

#### Changed — Bootstrap
- `main.ts` — global `ValidationPipe`
- `app.module.ts` — `ThrottlerModule` + `APP_GUARD: ThrottlerGuard` + 3 integration modules

#### Files KHÔNG đụng (theo RULES.md PROTECTED)
- `auth/auth.service.ts`, `auth/jwt.strategy.ts`, `auth/jwt-auth.guard.ts`, `auth/roles.guard.ts`
- `prisma/schema.prisma`, `.env`
- `frontend/shared/api.js`

#### Files mới khác
- `.env.example` — template biến môi trường (SMS/KYC/Payment)

#### Verify
- `npm run build` — PASS, dist/ chứa đầy đủ DTOs + integrations
- Build lần đầu báo lỗi do Prisma Client chưa generate trên fresh checkout → đã chạy `npx prisma generate`

---

## [1.1.0] — 2026-05-12

### 🐛 Bug fixes (reportloi3.txt — 6 lỗi)

#### Fixed
1. **Nạp tiền (naptienqr.html)** — Xóa hardcode 500.000đ, thêm 6 preset (50k→2tr), cho nhập tùy ý, hiển thị số dư mới sau nạp
2. **Chỉnh sửa hồ sơ (api.controller.ts, api.service.ts)** — Thêm endpoint `PUT /api/users/profile` với input validation
3. **Gói gia đình (goigiadinh.html)** — Sửa URL sai `/api/wallet/balance` → `/api/wallets/balance`
4. **Tài khoản (taikhoan.html)** — Thay `<select>` giới tính bằng radio button group mobile-friendly
5. **Đổi mật khẩu (auth.controller.ts, auth.service.ts)** — Thêm endpoint `POST /api/auth/change-password` với bcrypt verify + JWT guard
6. **Chat (chatvoitasker.html)** — Thêm CSS `.message-gradient`, fix chữ trắng nền trắng. Thêm handler chụp ảnh + up ảnh (file input + camera capture)

#### Files ảnh hưởng
- `Khachhang/naptienqr.html`
- `Khachhang/goigiadinh.html`
- `Khachhang/taikhoan.html`
- `Khachhang/chatvoitasker.html`
- `chioi-backend/src/api/api.controller.ts`
- `chioi-backend/src/api/api.service.ts`
- `chioi-backend/src/auth/auth.controller.ts`
- `chioi-backend/src/auth/auth.service.ts`

---

## [1.0.0] — 2026-05-12

### 🎉 Release đầu tiên — Thiết lập Technical Design

#### Added — Tài liệu kỹ thuật
- `docs/ARCHITECTURE.md` — Kiến trúc tổng thể, tech stack, sơ đồ hệ thống
- `docs/DATABASE.md` — 14 bảng database, ERD, quy tắc migration
- `docs/API_CONTRACTS.md` — 30+ API endpoints, request/response mẫu, WebSocket events
- `docs/CRITICAL_PATHS.md` — 7 luồng nghiệp vụ quan trọng, protected files
- `docs/SECURITY.md` — Quy tắc bảo mật, RBAC matrix, production checklist
- `docs/DEPLOY.md` — Hướng dẫn deploy local + VPS + Nginx
- `docs/CHANGELOG.md` — File này
- `RULES.md` — Quy tắc AI Agent bắt buộc

#### Fixed — Bug fixes (reportloi2.txt — 10 lỗi)
1. **Trang chủ** — Sửa API endpoint ví từ `/api/wallets/balance` → `/api/wallet/balance`
2. **Trang chủ** — Xóa nút "Xem tất cả" thừa
3. **Mua hộ** — Thay `prompt()` bằng inline input row + nút +/-
4. **Tài khoản** — Thêm trường Giới tính, Email, Địa chỉ vào modal chỉnh sửa hồ sơ
5. **Gói gia đình** — Sửa thanh tổng cộng từ `fixed` → `static` để không đè điều khoản
6. **Tài khoản** — Thêm form đổi mật khẩu (3 input + validation) + đăng xuất tất cả thiết bị
7. **Hoạt động** — Filter chips + Date range picker hoạt động thực tế
8. **Hoạt động** — Map service name → icon tự động từ dữ liệu API
9. **Hoạt động** — Modal chi tiết đơn hàng đầy đủ thông tin
10. **Thông báo** — Rebuild từ dữ liệu API thật, filter tabs hoạt động, xóa duplicate

#### Fixed — Bug fixes (reportloi.txt — 15 lỗi trước đó)
- Đã fix toàn bộ 15 lỗi UI/UX từ bộ report đầu tiên

#### Infrastructure
- Backend NestJS đã chạy ổn định (Port 3000)
- PostgreSQL 16 + PostGIS đã cấu hình
- Socket.IO real-time đã tích hợp cho Orders
- Swagger API docs tại `/api/docs`

---

## Quy ước ghi Changelog

- **Added** — Tính năng mới
- **Changed** — Thay đổi tính năng hiện có
- **Deprecated** — Tính năng sẽ bị loại bỏ
- **Removed** — Tính năng đã loại bỏ
- **Fixed** — Sửa lỗi
- **Security** — Cập nhật bảo mật

> Format: `[VERSION] — YYYY-MM-DD`  
> Mỗi entry phải có: **Ai thay đổi** (nếu có), **File bị ảnh hưởng**, **Lý do**
