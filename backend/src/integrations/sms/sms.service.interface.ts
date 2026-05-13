export interface SendOtpResult {
  /** True nếu gửi thành công */
  success: boolean;
  /** Mã OTP sinh ra (chỉ trả khi provider = mock; KHÔNG bao giờ trả ở production) */
  mock_otp?: string;
  /** Message log */
  message: string;
  /** Provider đã gửi (mock | fpt | vnpt | esms | speedsms) */
  provider: string;
}

export interface SmsProvider {
  /** Gửi OTP cho số điện thoại */
  sendOtp(phone: string, otp: string): Promise<SendOtpResult>;
  /** Gửi SMS thường (thông báo) */
  sendSms(phone: string, content: string): Promise<{ success: boolean; message: string }>;
}

/** Token DI cho NestJS */
export const SMS_PROVIDER_TOKEN = 'SMS_PROVIDER_TOKEN';
