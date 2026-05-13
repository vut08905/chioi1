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

    const result = await this.prisma.$transaction(async (prisma) => {
      const updatedWallet = await prisma.wallets.update({
        where: { wallet_id: wallet.wallet_id },
        data: { balance: { increment: amount } }, // amount can be negative for withdrawal or fee
      });

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

  async withdraw(userId: number, amount: number) {
    if (amount <= 0) {
      throw new BadRequestException('Amount must be positive');
    }

    const wallet = await this.getWallet(userId);

    // TypeScript compilation fix: Ensure balance is treated as a number
    if (Number(wallet.balance) < amount) {
      throw new BadRequestException('Insufficient balance');
    }

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
          description: 'Yêu cầu rút tiền',
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
