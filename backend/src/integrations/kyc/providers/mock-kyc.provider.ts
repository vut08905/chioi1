import { Injectable, Logger } from '@nestjs/common';
import { KycProvider, KycVerifyInput, KycVerifyResult } from '../kyc.service.interface';

@Injectable()
export class MockKycProvider implements KycProvider {
  private readonly logger = new Logger(MockKycProvider.name);

  async verify(input: KycVerifyInput): Promise<KycVerifyResult> {
    this.logger.warn(`[MOCK KYC] verify userId=${input.userId} — auto PENDING_REVIEW (admin duyệt thủ công)`);
    return {
      success: true,
      status: 'PENDING_REVIEW',
      idNumber: input.declaredIdNumber,
      faceMatchScore: 0.85,
      provider: 'mock',
    };
  }
}
