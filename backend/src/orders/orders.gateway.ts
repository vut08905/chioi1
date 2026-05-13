import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { OrdersService } from './orders.service';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({ cors: true })
export class OrdersGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // Store connected clients: Map<userId, socketId>
  private connectedUsers = new Map<number, string>();

  constructor(
    private ordersService: OrdersService,
    private jwtService: JwtService
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token || client.handshake.headers['authorization'];
      if (!token) {
        client.disconnect();
        return;
      }
      
      const payload = this.jwtService.verify(token.replace('Bearer ', ''), { secret: process.env.JWT_SECRET || 'super-secret' });
      const userId = Number(payload.sub);
      this.connectedUsers.set(userId, client.id);
      
      // Store userId in socket
      client.data.userId = userId;
      client.data.role = payload.role;
    } catch (e) {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    if (client.data.userId) {
      this.connectedUsers.delete(Number(client.data.userId));
    }
  }

  @SubscribeMessage('update_gps')
  async handleGpsUpdate(@ConnectedSocket() client: Socket, @MessageBody() data: { latitude: number, longitude: number }) {
    if (client.data.role === 'TASKER') {
      await this.ordersService.updateTaskerLocation(client.data.userId, data.longitude, data.latitude);
    }
  }

  notifyTaskersNewOrder(taskerIds: number[], order: any) {
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

  notifyCustomerOrderAccepted(customerId: number, order: any) {
    const socketId = this.connectedUsers.get(Number(customerId));
    if (socketId) {
      this.server.to(socketId).emit('order_accepted', {
        message: 'Tasker đã nhận đơn của bạn',
        order,
      });
    }
  }

  notifyCustomerOrderStatus(customerId: number, data: any) {
    const socketId = this.connectedUsers.get(Number(customerId));
    if (socketId) {
      this.server.to(socketId).emit('order_status_updated', {
        message: `Đơn hàng của bạn đã chuyển sang trạng thái: ${data.status}`,
        data,
      });
    }
  }

  notifyTaskerOrderCancelled(taskerId: number, orderId: number) {
    const socketId = this.connectedUsers.get(Number(taskerId));
    if (socketId) {
      this.server.to(socketId).emit('order_cancelled', {
        message: 'Rất tiếc, Khách hàng đã hủy đơn',
        orderId,
      });
    }
  }

  // ===== BƯỚC 1.2: Join order room — xác thực user thuộc đơn hàng =====
  @SubscribeMessage('join_order_room')
  async handleJoinRoom(@ConnectedSocket() client: Socket, @MessageBody() data: { orderId: number }) {
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
    } catch (e) {
      client.emit('error', { message: 'Không thể tham gia phòng chat' });
    }
  }

  // ===== BƯỚC 1.1: Send message — xác thực + room broadcast + confirm =====
  @SubscribeMessage('send_message')
  async handleMessage(@ConnectedSocket() client: Socket, @MessageBody() data: { orderId: number, receiverId: number, content: string }) {
    // Bước 1.1: Xác thực quyền chat theo orderId
    try {
      const order = await this.ordersService.getOrderById(data.orderId, client.data.userId);
      if (!order) {
        client.emit('error', { message: 'Bạn không có quyền chat trong đơn hàng này' });
        return;
      }
    } catch (e) {
      client.emit('error', { message: 'Đơn hàng không tồn tại' });
      return;
    }

    // Save to DB
    const message = await this.ordersService.saveMessage({
      order_id: data.orderId,
      sender_id: client.data.userId,
      receiver_id: data.receiverId,
      content: data.content,
    });

    // Broadcast to order room (chỉ gửi cho người KHÁC trong room, không gửi lại sender)
    const roomName = `order_${data.orderId}`;
    client.broadcast.to(roomName).emit('receive_message', message);

    // Gửi confirm cho sender riêng (tick "đã gửi")
    client.emit('message_sent', { ...message, status: 'sent' });
  }

  // ===== BƯỚC 2.1: WebRTC Voice Call Signaling =====

  // 1. Yêu cầu gọi điện
  @SubscribeMessage('call_request')
  async handleCallRequest(@ConnectedSocket() client: Socket, @MessageBody() data: { orderId: number, receiverId: number }) {
    // Xác thực user thuộc đơn hàng
    try {
      const order = await this.ordersService.getOrderById(data.orderId, client.data.userId);
      if (!order) {
        client.emit('call_failed', { reason: 'Bạn không thuộc đơn hàng này' });
        return;
      }
    } catch (e) {
      client.emit('call_failed', { reason: 'Đơn hàng không tồn tại' });
      return;
    }

    const receiverSocketId = this.connectedUsers.get(Number(data.receiverId));
    if (receiverSocketId) {
      this.server.to(receiverSocketId).emit('call_incoming', {
        orderId: data.orderId,
        callerId: client.data.userId,
      });
    } else {
      client.emit('call_failed', { reason: 'Người dùng không trực tuyến' });
    }
  }

  // 2. Chấp nhận cuộc gọi
  @SubscribeMessage('call_accepted')
  handleCallAccepted(@ConnectedSocket() client: Socket, @MessageBody() data: { orderId: number, callerId: number }) {
    const callerSocketId = this.connectedUsers.get(Number(data.callerId));
    if (callerSocketId) {
      this.server.to(callerSocketId).emit('call_accepted', { orderId: data.orderId });
    }
  }

  // 3. Từ chối cuộc gọi
  @SubscribeMessage('call_rejected')
  handleCallRejected(@ConnectedSocket() client: Socket, @MessageBody() data: { callerId: number }) {
    const callerSocketId = this.connectedUsers.get(Number(data.callerId));
    if (callerSocketId) {
      this.server.to(callerSocketId).emit('call_rejected', {});
    }
  }

  // 4. WebRTC SDP Exchange — Offer
  @SubscribeMessage('webrtc_offer')
  handleOffer(@ConnectedSocket() client: Socket, @MessageBody() data: { receiverId: number, sdp: any }) {
    const receiverSocketId = this.connectedUsers.get(Number(data.receiverId));
    if (receiverSocketId) {
      this.server.to(receiverSocketId).emit('webrtc_offer', { sdp: data.sdp, callerId: client.data.userId });
    }
  }

  // 5. WebRTC SDP Exchange — Answer
  @SubscribeMessage('webrtc_answer')
  handleAnswer(@ConnectedSocket() client: Socket, @MessageBody() data: { callerId: number, sdp: any }) {
    const callerSocketId = this.connectedUsers.get(Number(data.callerId));
    if (callerSocketId) {
      this.server.to(callerSocketId).emit('webrtc_answer', { sdp: data.sdp });
    }
  }

  // 6. ICE Candidate
  @SubscribeMessage('ice_candidate')
  handleIceCandidate(@ConnectedSocket() client: Socket, @MessageBody() data: { receiverId: number, candidate: any }) {
    const receiverSocketId = this.connectedUsers.get(Number(data.receiverId));
    if (receiverSocketId) {
      this.server.to(receiverSocketId).emit('ice_candidate', { candidate: data.candidate });
    }
  }

  // 7. Kết thúc cuộc gọi
  @SubscribeMessage('call_ended')
  handleCallEnded(@ConnectedSocket() client: Socket, @MessageBody() data: { receiverId: number }) {
    const receiverSocketId = this.connectedUsers.get(Number(data.receiverId));
    if (receiverSocketId) {
      this.server.to(receiverSocketId).emit('call_ended', {});
    }
  }
}
