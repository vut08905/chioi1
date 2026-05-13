# Báo Cáo Lỗi Chat Realtime — Phân tích & Giải pháp

> **Ngày:** 2026-05-13  
> **Tình trạng:** Lỗi hiển thị tin nhắn khi chat realtime và sau khi reload trang

---

## 1. MÔ TẢ LỖI

### Lỗi A — Tin nhắn hiện sai phía (sau reload)
**Hiện tượng:** Khi reload trang chat, tin nhắn của mình lẽ ra hiện bên **phải** (sent) nhưng lại hiện bên **trái** (received), hoặc ngược lại.

### Lỗi B — Tin nhắn bị trùng lặp (realtime)
**Hiện tượng:** Khi gửi tin nhắn, bong bóng tin nhắn xuất hiện **2 lần** ở phía người gửi.

### Lỗi C — Ảnh mất sau reload
**Hiện tượng:** Gửi ảnh → hiện trong phiên chat hiện tại → reload → ảnh biến mất, chỉ còn `[Hình ảnh]`.

### Lỗi D — Ảnh hiện icon thay vì ảnh thật ở phía người nhận
**Hiện tượng:** Người nhận thấy icon ảnh lớn màu cam thay vì ảnh thật.

---

## 2. NGUYÊN NHÂN GỐC

### Lỗi A — Type mismatch `sender_id` (STRING vs NUMBER)

**Đây là lỗi nghiêm trọng nhất.**

**Luồng dữ liệu:**
```
Login API → trả về { user: { user_id: 5 } }  (NUMBER từ PostgreSQL)
              ↓
localStorage → chioi_user = '{"user_id": 5}'
              ↓
ChiOiAuth.getUser() → { user_id: 5 }          (NUMBER ✅)
```

```
Chat API → GET /api/orders/chat/:orderId
         → trả về [{ sender_id: 5, content: "..." }]  (NUMBER từ DB)
```

**Vấn đề nằm ở so sánh:**
```javascript
// Frontend hiện tại dùng ===
msg.sender_id === user.user_id
```

Tuy nhiên, tùy trường hợp:
- `user.user_id` có thể là `"5"` (string) nếu JSON parse không nhất quán
- `msg.sender_id` từ DB là `5` (number)
- `"5" === 5` → **FALSE** → tin nhắn của mình hiện ở phía "received"

**Và quan trọng hơn:**
- Khi socket broadcast `receive_message`, `msg.sender_id` là number
- Phép so sánh `msg.sender_id !== user.user_id` dùng `!==` cũng bị type mismatch
- → Tin nhắn mình gửi vẫn bị hiện thêm 1 lần ở phía "received"

### Lỗi B — Room broadcast + Optimistic UI = Double message

**Luồng hiện tại khi gửi tin:**
```
1. User gõ "hello", bấm Send
2. Frontend: appendMessage(msg, true) → hiện bong bóng phải ✅
3. Frontend: socket.emit('send_message', {...})
4. Backend: lưu DB → broadcast room → emit('receive_message') cho TẤT CẢ trong room
5. Frontend (sender): nhận 'receive_message' → kiểm tra sender_id !== user_id
6. Do type mismatch → ĐÚNG (vì "5" !== 5) → appendMessage lần 2 ❌
```

**Kết quả:** Người gửi thấy tin nhắn 2 lần — 1 bên phải (bước 2) + 1 bên trái (bước 6).

### Lỗi C — Ảnh không lưu server

**Hiện tại:**
- Ảnh được đọc bằng `FileReader.readAsDataURL()` → base64 string
- Chỉ hiện client-side
- Chỉ gửi `content: "[Hình ảnh]"` qua socket → lưu vào DB
- Sau reload → DB chỉ có text `[Hình ảnh]` → không có ảnh

### Lỗi D — Ảnh không gửi đúng cách cho người nhận

- Ảnh base64 không được gửi qua socket (quá nặng)
- Chỉ gửi `[Hình ảnh]` text → người nhận thấy text `[Hình ảnh]` hoặc icon placeholder

---

## 3. GIẢI PHÁP

### Fix A — Ép kiểu Number() khi so sánh sender_id

**File cần sửa:** `chatvoitasker.html`, `chatvoikhachhang.html`

```javascript
// TRƯỚC (lỗi):
msg.sender_id === user.user_id

// SAU (fix):
Number(msg.sender_id) === Number(user.user_id)
```

**Áp dụng ở 3 chỗ trong mỗi file:**
1. `socket.on('receive_message')` — filter tin mình gửi
2. Vòng `messages.forEach()` — render lịch sử
3. `appendMessage()` — xác định bubble bên nào

### Fix B — Không broadcast về sender qua room (hoặc filter chính xác hơn)

**Cách 1 — Backend: Dùng `client.broadcast.to(room)` thay vì `server.to(room)`**
```typescript
// TRƯỚC: gửi cho TẤT CẢ trong room (kể cả sender)
this.server.to(roomName).emit('receive_message', message);

// SAU: chỉ gửi cho người KHÁC trong room
client.broadcast.to(roomName).emit('receive_message', message);
```
→ Sender không nhận lại tin mình → không bị double.

**Cách 2 — Frontend: So sánh bằng Number() (đã fix ở Fix A)**
→ `receive_message` sẽ bị filter đúng cho sender → không append lại.

**Đề xuất:** Dùng **cả 2 cách** để chắc chắn.

### Fix C — Lưu ảnh lên server (tính năng mới)

**Phương án nhanh (không cần infra mới):**
1. Tạo API endpoint `POST /api/orders/chat/:orderId/upload-image`
2. Nhận file ảnh (multipart/form-data)
3. Lưu vào thư mục `backend/uploads/chat/`
4. Trả về URL: `/uploads/chat/{filename}`
5. Gửi tin nhắn với `content: URL ảnh` + `type: "IMAGE"`
6. Frontend render: nếu `type === "IMAGE"` → hiện `<img src="...">` thay vì text

**DB change:** Thêm cột `message_type` vào bảng `messages` (TEXT | IMAGE).  
Hoặc dùng convention: nếu content bắt đầu bằng `/uploads/chat/` → là ảnh.

### Fix D — Render ảnh ở phía người nhận

**Hiện tại:** Người nhận chỉ nhận `content: "[Hình ảnh]"` text.

**Sau khi fix C:** Người nhận sẽ nhận `content: "http://.../uploads/chat/abc.jpg"` → render ảnh thật.

---

## 4. THỨ TỰ SỬA

| STT | Fix | Độ ưu tiên | Ảnh hưởng |
|-----|-----|-----------|-----------|
| 1 | **Fix A** — Ép Number() sender_id | 🔴 Cao nhất | Sai phía tin nhắn |
| 2 | **Fix B** — `client.broadcast` thay `server.to` | 🔴 Cao | Tin nhắn trùng |
| 3 | **Fix C+D** — Upload ảnh lên server | 🟡 Trung bình | Ảnh mất sau reload |

### Fix 1+2 có thể làm ngay (15 phút)
### Fix 3+4 cần thêm code backend (1-2 giờ)

---

## 5. FILE CẦN SỬA

| File | Thay đổi |
|------|---------|
| `frontend/khachhang/chatvoitasker.html` | Thêm `Number()` vào so sánh sender_id |
| `frontend/giupviec/chatvoikhachhang.html` | Thêm `Number()` vào so sánh sender_id |
| `backend/src/orders/orders.gateway.ts` | Đổi `server.to()` → `client.broadcast.to()` |
| `backend/src/orders/orders.controller.ts` | *(Tương lai)* Thêm API upload ảnh |
| `backend/src/orders/orders.service.ts` | *(Tương lai)* Thêm service lưu file |

> ⚠️ **KHÔNG sửa:** `shared/api.js`, `auth.service.ts`, `schema.prisma`

---

## 6. MINH HỌA LUỒNG SAU KHI FIX

```
[KH gõ "hello"] 
    → appendMessage("hello", isMine=true)  → hiện bong bóng PHẢI ✅
    → socket.emit('send_message')
    → Backend: saveMessage() + client.broadcast.to(room)
    → Tasker nhận 'receive_message' → appendMessage("hello", isMine=false) → bong bóng TRÁI ✅
    → KH KHÔNG nhận lại (vì dùng broadcast) ✅
    → KH nhận 'message_sent' → đổi tick done → done_all ✅

[Reload trang]
    → GET /api/orders/chat/:orderId → [{sender_id: 5, ...}, {sender_id: 3, ...}]
    → Number(msg.sender_id) === Number(user.user_id) → đúng phía ✅
```
