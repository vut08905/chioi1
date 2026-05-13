import { WalletsService } from './wallets.service';
export declare class WalletsController {
    private readonly walletsService;
    constructor(walletsService: WalletsService);
    getBalance(req: any): Promise<{
        user_id: number;
        updated_at: Date | null;
        balance: import("@prisma/client-runtime-utils").Decimal | null;
        wallet_id: number;
    }>;
    getTransactions(req: any): Promise<{
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
    deposit(req: any, amount: number): Promise<{
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
    withdraw(req: any, amount: number): Promise<{
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
