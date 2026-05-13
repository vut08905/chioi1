import { PrismaService } from '../prisma/prisma.service';
export declare class ApiService {
    private prisma;
    constructor(prisma: PrismaService);
    getUserProfile(userId: number): Promise<{
        address: string | null;
        bio: string | null;
        user_id: number;
        phone: string;
        full_name: string;
        email: string | null;
        gender: string | null;
        avatar_url: string | null;
        role: string;
        status: string | null;
        created_at: Date | null;
    }>;
    updateUserProfile(userId: number, data: {
        full_name?: string;
        gender?: string;
        email?: string;
        address?: string;
        bio?: string;
    }): Promise<{
        address: string | null;
        bio: string | null;
        user_id: number;
        phone: string;
        full_name: string;
        email: string | null;
        gender: string | null;
        avatar_url: string | null;
        role: string;
        status: string | null;
        created_at: Date | null;
    }>;
    getServices(): Promise<{
        created_at: Date | null;
        name: string;
        service_id: number;
        description: string | null;
        base_price: import("@prisma/client-runtime-utils").Decimal;
        icon_url: string | null;
        is_active: boolean | null;
    }[]>;
    subscribePackage(userId: number, packageId: number): Promise<{
        message: string;
        subscription: {
            status: string | null;
            created_at: Date | null;
            customer_id: number;
            package_id: number;
            customer_package_id: number;
            start_date: Date;
            end_date: Date;
        };
        wallet: {
            balance: import("@prisma/client-runtime-utils").Decimal | null;
        };
    }>;
    getPackages(): Promise<{
        name: string;
        description: string | null;
        is_active: boolean | null;
        package_id: number;
        price: import("@prisma/client-runtime-utils").Decimal;
        duration_days: number | null;
    }[]>;
    getTaskerHistory(taskerId: number): Promise<({
        customers: {
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
            default_address: string | null;
            loyalty_points: number | null;
            customer_id: number;
        };
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
    getActiveTaskers(lat?: number, lng?: number): Promise<({
        taskers: ({
            tasker_services: ({
                services: {
                    name: string;
                };
            } & {
                status: string | null;
                service_id: number;
                tasker_id: number;
            })[];
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
    })[]>;
    getAdminDashboard(): Promise<{
        total_orders: number;
        total_revenue: number | import("@prisma/client-runtime-utils").Decimal;
    }>;
    submitKyc(taskerId: number, kycData: any): Promise<{
        bio: string | null;
        kyc_status: string | null;
        average_rating: import("@prisma/client-runtime-utils").Decimal | null;
        total_jobs: number | null;
        is_online: boolean | null;
        last_heartbeat: Date | null;
        tasker_id: number;
    }>;
    updateTaskerStatus(taskerId: number, isOnline: boolean): Promise<{
        bio: string | null;
        kyc_status: string | null;
        average_rating: import("@prisma/client-runtime-utils").Decimal | null;
        total_jobs: number | null;
        is_online: boolean | null;
        last_heartbeat: Date | null;
        tasker_id: number;
    }>;
    createTicket(userId: number, subject: string, description: string): Promise<{
        user_id: number;
        status: string | null;
        created_at: Date | null;
        updated_at: Date | null;
        description: string;
        order_id: number | null;
        admin_id: number | null;
        ticket_code: string;
        subject: string;
        priority: string | null;
        ticket_id: number;
    }>;
    approveTaskerKyc(adminId: number, taskerId: number, status: string): Promise<{
        bio: string | null;
        kyc_status: string | null;
        average_rating: import("@prisma/client-runtime-utils").Decimal | null;
        total_jobs: number | null;
        is_online: boolean | null;
        last_heartbeat: Date | null;
        tasker_id: number;
    }>;
    approveTaskerService(adminId: number, taskerId: number, serviceId: number, status: string): Promise<{
        status: string | null;
        service_id: number;
        tasker_id: number;
    }>;
    getTaskerServicesPending(): Promise<({
        taskers: {
            users: {
                phone: string;
                full_name: string;
            };
        } & {
            bio: string | null;
            kyc_status: string | null;
            average_rating: import("@prisma/client-runtime-utils").Decimal | null;
            total_jobs: number | null;
            is_online: boolean | null;
            last_heartbeat: Date | null;
            tasker_id: number;
        };
        services: {
            name: string;
            service_id: number;
        };
    } & {
        status: string | null;
        service_id: number;
        tasker_id: number;
    })[]>;
    manageService(action: string, data: any, serviceId?: number): Promise<{
        created_at: Date | null;
        name: string;
        service_id: number;
        description: string | null;
        base_price: import("@prisma/client-runtime-utils").Decimal;
        icon_url: string | null;
        is_active: boolean | null;
    } | undefined>;
    managePackage(action: string, data: any, packageId?: number): Promise<{
        name: string;
        description: string | null;
        is_active: boolean | null;
        package_id: number;
        price: import("@prisma/client-runtime-utils").Decimal;
        duration_days: number | null;
    } | undefined>;
    approveWithdrawal(adminId: number, transactionId: number, status: string): Promise<{
        status: string | null;
        created_at: Date | null;
        wallet_id: number;
        description: string | null;
        order_id: number | null;
        type: string;
        transaction_id: number;
        transaction_code: string;
        amount: import("@prisma/client-runtime-utils").Decimal;
    }>;
    resolveTicket(adminId: number, ticketId: number, status: string): Promise<{
        user_id: number;
        status: string | null;
        created_at: Date | null;
        updated_at: Date | null;
        description: string;
        order_id: number | null;
        admin_id: number | null;
        ticket_code: string;
        subject: string;
        priority: string | null;
        ticket_id: number;
    }>;
    getAdminUsers(): Promise<{
        user_id: number;
        phone: string;
        full_name: string;
        role: string;
        status: string | null;
        created_at: Date | null;
        taskers: {
            bio: string | null;
            kyc_status: string | null;
            average_rating: import("@prisma/client-runtime-utils").Decimal | null;
            total_jobs: number | null;
            is_online: boolean | null;
            last_heartbeat: Date | null;
            tasker_id: number;
        } | null;
    }[]>;
    getAdminOrders(): Promise<{
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
    }[]>;
    adminCancelOrder(adminId: number, orderId: number): Promise<{
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
    getAdminTickets(): Promise<({
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
        user_id: number;
        status: string | null;
        created_at: Date | null;
        updated_at: Date | null;
        description: string;
        order_id: number | null;
        admin_id: number | null;
        ticket_code: string;
        subject: string;
        priority: string | null;
        ticket_id: number;
    })[]>;
    getAdminWithdrawals(): Promise<{
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
    getAvailableOrdersForTasker(taskerId: number): Promise<({
        customers: {
            users: {
                full_name: string;
            };
        } & {
            default_address: string | null;
            loyalty_points: number | null;
            customer_id: number;
        };
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
    getAllServicesForTasker(taskerId: number): Promise<{
        is_registered: boolean;
        registration_status: string | null;
        created_at: Date | null;
        name: string;
        service_id: number;
        description: string | null;
        base_price: import("@prisma/client-runtime-utils").Decimal;
        icon_url: string | null;
        is_active: boolean | null;
    }[]>;
    registerTaskerService(taskerId: number, serviceId: number): Promise<{
        status: string | null;
        service_id: number;
        tasker_id: number;
    }>;
}
