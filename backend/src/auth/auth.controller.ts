import { Controller, Post, Body, UseGuards, Request, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBody, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Authentication')
@Controller('api/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Đăng nhập vào hệ thống (Customer, Tasker, Admin)' })
  @ApiBody({ schema: { example: { phone: '0901234567', password: 'password123' } } })
  async login(@Body() body: any) {
    const user = await this.authService.validateUser(body.phone, body.password);
    if (!user) {
      throw new UnauthorizedException('Invalid phone or password');
    }
    return this.authService.login(user);
  }

  @Post('register')
  @ApiOperation({ summary: 'Đăng ký tài khoản mới' })
  @ApiBody({ schema: { example: { phone: '0901234567', password: 'password123', full_name: 'Nguyen Van A', role: 'CUSTOMER' } } })
  async register(@Body() body: any) {
    return this.authService.register(body);
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Yêu cầu OTP quên mật khẩu (MOCK)' })
  @ApiBody({ schema: { example: { phone: '0901234567' } } })
  async requestPasswordReset(@Body() body: any) {
    return this.authService.requestPasswordReset(body.phone);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Đặt lại mật khẩu bằng OTP' })
  @ApiBody({ schema: { example: { phone: '0901234567', otp: '123456', new_password: 'newpassword123' } } })
  async resetPassword(@Body() body: any) {
    return this.authService.resetPassword(body);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Đổi mật khẩu (cần đăng nhập)' })
  @ApiBody({ schema: { example: { current_password: 'old123', new_password: 'new123' } } })
  async changePassword(@Request() req, @Body() body: any) {
    return this.authService.changePassword(req.user.userId, body.current_password, body.new_password);
  }
}
