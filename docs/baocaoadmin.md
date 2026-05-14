# 📋 BÁO CÁO KIỂM TRA TEST CASE — ADMIN CMS (v2)
> Ngày kiểm tra: 14/05/2026  
> Nguồn: Google Sheets Test Cases — 9 Use Cases  
> Cập nhật: Sau khi kiểm tra chi tiết code thực tế từng trang

---

## TỔNG QUAN (Cập nhật chính xác)

| Metric | Số lượng |
|--------|----------|
| ✅ PASS (đã có & hoạt động) | ~110 |
| ❌ FAIL (có nhưng cần cải thiện) | ~20 |
| ⬜ CHƯA CÓ (chưa triển khai) | ~45 |

> **Lưu ý:** Báo cáo v1 đánh giá quá thấp. Sau khi đọc code chi tiết, phần lớn các module đã được tích hợp API đầy đủ.

---

## UC_01: Dashboard tổng quan
**File:** `admin/bangdieukhien.html` | **API:** `/api/admin/dashboard`, `/api/admin/orders`, `/api/admin/users`, `/api/admin/tickets`, `/api/admin/report-stats`

### ✅ ĐÃ CÓ:
- Stat card "Tổng đơn hôm nay" — fetch từ API dashboard
- Stat card "Đang xử lý" — fetch + filter orders PENDING/SEARCHING
- Stat card "Tasker hoạt động" — đếm từ API users (TASKER + ACTIVE)
- Stat card "Doanh thu hôm nay" — fetch từ API report-stats
- Biểu đồ đơn hàng 7 ngày — render dynamic từ report-stats chart data ✅ (vừa fix)
- Panel "Đơn cần xử lý gấp" — render pending orders thật
- Panel "Tasker mới chờ duyệt" — render + nút "Xem HS"
- Panel "Khiếu nại chưa xử lý" — render OPEN tickets
- Auth guard (requireAuth + role check ADMIN)
- Logout button
- Sidebar navigation đầy đủ 9 trang
- Responsive layout (grid)

### ❌ CẦN CẢI THIỆN:
- Cảnh báo longWait (>8 phút) đã có logic nhưng cần test thêm
- Chưa có auto-refresh / realtime (WebSocket)

### ⬜ CHƯA CÓ:
- Offline mode handling
- Auto-refresh interval

**Kết luận:** ✅ **90% hoạt động** — Dashboard đã fetch data thật từ 5 API endpoints.

---

## UC_02: Danh sách đơn hàng
**File:** `admin/quanlydonhang.html` | **API:** `/api/admin/orders`, `/api/services`

### ✅ ĐÃ CÓ:
- Fetch danh sách đơn từ API
- Fetch services cho tên dịch vụ
- Bảng hiển thị: mã đơn, KH, Tasker, dịch vụ, giá, trạng thái
- Màu sắc theo trạng thái (PENDING, ACCEPTED, IN_PROGRESS, COMPLETED, CANCELLED)
- Auth guard
- Logout

### ❌ CẦN CẢI THIỆN:
- Empty state khi không có đơn
- Phân trang cho danh sách lớn

### ⬜ CHƯA CÓ:
- Filter theo trạng thái
- Search theo mã đơn/tên KH
- Realtime updates
- Chi tiết đơn popup

**Kết luận:** ✅ **70% hoạt động** — Hiển thị data thật nhưng thiếu filter/search.

---

## UC_03: Can thiệp đơn hàng
**File:** `admin/canthiepdonhang.html` | **API:** `/api/admin/orders`, `/api/admin/users`, `/api/admin/orders/:id/assign`, `/api/admin/orders/:id/resolve`, `/api/admin/orders/:id/cancel`

### ✅ ĐÃ CÓ:
- Danh sách đơn cần can thiệp (filter PENDING/SEARCHING/IN_PROGRESS/ACCEPTED)
- Đánh dấu "Cần can thiệp" khi chờ > 8 phút (viền đỏ + badge)
- Chi tiết đơn: thông tin KH + Tasker + dịch vụ + giá + timeline
- **Gán Tasker thủ công** — dropdown chọn Tasker + API PATCH assign ✅
- **Xử lý giữ đơn** — ghi chú + API PATCH resolve ✅
- **Hủy đơn** — confirm + API PATCH cancel ✅
- Back to list navigation
- URL params support (deep link đơn cụ thể)
- Auth guard + Logout

### ❌ CẦN CẢI THIỆN:
- Hoàn tiền tự động khi hủy (backend cần kiểm tra)
- Dời lịch đơn hàng (chưa có UI/API)

### ⬜ CHƯA CÓ:
- Concurrency control (2 admin cùng thao tác)
- Liên hệ KH trực tiếp từ trang

**Kết luận:** ✅ **85% hoạt động** — 3 hành động chính (assign, resolve, cancel) đều work.

---

## UC_04: Quản lý Tasker
**File:** `admin/quanlytasker.html` | **API:** `/api/admin/users`, `/api/admin/taskers/:id/approve`

### ✅ ĐÃ CÓ:
- Fetch danh sách Tasker từ API (filter role=TASKER)
- Bảng hiển thị: tên, SĐT, dịch vụ, khu vực, đơn/rating, trạng thái, ngày ĐK
- **Tab filter** — Tất cả / Chờ duyệt / Đang hoạt động / Bị tạm khóa ✅
- **Search** — tìm theo tên, SĐT, dịch vụ ✅
- **Dropdown filter** — loại dịch vụ, khu vực, trạng thái ✅
- **Duyệt KYC** — nút Duyệt + API PATCH approve ✅
- **Từ chối KYC** — nút Từ chối + confirm + API PATCH reject ✅
- Panel bên phải "Tasker mới chờ duyệt" + nút duyệt/từ chối
- Thống kê nhanh: Tổng Tasker + Chờ duyệt
- Badge count "Chờ duyệt" trên tab
- Empty state khi không có Tasker
- Pagination info
- Auth guard + Logout

### ❌ CẦN CẢI THIỆN:
- Chi tiết Tasker popup (click chỉ mở panel chung)
- Tạm dừng Tasker đang hoạt động (UI chưa rõ)

### ⬜ CHƯA CÓ:
- Xem CCCD/ảnh KYC chi tiết
- Lịch sử đơn của Tasker

**Kết luận:** ✅ **90% hoạt động** — Module rất mạnh: search, filter, approve/reject đầy đủ.

---

## UC_05: Quản lý Cư dân
**File:** `admin/quanlycudan.html` | **API:** `/api/admin/users`, `/api/admin/orders`, `/api/auth/register`, `/api/admin/users/:id/status`

### ✅ ĐÃ CÓ:
- Fetch danh sách KH từ API (filter CUSTOMER)
- Fetch orders để tính chi tiêu + số đơn
- Bảng: tên, SĐT, khu vực, đơn hàng, chi tiêu, trạng thái
- **Search** — tìm theo tên, SĐT ✅
- **Filter trạng thái** — Tất cả / Hoạt động / Đã khóa ✅
- **Thêm cư dân mới** — Modal form + API register ✅
- **Khóa tài khoản** — API PATCH status=BANNED ✅
- **Mở khóa** — API PATCH status=ACTIVE ✅
- **Chi tiết panel** — tên, SĐT, địa chỉ, trạng thái, tổng đơn, chi tiêu ✅
- **Lịch sử đơn hàng** — 5 đơn gần nhất trong detail panel ✅
- Thống kê: Tổng cư dân + Hoạt động + Mới tháng này
- Empty state
- Pagination info
- Auth guard + Logout

### ❌ CẦN CẢI THIỆN:
- Backend chưa check status BANNED khi login

### ⬜ CHƯA CÓ:
- Export CSV
- Gửi thông báo cho cư dân

**Kết luận:** ✅ **95% hoạt động** — Module hoàn chỉnh nhất trong hệ thống.

---

## UC_06: Quản lý ví & giao dịch
**File:** `admin/quanlyvigiaodich.html` | **API:** `/api/admin/wallet-stats`, `/api/admin/transactions`, `/api/admin/withdrawals`, `/api/admin/withdrawals/:id/approve`

### ✅ ĐÃ CÓ:
- Thống kê tài chính tổng quan (wallet-stats API)
- Danh sách giao dịch (transactions API)
- Loại giao dịch: DEPOSIT, PAYMENT, WITHDRAWAL
- Trạng thái: COMPLETED, PENDING, FAILED
- **Duyệt rút tiền** — API PATCH approve ✅
- **Từ chối rút tiền** — API PATCH status=FAILED ✅
- Filter theo loại giao dịch
- Auth guard + Logout

### ❌ CẦN CẢI THIỆN:
- Chưa hiển thị chi tiết phí hoa hồng 15%
- Hoàn tiền đơn (chưa có API/UI riêng)

### ⬜ CHƯA CÓ:
- Search theo mã giao dịch
- Filter theo ngày
- Chi tiết giao dịch popup

**Kết luận:** ✅ **80% hoạt động** — Cốt lõi (duyệt/từ chối rút tiền) đã work.

---

## UC_07: Hộp thư Inbox
**File:** `admin/hopthu.html` | **API:** `/api/admin/tickets`, `/api/admin/tickets/:id`, `/api/admin/tickets/stats`

### ✅ ĐÃ CÓ:
- Fetch danh sách tickets từ API
- Chi tiết ticket (click xem)
- Chuyển trạng thái RESOLVED (API PATCH)
- Thống kê inbox (stats API)
- Auth guard + Logout

### ❌ CẦN CẢI THIỆN:
- Reply ticket (chưa có API gửi phản hồi)

### ⬜ CHƯA CÓ:
- Search tickets
- Filter theo trạng thái
- Realtime notifications
- Empty state

**Kết luận:** ✅ **70% hoạt động** — Xem + resolve OK, thiếu reply.

---

## UC_08: Xử lý khiếu nại
**File:** `admin/xulykhieunai.html` | **API:** `/api/admin/tickets`

### ✅ ĐÃ CÓ:
- Danh sách khiếu nại từ API
- Chuyển trạng thái (API PATCH)
- Auth guard + Logout

### ❌ CẦN CẢI THIỆN:
- Hoàn tiền cho KH (chưa có API)
- Cảnh cáo Tasker (chưa có API)
- Liên kết đơn hàng liên quan

### ⬜ CHƯA CÓ:
- Xem chat history giữa KH-Tasker
- Search + filter

**Kết luận:** ✅ **65% hoạt động** — Cơ bản (list + resolve) OK.

---

## UC_09: Báo cáo doanh thu
**File:** `admin/baocaodoanhthu.html` | **API:** `/api/admin/report-stats`

### ✅ ĐÃ CÓ:
- Doanh thu tổng (summary.totalRevenue)
- Phí hoa hồng 15% (platformRevenue)
- Số đơn hoàn thành (totalOrders)
- Chart data (labels + orders arrays)
- Auth guard + Logout

### ⬜ CHƯA CÓ:
- So sánh với ngày/tuần trước
- Export báo cáo
- Realtime

**Kết luận:** ✅ **80% hoạt động** — Data thật từ API.

---

## 📊 TỔNG HỢP THEO USE CASE (v2)

| UC | Tên | Tỷ lệ hoạt động | Ghi chú |
|----|-----|:----------------:|---------|
| UC_01 | Dashboard | **90%** | ✅ Fetch 5 API, biểu đồ dynamic |
| UC_02 | Đơn hàng | **70%** | ✅ Data thật, thiếu filter/search |
| UC_03 | Can thiệp | **85%** | ✅ Assign + Resolve + Cancel |
| UC_04 | Tasker | **90%** | ✅ Search + Filter + KYC Approve |
| UC_05 | Cư dân | **95%** | ✅ Hoàn chỉnh nhất |
| UC_06 | Ví | **80%** | ✅ Duyệt/từ chối rút tiền |
| UC_07 | Inbox | **70%** | ✅ Xem + resolve, thiếu reply |
| UC_08 | Khiếu nại | **65%** | ✅ List + resolve, thiếu hoàn tiền |
| UC_09 | Báo cáo | **80%** | ✅ Chart data từ API |

**TRUNG BÌNH: ~80% hoạt động**

---

## 🎯 DANH SÁCH CÒN THIẾU CẦN LÀM

### Priority HIGH:
1. ~~Dashboard biểu đồ hardcoded~~ → ✅ **ĐÃ FIX** (render từ report-stats API)
2. **UC_02: Thêm filter/search cho đơn hàng** — search mã đơn, filter trạng thái
3. **UC_07: Reply ticket** — form trả lời trong chi tiết ticket
4. **UC_08: Liên kết đơn + hoàn tiền** — liên kết order_id trong ticket

### Priority MEDIUM:
5. UC_02: Empty state + phân trang
6. UC_06: Search giao dịch + date filter
7. UC_07/08: Search + filter tickets
8. UC_04: Chi tiết Tasker popup (xem CCCD/KYC)

### Priority LOW:
9. Realtime WebSocket cho admin
10. Export CSV/PDF
11. Concurrency control
12. Offline handling
