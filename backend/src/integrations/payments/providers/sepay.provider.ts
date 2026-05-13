import { Injectable, Logger } from '@nestjs/common';
import {
  PaymentProvider,
  QrPayload,
  QrCodeResult,
  BankWebhookEvent,
} from '../payments.service.interface';

/**
 * STUB — Sepay (https://sepay.vn/) cổng đối soát ngân hàng miễn phí cho startup VN.
 *
 * Doc: https://docs.sepay.vn/
 */
@Injectable()
export class SepayProvider implements PaymentProvider {
  private readonly logger = new Logger(SepayProvider.name);

  async generateQr(payload: QrPayload): Promise<QrCodeResult> {
    this.logger.error('[Sepay] generateQr chưa implement');
    throw new Error('Sepay provider chưa cấu hình. Set PAYMENT_PROVIDER=mock hoặc thêm credentials.');
  }

  verifyWebhookSignature(headers: Record<string, string>): boolean {
    const expected = process.env.PAYMENT_SEPAY_WEBHOOK_SECRET;
    if (!expected) return false;
    const auth = headers['authorization'] || headers['Authorization'];
    return auth === `Apikey ${expected}`;
  }

  parseWebhook(body: any): BankWebhookEvent | null {
    if (!body?.transferAmount || !body?.content) return null;
    const memoMatch = String(body.content).match(/[A-Z0-9]{8,}/);
    if (!memoMatch) return null;
    return {
      transactionCode: memoMatch[0],
      amount: Number(body.transferAmount),
      timestamp: new Date(body.transactionDate || Date.now()),
      bankTxId: body.id ? String(body.id) : `SP-${Date.now()}`,
      provider: 'sepay',
    };
  }
}
