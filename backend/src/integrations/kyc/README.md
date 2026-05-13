# KYC Integration

Module `KycModule` cung cấp gateway eKYC (xác minh danh tính Tasker). Hiện đang dùng **MockProvider** — luôn trả `PENDING_REVIEW` để admin duyệt thủ công.

## Cách swap sang provider thật

1. Đăng ký account [FPT.AI eKYC](https://docs.fpt.ai/ekyc/).
2. Điền vào `.env`:
   ```
   KYC_PROVIDER=fpt_ai
   KYC_FPT_API_KEY=xxxxxx
   KYC_FPT_API_SECRET=yyyyyy
   ```
3. Hoàn thiện `providers/fpt-ai.provider.ts` theo block comment hướng dẫn.

## Flow nghiệp vụ Tasker KYC

```
1. Tasker upload 3 ảnh: idFront, idBack, selfie → backend lưu URL
2. Backend gọi KycService.verify() → provider trả status
3. Nếu status = APPROVED → tự động set tasker.kyc_status = 'VERIFIED'
4. Nếu PENDING_REVIEW → đẩy vào queue admin duyệt
5. Nếu REJECTED → notify Tasker, lý do trong result.reason
```

## Lưu ý bảo mật

- Ảnh CMND/CCCD là dữ liệu cực nhạy → upload qua S3/CDN có signed URL, không lưu trực tiếp local.
- Audit lại mọi lần verify trong `admin_audit_logs`.
- TTL ảnh KYC ≤ 90 ngày (theo Nghị định 13/2023 về dữ liệu cá nhân).
