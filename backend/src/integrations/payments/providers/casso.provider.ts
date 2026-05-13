import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import {
  PaymentProvider,
  QrPayload,
  QrCodeResult,
  BankWebhookEvent,
} from '../payments.service.interface';

/**
 * STUB — Casso (https://casso.vn/) là cổng đối soát ngân hàng VN.
 *
 * Khi có credentials, hoàn thiện:
 *   - generateQr(): dùng VietQR API hoặc tạo QR theo chuẩn NAPAS 24
 *   - verifyWebhookSignature(): Casso ký request bằng `secure_token` header
 *   - parseWebhook(): parse mảng `data[]` mà Casso gửi
 *
 * Doc: https://docs.casso.vn/
 */
@Injectable()
export class CassoProvider implements PaymentProvider {
  private readonly logger = new Logger(CassoProvider.name);

  async generateQr(payload: QrPayload): Promise<QrCodeResult> {
    this.logger.error('[Casso] generateQr chưa implement');
    throw new Error('Casso provider chưa cấu hình. Set PAYMENT_PROVIDER=mock hoặc thêm credentials.');
  }

  verifyWebhookSignature(headers: Record<string, string>, body: string): boolean {
    const expected = process.env.PAYMENT_CASSO_WEBHOOK_SECRET;
    if (!expected) {
      this.logger.error('PAYMENT_CASSO_WEBHOOK_SECRET chưa set');
      return false;
    }
    const sig = headers['secure-token'] || headers['Secure-Token'];
    if (!sig) return false;
    return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  }

  parseWebhook(body: any): BankWebhookEvent | null {
    if (!body?.data?.[0]) return null;
    const tx = body.data[0];
    const memoMatch = String(tx.description || '').match(/[A-Z0-9]{8,}/);
    if (!memoMatch) return null;
    return {
      transactionCode: memoMatch[0],
      amount: Number(tx.amount),
      timestamp: new Date(tx.when || Date.now()),
      bankTxId: tx.tid || tx.id,
      provider: 'casso',
    };
  }
}
