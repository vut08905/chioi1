import { Module, Logger } from '@nestjs/common';
import { KycService } from './kyc.service';
import { KYC_PROVIDER_TOKEN } from './kyc.service.interface';
import { MockKycProvider } from './providers/mock-kyc.provider';
import { FptAiKycProvider } from './providers/fpt-ai.provider';

const logger = new Logger('KycModule');

@Module({
  providers: [
    KycService,
    MockKycProvider,
    FptAiKycProvider,
    {
      provide: KYC_PROVIDER_TOKEN,
      inject: [MockKycProvider, FptAiKycProvider],
      useFactory: (mock: MockKycProvider, fpt: FptAiKycProvider) => {
        const choice = (process.env.KYC_PROVIDER || 'mock').toLowerCase();
        switch (choice) {
          case 'fpt_ai':
            logger.log('Sử dụng FPT.AI eKYC provider');
            return fpt;
          default:
            logger.warn('KYC_PROVIDER=mock — Tasker sẽ luôn ở trạng thái PENDING_REVIEW');
            return mock;
        }
      },
    },
  ],
  exports: [KycService],
})
export class KycModule {}
