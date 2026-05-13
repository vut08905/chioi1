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
                user_id: number;
                phone: string;
                password_hash: string;
                full_name: string;
                email: string | null;
                gender: string | null;
                avatar_url: string | null;
                role: string;
                status: string | null;
                created_at: Date | null;
                updated_at: Date | null;
            };
        } & {
            bio: string | null;
            kyc_status: string | null;
            average_rating: import("@prisma/client-runtime-utils").Decimal | null;
            total_jobs: number | null;
            is_online: boolean | null;
            last_heartbeat: Date | null;
            tasker_id: number;
        }) | null;
    } & {
        status: string | null;
        created_at: Date | null;
        updated_at: Date | null;
        service_id: number;
        order_id: number;
        order_code: string;
        customer_id: number;
        tasker_id: number | null;
        voucher_id: number | null;
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
    }>;
    updateStatus(req: any, id: number, status: string): Promise<{
        status: string | null;
        created_at: Date | null;
        updated_at: Date | null;
        service_id: number;
        order_id: number;
        order_code: string;
        customer_id: number;
        tasker_id: number | null;
        voucher_id: number | null;
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
    }>;
    cancelOrder(req: any, id: number): Promise<{
        message: string;
        order: {
            status: string | null;
            created_at: Date | null;
            updated_at: Date | null;
            service_id: number;
            order_id: number;
            order_code: string;
            customer_id: number;
            tasker_id: number | null;
            voucher_id: number | null;
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
        };
    }>;
    reviewOrder(req: any, id: number, body: any): Promise<{
        message: string;
        review: {
            created_at: Date | null;
            order_id: number;
            customer_id: number;
            tasker_id: number;
            review_id: number;
            rating: number;
            comment: string | null;
        };
    }>;
    getCustomerHistory(req: any): Promise<({
        taskers: ({
            users: {
                user_id: number;
                phone: string;
                password_hash: string;
                full_name: string;
                email: string | null;
                gender: string | null;
                avatar_url: string | null;
                role: string;
                status: string | null;
                created_at: Date | null;
                updated_at: Date | null;
            };
        } & {
            bio: string | null;
            kyc_status: string | null;
            average_rating: import("@prisma/client-runtime-utils").Decimal | null;
            total_jobs: number | null;
            is_online: boolean | null;
            last_heartbeat: Date | null;
            tasker_id: number;
        }) | null;
        services: {
            created_at: Date | null;
            name: string;
            service_id: number;
            description: string | null;
            base_price: import("@prisma/client-runtime-utils").Decimal;
            icon_url: string | null;
            is_active: boolean | null;
        };
    } & {
        status: string | null;
        created_at: Date | null;
        updated_at: Date | null;
        service_id: number;
        order_id: number;
        order_code: string;
        customer_id: number;
        tasker_id: number | null;
        voucher_id: number | null;
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
    })[]>;
    getChatHistory(orderId: number): Promise<{
        created_at: Date | null;
        order_id: number;
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
            default_address: string | null;
            loyalty_points: number | null;
            customer_id: number;
        };
        taskers: ({
            users: {
                phone: string;
                full_name: string;
                avatar_url: string | null;
            };
        } & {
            bio: string | null;
            kyc_status: string | null;
            average_rating: import("@prisma/client-runtime-utils").Decimal | null;
            total_jobs: number | null;
            is_online: boolean | null;
            last_heartbeat: Date | null;
            tasker_id: number;
        }) | null;
        services: {
            created_at: Date | null;
            name: string;
            service_id: number;
            description: string | null;
            base_price: import("@prisma/client-runtime-utils").Decimal;
            icon_url: string | null;
            is_active: boolean | null;
        };
    } & {
        status: string | null;
        created_at: Date | null;
        updated_at: Date | null;
        service_id: number;
        order_id: number;
        order_code: string;
        customer_id: number;
        tasker_id: number | null;
        voucher_id: number | null;
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
    }>;
}
