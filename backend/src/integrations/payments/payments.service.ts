import { Injectable, Inject, Logger } from '@nestjs/common';
import { PAYMENT_PROVIDER_TOKEN } from './payments.service.interface';
import type {
  PaymentProvider,
  QrPayload,
  QrCodeResult,
  BankWebhookEvent,
} from './payments.service.interface';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(@Inject(PAYMENT_PROVIDER_TOKEN) private readonly provider: PaymentProvider) {}

  generateDepositQr(transactionCode: string, amount: number): Promise<QrCodeResult> {
    return this.provider.generateQr({
      transactionCode,
      amount,
      accountName: process.env.PAYMENT_BANK_ACCOUNT_NAME || 'CHI OI APP',
      accountNumber: process.env.PAYMENT_BANK_ACCOUNT || '0000000000',
      bankName: process.env.PAYMENT_BANK_NAME || 'VCB',
    });
  }

  verifyWebhook(headers: Record<string, string>, rawBody: string): boolean {
    return this.provider.verifyWebhookSignature(headers, rawBody);
  }

  parseWebhook(body: any): BankWebhookEvent | null {
    return this.provider.parseWebhook(body);
  }
}
