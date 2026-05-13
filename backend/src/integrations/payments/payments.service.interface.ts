export interface QrPayload {
  /** Transaction code (chính là transaction_code trong DB) */
  transactionCode: string;
  /** Số tiền VND */
  amount: number;
  /** Người nhận (tên TK ngân hàng) */
  accountName: string;
  /** Số tài khoản */
  accountNumber: string;
  /** Tên ngân hàng (vd: Vietcombank, Techcombank) */
  bankName: string;
}

export interface QrCodeResult {
  /** Data URI của QR (data:image/png;base64,...) hoặc URL ảnh */
  qrImage: string;
  /** Nội dung chuyển khoản (memo) — dùng để webhook đối chiếu */
  transferContent: string;
  /** Provider trả về */
  provider: string;
}

/** Webhook payload sau khi user chuyển khoản thành công */
export interface BankWebhookEvent {
  /** Transaction code lấy từ memo */
  transactionCode: string;
  /** Số tiền nhận thực tế (VND) */
  amount: number;
  /** Thời gian giao dịch */
  timestamp: Date;
  /** ID giao dịch ở phía ngân hàng */
  bankTxId: string;
  /** Provider gọi webhook */
  provider: string;
}

export interface PaymentProvider {
  /** Sinh QR thanh toán (VietQR) */
  generateQr(payload: QrPayload): Promise<QrCodeResult>;
  /** Verify chữ ký webhook từ provider — chống fake */
  verifyWebhookSignature(headers: Record<string, string>, body: string): boolean;
  /** Parse webhook payload (raw body từ provider) → event chuẩn hóa */
  parseWebhook(body: any): BankWebhookEvent | null;
}

export const PAYMENT_PROVIDER_TOKEN = 'PAYMENT_PROVIDER_TOKEN';
