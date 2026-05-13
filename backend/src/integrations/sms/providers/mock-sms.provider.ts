import { Injectable, Logger } from '@nestjs/common';
import { SmsProvider, SendOtpResult } from '../sms.service.interface';

@Injectable()
export class MockSmsProvider implements SmsProvider {
  private readonly logger = new Logger(MockSmsProvider.name);

  async sendOtp(phone: string, otp: string): Promise<SendOtpResult> {
    this.logger.warn(`[MOCK SMS] OTP cho ${phone}: ${otp}`);
    return {
      success: true,
      mock_otp: otp,
      message: 'OTP đã được gửi (MOCK — kiểm tra console log)',
      provider: 'mock',
    };
  }

  async sendSms(phone: string, content: string): Promise<{ success: boolean; message: string }> {
    this.logger.warn(`[MOCK SMS] gửi đến ${phone}: ${content}`);
    return { success: true, message: 'SMS đã gửi (MOCK)' };
  }
}
