import { Controller, Post, Body, UseGuards, Request, UnauthorizedException } from '@nestjs/common';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@ApiTags('Authentication')
@Controller('api/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @Throttle({ auth: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Đăng nhập vào hệ thống (Customer, Tasker, Admin) — rate limit 10 lần/phút/IP' })
  @ApiBody({ type: LoginDto })
  async login(@Body() body: LoginDto) {
    const user = await this.authService.validateUser(body.phone, body.password);
    if (!user) {
      throw new UnauthorizedException('Sai số điện thoại hoặc mật khẩu.');
    }
    return this.authService.login(user);
  }

  @Post('register')
  @Throttle({ register: { limit: 3, ttl: 60_000 } })
  @ApiOperation({ summary: 'Đăng ký tài khoản mới — rate limit 3 lần/phút/IP' })
  @ApiBody({ type: RegisterDto })
  async register(@Body() body: RegisterDto) {
    return this.authService.register(body);
  }

  @Post('forgot-password')
  @Throttle({ otp: { limit: 3, ttl: 30 * 60_000 } })
  @ApiOperation({ summary: 'Yêu cầu OTP quên mật khẩu (MOCK) — rate limit 3 lần/30 phút/IP' })
  @ApiBody({ type: ForgotPasswordDto })
  async requestPasswordReset(@Body() body: ForgotPasswordDto) {
    return this.authService.requestPasswordReset(body.phone);
  }

  @Post('reset-password')
  @Throttle({ otp: { limit: 5, ttl: 30 * 60_000 } })
  @ApiOperation({ summary: 'Đặt lại mật khẩu bằng OTP' })
  @ApiBody({ type: ResetPasswordDto })
  async resetPassword(@Body() body: ResetPasswordDto) {
    return this.authService.resetPassword(body);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @SkipThrottle()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Đổi mật khẩu (cần đăng nhập)' })
  @ApiBody({ type: ChangePasswordDto })
  async changePassword(@Request() req, @Body() body: ChangePasswordDto) {
    return this.authService.changePassword(req.user.userId, body.current_password, body.new_password);
  }
}

@ApiTags('OCR')
@Controller('api/ocr')
export class OcrController {
  @Post('cccd')
  @ApiOperation({ summary: 'OCR nhận diện CCCD từ ảnh base64' })
  @ApiBody({ schema: { example: { image: 'data:image/jpeg;base64,...' } } })
  async ocrCCCD(@Body() body: any) {
    // Extract base64 data
    const imageData = body.image || '';
    if (!imageData) {
      return { full_name: '', cccd_number: '', error: 'No image provided' };
    }

    // In production, call Google Vision / FPT.AI eKYC API here
    // For now, return empty to trigger manual input fallback
    // The frontend handles this gracefully
    return {
      full_name: '',
      cccd_number: '',
      message: 'OCR service chưa tích hợp. Vui lòng nhập thủ công.'
    };
  }
}
