import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomInt } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateUser(phone: string, pass: string): Promise<any> {
    const user = await this.prisma.users.findUnique({ where: { phone } });
    // Bug #25 FIX: Phân biệt "SĐT không tồn tại" vs "Sai mật khẩu"
    if (!user) {
      return 'NOT_FOUND'; // SĐT chưa đăng ký
    }
    if (await bcrypt.compare(pass, user.password_hash)) {
      const { password_hash, ...result } = user;
      return result;
    }
    return null; // Sai mật khẩu
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
      throw new BadRequestException('Số điện thoại chưa được đăng ký');
    }

    // Rate limit: không quá 3 OTP / 30 phút cho cùng phone
    const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000);
    const recentOtps = await this.prisma.otp_codes.count({
      where: {
        phone,
        purpose: 'RESET_PASSWORD',
        created_at: { gte: thirtyMinAgo },
      },
    });
    if (recentOtps >= 3) {
      throw new BadRequestException('Bạn đã yêu cầu quá 3 lần trong 30 phút. Vui lòng thử lại sau.');
    }

    // Vô hiệu tất cả OTP cũ chưa dùng cho phone này
    await this.prisma.otp_codes.updateMany({
      where: { phone, purpose: 'RESET_PASSWORD', used_at: null },
      data: { used_at: new Date() },
    });

    // Tạo OTP 6 số ngẫu nhiên
    const otpCode = String(randomInt(100000, 999999));
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 phút

    // Lưu vào bảng otp_codes
    await this.prisma.otp_codes.create({
      data: {
        user_id: user.user_id,
        phone,
        otp_code: otpCode,
        purpose: 'RESET_PASSWORD',
        expires_at: expiresAt,
      },
    });

    // ===== PHASE 1: Log OTP ra console (KHÔNG gửi SMS) =====
    console.log('========================================');
    console.log(`[OTP] SĐT: ${phone}`);
    console.log(`[OTP] Mã OTP: ${otpCode}`);
    console.log(`[OTP] Hết hạn: ${expiresAt.toLocaleString('vi-VN')}`);
    console.log('========================================');
    // ===== Khi go-live: thay bằng SMS API thật =====

    // Mask số điện thoại để hiển thị
    const maskedPhone = phone.substring(0, 3) + '****' + phone.substring(phone.length - 3);

    return {
      message: `Mã OTP đã gửi đến số ${maskedPhone}`,
      masked_phone: maskedPhone,
      // ⚠️ CHỈ DÙNG CHO PHASE TEST — XÓA KHI GO-LIVE
      dev_otp: otpCode,
    };
  }

  async resetPassword(data: any) {
    const user = await this.prisma.users.findUnique({ where: { phone: data.phone } });
    if (!user) {
      throw new BadRequestException('Số điện thoại không tồn tại');
    }

    // Tìm OTP record mới nhất chưa dùng
    const otpRecord = await this.prisma.otp_codes.findFirst({
      where: {
        phone: data.phone,
        purpose: 'RESET_PASSWORD',
        used_at: null,
      },
      orderBy: { created_at: 'desc' },
    });

    if (!otpRecord) {
      throw new BadRequestException('Chưa có mã OTP nào. Vui lòng yêu cầu gửi OTP trước.');
    }

    // Kiểm tra OTP đã hết hạn
    if (new Date() > otpRecord.expires_at) {
      throw new BadRequestException('Mã OTP đã hết hạn. Vui lòng yêu cầu gửi lại.');
    }

    // Kiểm tra số lần thử
    if (otpRecord.attempts >= otpRecord.max_attempts) {
      // Vô hiệu OTP
      await this.prisma.otp_codes.update({
        where: { id: otpRecord.id },
        data: { used_at: new Date() },
      });
      throw new BadRequestException('Bạn đã nhập sai OTP quá 5 lần. Vui lòng yêu cầu mã mới.');
    }

    // Kiểm tra OTP đúng
    if (data.otp !== otpRecord.otp_code) {
      // Tăng attempts
      await this.prisma.otp_codes.update({
        where: { id: otpRecord.id },
        data: { attempts: otpRecord.attempts + 1 },
      });
      const remaining = otpRecord.max_attempts - otpRecord.attempts - 1;
      throw new BadRequestException(`Mã OTP không chính xác. Còn ${remaining} lần thử.`);
    }

    // OTP đúng → đổi mật khẩu
    const saltOrRounds = 10;
    const password_hash = await bcrypt.hash(data.new_password, saltOrRounds);

    await this.prisma.users.update({
      where: { phone: data.phone },
      data: { password_hash, updated_at: new Date() },
    });

    // Đánh dấu OTP đã dùng
    await this.prisma.otp_codes.update({
      where: { id: otpRecord.id },
      data: { used_at: new Date() },
    });

    // Vô hiệu tất cả OTP cũ cho phone này
    await this.prisma.otp_codes.updateMany({
      where: { phone: data.phone, purpose: 'RESET_PASSWORD', used_at: null },
      data: { used_at: new Date() },
    });

    console.log(`[OTP] Đổi mật khẩu thành công cho SĐT: ${data.phone}`);

    return { message: 'Đổi mật khẩu thành công' };
  }

  async resendOtp(phone: string) {
    // Kiểm tra phải chờ ít nhất 30s kể từ OTP cuối
    const lastOtp = await this.prisma.otp_codes.findFirst({
      where: { phone, purpose: 'RESET_PASSWORD' },
      orderBy: { created_at: 'desc' },
    });

    if (lastOtp) {
      const secondsSinceLast = (Date.now() - lastOtp.created_at.getTime()) / 1000;
      if (secondsSinceLast < 30) {
        const waitSec = Math.ceil(30 - secondsSinceLast);
        throw new BadRequestException(`Vui lòng chờ ${waitSec} giây trước khi gửi lại.`);
      }
    }

    // Gọi lại requestPasswordReset (đã có rate limit bên trong)
    return this.requestPasswordReset(phone);
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
