export interface KycVerifyInput {
  /** ID người dùng (tasker) */
  userId: number;
  /** URL ảnh CMND/CCCD mặt trước */
  idFrontUrl: string;
  /** URL ảnh CMND/CCCD mặt sau */
  idBackUrl: string;
  /** URL ảnh selfie chân dung */
  selfieUrl: string;
  /** Số CMND/CCCD do user khai báo (sẽ so với OCR) */
  declaredIdNumber?: string;
}

export interface KycVerifyResult {
  success: boolean;
  /** APPROVED | REJECTED | PENDING_REVIEW */
  status: 'APPROVED' | 'REJECTED' | 'PENDING_REVIEW';
  /** Số CMND/CCCD đọc được từ OCR */
  idNumber?: string;
  /** Họ tên đọc được từ OCR */
  fullName?: string;
  /** Ngày sinh đọc được */
  dob?: string;
  /** Score nhận diện (0-1) */
  faceMatchScore?: number;
  /** Lý do reject (nếu có) */
  reason?: string;
  /** Provider trả về */
  provider: string;
}

export interface KycProvider {
  verify(input: KycVerifyInput): Promise<KycVerifyResult>;
}

export const KYC_PROVIDER_TOKEN = 'KYC_PROVIDER_TOKEN';
