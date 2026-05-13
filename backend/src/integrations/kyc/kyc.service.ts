import { Injectable, Inject } from '@nestjs/common';
import { KYC_PROVIDER_TOKEN } from './kyc.service.interface';
import type { KycProvider, KycVerifyInput, KycVerifyResult } from './kyc.service.interface';

@Injectable()
export class KycService {
  constructor(@Inject(KYC_PROVIDER_TOKEN) private readonly provider: KycProvider) {}

  verify(input: KycVerifyInput): Promise<KycVerifyResult> {
    return this.provider.verify(input);
  }
}
