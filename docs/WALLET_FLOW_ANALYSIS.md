# 💰 WALLET_FLOW_ANALYSIS.md — Phân tích Luồng Ví Điện tử Tasker
## App Chị Ơi! · Phiên bản phân tích: 1.0 · Ngày: 2026-05-16

> **Nguồn tham chiếu:** Phân tích từ lịch sử giao dịch app Be (tài xế) + Database schema Chị Ơi!

---

## 1. Phân tích ảnh Be Driver — Hiểu bản chất từng dòng giao dịch

### Dữ liệu gốc từ ảnh Be (Lịch sử giao dịch tài xế)

#### Chuyến đi `1383091246` — Thanh toán **TIỀN MẶT** (Tất cả âm ròng)

| Dòng giao dịch | Giá trị | Dấu | Ý nghĩa |
|----------------|---------|-----|---------|
| Cước chuyến đi | 26.000đ | (+) | Doanh thu của chuyến (giá khách trả) |
| Hoàn trả chênh lệch tiền mặt thu hộ | -6.105đ | (-) | Khách trả tiền mặt nhiều hơn → trả lại chênh lệch |
| Tiền mặt đối tác thu hộ | -22.000đ | (-) | Tài xế thu tiền mặt hộ Be → phải nộp lại cho Be |
| Khoản thu hộ Be | -1.000đ | (-) | Phí thu hộ cố định |
| Phí SDUD, Chiết khấu và Thuế GTGT | -8.863đ | (-) | Phí sử dụng dịch vụ (platform fee) + thuế |
| Thuế TNCN | -242đ | (-) | Thuế thu nhập cá nhân |
| **Tổng thực nhận** | **-12.210đ** | (-) | **Tài xế bị TRỪ tiền ví** vì nhận tiền mặt |

> **Logic tiền mặt Be:** Tài xế nhận 26.000đ tiền mặt từ khách → ví bị trừ 26.000đ (nộp lại Be) + trừ thêm các phí → **ví âm tổng thể**.

---

#### Chuyến đi `1364442580` — Thanh toán **THẺ/VÍ** (Có cộng tiền)

| Dòng giao dịch | Giá trị | Dấu | Ý nghĩa |
|----------------|---------|-----|---------|
| Cước chuyến đi | 36.000đ | (+) | Doanh thu chuyến |
| Hoàn trả chênh lệch tiền mặt thu hộ | +22.253đ | (+) | Bù chênh lệch (đã từng bị trừ dư) → được hoàn lại |
| Khoản thu hộ Be | -1.000đ | (-) | Phí thu hộ |
| Phí SDUD, Chiết khấu và Thuế GTGT | -12.408đ | (-) | Platform fee + thuế |
| Thuế TNCN | -339đ | (-) | Thuế TNCN |
| **Tổng thực nhận** | **+44.506đ** | (+) | **Tài xế được CỘNG tiền ví** vì thanh toán qua app |

> **Logic thẻ/ví Be:** Khách thanh toán qua app → tiền vào ví Be → Be chia phần tài xế = Cước - Platform fee - Thuế → **ví được cộng tiền**.

---

#### Chuyến đi `1364436344` và `1364415896` — Chỉ có "Hoàn trả chênh lệch"

| Chuyến | Giá trị | Ý nghĩa |
|--------|---------|---------|
| `1364436344` | +16.531đ | Đã bị trừ dư ở chuyến trước → Be hoàn lại |
| `1364415896` | -16.685đ | Tài xế thiếu nộp hoặc dư tiền mặt → ví bị điều chỉnh trừ |

> **"Hoàn trả chênh lệch tiền mặt thu hộ"** = cơ chế cân bằng ví cuối ngày/tuần giữa Be và tài xế.

---

## 2. Mapping sang App Chị Ơi! — Tasker (Người giúp việc)

### Điểm tương đồng Be vs Chị Ơi!

| Be (App tài xế) | Chị Ơi! (App giúp việc) |
|-----------------|-------------------------|
| Cước chuyến đi | Tiền dịch vụ giúp việc |
| Tài xế | Tasker (Người giúp việc) |
| Phí SDUD (platform fee) | Platform fee (15%) |
| Thanh toán thẻ/ví | Thanh toán ví Chị Ơi! |
| Thanh toán tiền mặt | Thanh toán tiền mặt tại nhà |
| Thu hộ Be | Thu hộ Chị Ơi! platform |

---

## 3. Luồng Ví Tasker — Chị Ơi! (Phân tích đầy đủ)

### CASE 1: Khách thanh toán bằng VÍ CHIOI (Tương đương thẻ Be)

```
Khi đơn chuyển sang COMPLETED + payment_method = 'WALLET':

  Đơn dịch vụ: Dọn nhà
  Tổng tiền khách trả: 200.000đ

  Xử lý tự động:
  (1) VÍ KHÁCH:  -200.000đ (payment_status -> PAID)
  (2) Platform giữ: 200.000đ
  (3) Trừ phí platform (15%): -30.000đ
  (4) VÍ TASKER: +170.000đ (EARNING)

Giao dịch tạo ra trong bảng transactions:
- Tasker:   type=EARNING, amount=+170.000, description="Thu nhập đơn DH001"
- Customer: type=PAYMENT, amount=-200.000, description="Thanh toán đơn DH001"
```

**→ VÍ TASKER ĐƯỢC CỘNG TIỀN** ngay khi đơn hoàn thành.

---

### CASE 2: Khách thanh toán TIỀN MẶT (tương đương tiền mặt Be)

```
Khi đơn chuyển sang COMPLETED + payment_method = 'CASH':

  Đơn dịch vụ: Dọn nhà
  Tổng tiền khách trả: 200.000đ (tiền mặt, tại nhà)

  Thực tế:
  (1) Tasker đã cầm 200.000đ tiền mặt của khách
  (2) Platform chưa nhận được gì
  (3) Platform phí (15%) = 30.000đ phải thu từ Tasker
  (4) VÍ TASKER: -30.000đ (bị trừ phí platform)

Giao dịch tạo ra trong bảng transactions:
- Tasker: type=PAYMENT, amount=-30.000, description="Phí platform đơn DH001 (tiền mặt)"
```

**→ VÍ TASKER BỊ TRỪ TIỀN** (chỉ trừ phần platform fee, không trừ toàn bộ).

> ⚠️ **Khác với Be:** Be trừ toàn bộ tiền mặt thu hộ vì Be là đơn vị chủ. Chị Ơi! chỉ trừ phần phí platform vì dịch vụ là của Tasker.

---

### CASE 3: Khách thanh toán NGÂN HÀNG/QR (payment_method = 'BANK')

```
Khi xác nhận thanh toán qua webhook VietQR:

  Đơn dịch vụ: Dọn nhà
  Khách chuyển khoản: 200.000đ -> TK Chị Ơi!

  Xử lý sau khi nhận webhook:
  (1) Platform xác nhận nhận tiền
  (2) Trừ platform fee (15%): -30.000đ
  (3) VÍ TASKER: +170.000đ (EARNING)
```

**→ VÍ TASKER ĐƯỢC CỘNG TIỀN** sau khi webhook xác nhận.

---

### CASE 4: Tasker NẠP TIỀN VÀO VÍ (để đủ số dư bù phí)

```
Khi Tasker nạp tiền qua QR/chuyển khoản:
VÍ TASKER: +[số tiền nạp] (type=DEPOSIT)
```

**Tại sao Tasker cần nạp tiền?** → Để đủ số dư bù đắp phí platform khi nhận nhiều đơn tiền mặt.

---

### CASE 5: Tasker RÚT TIỀN về tài khoản ngân hàng

```
Khi Tasker yêu cầu rút tiền (Admin duyệt):
VÍ TASKER: -[số tiền rút] (type=WITHDRAW)
```

**→ VÍ TASKER BỊ TRỪ TIỀN**, Admin xác nhận và chuyển khoản thực tế.

---

### CASE 6: HOÀN TIỀN khi đơn bị hủy (CANCELLED)

```
Nếu Khách đã thanh toán ví trước và đơn bị hủy:
VÍ KHÁCH:  +[số tiền] (type=REFUND)
VÍ TASKER: [không thay đổi nếu chưa hoàn thành]
```

---

## 4. Bảng tổng hợp — Khi nào VÍ TASKER tăng/giảm

| # | Sự kiện | Phương thức TT | Tác động ví Tasker | Loại giao dịch | Giá trị |
|---|---------|----------------|-------------------|----------------|---------|
| 1 | Đơn COMPLETED | Ví Chị Ơi! (WALLET) | ✅ **CỘNG TIỀN** | EARNING | +tasker_earnings (85%) |
| 2 | Đơn COMPLETED | Tiền mặt (CASH) | ❌ **TRỪ TIỀN** | PAYMENT | -platform_fee (15%) |
| 3 | Đơn COMPLETED | Ngân hàng (BANK) | ✅ **CỘNG TIỀN** | EARNING | +tasker_earnings (85%) |
| 4 | Tasker nạp tiền | Bất kỳ | ✅ **CỘNG TIỀN** | DEPOSIT | +số tiền nạp |
| 5 | Tasker rút tiền | Chuyển khoản | ❌ **TRỪ TIỀN** | WITHDRAW | -số tiền rút |
| 6 | Đơn CANCELLED (đã TT ví) | Ví Chị Ơi! | ❌ TRỪ (hoàn khách) | REFUND | -tasker_earnings (nếu có) |
| 7 | Admin điều chỉnh thủ công | — | +/- Tùy admin | ADJUSTMENT | +/- giá trị |

---

## 5. Bảng tổng hợp — Khi nào VÍ KHÁCH tăng/giảm

| # | Sự kiện | Tác động ví Khách | Loại giao dịch | Giá trị |
|---|---------|-------------------|----------------|---------|
| 1 | Khách đặt dịch vụ và TT bằng ví | ❌ **TRỪ TIỀN** | PAYMENT | -total_price |
| 2 | Khách nạp tiền vào ví | ✅ **CỘNG TIỀN** | DEPOSIT | +số tiền nạp |
| 3 | Đơn CANCELLED (đã TT ví) | ✅ **CỘNG TIỀN** | REFUND | +total_price |
| 4 | Admin hoàn tiền thủ công | ✅ **CỘNG TIỀN** | REFUND | +giá trị |

---

## 6. Sơ đồ luồng xử lý (Flow Diagram)

```
                    ĐƠN HOÀN THÀNH (COMPLETED)
                            |
              +-------------+--------------+
              v                            v
    TIỀN MẶT (CASH)              VÍ / NGÂN HÀNG (WALLET/BANK)
              |                            |
              v                            v
   Tasker cầm tiền mặt        Platform đã nhận tiền từ khách
   Chị Ơi! chưa nhận
              |                            |
              v                            v
   TRỪ phí platform 15%        CỘNG thu nhập 85%
   vào VÍ TASKER               vào VÍ TASKER
   (type=PAYMENT)              (type=EARNING)
              |                            |
              v                            v
   Ví Tasker: -30.000đ         Ví Tasker: +170.000đ
   (với đơn 200.000đ)          (với đơn 200.000đ)
```

---

## 7. Điều kiện kỹ thuật kích hoạt giao dịch

### Backend trigger point — orders.service.ts

Giao dịch ví chỉ được tạo khi:

```typescript
if (newStatus === 'COMPLETED') {
  if (order.payment_method === 'WALLET' || order.payment_method === 'BANK') {
    // Cộng tiền Tasker
    await walletsService.createTransaction({
      wallet_id: taskerWalletId,
      type: 'EARNING',
      amount: order.tasker_earnings,  // 85% của total_price
      order_id: order.order_id,
      description: `Thu nhập đơn ${order.order_code}`
    });
  }

  if (order.payment_method === 'CASH') {
    // Trừ phí platform từ ví Tasker
    await walletsService.createTransaction({
      wallet_id: taskerWalletId,
      type: 'PAYMENT',
      amount: -order.platform_fee,  // 15% của total_price
      order_id: order.order_id,
      description: `Phí platform đơn ${order.order_code} (tiền mặt)`
    });
  }
}
```

### Quy tắc số dư âm

- Nếu Tasker nhận nhiều đơn tiền mặt → ví có thể âm
- Tasker cần nạp tiền để bù đắp phí
- Cài ngưỡng cảnh báo: số dư < 50.000đ → thông báo
- Có thể khóa nhận đơn tiền mặt nếu ví âm quá ngưỡng

---

## 8. Schema database cần kiểm tra/bổ sung

### Bảng `transactions` hiện tại (đã có)

```
type: 'EARNING'    // Cộng thu nhập (ví/ngân hàng)
type: 'PAYMENT'    // Trừ phí platform (tiền mặt)
type: 'DEPOSIT'    // Nạp tiền
type: 'WITHDRAW'   // Rút tiền
type: 'REFUND'     // Hoàn tiền
```

### Bảng `orders` — các trường liên quan

```
tasker_earnings  DECIMAL(12,2)  // Đã có: 85% của total_price
platform_fee     DECIMAL(12,2)  // Đã có: 15% của total_price
payment_method   VARCHAR(20)    // Đã có: CASH / WALLET / BANK
payment_status   VARCHAR(20)    // Đã có: UNPAID / PAID / REFUNDED
```

✅ **Schema hiện tại đã đủ** — không cần thêm bảng mới.

---

## 9. Ví dụ cụ thể — Tasker "Nguyễn Thị B" trong ngày

| Thời gian | Đơn | Phương thức | Tác động | Số dư ví |
|-----------|-----|-------------|----------|----------|
| Đầu ngày | — | — | — | +200.000đ |
| 09:00 | DH001: Dọn nhà 200.000đ | Ví | +170.000đ (EARNING) | +370.000đ |
| 11:00 | DH002: Trông trẻ 150.000đ | Tiền mặt | -22.500đ (PAYMENT) | +347.500đ |
| 14:00 | DH003: Mua hộ 100.000đ | Ngân hàng | +85.000đ (EARNING) | +432.500đ |
| 16:00 | DH004: Dọn nhà 250.000đ | Tiền mặt | -37.500đ (PAYMENT) | +395.000đ |
| Cuối ngày | Rút tiền | Chuyển khoản | -300.000đ (WITHDRAW) | +95.000đ |

---

## 10. Yêu cầu UI — Lịch sử giao dịch Tasker

Màn hình `thunhapvathongke.html` cần hiển thị:

| Thành phần | Mô tả |
|-----------|-------|
| Số dư hiện tại | Balance ví, highlight xanh/đỏ |
| Lịch sử giao dịch | Danh sách transaction, phân loại theo type |
| Màu sắc | Xanh lá (#10B981) cho dương / Đỏ (#EF4444) cho âm |
| Icon type | EARNING / PAYMENT / DEPOSIT / WITHDRAW / REFUND |
| Filter | Theo tháng, theo loại giao dịch |
| Chi tiết | Click vào đơn → xem đơn liên quan |

---

## 11. Khuyến nghị triển khai

### Ưu tiên cao (MVP)

- [ ] **Backend**: Tự động tạo transaction khi đơn COMPLETED
- [ ] **Backend**: Validate số dư Tasker trước khi cho nhận đơn tiền mặt (nếu ví âm quá ngưỡng)
- [ ] **Frontend**: Hiển thị lịch sử giao dịch ví Tasker với màu sắc rõ ràng

### Ưu tiên trung bình

- [ ] **Backend**: Cảnh báo khi ví Tasker < 50.000đ (nhiều đơn tiền mặt tích lũy)
- [ ] **Frontend**: Badge thông báo "Ví sắp hết số dư" trên dashboard Tasker
- [ ] **Admin**: Màn hình duyệt rút tiền Tasker

### Tương lai

- [ ] Tích hợp VietQR webhook cho nạp tiền tự động
- [ ] Chu kỳ thanh toán tự động (cuối tuần, cuối tháng)
- [ ] Báo cáo thuế TNCN cho Tasker

---

## 12. So sánh Be vs Chị Ơi! — Điểm khác biệt quan trọng

| Điểm so sánh | App Be (Tài xế) | App Chị Ơi! (Tasker) |
|-------------|-----------------|----------------------|
| Tiền mặt | Trừ TOÀN BỘ tiền mặt thu hộ + phí | Chỉ trừ PHẦN PHÍ (15%) |
| Lý do khác nhau | Be là bên nhận dịch vụ (đơn của Be) | Tasker là chủ dịch vụ, Chị Ơi! chỉ là platform |
| Thẻ/Ví | Cộng: Cước - Platform fee - Thuế | Cộng: total_price x 85% |
| Thuế TNCN | Be tự khấu trừ và nộp | Chị Ơi! có thể tự xử lý hoặc để Tasker tự nộp |
| Chênh lệch thu hộ | Có cơ chế điều chỉnh cuối ngày | Không cần (không thu hộ toàn bộ) |

---

*Tài liệu này phục vụ việc implement module Wallet cho Tasker trong hệ thống Chị Ơi!*  
*Tham chiếu: docs/DATABASE.md (bảng wallets, transactions) · docs/ARCHITECTURE.md (WalletsModule)*
