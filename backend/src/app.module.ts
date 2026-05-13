import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ApiModule } from './api/api.module';
import { OrdersModule } from './orders/orders.module';
import { WalletsModule } from './wallets/wallets.module';
import { SmsModule } from './integrations/sms/sms.module';
import { KycModule } from './integrations/kyc/kyc.module';
import { PaymentsModule } from './integrations/payments/payments.module';
import { throttlerConfig } from './common/throttler.config';

@Module({
  imports: [
    ThrottlerModule.forRoot(throttlerConfig),
    PrismaModule,
    AuthModule,
    ApiModule,
    OrdersModule,
    WalletsModule,
    SmsModule,
    KycModule,
    PaymentsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
