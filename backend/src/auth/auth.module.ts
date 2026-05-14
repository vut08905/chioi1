import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController, OcrController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'super-secret', // Should be in .env in production
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [AuthController, OcrController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
