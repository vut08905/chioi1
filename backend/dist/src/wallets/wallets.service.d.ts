import { PrismaService } from '../prisma/prisma.service';
export declare class WalletsService {
    private prisma;
    constructor(prisma: PrismaService);
    getWallet(userId: number): Promise<{
        user_id: number;
        updated_at: Date | null;
        balance: import("@prisma/client-runtime-utils").Decimal | null;
        wallet_id: number;
    }>;
    getTransactions(userId: number): Promise<{
        status: string | null;
        created_at: Date | null;
        wallet_id: number;
        description: string | null;
        order_id: number | null;
        type: string;
        transaction_id: number;
        transaction_code: string;
        amount: import("@prisma/client-runtime-utils").Decimal;
    }[]>;
    deposit(userId: number, amount: number): Promise<{
        wallet: {
            user_id: number;
            updated_at: Date | null;
            balance: import("@prisma/client-runtime-utils").Decimal | null;
            wallet_id: number;
        };
        transaction: {
            status: string | null;
            created_at: Date | null;
            wallet_id: number;
            description: string | null;
            order_id: number | null;
            type: string;
            transaction_id: number;
            transaction_code: string;
            amount: import("@prisma/client-runtime-utils").Decimal;
        };
    }>;
    addTransaction(userId: number, amount: number, type: string, orderId?: number, description?: string): Promise<{
        wallet: {
            user_id: number;
            updated_at: Date | null;
            balance: import("@prisma/client-runtime-utils").Decimal | null;
            wallet_id: number;
        };
        transaction: {
            status: string | null;
            created_at: Date | null;
            wallet_id: number;
            description: string | null;
            order_id: number | null;
            type: string;
            transaction_id: number;
            transaction_code: string;
            amount: import("@prisma/client-runtime-utils").Decimal;
        };
    }>;
    withdraw(userId: number, amount: number): Promise<{
        wallet: {
            user_id: number;
            updated_at: Date | null;
            balance: import("@prisma/client-runtime-utils").Decimal | null;
            wallet_id: number;
        };
        transaction: {
            status: string | null;
            created_at: Date | null;
            wallet_id: number;
            description: string | null;
            order_id: number | null;
            type: string;
            transaction_id: number;
            transaction_code: string;
            amount: import("@prisma/client-runtime-utils").Decimal;
        };
    }>;
}
