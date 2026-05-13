import { Injectable, Logger } from '@nestjs/common';
import {
  PaymentProvider,
  QrPayload,
  QrCodeResult,
  BankWebhookEvent,
} from '../payments.service.interface';

/**
 * MockProvider — sinh URL VietQR public (không cần credentials),
 * webhook KHÔNG verify (chỉ dev). KHÔNG dùng production.
 */
@Injectable()
export class MockPaymentProvider implements PaymentProvider {
  private readonly logger = new Logger(MockPaymentProvider.name);

  async generateQr(payload: QrPayload): Promise<QrCodeResult> {
    const transferContent = payload.transactionCode;
    const accountNumber = payload.accountNumber || '0000000000';
    const bankName = payload.bankName || 'VCB';

    const qrUrl = `https://img.vietqr.io/image/${encodeURIComponent(bankName)}-${encodeURIComponent(accountNumber)}-compact.png?amount=${payload.amount}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(payload.accountName)}`;

    this.logger.warn(`[MOCK PAYMENT] QR sinh ra (chưa kết nối ngân hàng thật): ${qrUrl}`);

    return {
      qrImage: qrUrl,
      transferContent,
      provider: 'mock',
    };
  }

  verifyWebhookSignature(): boolean {
    this.logger.warn('[MOCK PAYMENT] Webhook signature verify SKIPPED (mock mode)');
    return true;
  }

  parseWebhook(body: any): BankWebhookEvent | null {
    if (!body?.transactionCode || !body?.amount) return null;
    return {
      transactionCode: String(body.transactionCode),
      amount: Number(body.amount),
      timestamp: new Date(body.timestamp || Date.now()),
      bankTxId: body.bankTxId || `MOCK-${Date.now()}`,
      provider: 'mock',
    };
  }
}
