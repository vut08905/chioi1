import { Injectable, Inject, Logger } from '@nestjs/common';
import { SMS_PROVIDER_TOKEN } from './sms.service.interface';
import type { SmsProvider, SendOtpResult } from './sms.service.interface';

/**
 * Wrapper service. Inject vào module nào cần gửi SMS:
 *   constructor(private sms: SmsService) {}
 *   await this.sms.sendOtp('0901234567', '123456');
 *
 * Provider thật được chọn qua biến env SMS_PROVIDER (xem .env.example).
 */
@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor(@Inject(SMS_PROVIDER_TOKEN) private readonly provider: SmsProvider) {}

  generateOtp(length = 6): string {
    let otp = '';
    for (let i = 0; i < length; i++) otp += Math.floor(Math.random() * 10);
    return otp;
  }

  sendOtp(phone: string, otp: string): Promise<SendOtpResult> {
    return this.provider.sendOtp(phone, otp);
  }

  sendSms(phone: string, content: string) {
    return this.provider.sendSms(phone, content);
  }
}
