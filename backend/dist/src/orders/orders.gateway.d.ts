import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { OrdersService } from './orders.service';
import { JwtService } from '@nestjs/jwt';
export declare class OrdersGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private ordersService;
    private jwtService;
    server: Server;
    private connectedUsers;
    constructor(ordersService: OrdersService, jwtService: JwtService);
    handleConnection(client: Socket): Promise<void>;
    handleDisconnect(client: Socket): void;
    handleGpsUpdate(client: Socket, data: {
        latitude: number;
        longitude: number;
    }): Promise<void>;
    notifyTaskersNewOrder(taskerIds: number[], order: any): void;
    notifyCustomerOrderAccepted(customerId: number, order: any): void;
    notifyCustomerOrderStatus(customerId: number, data: any): void;
    notifyTaskerOrderCancelled(taskerId: number, orderId: number): void;
    handleJoinRoom(client: Socket, data: {
        orderId: number;
    }): Promise<void>;
    handleMessage(client: Socket, data: {
        orderId: number;
        receiverId: number;
        content: string;
    }): Promise<void>;
    handleCallRequest(client: Socket, data: {
        orderId: number;
        receiverId: number;
    }): Promise<void>;
    handleCallAccepted(client: Socket, data: {
        orderId: number;
        callerId: number;
    }): void;
    handleCallRejected(client: Socket, data: {
        callerId: number;
    }): void;
    handleOffer(client: Socket, data: {
        receiverId: number;
        sdp: any;
    }): void;
    handleAnswer(client: Socket, data: {
        callerId: number;
        sdp: any;
    }): void;
    handleIceCandidate(client: Socket, data: {
        receiverId: number;
        candidate: any;
    }): void;
    handleCallEnded(client: Socket, data: {
        receiverId: number;
    }): void;
}
