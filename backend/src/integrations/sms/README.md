# SMS Integration

Module `SmsModule` cung cấp gateway gửi SMS / OTP. Hiện đang dùng **MockProvider** — chỉ log OTP ra console (không gửi thật).

## Cách swap sang provider thật

1. Đăng ký account ở 1 trong các provider:
   - [FPT SMS](https://docs.fpt.ai/sms/)
   - [VNPT SMS](https://vnptsms.com.vn/)
   - eSMS / SpeedSMS (chưa có stub — tự tạo nếu cần)
2. Điền credentials vào `.env`:
   ```
   SMS_PROVIDER=fpt              # hoặc vnpt
   SMS_FPT_API_KEY=xxxxxxxxxxxx
   SMS_FPT_API_SECRET=yyyyyyyyy
   SMS_FPT_BRAND_NAME=ChiOi
   ```
3. Mở `providers/fpt-sms.provider.ts` (hoặc `vnpt-sms.provider.ts`) và **hoàn thiện** 2 hàm `sendOtp()` và `sendSms()` — code ví dụ đã có sẵn trong block comment.
4. Restart backend. `SmsModule` sẽ tự pick provider từ env.

## Cách dùng trong service

```ts
import { SmsService } from '../integrations/sms/sms.service';

@Injectable()
export class SomeService {
  constructor(private sms: SmsService) {}

  async sendForgotPasswordOtp(phone: string) {
    const otp = this.sms.generateOtp(6);
    // TODO: lưu otp vào DB hoặc Redis với TTL 5 phút
    return this.sms.sendOtp(phone, otp);
  }
}
```

## Lưu ý bảo mật

- KHÔNG bao giờ trả OTP về client (kể cả debug). MockProvider có `mock_otp` để dev test, nhưng **production** phải xóa field này khỏi response API.
- Lưu OTP với TTL ≤ 5 phút và rate-limit số lần gửi (3 lần / 30 phút / SĐT) — đã cấu hình sẵn ở `common/throttler.config.ts` với throttler name `otp`.
