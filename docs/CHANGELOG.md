# CHANGELOG.md — Lịch sử thay đổi Chị Ơi!

> AI Agent cập nhật file này sau MỖI session làm việc.

---

## [1.3.0] — 2026-05-13

### 🚨 Phase 5 — Recovery + bug fixes mới

#### Bối cảnh
Sau khi PR #1 (backend hardening) merge vào main, PR #2 (`testvps1` — chat realtime + WebRTC voice calls) merge SAU đó với conflict resolution **vô tình ghi đè toàn bộ Phase 1 hardening**:
- 15 DTOs files bị xóa
- SMS/KYC/Payment integrations bị xóa
- `common/throttler.config.ts` bị xóa
- `ValidationPipe` + `ThrottlerModule` bị revert khỏi main.ts/app.module.ts
- Controllers re-revert về `body: any` (mất DTO + @Throttle)
- 3 FE booking files revert `notes` → `note` (mismatch DTO)
- Build output `backend/dist/` (76 files) bị commit nhầm

#### Restored từ commit f3ea490 (Phase 4)
- `backend/src/auth/dto/`, `orders/dto/`, `wallets/dto/`, `api/dto/` (15 DTOs)
- `backend/src/integrations/sms/`, `integrations/kyc/`, `integrations/payments/` (17 file scaffolding + READMEs)
- `backend/src/common/throttler.config.ts`
- `backend/.env.example`
- `backend/prisma/migrations/manual_20260513_add_tasker_address.sql`
- 4 controllers + 3 services (api/orders/wallets) + schema.prisma
- npm install lại `@nestjs/throttler`, `class-validator`, `class-transformer`

#### Re-applied + integrated
- `main.ts` — re-add global `ValidationPipe` (whitelist + forbidNonWhitelisted)
- `app.module.ts` — re-add `ThrottlerModule` + `APP_GUARD` + 3 integration modules
- `api.controller.ts` — kept new endpoint `GET /api/users/profile` (từ PR #2) + restored DTO + throttler trên các endpoint khác
- `api.service.ts` — kept new method `getUserProfile()` + Phase 4 logic save tasker.address

#### Fixed regression (3 file FE)
- `datdichvudonnha.html` — `note` → `notes` (line 466)
- `datdichvumuaho.html` — `note` → `notes` (line 419)
- `datdichvutrongtre.html` — `note` → `notes` + Bug 12.3 + Bug 13.1 (xem dưới)

#### Fixed bugs mới (verify từ 11 reports + báo cáo chat)
**11/15 bugs đã fix sẵn trong PR #2** (chat realtime: Number() sender_id, client.broadcast room, cancel skip orders, login role check, …)

**4 bug fix mới trong session này:**
1. **Bug 12.3** (`datdichvutrongtre.html`) — Spam click submit → multiple orders. Thêm `isSubmitting` flag + disable button + reset on error.
2. **Bug 13.1** (`datdichvutrongtre.html`) — Hardcode address `'Địa chỉ từ ứng dụng'` → fetch từ `GET /api/users/profile.address`.
3. **Bug 12.1** (route drawing tasker → khách hàng):
   - BE `orders.service.ts` `bookOrder` — RETURN thêm `latitude`/`longitude`
   - BE `orders.service.ts` `acceptOrder` — raw SQL `ST_X/ST_Y` để extract lat/lng từ geometry, trả về cùng response
   - FE `trangchutasker.html` — thêm `drawRouteToCustomer(lat, lng)` dùng OSRM `https://router.project-osrm.org/route/v1/driving`, render polyline cam + customer marker, fallback vẽ đường thẳng dashed nếu OSRM fail. Wire vào `showActiveOrderCard`. Clear route khi `COMPLETED`.

#### Git hygiene
- Restored `backend/.gitignore` đầy đủ (dist, coverage, .env*, IDE folders)
- `git rm -r --cached backend/dist` — xóa 76 build output files khỏi tracking

#### Deferred (cần thiết kế lớn hơn, tracking trong issue riêng)

**Bug Chat-C + Chat-D — Upload ảnh chat**
- *Hiện tại:* Ảnh chỉ preview client (FileReader.readAsDataURL), gửi text `'[Hình ảnh]'` qua socket. Reload mất ảnh, người nhận thấy text/icon thay vì ảnh thật.
- *Cần:*
  1. Add multer dependency + multipart endpoint `POST /api/orders/chat/:orderId/upload-image`
  2. Storage strategy: local `backend/uploads/chat/` (đơn giản) hoặc S3/Cloudinary (production)
  3. Schema migration: thêm column `message_type` (TEXT|IMAGE) vào `messages` HOẶC convention nếu `content` bắt đầu bằng `/uploads/` → render ảnh
  4. FE: sửa `imagePicker.change` để POST FormData → nhận URL → emit `send_message` với content URL
  5. FE: sửa `appendImageMessage` thêm nhánh `else` (isMine=false) render ảnh từ URL
  6. Static serve `/uploads/chat/*` qua Nest

**Bug 14.4 — Cancel pending notifications khi tasker offline (BE edge case)**
- *Hiện tại:* `findNearbyTaskers` đã filter `is_online=true` (FIXED). FE chặn modal khi `!toggleInput.checked` (FIXED). Nhưng nếu tasker offline GIỮA chừng broadcast, gateway vẫn gửi event.
- *Cần:* Track `Map<orderId, taskerIds[]>` trong gateway, listen tasker disconnect/offline → pull pending notifications. Priority thấp vì FE đã chặn đủ.

#### Verification & Build
- `npm run build` — PASS sau cùng
- 11/15 bugs mới đã fix sẵn (verify report Phase 5 trong sub-agent log)
- 4 bug fix mới: 12.3, 13.1, 12.1, regression note→notes

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
