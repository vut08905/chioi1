import { ApiService } from './api.service';
export declare class ApiController {
    private apiService;
    constructor(apiService: ApiService);
    getProfile(req: any): Promise<{
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
    updateProfile(req: any, body: any): Promise<{
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
    getPackages(): Promise<{
        name: string;
        description: string | null;
        is_active: boolean | null;
        package_id: number;
        price: import("@prisma/client-runtime-utils").Decimal;
        duration_days: number | null;
    }[]>;
    getActiveTaskers(lat?: string, lng?: string): Promise<({
        taskers: ({
            tasker_services: ({
                services: {
                    name: string;
                };
            } & {
                status: string | null;
                tasker_id: number;
                service_id: number;
            })[];
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
    getTaskerHistory(req: any): Promise<({
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
            customer_id: number;
            default_address: string | null;
            loyalty_points: number | null;
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
        customer_id: number;
        tasker_id: number | null;
        service_id: number;
        order_id: number;
        order_code: string;
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
    getAdminDashboard(): Promise<{
        total_orders: number;
        total_revenue: number | import("@prisma/client-runtime-utils").Decimal;
    }>;
    submitKyc(req: any, body: any): Promise<{
        tasker_id: number;
        bio: string | null;
        kyc_status: string | null;
        average_rating: import("@prisma/client-runtime-utils").Decimal | null;
        total_jobs: number | null;
        is_online: boolean | null;
        last_heartbeat: Date | null;
    }>;
    updateTaskerStatus(req: any, isOnline: boolean): Promise<{
        tasker_id: number;
        bio: string | null;
        kyc_status: string | null;
        average_rating: import("@prisma/client-runtime-utils").Decimal | null;
        total_jobs: number | null;
        is_online: boolean | null;
        last_heartbeat: Date | null;
    }>;
    getAvailableOrders(req: any): Promise<({
        customers: {
            users: {
                full_name: string;
            };
        } & {
            customer_id: number;
            default_address: string | null;
            loyalty_points: number | null;
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
        customer_id: number;
        tasker_id: number | null;
        service_id: number;
        order_id: number;
        order_code: string;
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
    getAllServicesForTasker(req: any): Promise<{
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
    registerService(req: any, serviceId: number): Promise<{
        status: string | null;
        tasker_id: number;
        service_id: number;
    }>;
    getUserTickets(req: any): Promise<{
        user_id: number;
        status: string | null;
        created_at: Date | null;
        updated_at: Date | null;
        admin_id: number | null;
        description: string;
        order_id: number | null;
        ticket_id: number;
        ticket_code: string;
        subject: string;
        priority: string | null;
    }[]>;
    createTicket(req: any, body: any): Promise<{
        user_id: number;
        status: string | null;
        created_at: Date | null;
        updated_at: Date | null;
        admin_id: number | null;
        description: string;
        order_id: number | null;
        ticket_id: number;
        ticket_code: string;
        subject: string;
        priority: string | null;
    }>;
    approveTaskerKyc(req: any, id: number, status: string): Promise<{
        tasker_id: number;
        bio: string | null;
        kyc_status: string | null;
        average_rating: import("@prisma/client-runtime-utils").Decimal | null;
        total_jobs: number | null;
        is_online: boolean | null;
        last_heartbeat: Date | null;
    }>;
    approveTaskerService(req: any, taskerId: number, serviceId: number, status: string): Promise<{
        status: string | null;
        tasker_id: number;
        service_id: number;
    }>;
    getTaskerServicesPending(): Promise<({
        taskers: {
            users: {
                phone: string;
                full_name: string;
            };
        } & {
            tasker_id: number;
            bio: string | null;
            kyc_status: string | null;
            average_rating: import("@prisma/client-runtime-utils").Decimal | null;
            total_jobs: number | null;
            is_online: boolean | null;
            last_heartbeat: Date | null;
        };
        services: {
            name: string;
            service_id: number;
        };
    } & {
        status: string | null;
        tasker_id: number;
        service_id: number;
    })[]>;
    createService(body: any): Promise<{
        created_at: Date | null;
        name: string;
        service_id: number;
        description: string | null;
        base_price: import("@prisma/client-runtime-utils").Decimal;
        icon_url: string | null;
        is_active: boolean | null;
    } | undefined>;
    updateService(id: number, body: any): Promise<{
        created_at: Date | null;
        name: string;
        service_id: number;
        description: string | null;
        base_price: import("@prisma/client-runtime-utils").Decimal;
        icon_url: string | null;
        is_active: boolean | null;
    } | undefined>;
    deleteService(id: number): Promise<{
        created_at: Date | null;
        name: string;
        service_id: number;
        description: string | null;
        base_price: import("@prisma/client-runtime-utils").Decimal;
        icon_url: string | null;
        is_active: boolean | null;
    } | undefined>;
    subscribePackage(req: any, body: any): Promise<{
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
    createPackage(body: any): Promise<{
        name: string;
        description: string | null;
        is_active: boolean | null;
        package_id: number;
        price: import("@prisma/client-runtime-utils").Decimal;
        duration_days: number | null;
    } | undefined>;
    updatePackage(id: number, body: any): Promise<{
        name: string;
        description: string | null;
        is_active: boolean | null;
        package_id: number;
        price: import("@prisma/client-runtime-utils").Decimal;
        duration_days: number | null;
    } | undefined>;
    deletePackage(id: number): Promise<{
        name: string;
        description: string | null;
        is_active: boolean | null;
        package_id: number;
        price: import("@prisma/client-runtime-utils").Decimal;
        duration_days: number | null;
    } | undefined>;
    approveWithdrawal(req: any, id: number, status: string): Promise<{
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
    resolveTicket(req: any, id: number, status: string): Promise<{
        user_id: number;
        status: string | null;
        created_at: Date | null;
        updated_at: Date | null;
        admin_id: number | null;
        description: string;
        order_id: number | null;
        ticket_id: number;
        ticket_code: string;
        subject: string;
        priority: string | null;
    }>;
    getAdminUsers(): Promise<{
        user_id: number;
        phone: string;
        full_name: string;
        role: string;
        status: string | null;
        created_at: Date | null;
        customers: {
            default_address: string | null;
        } | null;
        taskers: {
            tasker_id: number;
            bio: string | null;
            kyc_status: string | null;
            average_rating: import("@prisma/client-runtime-utils").Decimal | null;
            total_jobs: number | null;
            is_online: boolean | null;
            last_heartbeat: Date | null;
        } | null;
    }[]>;
    updateUserStatus(req: any, id: number, status: string): Promise<{
        user_id: number;
        phone: string;
        full_name: string;
        role: string;
        status: string | null;
    }>;
    getAdminOrders(): Promise<({
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
            customer_id: number;
            default_address: string | null;
            loyalty_points: number | null;
        };
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
            tasker_id: number;
            bio: string | null;
            kyc_status: string | null;
            average_rating: import("@prisma/client-runtime-utils").Decimal | null;
            total_jobs: number | null;
            is_online: boolean | null;
            last_heartbeat: Date | null;
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
        customer_id: number;
        tasker_id: number | null;
        service_id: number;
        order_id: number;
        order_code: string;
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
    adminCancelOrder(req: any, id: number): Promise<{
        status: string | null;
        created_at: Date | null;
        updated_at: Date | null;
        customer_id: number;
        tasker_id: number | null;
        service_id: number;
        order_id: number;
        order_code: string;
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
    adminAssignTasker(req: any, id: number, taskerId: number): Promise<{
        status: string | null;
        created_at: Date | null;
        updated_at: Date | null;
        customer_id: number;
        tasker_id: number | null;
        service_id: number;
        order_id: number;
        order_code: string;
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
    adminResolveOrder(req: any, id: number, note: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getAdminInboxStats(): Promise<{
        total: number;
        open: number;
        inProgress: number;
        resolved: number;
    }>;
    getAdminTicketsList(status?: string, priority?: string): Promise<({
        admins: {
            admin_id: number;
        } | null;
        users: {
            user_id: number;
            phone: string;
            full_name: string;
            email: string | null;
        };
        orders: {
            status: string | null;
            order_id: number;
            order_code: string;
        } | null;
    } & {
        user_id: number;
        status: string | null;
        created_at: Date | null;
        updated_at: Date | null;
        admin_id: number | null;
        description: string;
        order_id: number | null;
        ticket_id: number;
        ticket_code: string;
        subject: string;
        priority: string | null;
    })[]>;
    getAdminTicketDetail(id: number): Promise<{
        ticket: ({
            admins: {
                admin_id: number;
            } | null;
            users: {
                user_id: number;
                phone: string;
                full_name: string;
                email: string | null;
            };
            orders: {
                status: string | null;
                order_id: number;
                order_code: string;
            } | null;
        } & {
            user_id: number;
            status: string | null;
            created_at: Date | null;
            updated_at: Date | null;
            admin_id: number | null;
            description: string;
            order_id: number | null;
            ticket_id: number;
            ticket_code: string;
            subject: string;
            priority: string | null;
        }) | null;
        messages: any[];
    }>;
    updateAdminTicket(id: number, body: {
        status?: string;
        priority?: string;
    }): Promise<{
        user_id: number;
        status: string | null;
        created_at: Date | null;
        updated_at: Date | null;
        admin_id: number | null;
        description: string;
        order_id: number | null;
        ticket_id: number;
        ticket_code: string;
        subject: string;
        priority: string | null;
    }>;
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
    getAdminTransactions(type?: string): Promise<({
        wallets: {
            users: {
                user_id: number;
                phone: string;
                full_name: string;
                role: string;
            };
        } & {
            user_id: number;
            updated_at: Date | null;
            wallet_id: number;
            balance: import("@prisma/client-runtime-utils").Decimal | null;
        };
        orders: {
            order_code: string;
        } | null;
    } & {
        status: string | null;
        created_at: Date | null;
        wallet_id: number;
        description: string | null;
        order_id: number | null;
        type: string;
        transaction_id: number;
        transaction_code: string;
        amount: import("@prisma/client-runtime-utils").Decimal;
    })[]>;
    getAdminWalletStats(): Promise<{
        totalBalance: number;
        todayTransactions: number;
        pendingWithdrawal: number;
        paidThisMonth: number;
    }>;
    getAdminReportStats(period?: string): Promise<{
        summary: {
            totalOrders: number;
            completedOrders: number;
            cancelledOrders: number;
            pendingOrders: number;
            totalRevenue: number;
            platformRevenue: number;
            totalUsers: number;
            totalTaskers: number;
            newUsersThisPeriod: number;
            completionRate: number;
        };
        chart: {
            labels: string[];
            revenue: number[];
            orders: number[];
        };
        topServices: {
            name: string;
            count: any;
            revenue: number;
        }[];
        topTaskers: {
            name: any;
            orders: any;
            earnings: number;
        }[];
        recentOrders: {
            code: any;
            service: any;
            customer: any;
            amount: number;
            status: any;
            date: any;
        }[];
    }>;
}
