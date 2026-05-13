"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let WalletsService = class WalletsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getWallet(userId) {
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
    async getTransactions(userId) {
        const wallet = await this.getWallet(userId);
        return this.prisma.transactions.findMany({
            where: { wallet_id: wallet.wallet_id },
            orderBy: { created_at: 'desc' },
        });
    }
    async deposit(userId, amount) {
        if (amount <= 0) {
            throw new common_1.BadRequestException('Amount must be positive');
        }
        const wallet = await this.getWallet(userId);
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
    async addTransaction(userId, amount, type, orderId, description) {
        const wallet = await this.getWallet(userId);
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
                    type: type,
                    status: 'COMPLETED',
                    order_id: orderId,
                    description: description,
                },
            });
            return { wallet: updatedWallet, transaction };
        });
        return result;
    }
    async withdraw(userId, amount) {
        if (amount <= 0) {
            throw new common_1.BadRequestException('Amount must be positive');
        }
        const wallet = await this.getWallet(userId);
        if (Number(wallet.balance) < amount) {
            throw new common_1.BadRequestException('Insufficient balance');
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
                    amount: amount,
                    type: 'WITHDRAW',
                    status: 'PENDING',
                    description: 'Yêu cầu rút tiền',
                },
            });
            return { wallet: updatedWallet, transaction };
        });
        return result;
    }
};
exports.WalletsService = WalletsService;
exports.WalletsService = WalletsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], WalletsService);
//# sourceMappingURL=wallets.service.js.map