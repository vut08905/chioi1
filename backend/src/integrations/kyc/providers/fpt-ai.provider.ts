import { Injectable, Logger } from '@nestjs/common';
import { KycProvider, KycVerifyInput, KycVerifyResult } from '../kyc.service.interface';

/**
 * STUB — chưa kết nối FPT.AI eKYC API.
 * Khi có credentials, hoàn thiện các bước:
 *
 *   1. OCR CMND/CCCD: POST https://api.fpt.ai/vision/idr/vnm với image
 *   2. Face match: POST https://api.fpt.ai/dmp/checkface/v1 với 2 ảnh
 *   3. Liveness: POST https://api.fpt.ai/dmp/liveness/v1 với selfie
 *
 * Doc: https://docs.fpt.ai/ekyc/
 */
@Injectable()
export class FptAiKycProvider implements KycProvider {
  private readonly logger = new Logger(FptAiKycProvider.name);

  async verify(input: KycVerifyInput): Promise<KycVerifyResult> {
    this.logger.error('[FPT.AI eKYC] Chưa implement.');
    throw new Error('FPT.AI eKYC chưa cấu hình. Set KYC_PROVIDER=mock hoặc thêm credentials.');
  }
}
