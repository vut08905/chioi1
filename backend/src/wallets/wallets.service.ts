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
    
    // Create transaction and update balance in a Prisma transaction
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

      return { wallet: updatedWallet, transaction };
    });

    return result;
  }
}
