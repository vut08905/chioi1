# 🐛 Bug Analysis: Tasker Nhận Được Nhiều Đơn Cùng Lúc

> **Tạo ngày**: 13/05/2026  
> **Mức độ nghiêm trọng**: 🔴 CRITICAL  
> **Trạng thái**: ✅ ĐÃ FIX (Backend + Frontend) — 13/05/2026

---

## 1. Mô Tả Vấn Đề

Một Tasker có thể nhận nhiều đơn hàng đồng thời (cùng trạng thái `ACCEPTED` / `IN_PROGRESS`) tại một thời điểm. Như trong ảnh: Tasker có tới **5+ đơn "Đã nhận"** trong cùng ngày 13/5/2026.

**Hậu quả:**
- Tasker thực tế không thể làm 5 việc cùng lúc → khách hàng bị bỏ rơi
- Dữ liệu lịch sử đơn hàng sai lệch
- Thu nhập thống kê bị ảo
- Race condition: 2 Tasker có thể cùng nhận 1 đơn PENDING

---

## 2. Nguyên Nhân Gốc Rễ

### 🔴 LỖI CHÍNH — Backend `orders.service.ts` (dòng 54–70)

```typescript
async acceptOrder(orderId: number, taskerId: number) {
  const order = await this.prisma.orders.findUnique({ where: { order_id: orderId } });

  // ❌ CHỈ kiểm tra đơn có PENDING không
  // ❌ KHÔNG HỀ kiểm tra Tasker đang có đơn active nào khác không
  if (!order || order.status !== 'PENDING') {
    throw new BadRequestException('Order is no longer available');
  }

  // ❌ Không dùng transaction → race condition khi 2 người cùng nhận
  return this.prisma.orders.update({
    where: { order_id: orderId },
    data: { tasker_id: taskerId, status: 'ACCEPTED' },
  });
}
```

**3 lỗ hổng cụ thể:**
1. Không kiểm tra `tasker_id` đang có đơn `ACCEPTED/IN_PROGRESS/TASKER_ARRIVED` nào không
2. Không dùng `$transaction` → race condition nếu 2 Tasker bấm nhận cùng lúc  
3. Không có database constraint ở tầng SQL

### 🟡 LỖI PHỤ — Frontend `trangchutasker.html`

```javascript
var isHandlingOrder = false; // ❌ Biến in-memory, reset khi F5

// Nếu Tasker reload trang → isHandlingOrder = false
// → Modal đơn mới hiện ra dù đang có đơn đang chạy
```

---

## 3. Luồng Lỗi Cụ Thể

```
[Trước] Tasker đang có đơn ACCEPTED (order_id = 5)
         ↓
[Reload trang] → isHandlingOrder = false (biến JS reset)
         ↓
[Socket] Server gửi 'new_order' event
         ↓
[Frontend] isHandlingOrder === false → hiện modal đơn mới ✅ (sai)
         ↓
[Tasker] Bấm "NHẬN ĐƠN" (order_id = 10)
         ↓
[Backend] acceptOrder(10, tasker_id=3)
  → Kiểm tra order.status === 'PENDING'? ✅ 
  → Kiểm tra Tasker đang bận? ❌ KHÔNG KIỂM TRA
         ↓
[DB] UPDATE orders SET tasker_id=3, status='ACCEPTED' WHERE order_id=10
         ↓
[Kết quả] Tasker giờ có 2 đơn ACCEPTED cùng lúc ❌❌❌
```

---

## 4. Cách Khắc Phục

### ✅ Fix 1 (QUAN TRỌNG NHẤT) — Backend `orders.service.ts`

**Thêm check active order + dùng transaction:**

```typescript
async acceptOrder(orderId: number, taskerId: number) {
  // ✅ BƯỚC 1: Kiểm tra Tasker đang có đơn active không
  const activeOrder = await this.prisma.orders.findFirst({
    where: {
      tasker_id: taskerId,
      status: { in: ['ACCEPTED', 'TASKER_ARRIVED', 'IN_PROGRESS'] },
    },
  });

  if (activeOrder) {
    throw new BadRequestException(
      `Bạn đang có đơn #${activeOrder.order_id} đang xử lý. Hoàn thành trước khi nhận đơn mới.`
    );
  }

  // ✅ BƯỚC 2: Dùng $transaction để tránh race condition
  return this.prisma.$transaction(async (tx) => {
    const order = await tx.orders.findUnique({ where: { order_id: orderId } });
    if (!order || order.status !== 'PENDING') {
      throw new BadRequestException('Đơn hàng không còn khả dụng');
    }

    return tx.orders.update({
      where: { order_id: orderId },
      data: { tasker_id: taskerId, status: 'ACCEPTED' },
      include: { taskers: { include: { users: true } } },
    });
  });
}
```

### ✅ Fix 2 — Frontend: Persist `isHandlingOrder` qua localStorage

**File**: `frontend/giupviec/trangchutasker.html`

```javascript
// ❌ Trước: biến in-memory → mất khi reload
var isHandlingOrder = false;

// ✅ Sau: lưu vào localStorage để persist qua reload
var isHandlingOrder = localStorage.getItem('chioi_tasker_handling') === 'true';

// Khi nhận đơn thành công → set true
isHandlingOrder = true;
localStorage.setItem('chioi_tasker_handling', 'true');

// Khi đơn COMPLETED/CANCELLED → xóa
isHandlingOrder = false;
localStorage.removeItem('chioi_tasker_handling');
```

### ✅ Fix 3 (Optional nhưng mạnh) — Database Constraint

```sql
-- Chỉ cho phép 1 đơn active per tasker tại mọi thời điểm
CREATE UNIQUE INDEX unique_active_tasker_order
ON orders (tasker_id)
WHERE status IN ('ACCEPTED', 'TASKER_ARRIVED', 'IN_PROGRESS')
  AND tasker_id IS NOT NULL;
```

> ⚠️ Chạy migration cẩn thận — fail nếu DB hiện có data vi phạm.

---

## 5. Thứ Tự Ưu Tiên

| Độ ưu tiên | Fix | Tầng | Tác dụng |
|-----------|-----|------|----------|
| 🔴 P0 | Thêm check active order trong `acceptOrder()` | Backend | Chặn hoàn toàn ở server |
| 🟠 P1 | Wrap trong `$transaction()` | Backend | Ngăn race condition |
| 🟡 P2 | Persist `isHandlingOrder` qua localStorage | Frontend | UX tốt hơn khi reload |
| 🟢 P3 | Database UNIQUE INDEX partial | Database | Bảo vệ tầng DB |

---

## 6. Files Cần Sửa

```
🔴 BẮT BUỘC:
└── chioi-backend/src/orders/orders.service.ts
    → Hàm acceptOrder() thêm active order check + $transaction

🟡 NÊN SỬA:
└── frontend/giupviec/trangchutasker.html
    → isHandlingOrder persist qua localStorage

🟢 TÙY CHỌN:
└── chioi-backend/prisma/schema.prisma
    → Database-level constraint
```

---

## 7. Test Cases Sau Khi Fix

- [ ] Tasker có đơn `ACCEPTED` → nhận đơn mới → API trả 400 + message rõ ràng
- [ ] Tasker có đơn `IN_PROGRESS` → nhận đơn mới → API trả 400
- [ ] Tasker có đơn `TASKER_ARRIVED` → nhận đơn mới → API trả 400
- [ ] 2 Tasker cùng bấm nhận 1 đơn → chỉ 1 người thành công
- [ ] Tasker hoàn thành đơn → có thể nhận đơn mới bình thường
- [ ] Tasker reload trang khi đang có đơn → không hiện modal đơn mới
- [ ] Tasker tắt tab, mở lại → vẫn biết mình đang có đơn
