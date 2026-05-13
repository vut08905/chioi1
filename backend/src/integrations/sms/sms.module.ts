import { Module, Logger } from '@nestjs/common';
import { SmsService } from './sms.service';
import { SMS_PROVIDER_TOKEN } from './sms.service.interface';
import { MockSmsProvider } from './providers/mock-sms.provider';
import { FptSmsProvider } from './providers/fpt-sms.provider';
import { VnptSmsProvider } from './providers/vnpt-sms.provider';

const logger = new Logger('SmsModule');

@Module({
  providers: [
    SmsService,
    MockSmsProvider,
    FptSmsProvider,
    VnptSmsProvider,
    {
      provide: SMS_PROVIDER_TOKEN,
      inject: [MockSmsProvider, FptSmsProvider, VnptSmsProvider],
      useFactory: (mock: MockSmsProvider, fpt: FptSmsProvider, vnpt: VnptSmsProvider) => {
        const choice = (process.env.SMS_PROVIDER || 'mock').toLowerCase();
        switch (choice) {
          case 'fpt':
            logger.log('Sử dụng FPT SMS provider');
            return fpt;
          case 'vnpt':
            logger.log('Sử dụng VNPT SMS provider');
            return vnpt;
          default:
            logger.warn('SMS_PROVIDER=mock — OTP sẽ chỉ log ra console');
            return mock;
        }
      },
    },
  ],
  exports: [SmsService],
})
export class SmsModule {}
