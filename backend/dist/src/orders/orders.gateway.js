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
exports.OrdersGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const orders_service_1 = require("./orders.service");
const jwt_1 = require("@nestjs/jwt");
let OrdersGateway = class OrdersGateway {
    ordersService;
    jwtService;
    server;
    connectedUsers = new Map();
    constructor(ordersService, jwtService) {
        this.ordersService = ordersService;
        this.jwtService = jwtService;
    }
    async handleConnection(client) {
        try {
            const token = client.handshake.auth.token || client.handshake.headers['authorization'];
            if (!token) {
                client.disconnect();
                return;
            }
            const payload = this.jwtService.verify(token.replace('Bearer ', ''), { secret: process.env.JWT_SECRET || 'super-secret' });
            const userId = Number(payload.sub);
            this.connectedUsers.set(userId, client.id);
            client.data.userId = userId;
            client.data.role = payload.role;
        }
        catch (e) {
            client.disconnect();
        }
    }
    handleDisconnect(client) {
        if (client.data.userId) {
            this.connectedUsers.delete(Number(client.data.userId));
        }
    }
    async handleGpsUpdate(client, data) {
        if (client.data.role === 'TASKER') {
            await this.ordersService.updateTaskerLocation(client.data.userId, data.longitude, data.latitude);
        }
    }
    notifyTaskersNewOrder(taskerIds, order) {
        taskerIds.forEach(id => {
            const socketId = this.connectedUsers.get(Number(id));
            if (socketId) {
                this.server.to(socketId).emit('new_order', {
                    message: 'Ting ting! Có đơn hàng mới gần bạn',
                    order,
                });
            }
        });
    }
    notifyCustomerOrderAccepted(customerId, order) {
        const socketId = this.connectedUsers.get(Number(customerId));
        if (socketId) {
            this.server.to(socketId).emit('order_accepted', {
                message: 'Tasker đã nhận đơn của bạn',
                order,
            });
        }
    }
    notifyCustomerOrderStatus(customerId, data) {
        const socketId = this.connectedUsers.get(Number(customerId));
        if (socketId) {
            this.server.to(socketId).emit('order_status_updated', {
                message: `Đơn hàng của bạn đã chuyển sang trạng thái: ${data.status}`,
                data,
            });
        }
    }
    notifyTaskerOrderCancelled(taskerId, orderId) {
        const socketId = this.connectedUsers.get(Number(taskerId));
        if (socketId) {
            this.server.to(socketId).emit('order_cancelled', {
                message: 'Rất tiếc, Khách hàng đã hủy đơn',
                orderId,
            });
        }
    }
    async handleJoinRoom(client, data) {
        try {
            const order = await this.ordersService.getOrderById(data.orderId, client.data.userId);
            if (!order) {
                client.emit('error', { message: 'Không được phép tham gia phòng chat này' });
                return;
            }
            const roomName = `order_${data.orderId}`;
            client.join(roomName);
            client.data.currentOrderRoom = roomName;
            client.emit('joined_room', { orderId: data.orderId, roomName });
        }
        catch (e) {
            client.emit('error', { message: 'Không thể tham gia phòng chat' });
        }
    }
    async handleMessage(client, data) {
        try {
            const order = await this.ordersService.getOrderById(data.orderId, client.data.userId);
            if (!order) {
                client.emit('error', { message: 'Bạn không có quyền chat trong đơn hàng này' });
                return;
            }
        }
        catch (e) {
            client.emit('error', { message: 'Đơn hàng không tồn tại' });
            return;
        }
        const message = await this.ordersService.saveMessage({
            order_id: data.orderId,
            sender_id: client.data.userId,
            receiver_id: data.receiverId,
            content: data.content,
        });
        const roomName = `order_${data.orderId}`;
        client.broadcast.to(roomName).emit('receive_message', message);
        client.emit('message_sent', { ...message, status: 'sent' });
    }
    async handleCallRequest(client, data) {
        try {
            const order = await this.ordersService.getOrderById(data.orderId, client.data.userId);
            if (!order) {
                client.emit('call_failed', { reason: 'Bạn không thuộc đơn hàng này' });
                return;
            }
        }
        catch (e) {
            client.emit('call_failed', { reason: 'Đơn hàng không tồn tại' });
            return;
        }
        const receiverSocketId = this.connectedUsers.get(Number(data.receiverId));
        if (receiverSocketId) {
            this.server.to(receiverSocketId).emit('call_incoming', {
                orderId: data.orderId,
                callerId: client.data.userId,
            });
        }
        else {
            client.emit('call_failed', { reason: 'Người dùng không trực tuyến' });
        }
    }
    handleCallAccepted(client, data) {
        const callerSocketId = this.connectedUsers.get(Number(data.callerId));
        if (callerSocketId) {
            this.server.to(callerSocketId).emit('call_accepted', { orderId: data.orderId });
        }
    }
    handleCallRejected(client, data) {
        const callerSocketId = this.connectedUsers.get(Number(data.callerId));
        if (callerSocketId) {
            this.server.to(callerSocketId).emit('call_rejected', {});
        }
    }
    handleOffer(client, data) {
        const receiverSocketId = this.connectedUsers.get(Number(data.receiverId));
        if (receiverSocketId) {
            this.server.to(receiverSocketId).emit('webrtc_offer', { sdp: data.sdp, callerId: client.data.userId });
        }
    }
    handleAnswer(client, data) {
        const callerSocketId = this.connectedUsers.get(Number(data.callerId));
        if (callerSocketId) {
            this.server.to(callerSocketId).emit('webrtc_answer', { sdp: data.sdp });
        }
    }
    handleIceCandidate(client, data) {
        const receiverSocketId = this.connectedUsers.get(Number(data.receiverId));
        if (receiverSocketId) {
            this.server.to(receiverSocketId).emit('ice_candidate', { candidate: data.candidate });
        }
    }
    handleCallEnded(client, data) {
        const receiverSocketId = this.connectedUsers.get(Number(data.receiverId));
        if (receiverSocketId) {
            this.server.to(receiverSocketId).emit('call_ended', {});
        }
    }
};
exports.OrdersGateway = OrdersGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], OrdersGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('update_gps'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], OrdersGateway.prototype, "handleGpsUpdate", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('join_order_room'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], OrdersGateway.prototype, "handleJoinRoom", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('send_message'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], OrdersGateway.prototype, "handleMessage", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('call_request'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], OrdersGateway.prototype, "handleCallRequest", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('call_accepted'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], OrdersGateway.prototype, "handleCallAccepted", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('call_rejected'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], OrdersGateway.prototype, "handleCallRejected", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('webrtc_offer'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], OrdersGateway.prototype, "handleOffer", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('webrtc_answer'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], OrdersGateway.prototype, "handleAnswer", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('ice_candidate'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], OrdersGateway.prototype, "handleIceCandidate", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('call_ended'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], OrdersGateway.prototype, "handleCallEnded", null);
exports.OrdersGateway = OrdersGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({ cors: true }),
    __metadata("design:paramtypes", [orders_service_1.OrdersService,
        jwt_1.JwtService])
], OrdersGateway);
//# sourceMappingURL=orders.gateway.js.map