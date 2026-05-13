# Payment Integration

Module `PaymentsModule` cung cấp 2 chức năng:
1. **Sinh QR thanh toán VietQR** cho user nạp tiền
2. **Nhận webhook** từ ngân hàng/cổng đối soát khi user chuyển khoản thành công → tự cộng ví

Hiện đang dùng **MockProvider**: sinh QR từ public VietQR API (chạy được ngay), nhưng webhook KHÔNG verify chữ ký.

## Cách swap sang provider thật

### Option 1: Casso (chính thống, có phí)
1. Đăng ký [casso.vn](https://casso.vn/), liên kết tài khoản ngân hàng
2. Lấy webhook secret, điền vào `.env`:
   ```
   PAYMENT_PROVIDER=casso
   PAYMENT_CASSO_API_KEY=xxxx
   PAYMENT_CASSO_WEBHOOK_SECRET=yyyy
   PAYMENT_BANK_ACCOUNT=1234567890
   PAYMENT_BANK_NAME=VCB
   ```
3. Hoàn thiện `providers/casso.provider.ts` (xem block comment hướng dẫn)
4. Cấu hình URL webhook trong dashboard Casso: `https://api.chioi.vn/api/payments/webhook`

### Option 2: Sepay (miễn phí cho startup)
1. Đăng ký [sepay.vn](https://sepay.vn/)
2. Tương tự Casso, set `PAYMENT_PROVIDER=sepay` và điền `PAYMENT_SEPAY_*`

## Flow nạp tiền

```
1. User bấm "Nạp tiền" → POST /api/wallets/deposit { amount }
2. Backend:
   - Tạo transaction (status=PENDING, type=TOP_UP)
   - Gọi PaymentsService.generateDepositQr(transactionCode, amount)
   - Trả QR + transactionCode về client
3. User chuyển khoản với memo = transactionCode
4. Ngân hàng → Casso/Sepay → POST /api/payments/webhook
5. Backend:
   - Verify chữ ký
   - Parse webhook → BankWebhookEvent
   - Tìm transaction theo transactionCode (status=PENDING)
   - Update transaction.status=COMPLETED + cộng wallet.balance
   - Emit socket 'wallet_topped_up' cho user
```

## Lưu ý bảo mật

- Webhook endpoint KHÔNG dùng JWT, chỉ verify chữ ký provider → **PHẢI** verify nghiêm ngặt
- Idempotent: cùng `bankTxId` không cộng tiền 2 lần (cần unique constraint trong DB)
- Audit mọi webhook (kể cả invalid signature) trong `admin_audit_logs`
- Rate limit endpoint `/webhook` cao (~1000/min) vì batch update từ ngân hàng
