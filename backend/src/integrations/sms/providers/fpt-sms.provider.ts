import { Injectable, Logger } from '@nestjs/common';
import { SmsProvider, SendOtpResult } from '../sms.service.interface';

/**
 * STUB — chưa kết nối FPT SMS API thật.
 * Khi có credentials, hoàn thiện như sau:
 *
 *   const res = await fetch('https://api.fpt.ai/hmi/tts/v5', {
 *     method: 'POST',
 *     headers: {
 *       'api-key': process.env.SMS_FPT_API_KEY,
 *       'Content-Type': 'application/json',
 *     },
 *     body: JSON.stringify({
 *       phone,
 *       message: `Ma OTP cua ban la ${otp}. Het han sau 5 phut.`,
 *       brand_name: process.env.SMS_FPT_BRAND_NAME,
 *     }),
 *   });
 *
 * Doc: https://docs.fpt.ai/sms/
 */
@Injectable()
export class FptSmsProvider implements SmsProvider {
  private readonly logger = new Logger(FptSmsProvider.name);

  async sendOtp(phone: string, otp: string): Promise<SendOtpResult> {
    this.logger.error('[FPT SMS] Chưa implement. Cần điền API key vào .env (SMS_FPT_API_KEY)');
    throw new Error('FPT SMS provider chưa được cấu hình. Set SMS_PROVIDER=mock hoặc thêm credentials.');
  }

  async sendSms(phone: string, content: string): Promise<{ success: boolean; message: string }> {
    this.logger.error('[FPT SMS] Chưa implement.');
    throw new Error('FPT SMS provider chưa được cấu hình.');
  }
}
