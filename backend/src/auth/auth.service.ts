import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateUser(phone: string, pass: string): Promise<any> {
    const user = await this.prisma.users.findUnique({ where: { phone } });
    if (user && await bcrypt.compare(pass, user.password_hash)) {
      const { password_hash, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { phone: user.phone, sub: user.user_id, role: user.role };
    let address: string | null = null;
    if (user.role === 'CUSTOMER') {
      const customer = await this.prisma.customers.findUnique({ where: { customer_id: user.user_id } });
      if (customer) address = customer.default_address;
    }
    return {
      access_token: this.jwtService.sign(payload),
      user: { ...user, address },
    };
  }

  async register(data: any) {
    const existingUser = await this.prisma.users.findUnique({ where: { phone: data.phone } });
    if (existingUser) {
      throw new BadRequestException('Phone number already exists');
    }

    const saltOrRounds = 10;
    const password_hash = await bcrypt.hash(data.password, saltOrRounds);

    // Tasker mới phải chờ Admin phê duyệt
    const userStatus = data.role === 'TASKER' ? 'PENDING' : 'ACTIVE';

    const user = await this.prisma.users.create({
      data: {
        phone: data.phone,
        password_hash,
        full_name: data.full_name || 'Chưa cập nhật',
        role: data.role,
        status: userStatus,
      },
    });

    // Auto-create wallet cho user mới
    await this.prisma.wallets.create({
      data: { user_id: user.user_id, balance: 0 },
    });

    if (data.role === 'CUSTOMER') {
      await this.prisma.customers.create({
        data: { customer_id: user.user_id },
      });
    } else if (data.role === 'TASKER') {
      await this.prisma.taskers.create({
        data: { tasker_id: user.user_id, kyc_status: 'PENDING_APPROVAL' },
      });
    } else if (data.role === 'ADMIN') {
      await this.prisma.admins.create({
        data: { admin_id: user.user_id, access_level: 'SUPPORT' },
      });
    }

    // Auto login after register
    return this.login(user);
  }

  async requestPasswordReset(phone: string) {
    const user = await this.prisma.users.findUnique({ where: { phone } });
    if (!user) {
      throw new BadRequestException('User not found');
    }
    // Mock OTP logic
    return {
      message: 'OTP sent to phone number',
      mock_otp: '123456'
    };
  }

  async resetPassword(data: any) {
    const user = await this.prisma.users.findUnique({ where: { phone: data.phone } });
    if (!user) {
      throw new BadRequestException('User not found');
    }
    // In real app, check OTP here.
    if (data.otp !== '123456') {
      throw new BadRequestException('Invalid OTP');
    }

    const saltOrRounds = 10;
    const password_hash = await bcrypt.hash(data.new_password, saltOrRounds);

    await this.prisma.users.update({
      where: { phone: data.phone },
      data: { password_hash },
    });

    return { message: 'Password reset successfully' };
  }

  async changePassword(userId: number, currentPassword: string, newPassword: string) {
    if (!currentPassword || !newPassword) {
      throw new BadRequestException('Vui lòng nhập đầy đủ mật khẩu cũ và mới');
    }
    if (newPassword.length < 6) {
      throw new BadRequestException('Mật khẩu mới phải ít nhất 6 ký tự');
    }

    const user = await this.prisma.users.findUnique({ where: { user_id: userId } });
    if (!user) {
      throw new BadRequestException('Người dùng không tồn tại');
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) {
      throw new BadRequestException('Mật khẩu hiện tại không đúng');
    }

    const saltOrRounds = 10;
    const password_hash = await bcrypt.hash(newPassword, saltOrRounds);

    await this.prisma.users.update({
      where: { user_id: userId },
      data: { password_hash, updated_at: new Date() },
    });

    return { message: 'Đổi mật khẩu thành công' };
  }
}
