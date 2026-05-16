import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WalletsService {
  constructor(private prisma: PrismaService) {}

  async getWallet(userId: number) {
    let wallet = await this.prisma.wallets.findUnique({
      where: { user_id: userId },
    });

    if (!wallet) {
      wallet = await this.prisma.wallets.create({
        data: { user_id: userId, balance: 0 },
      });
    }

    return wallet;
  }

  async getTransactions(userId: number) {
    const wallet = await this.getWallet(userId);
    return this.prisma.transactions.findMany({
      where: { wallet_id: wallet.wallet_id },
      orderBy: { created_at: 'desc' },
    });
  }

  async deposit(userId: number, amount: number) {
    if (amount <= 0) {
      throw new BadRequestException('Amount must be positive');
    }

    const wallet = await this.getWallet(userId);

    // Create transaction + notification + update balance in a Prisma transaction
    const result = await this.prisma.$transaction(async (prisma) => {
      const updatedWallet = await prisma.wallets.update({
        where: { wallet_id: wallet.wallet_id },
        data: { balance: { increment: amount } },
      });

      const transaction = await prisma.transactions.create({
        data: {
          wallet_id: wallet.wallet_id,
          transaction_code: `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`,
          amount: amount,
          type: 'TOP_UP',
          status: 'COMPLETED',
          description: 'Nạp tiền vào ví',
        },
      });

      // Bug 5.5 FIX: Tạo notification cho user
      await prisma.notifications.create({
        data: {
          user_id: userId,
          title: 'Nạp tiền thành công',
          content: `Bạn đã nạp +${amount.toLocaleString('vi-VN')} đ vào ví. Số dư mới: ${Number(updatedWallet.balance).toLocaleString('vi-VN')} đ.`,
        },
      });

      return { wallet: updatedWallet, transaction };
    });

    return result;
  }

  async addTransaction(userId: number, amount: number, type: string, orderId?: number, description?: string) {
    const wallet = await this.getWallet(userId);

    // Bug #28 FIX: Chặn số dư âm — nếu amount < 0, kiểm tra balance đủ không
    if (amount < 0) {
      const currentBalance = Number(wallet.balance);
      const deductAmount = Math.abs(amount);
      if (currentBalance < deductAmount) {
        throw new BadRequestException(
          `Số dư ví không đủ. Hiện có: ${currentBalance.toLocaleString('vi-VN')}đ, cần: ${deductAmount.toLocaleString('vi-VN')}đ`
        );
      }
    }

    const result = await this.prisma.$transaction(async (prisma) => {
      const updatedWallet = await prisma.wallets.update({
        where: { wallet_id: wallet.wallet_id },
        data: { balance: { increment: amount } }, // amount can be negative for withdrawal or fee
      });

      // Bug #28 FIX: Double-check sau khi update — phòng trường hợp race condition
      if (Number(updatedWallet.balance) < 0) {
        throw new BadRequestException('Giao dịch bị từ chối: số dư ví sẽ bị âm');
      }

      const transaction = await prisma.transactions.create({
        data: {
          wallet_id: wallet.wallet_id,
          transaction_code: `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`,
          amount: amount,
          type: type, // EARNING, FEE, WITHDRAW, PAYMENT
          status: 'COMPLETED',
          order_id: orderId,
          description: description,
        },
      });

      // Bug 5.5 FIX: Tạo notification cho user theo loại giao dịch
      const titleMap: Record<string, string> = {
        EARNING: 'Đã nhận thu nhập',
        FEE: 'Phí nền tảng',
        WITHDRAW: 'Rút tiền',
        PAYMENT: 'Thanh toán dịch vụ',
        REFUND: 'Hoàn tiền',
      };
      const sign = amount >= 0 ? '+' : '';
      await prisma.notifications.create({
        data: {
          user_id: userId,
          title: titleMap[type] || 'Giao dịch ví',
          content: `${description || 'Giao dịch'}: ${sign}${amount.toLocaleString('vi-VN')} đ. Số dư: ${Number(updatedWallet.balance).toLocaleString('vi-VN')} đ.`,
        },
      });

      return { wallet: updatedWallet, transaction };
    });

    return result;
  }

  async withdraw(userId: number, amount: number, bankName?: string, accountNumber?: string, accountHolder?: string) {
    if (amount <= 0) {
      throw new BadRequestException('Amount must be positive');
    }

    if (amount < 100000) {
      throw new BadRequestException('Số tiền tối thiểu 100.000đ');
    }

    const wallet = await this.getWallet(userId);

    // TypeScript compilation fix: Ensure balance is treated as a number
    if (Number(wallet.balance) < amount) {
      throw new BadRequestException('Số dư không đủ. Hiện có: ' + Number(wallet.balance).toLocaleString('vi-VN') + 'đ');
    }

    const bankInfo = bankName ? `${bankName} - ${accountNumber} - ${accountHolder}` : '';
    const description = bankInfo ? `Yêu cầu rút tiền → ${bankInfo}` : 'Yêu cầu rút tiền';

    const result = await this.prisma.$transaction(async (prisma) => {
      const updatedWallet = await prisma.wallets.update({
        where: { wallet_id: wallet.wallet_id },
        data: { balance: { decrement: amount } },
      });

      const transaction = await prisma.transactions.create({
        data: {
          wallet_id: wallet.wallet_id,
          transaction_code: `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`,
          amount: amount, // amount to withdraw
          type: 'WITHDRAW',
          status: 'PENDING',
          description: description,
        },
      });

      // Bug 5.5 FIX: Tạo notification cho user
      await prisma.notifications.create({
        data: {
          user_id: userId,
          title: 'Yêu cầu rút tiền đã gửi',
          content: `Yêu cầu rút ${amount.toLocaleString('vi-VN')} đ đang chờ Admin duyệt. Số dư hiện tại: ${Number(updatedWallet.balance).toLocaleString('vi-VN')} đ.`,
        },
      });

      return { wallet: updatedWallet, transaction };
    });

    return result;
  }
}
