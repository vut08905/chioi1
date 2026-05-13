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
exports.OrdersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const wallets_service_1 = require("../wallets/wallets.service");
let OrdersService = class OrdersService {
    prisma;
    walletsService;
    constructor(prisma, walletsService) {
        this.prisma = prisma;
        this.walletsService = walletsService;
        this.fixDatabaseConstraint();
    }
    async fixDatabaseConstraint() {
        try {
            await this.prisma.$executeRawUnsafe(`ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;`);
            await this.prisma.$executeRawUnsafe(`ALTER TABLE orders ADD CONSTRAINT orders_status_check CHECK (status IN ('PENDING', 'SEARCHING', 'ACCEPTED', 'TASKER_ARRIVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'));`);
            console.log('[Database] Fixed missing TASKER_ARRIVED constraint in orders table.');
            await this.prisma.$executeRawUnsafe(`ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_type_check;`);
            await this.prisma.$executeRawUnsafe(`ALTER TABLE transactions ADD CONSTRAINT transactions_type_check CHECK (type IN ('TOP_UP', 'WITHDRAW', 'PAYMENT', 'EARNING', 'REFUND', 'BONUS', 'FEE'));`);
            console.log('[Database] Fixed missing FEE constraint in transactions table.');
        }
        catch (e) {
            console.log('[Database] Constraint fix check skipped or failed.');
        }
    }
    async bookOrder(customerId, data) {
        const orderCode = 'ORD' + Date.now().toString().slice(-6);
        const [order] = await this.prisma.$queryRaw `
      INSERT INTO orders (
        order_code, customer_id, service_id, status, scheduled_time, address, total_price, 
        tasker_earnings, platform_fee, payment_method, location, created_at, updated_at
      ) VALUES (
        ${orderCode}, ${customerId}, ${data.service_id}, 'PENDING', ${new Date(data.scheduled_time)}, 
        ${data.address}, ${data.total_price}, ${data.total_price * 0.8}, ${data.total_price * 0.2}, 
        'CASH', ST_SetSRID(ST_MakePoint(${data.longitude}, ${data.latitude}), 4326), 
        NOW(), NOW()
      ) RETURNING order_id, order_code, address, total_price, scheduled_time;
    `;
        return order;
    }
    async findNearbyTaskers(longitude, latitude, radiusMeters = 5000000) {
        const taskers = await this.prisma.$queryRaw `
      SELECT tasker_id, bio, average_rating, 
             ST_DistanceSphere(current_location, ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)) as distance
      FROM taskers
      WHERE is_online = true 
        AND current_location IS NOT NULL
        AND ST_DWithin(current_location::geography, ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography, ${radiusMeters})
      ORDER BY distance ASC
      LIMIT 3;
    `;
        return taskers;
    }
    async updateTaskerLocation(taskerId, longitude, latitude) {
        await this.prisma.$executeRaw `
      UPDATE taskers 
      SET current_location = ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326),
          last_heartbeat = NOW()
      WHERE tasker_id = ${taskerId};
    `;
    }
    async acceptOrder(orderId, taskerId) {
        const order = await this.prisma.orders.findUnique({ where: { order_id: orderId } });
        if (!order || order.status !== 'PENDING') {
            throw new common_1.BadRequestException('Order is no longer available');
        }
        return this.prisma.orders.update({
            where: { order_id: orderId },
            data: {
                tasker_id: taskerId,
                status: 'ACCEPTED',
            },
            include: {
                taskers: { include: { users: true } },
            }
        });
    }
    async updateOrderStatus(orderId, taskerId, status) {
        const order = await this.prisma.orders.findFirst({
            where: { order_id: orderId, tasker_id: taskerId },
        });
        if (!order) {
            throw new common_1.BadRequestException('Order not found or you are not assigned to this order');
        }
        const validTransitions = {
            'ACCEPTED': ['TASKER_ARRIVED', 'CANCELLED'],
            'TASKER_ARRIVED': ['IN_PROGRESS'],
            'IN_PROGRESS': ['COMPLETED'],
        };
        const currentStatus = order.status || '';
        if (!validTransitions[currentStatus] || !validTransitions[currentStatus].includes(status)) {
            throw new common_1.BadRequestException(`Cannot transition from ${currentStatus} to ${status}`);
        }
        const updatedOrder = await this.prisma.orders.update({
            where: { order_id: orderId },
            data: { status },
        });
        if (status === 'COMPLETED') {
            try {
                await this.walletsService.addTransaction(order.customer_id, -Number(order.total_price), 'PAYMENT', order.order_id, 'Thanh toán dịch vụ đơn hàng #' + order.order_id);
            }
            catch (e) {
                console.warn('[Order] Không trừ được tiền ví KH:', e.message);
            }
            try {
                if (order.payment_method === 'CASH') {
                    await this.walletsService.addTransaction(order.tasker_id, -Number(order.platform_fee), 'FEE', order.order_id, 'Thu phí nền tảng cho đơn hàng trả tiền mặt');
                }
                else {
                    await this.walletsService.addTransaction(order.tasker_id, Number(order.tasker_earnings), 'EARNING', order.order_id, 'Thanh toán thu nhập đơn hàng');
                }
            }
            catch (e) {
                console.warn('[Order] Không cộng/trừ được tiền ví Tasker:', e.message);
            }
        }
        return updatedOrder;
    }
    async cancelOrder(orderId, customerId) {
        const order = await this.prisma.orders.findFirst({
            where: { order_id: orderId, customer_id: customerId },
        });
        if (!order) {
            throw new common_1.BadRequestException('Order not found or does not belong to you');
        }
        const currentStatus = order.status || '';
        if (['IN_PROGRESS', 'COMPLETED', 'CANCELLED'].includes(currentStatus)) {
            throw new common_1.BadRequestException(`Cannot cancel order in status ${currentStatus}`);
        }
        return this.prisma.orders.update({
            where: { order_id: orderId },
            data: { status: 'CANCELLED' },
        });
    }
    async reviewOrder(orderId, customerId, rating, comment) {
        const order = await this.prisma.orders.findFirst({
            where: { order_id: orderId, customer_id: customerId, status: 'COMPLETED' },
        });
        if (!order || !order.tasker_id) {
            throw new common_1.BadRequestException('Order not eligible for review');
        }
        const existingReview = await this.prisma.reviews.findFirst({
            where: { order_id: orderId },
        });
        if (existingReview) {
            throw new common_1.BadRequestException('Order has already been reviewed');
        }
        const review = await this.prisma.reviews.create({
            data: {
                order_id: orderId,
                customer_id: customerId,
                tasker_id: order.tasker_id,
                rating,
                comment,
            },
        });
        const stats = await this.prisma.reviews.aggregate({
            where: { tasker_id: order.tasker_id },
            _avg: { rating: true },
        });
        await this.prisma.taskers.update({
            where: { tasker_id: order.tasker_id },
            data: { average_rating: stats._avg.rating || rating },
        });
        return review;
    }
    async getOrderById(orderId, userId) {
        const order = await this.prisma.orders.findFirst({
            where: { order_id: orderId, OR: [{ customer_id: userId }, { tasker_id: userId }] },
            include: {
                services: true,
                taskers: { include: { users: { select: { full_name: true, phone: true, avatar_url: true } } } },
                customers: { include: { users: { select: { full_name: true, phone: true } } } },
            },
        });
        if (!order) {
            throw new common_1.BadRequestException('Đơn hàng không tồn tại hoặc bạn không có quyền xem');
        }
        return order;
    }
    async getCustomerHistory(customerId) {
        return this.prisma.orders.findMany({
            where: { customer_id: customerId },
            orderBy: { created_at: 'desc' },
            include: {
                services: true,
                taskers: {
                    include: { users: true }
                }
            }
        });
    }
    async saveMessage(data) {
        return this.prisma.messages.create({
            data: {
                order_id: data.order_id,
                sender_id: data.sender_id,
                receiver_id: data.receiver_id,
                content: data.content,
            }
        });
    }
    async getChatHistory(orderId) {
        return this.prisma.messages.findMany({
            where: { order_id: orderId },
            orderBy: { created_at: 'asc' }
        });
    }
};
exports.OrdersService = OrdersService;
exports.OrdersService = OrdersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        wallets_service_1.WalletsService])
], OrdersService);
//# sourceMappingURL=orders.service.js.map