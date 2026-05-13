import { Injectable, Logger } from '@nestjs/common';
import { SmsProvider, SendOtpResult } from '../sms.service.interface';

/**
 * STUB — chưa kết nối VNPT SMS API thật.
 * Khi có credentials, tham khảo: https://vnptsms.com.vn/
 */
@Injectable()
export class VnptSmsProvider implements SmsProvider {
  private readonly logger = new Logger(VnptSmsProvider.name);

  async sendOtp(phone: string, otp: string): Promise<SendOtpResult> {
    this.logger.error('[VNPT SMS] Chưa implement.');
    throw new Error('VNPT SMS provider chưa được cấu hình. Set SMS_PROVIDER=mock hoặc thêm credentials.');
  }

  async sendSms(phone: string, content: string): Promise<{ success: boolean; message: string }> {
    this.logger.error('[VNPT SMS] Chưa implement.');
    throw new Error('VNPT SMS provider chưa được cấu hình.');
  }
}
