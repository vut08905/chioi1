import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ApiModule } from './api/api.module';
import { OrdersModule } from './orders/orders.module';
import { WalletsModule } from './wallets/wallets.module';

@Module({
  imports: [PrismaModule, AuthModule, ApiModule, OrdersModule, WalletsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
