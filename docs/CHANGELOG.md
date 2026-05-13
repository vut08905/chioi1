# CHANGELOG.md — Lịch sử thay đổi Chị Ơi!

> AI Agent cập nhật file này sau MỖI session làm việc.

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
