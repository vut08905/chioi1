import { OrdersService } from './orders.service';
import { OrdersGateway } from './orders.gateway';
export declare class OrdersController {
    private ordersService;
    private ordersGateway;
    constructor(ordersService: OrdersService, ordersGateway: OrdersGateway);
    bookOrder(req: any, body: any): Promise<{
        message: string;
        order: any;
        nearbyTaskersCount: number;
    }>;
    acceptOrder(req: any, id: number): Promise<{
        taskers: ({
            users: {
                status: string | null;
                created_at: Date | null;
                updated_at: Date | null;
                user_id: number;
                phone: string;
                password_hash: string;
                full_name: string;
                email: string | null;
                gender: string | null;
                avatar_url: string | null;
                role: string;
            };
        } & {
            tasker_id: number;
            bio: string | null;
            kyc_status: string | null;
            average_rating: import("@prisma/client-runtime-utils").Decimal | null;
            total_jobs: number | null;
            is_online: boolean | null;
            last_heartbeat: Date | null;
        }) | null;
    } & {
        order_id: number;
        order_code: string;
        customer_id: number;
        tasker_id: number | null;
        service_id: number;
        voucher_id: number | null;
        status: string | null;
        scheduled_time: Date;
        address: string;
        total_price: import("@prisma/client-runtime-utils").Decimal;
        discount_amount: import("@prisma/client-runtime-utils").Decimal | null;
        tasker_earnings: import("@prisma/client-runtime-utils").Decimal;
        platform_fee: import("@prisma/client-runtime-utils").Decimal;
        payment_method: string | null;
        payment_status: string | null;
        notes: string | null;
        cancel_reason: string | null;
        created_at: Date | null;
        updated_at: Date | null;
    }>;
    updateStatus(req: any, id: number, status: string): Promise<{
        order_id: number;
        order_code: string;
        customer_id: number;
        tasker_id: number | null;
        service_id: number;
        voucher_id: number | null;
        status: string | null;
        scheduled_time: Date;
        address: string;
        total_price: import("@prisma/client-runtime-utils").Decimal;
        discount_amount: import("@prisma/client-runtime-utils").Decimal | null;
        tasker_earnings: import("@prisma/client-runtime-utils").Decimal;
        platform_fee: import("@prisma/client-runtime-utils").Decimal;
        payment_method: string | null;
        payment_status: string | null;
        notes: string | null;
        cancel_reason: string | null;
        created_at: Date | null;
        updated_at: Date | null;
    }>;
    cancelOrder(req: any, id: number): Promise<{
        message: string;
        order: {
            order_id: number;
            order_code: string;
            customer_id: number;
            tasker_id: number | null;
            service_id: number;
            voucher_id: number | null;
            status: string | null;
            scheduled_time: Date;
            address: string;
            total_price: import("@prisma/client-runtime-utils").Decimal;
            discount_amount: import("@prisma/client-runtime-utils").Decimal | null;
            tasker_earnings: import("@prisma/client-runtime-utils").Decimal;
            platform_fee: import("@prisma/client-runtime-utils").Decimal;
            payment_method: string | null;
            payment_status: string | null;
            notes: string | null;
            cancel_reason: string | null;
            created_at: Date | null;
            updated_at: Date | null;
        };
    }>;
    reviewOrder(req: any, id: number, body: any): Promise<{
        message: string;
        review: {
            order_id: number;
            customer_id: number;
            tasker_id: number;
            created_at: Date | null;
            rating: number;
            comment: string | null;
            review_id: number;
        };
    }>;
    getCustomerHistory(req: any): Promise<({
        services: {
            description: string | null;
            service_id: number;
            created_at: Date | null;
            name: string;
            base_price: import("@prisma/client-runtime-utils").Decimal;
            icon_url: string | null;
            is_active: boolean | null;
        };
        taskers: ({
            users: {
                status: string | null;
                created_at: Date | null;
                updated_at: Date | null;
                user_id: number;
                phone: string;
                password_hash: string;
                full_name: string;
                email: string | null;
                gender: string | null;
                avatar_url: string | null;
                role: string;
            };
        } & {
            tasker_id: number;
            bio: string | null;
            kyc_status: string | null;
            average_rating: import("@prisma/client-runtime-utils").Decimal | null;
            total_jobs: number | null;
            is_online: boolean | null;
            last_heartbeat: Date | null;
        }) | null;
    } & {
        order_id: number;
        order_code: string;
        customer_id: number;
        tasker_id: number | null;
        service_id: number;
        voucher_id: number | null;
        status: string | null;
        scheduled_time: Date;
        address: string;
        total_price: import("@prisma/client-runtime-utils").Decimal;
        discount_amount: import("@prisma/client-runtime-utils").Decimal | null;
        tasker_earnings: import("@prisma/client-runtime-utils").Decimal;
        platform_fee: import("@prisma/client-runtime-utils").Decimal;
        payment_method: string | null;
        payment_status: string | null;
        notes: string | null;
        cancel_reason: string | null;
        created_at: Date | null;
        updated_at: Date | null;
    })[]>;
    getChatHistory(orderId: number): Promise<{
        order_id: number;
        created_at: Date | null;
        content: string;
        is_read: boolean | null;
        message_id: number;
        sender_id: number;
        receiver_id: number;
    }[]>;
    getOrderById(req: any, id: number): Promise<{
        customers: {
            users: {
                phone: string;
                full_name: string;
            };
        } & {
            customer_id: number;
            default_address: string | null;
            loyalty_points: number | null;
        };
        services: {
            description: string | null;
            service_id: number;
            created_at: Date | null;
            name: string;
            base_price: import("@prisma/client-runtime-utils").Decimal;
            icon_url: string | null;
            is_active: boolean | null;
        };
        taskers: ({
            users: {
                phone: string;
                full_name: string;
                avatar_url: string | null;
            };
        } & {
            tasker_id: number;
            bio: string | null;
            kyc_status: string | null;
            average_rating: import("@prisma/client-runtime-utils").Decimal | null;
            total_jobs: number | null;
            is_online: boolean | null;
            last_heartbeat: Date | null;
        }) | null;
    } & {
        order_id: number;
        order_code: string;
        customer_id: number;
        tasker_id: number | null;
        service_id: number;
        voucher_id: number | null;
        status: string | null;
        scheduled_time: Date;
        address: string;
        total_price: import("@prisma/client-runtime-utils").Decimal;
        discount_amount: import("@prisma/client-runtime-utils").Decimal | null;
        tasker_earnings: import("@prisma/client-runtime-utils").Decimal;
        platform_fee: import("@prisma/client-runtime-utils").Decimal;
        payment_method: string | null;
        payment_status: string | null;
        notes: string | null;
        cancel_reason: string | null;
        created_at: Date | null;
        updated_at: Date | null;
    }>;
}
