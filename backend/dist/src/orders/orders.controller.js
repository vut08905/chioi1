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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrdersController = void 0;
const common_1 = require("@nestjs/common");
const orders_service_1 = require("./orders.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const orders_gateway_1 = require("./orders.gateway");
const swagger_1 = require("@nestjs/swagger");
let OrdersController = class OrdersController {
    ordersService;
    ordersGateway;
    constructor(ordersService, ordersGateway) {
        this.ordersService = ordersService;
        this.ordersGateway = ordersGateway;
    }
    async bookOrder(req, body) {
        const order = await this.ordersService.bookOrder(req.user.userId, body);
        const nearbyTaskers = await this.ordersService.findNearbyTaskers(body.longitude, body.latitude);
        if (nearbyTaskers.length > 0) {
            const taskerIds = nearbyTaskers.map(t => t.tasker_id);
            this.ordersGateway.notifyTaskersNewOrder(taskerIds, order);
        }
        return { message: 'Order created and searching for taskers', order, nearbyTaskersCount: nearbyTaskers.length };
    }
    async acceptOrder(req, id) {
        const updatedOrder = await this.ordersService.acceptOrder(id, req.user.userId);
        this.ordersGateway.notifyCustomerOrderAccepted(updatedOrder.customer_id, updatedOrder);
        return updatedOrder;
    }
    async updateStatus(req, id, status) {
        const order = await this.ordersService.updateOrderStatus(id, req.user.userId, status);
        this.ordersGateway.notifyCustomerOrderStatus(order.customer_id, { orderId: id, status: order.status });
        return order;
    }
    async cancelOrder(req, id) {
        const order = await this.ordersService.cancelOrder(id, req.user.userId);
        if (order.tasker_id) {
            this.ordersGateway.notifyTaskerOrderCancelled(order.tasker_id, order.order_id);
        }
        return { message: 'Order cancelled successfully', order };
    }
    async reviewOrder(req, id, body) {
        const review = await this.ordersService.reviewOrder(id, req.user.userId, body.rating, body.comment);
        return { message: 'Review submitted successfully', review };
    }
    async getCustomerHistory(req) {
        return this.ordersService.getCustomerHistory(req.user.userId);
    }
    async getChatHistory(orderId) {
        return this.ordersService.getChatHistory(orderId);
    }
    async getOrderById(req, id) {
        return this.ordersService.getOrderById(id, req.user.userId);
    }
};
exports.OrdersController = OrdersController;
__decorate([
    (0, common_1.Post)('book'),
    (0, roles_decorator_1.Roles)('CUSTOMER'),
    (0, swagger_1.ApiOperation)({ summary: 'Đặt đơn mới (Cần Token Customer)' }),
    (0, swagger_1.ApiBody)({ schema: { example: { service_id: 1, scheduled_time: '2026-05-15T10:00:00Z', address: '123 Test', total_price: 150000, longitude: 106.6297, latitude: 10.8231 } } }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "bookOrder", null);
__decorate([
    (0, common_1.Patch)(':id/accept'),
    (0, roles_decorator_1.Roles)('TASKER'),
    (0, swagger_1.ApiOperation)({ summary: 'Nhận đơn (Cần Token Tasker)' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "acceptOrder", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    (0, roles_decorator_1.Roles)('TASKER'),
    (0, swagger_1.ApiOperation)({ summary: 'Cập nhật trạng thái đơn: TASKER_ARRIVED, IN_PROGRESS, COMPLETED (Cần Token Tasker)' }),
    (0, swagger_1.ApiBody)({ schema: { example: { status: 'TASKER_ARRIVED' } } }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, String]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Patch)(':id/cancel'),
    (0, roles_decorator_1.Roles)('CUSTOMER'),
    (0, swagger_1.ApiOperation)({ summary: 'Khách hàng Hủy đơn (Cần Token Customer)' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "cancelOrder", null);
__decorate([
    (0, common_1.Post)(':id/review'),
    (0, roles_decorator_1.Roles)('CUSTOMER'),
    (0, swagger_1.ApiOperation)({ summary: 'Đánh giá Tasker sau khi hoàn thành đơn (Cần Token Customer)' }),
    (0, swagger_1.ApiBody)({ schema: { example: { rating: 5, comment: 'Làm việc rất sạch sẽ và đúng giờ' } } }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Object]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "reviewOrder", null);
__decorate([
    (0, common_1.Get)('customer/history'),
    (0, roles_decorator_1.Roles)('CUSTOMER'),
    (0, swagger_1.ApiOperation)({ summary: 'Xem lịch sử đơn hàng của Khách hàng (Cần Token Customer)' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "getCustomerHistory", null);
__decorate([
    (0, common_1.Get)('chat/:orderId'),
    (0, roles_decorator_1.Roles)('CUSTOMER', 'TASKER'),
    (0, swagger_1.ApiOperation)({ summary: 'Lấy lịch sử chat của một đơn hàng' }),
    __param(0, (0, common_1.Param)('orderId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "getChatHistory", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)('CUSTOMER', 'TASKER'),
    (0, swagger_1.ApiOperation)({ summary: 'Lấy chi tiết đơn hàng theo ID' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "getOrderById", null);
exports.OrdersController = OrdersController = __decorate([
    (0, swagger_1.ApiTags)('Orders (Đặt đơn, Nhận đơn)'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('api/orders'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [orders_service_1.OrdersService,
        orders_gateway_1.OrdersGateway])
], OrdersController);
//# sourceMappingURL=orders.controller.js.map