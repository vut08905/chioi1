# Kế hoạch: Chat Realtime & Gọi Điện Realtime giữa Khách hàng ↔ Tasker

> **Phạm vi:** Chỉ nhắn tin và gọi điện trong phạm vi **1 đơn hàng cụ thể** (orderId).  
> Không thể chat hoặc gọi với người không liên quan đến đơn hàng.  
> **Stack hiện tại:** NestJS + Socket.IO 4.x + HTML/JS frontend.

---

## Phân tích hiện trạng

| Thành phần | Trạng thái |
|---|---|
| `orders.gateway.ts` | ✅ Đã có socket `send_message` → `receive_message` |
| `orders.service.ts` | ✅ Đã có `saveMessage()`, `getChatHistory()` |
| `orders.controller.ts` | ✅ Đã có `GET /api/orders/chat/:orderId` |
| `chatvoitasker.html` (KH) | ⚠️ Có socket nhưng chưa hiện tên tasker thật, chưa xác thực orderId |
| `chatvoikhachhang.html` (Tasker) | ⚠️ Tương tự — UI tĩnh, không load tin nhắn cũ |
| Gọi điện | ❌ Chưa có — cần implement WebRTC hoặc giải pháp thay thế |

**Kết luận:** Chat cơ bản gần xong. Cần hoàn thiện UX + xác thực đơn hàng + thêm tính năng gọi điện.

---

## GIAI ĐOẠN 1 — Hoàn thiện Chat Realtime (2–3 giờ)

### Bước 1.1 — Backend: Xác thực quyền chat theo orderId

**File:** `backend/src/orders/orders.gateway.ts`  
**Mục tiêu:** Khi nhận `send_message`, kiểm tra người gửi có thuộc đơn hàng đó không.

```typescript
// Trong handleMessage():
// Truy vấn DB: order phải có customer_id hoặc tasker_id === sender_id
const order = await this.ordersService.getOrderById(data.orderId, client.data.userId);
if (!order) {
  client.emit('error', { message: 'Bạn không có quyền chat trong đơn hàng này' });
  return;
}
```

**File:** `backend/src/orders/orders.gateway.ts`  
**Thêm:** Sau khi lưu tin nhắn, cũng gửi lại cho chính sender để confirm (tick "Đã gửi"):

```typescript
// Sau khi emit receive_message cho receiver:
client.emit('message_sent', { ...message, status: 'sent' });
```

---

### Bước 1.2 — Backend: Thêm socket event `join_order_room`

**File:** `backend/src/orders/orders.gateway.ts`  
**Mục tiêu:** Khi user kết nối vào trang chat, tham gia room của đơn hàng để dễ quản lý.

```typescript
@SubscribeMessage('join_order_room')
async handleJoinRoom(
  @ConnectedSocket() client: Socket,
  @MessageBody() data: { orderId: number }
) {
  // Kiểm tra user có thuộc đơn hàng này không
  const order = await this.ordersService.getOrderById(data.orderId, client.data.userId);
  if (!order) {
    client.emit('error', { message: 'Không được phép' });
    return;
  }
  const roomName = `order_${data.orderId}`;
  client.join(roomName);
  client.data.currentOrderRoom = roomName;
  client.emit('joined_room', { orderId: data.orderId, roomName });
}
```

**Thay đổi `send_message`** để broadcast trong room thay vì emit trực tiếp:

```typescript
// Thay vì: this.server.to(receiverSocketId).emit(...)
// Dùng: this.server.to(`order_${data.orderId}`).emit('receive_message', message);
// → Cả 2 bên đều nhận được (kể cả sender — để confirm)
```

---

### Bước 1.3 — Frontend KH: `chatvoitasker.html` — Kết nối thật

**Các việc cần làm:**

1. **Đọc `orderId` và `receiverId` từ URL** → đã có, kiểm tra lại
2. **Gọi API lấy thông tin đơn hàng** (`GET /api/orders/:orderId`) để hiện tên tasker thật, ảnh thật, trạng thái đơn
3. **Emit `join_order_room`** ngay khi socket kết nối
4. **Load lịch sử tin nhắn** từ `GET /api/orders/chat/:orderId` → render
5. **Xử lý `message_sent`** → đổi icon từ `done` → `done_all`
6. **Scroll xuống cuối** khi mở trang và khi nhận tin mới

```javascript
// Thêm sau khi socket connect:
socket.emit('join_order_room', { orderId: parseInt(orderId) });

socket.on('receive_message', function(msg) {
  // Hiện bong bóng tin nhắn
  appendMessage(msg, msg.sender_id === user.user_id);
});

socket.on('message_sent', function(msg) {
  // Cập nhật tick "đã gửi"
  updateMessageStatus(msg.message_id, 'sent');
});
```

---

### Bước 1.4 — Frontend Tasker: `chatvoikhachhang.html` — Kết nối thật

**Tương tự bước 1.3** nhưng cho phía Tasker:

1. Đọc `orderId` + `receiverId` từ URL params
2. Gọi `GET /api/orders/:orderId` → hiện tên khách hàng thật
3. Emit `join_order_room`, load lịch sử, nhận realtime
4. Thêm `onclick="history.back()"` cho nút back ← (đã fix ở report14)

---

### Bước 1.5 — Trỏ link chat từ các trang khác

| Trang gọi chat | Cần thêm |
|---|---|
| `lichsuhoatdong.html` (KH) | `chatvoitasker.html?orderId={id}&receiverId={tasker_id}` |
| `lichsudonhang.html` (Tasker) | `chatvoikhachhang.html?orderId={id}&receiverId={customer_id}` |
| `theodoidon.html` (KH — theo dõi đơn) | Nút Chat → `chatvoitasker.html?orderId={id}&receiverId={tasker_id}` |
| `trangchutasker.html` (Dashboard) | Nút Chat trên active order card |

---

## GIAI ĐOẠN 2 — Gọi Điện Realtime (4–6 giờ)

### Phương án kỹ thuật: WebRTC qua Socket.IO Signaling

**Chọn WebRTC vì:**
- Miễn phí, không cần service bên ngoài
- P2P → độ trễ thấp
- Hỗ trợ trên mọi trình duyệt hiện đại (Chrome, Safari mobile)
- Backend chỉ cần làm **signaling server** (trao đổi SDP + ICE candidates)

**Luồng kết nối WebRTC:**
```
Caller                          Backend (Socket)                Callee
  |                                    |                           |
  |--- call_request {orderId} -------->|                           |
  |                                    |--- call_incoming -------->|
  |                                    |<-- call_accepted ---------|
  |--- webrtc_offer {SDP} ----------->|                           |
  |                                    |--- webrtc_offer -------->|
  |                                    |<-- webrtc_answer {SDP} --|
  |<-- webrtc_answer ------------------|                           |
  |--- ice_candidate ----------------- |--- ice_candidate -------->|
  |<-- ice_candidate -----------------|<-- ice_candidate ---------|
  |========== P2P Audio Connected ============================|
  |--- call_ended ------------------->|--- call_ended ----------->|
```

---

### Bước 2.1 — Backend: Thêm WebRTC Signaling vào Gateway

**File:** `backend/src/orders/orders.gateway.ts`  
**Thêm 5 socket events:**

```typescript
// 1. Yêu cầu gọi điện
@SubscribeMessage('call_request')
async handleCallRequest(client, data: { orderId: number, receiverId: number }) {
  // Kiểm tra order có tồn tại và người dùng thuộc đơn không
  const order = await this.ordersService.getOrderById(data.orderId, client.data.userId);
  if (!order) return;
  
  const receiverSocketId = this.connectedUsers.get(data.receiverId);
  if (receiverSocketId) {
    this.server.to(receiverSocketId).emit('call_incoming', {
      orderId: data.orderId,
      callerId: client.data.userId,
      callerName: client.data.full_name || 'Người dùng'
    });
  } else {
    client.emit('call_failed', { reason: 'Người dùng không trực tuyến' });
  }
}

// 2. Chấp nhận cuộc gọi
@SubscribeMessage('call_accepted')
handleCallAccepted(client, data: { orderId: number, callerId: number }) {
  const callerSocketId = this.connectedUsers.get(data.callerId);
  if (callerSocketId) {
    this.server.to(callerSocketId).emit('call_accepted', { orderId: data.orderId });
  }
}

// 3. Từ chối cuộc gọi
@SubscribeMessage('call_rejected')
handleCallRejected(client, data: { callerId: number }) {
  const callerSocketId = this.connectedUsers.get(data.callerId);
  if (callerSocketId) {
    this.server.to(callerSocketId).emit('call_rejected', {});
  }
}

// 4. WebRTC SDP Exchange (offer/answer)
@SubscribeMessage('webrtc_offer')
handleOffer(client, data: { receiverId: number, sdp: RTCSessionDescriptionInit }) {
  const receiverSocketId = this.connectedUsers.get(data.receiverId);
  if (receiverSocketId) {
    this.server.to(receiverSocketId).emit('webrtc_offer', { sdp: data.sdp, callerId: client.data.userId });
  }
}

@SubscribeMessage('webrtc_answer')
handleAnswer(client, data: { callerId: number, sdp: RTCSessionDescriptionInit }) {
  const callerSocketId = this.connectedUsers.get(data.callerId);
  if (callerSocketId) {
    this.server.to(callerSocketId).emit('webrtc_answer', { sdp: data.sdp });
  }
}

// 5. ICE Candidate
@SubscribeMessage('ice_candidate')
handleIceCandidate(client, data: { receiverId: number, candidate: RTCIceCandidateInit }) {
  const receiverSocketId = this.connectedUsers.get(data.receiverId);
  if (receiverSocketId) {
    this.server.to(receiverSocketId).emit('ice_candidate', { candidate: data.candidate });
  }
}

// 6. Kết thúc cuộc gọi
@SubscribeMessage('call_ended')
handleCallEnded(client, data: { receiverId: number }) {
  const receiverSocketId = this.connectedUsers.get(data.receiverId);
  if (receiverSocketId) {
    this.server.to(receiverSocketId).emit('call_ended', {});
  }
}
```

---

### Bước 2.2 — Frontend: Module WebRTC dùng chung (`shared/webrtc.js`)

Tạo file mới `frontend/shared/webrtc.js` — dùng chung cho cả KH và Tasker:

```javascript
/**
 * CHỊ ƠI! — WebRTC Call Module
 * Quản lý gọi điện P2P giữa KH và Tasker trong phạm vi đơn hàng.
 * Dùng chung: chatvoitasker.html và chatvoikhachhang.html
 */

class ChiOiCall {
  constructor(socket, userId) {
    this.socket = socket;
    this.userId = userId;
    this.localStream = null;
    this.peerConnection = null;
    this.isCalling = false;
    this.remoteUserId = null;
    this.currentOrderId = null;
    
    // ICE Servers (STUN miễn phí từ Google)
    this.iceServers = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    };
    
    this._bindSocketEvents();
  }
  
  // === Gọi đi ===
  async startCall(orderId, receiverId) { /* ... */ }
  
  // === Nhận cuộc gọi đến ===
  showIncomingCall(callerId, callerName) { /* Hiện UI popup */ }
  
  async acceptCall(callerId) { /* Tạo peerConnection, gửi answer */ }
  
  rejectCall(callerId) { /* Gửi call_rejected */ }
  
  // === Kết thúc ===
  endCall() { /* Đóng stream, đóng peerConnection */ }
  
  // === Bind socket events ===
  _bindSocketEvents() {
    this.socket.on('call_incoming', ...)
    this.socket.on('call_accepted', ...)
    this.socket.on('call_rejected', ...)
    this.socket.on('webrtc_offer', ...)
    this.socket.on('webrtc_answer', ...)
    this.socket.on('ice_candidate', ...)
    this.socket.on('call_ended', ...)
  }
}
```

---

### Bước 2.3 — Frontend: UI gọi điện trong trang chat

**Thêm vào cả `chatvoitasker.html` và `chatvoikhachhang.html`:**

#### 2.3.1 — Nút gọi điện (đã có skeleton)
```html
<!-- Header đã có nút call, thêm onclick: -->
<button onclick="chiOiCall.startCall(orderId, receiverId)" ...>
  <span class="material-symbols-outlined">call</span>
</button>
```

#### 2.3.2 — Overlay "Đang gọi..." (Caller side)
```html
<div id="call-overlay" class="hidden fixed inset-0 z-[200] bg-black/80 flex flex-col items-center justify-center">
  <img id="call-avatar" class="w-24 h-24 rounded-full border-4 border-white mb-4" />
  <h2 id="call-name" class="text-white text-xl font-bold mb-2">Nguyễn Lan</h2>
  <p id="call-status" class="text-white/70 mb-8">Đang gọi...</p>
  <!-- Nút kết thúc -->
  <button onclick="chiOiCall.endCall()" class="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center">
    <span class="material-symbols-outlined text-white text-[32px]" style="font-variation-settings: 'FILL' 1">call_end</span>
  </button>
  <!-- Audio element ẩn (remote stream) -->
  <audio id="remote-audio" autoplay></audio>
</div>
```

#### 2.3.3 — Popup "Có cuộc gọi đến" (Callee side)
```html
<div id="incoming-call-popup" class="hidden fixed bottom-24 left-4 right-4 z-[200] bg-gray-900 rounded-2xl p-4 shadow-2xl">
  <div class="flex items-center gap-3 mb-3">
    <img id="incoming-avatar" class="w-12 h-12 rounded-full" />
    <div>
      <p class="text-white font-bold" id="incoming-name">Nguyễn Văn A</p>
      <p class="text-white/60 text-sm">Cuộc gọi đến từ đơn hàng</p>
    </div>
  </div>
  <div class="flex gap-3">
    <button onclick="chiOiCall.rejectCall(incomingCallerId)"
      class="flex-1 py-3 bg-red-500 rounded-full text-white font-bold flex items-center justify-center gap-1">
      <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1">call_end</span> Từ chối
    </button>
    <button onclick="chiOiCall.acceptCall(incomingCallerId)"
      class="flex-1 py-3 bg-green-500 rounded-full text-white font-bold flex items-center justify-center gap-1">
      <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1">call</span> Nghe máy
    </button>
  </div>
</div>
```

---

### Bước 2.4 — Xử lý quyền microphone

```javascript
// Khi gọi/nhận: xin quyền mic
async function getMicStream() {
  try {
    return await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
  } catch (e) {
    showToastMsg('⚠️ Cần cấp quyền microphone để gọi điện');
    return null;
  }
}
```

---

## GIAI ĐOẠN 3 — Bảo mật & Kiểm thử (1–2 giờ)

### Bước 3.1 — Xác thực: Chỉ 2 người trong đơn hàng mới chat/gọi được

**Logic backend (trong Gateway):**
- Mỗi socket event có `orderId` → query DB kiểm tra `customer_id` hoặc `tasker_id` của order có khớp với `client.data.userId` không
- Nếu không khớp → `client.emit('error', ...)` và return

```typescript
// Helper function dùng chung trong Gateway:
private async assertUserBelongsToOrder(userId: number, orderId: number): Promise<boolean> {
  const order = await this.prisma.orders.findFirst({
    where: {
      order_id: orderId,
      OR: [{ customer_id: userId }, { tasker_id: userId }]
    }
  });
  return !!order;
}
```

### Bước 3.2 — Rate Limiting tin nhắn

Thêm vào `handleMessage()`:
```typescript
// Chặn spam: max 20 tin/phút mỗi user
const msgKey = `chat_rate_${client.data.userId}`;
// Dùng một simple Map với timestamp để track
```

### Bước 3.3 — Test cases cần kiểm tra

| Test | Kết quả mong đợi |
|---|---|
| KH chat Tasker trong đơn đang làm | ✅ Nhận được realtime |
| KH cố chat với Tasker của đơn người khác | ❌ Bị chặn, báo lỗi |
| Gọi điện khi người kia offline | ❌ Báo "Không thể kết nối" |
| Gọi điện khi người kia đang trực tuyến | ✅ Popup nhận cuộc gọi hiện lên |
| Từ chối cuộc gọi | ✅ Caller thấy "Cuộc gọi bị từ chối" |
| Cả 2 cúp máy | ✅ Overlay tắt, stream giải phóng |
| Mất kết nối internet giữa chừng | ⚠️ ICE reconnect tự động |

---

## Tổng hợp file cần sửa / tạo mới

| File | Loại | Giai đoạn | Mô tả |
|---|---|---|---|
| `backend/src/orders/orders.gateway.ts` | Sửa | 1.1, 1.2, 2.1 | Thêm xác thực + join_room + WebRTC signaling |
| `frontend/shared/webrtc.js` | Tạo mới | 2.2 | Module WebRTC dùng chung |
| `frontend/khachhang/chatvoitasker.html` | Sửa | 1.3, 2.3 | Kết nối thật + UI gọi điện |
| `frontend/giupviec/chatvoikhachhang.html` | Sửa | 1.4, 2.3 | Kết nối thật + UI gọi điện |
| `frontend/khachhang/lichsuhoatdong.html` | Sửa | 1.5 | Fix link chat button |
| `frontend/giupviec/lichsudonhang.html` | Sửa | 1.5 | Fix link chat button |
| `frontend/khachhang/theodoidon.html` | Sửa | 1.5 | Thêm nút Chat trong trang theo dõi đơn |

> ⚠️ **KHÔNG sửa:** `shared/api.js`, `auth.service.ts`, `jwt.strategy.ts`, `schema.prisma`

---

## Ước tính thời gian

| Giai đoạn | Thời gian |
|---|---|
| Giai đoạn 1 — Chat hoàn chỉnh | 2–3 giờ |
| Giai đoạn 2 — Gọi điện WebRTC | 4–6 giờ |
| Giai đoạn 3 — Bảo mật + Test | 1–2 giờ |
| **Tổng** | **7–11 giờ** |

---

## Lưu ý kỹ thuật quan trọng

1. **STUN server miễn phí** (`stun.l.google.com`) hoạt động tốt trong cùng mạng LAN. Nếu cần test qua internet khác mạng, cần **TURN server** (có thể dùng `coturn` self-hosted hoặc dịch vụ miễn phí).

2. **iOS Safari** yêu cầu user gesture (tap) trước khi `getUserMedia()` hoạt động → nút "Nghe máy" đã đảm bảo điều này.

3. **WebRTC chỉ hoạt động trên HTTPS** trên production. Trong môi trường dev localhost/127.0.0.1 thì HTTP vẫn được.

4. **Tin nhắn đã lưu DB** (`messages` table) → lịch sử chat sẽ giữ nguyên dù reload trang.
