import { Module, Logger } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { PAYMENT_PROVIDER_TOKEN } from './payments.service.interface';
import { MockPaymentProvider } from './providers/mock-payment.provider';
import { CassoProvider } from './providers/casso.provider';
import { SepayProvider } from './providers/sepay.provider';

const logger = new Logger('PaymentsModule');

@Module({
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    MockPaymentProvider,
    CassoProvider,
    SepayProvider,
    {
      provide: PAYMENT_PROVIDER_TOKEN,
      inject: [MockPaymentProvider, CassoProvider, SepayProvider],
      useFactory: (mock: MockPaymentProvider, casso: CassoProvider, sepay: SepayProvider) => {
        const choice = (process.env.PAYMENT_PROVIDER || 'mock').toLowerCase();
        switch (choice) {
          case 'casso':
            logger.log('Sử dụng Casso payment provider');
            return casso;
          case 'sepay':
            logger.log('Sử dụng Sepay payment provider');
            return sepay;
          default:
            logger.warn('PAYMENT_PROVIDER=mock — QR sinh từ VietQR public, webhook KHÔNG verify');
            return mock;
        }
      },
    },
  ],
  exports: [PaymentsService],
})
export class PaymentsModule {}
