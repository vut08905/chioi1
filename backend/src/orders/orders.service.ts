import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WalletsService } from '../wallets/wallets.service';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private walletsService: WalletsService
  ) {}

  async bookOrder(customerId: number, data: any) {
    const orderCode = 'ORD' + Date.now().toString().slice(-6);

    // Insert order with PostGIS geometry using raw SQL
    // Bonus FIX: lưu cột notes (FE phải gửi 'notes' khớp BookOrderDto)
    const [order] = await this.prisma.$queryRaw<any[]>`
      INSERT INTO orders (
        order_code, customer_id, service_id, status, scheduled_time, address, total_price,
        tasker_earnings, platform_fee, payment_method, location, notes, created_at, updated_at
      ) VALUES (
        ${orderCode}, ${customerId}, ${data.service_id}, 'PENDING', ${new Date(data.scheduled_time)},
        ${data.address}, ${data.total_price}, ${data.total_price * 0.8}, ${data.total_price * 0.2},
        'CASH', ST_SetSRID(ST_MakePoint(${data.longitude}, ${data.latitude}), 4326), ${data.notes ?? null},
        NOW(), NOW()
      ) RETURNING order_id, order_code;
    `;

    return order;
  }

  async findNearbyTaskers(longitude: number, latitude: number, radiusMeters: number = 3000) {
    const taskers = await this.prisma.$queryRaw<any[]>`
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

  async updateTaskerLocation(taskerId: number, longitude: number, latitude: number) {
    await this.prisma.$executeRaw`
      UPDATE taskers 
      SET current_location = ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326),
          last_heartbeat = NOW()
      WHERE tasker_id = ${taskerId};
    `;
  }

  async acceptOrder(orderId: number, taskerId: number) {
    // ✅ FIX: Kiểm tra Tasker đang có đơn active không — chỉ cho nhận 1 đơn
    const activeOrder = await this.prisma.orders.findFirst({
      where: {
        tasker_id: taskerId,
        status: { in: ['ACCEPTED', 'TASKER_ARRIVED', 'IN_PROGRESS'] },
      },
    });

    if (activeOrder) {
      throw new BadRequestException(
        `Bạn đang có đơn hàng #${activeOrder.order_id} đang xử lý. Hoàn thành trước khi nhận đơn mới.`
      );
    }

    // ✅ FIX: Dùng transaction để tránh race condition (2 tasker cùng nhận 1 đơn)
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.orders.findUnique({ where: { order_id: orderId } });
      if (!order || order.status !== 'PENDING') {
        throw new BadRequestException('Đơn hàng không còn khả dụng hoặc đã được nhận');
      }

      return tx.orders.update({
        where: { order_id: orderId },
        data: {
          tasker_id: taskerId,
          status: 'ACCEPTED',
        },
        include: {
          taskers: { include: { users: true } },
        }
      });
    });
  }

  async updateOrderStatus(orderId: number, taskerId: number, status: string) {
    const order = await this.prisma.orders.findFirst({
      where: { order_id: orderId, tasker_id: taskerId },
    });

    if (!order) {
      throw new BadRequestException('Order not found or you are not assigned to this order');
    }

    const validTransitions: Record<string, string[]> = {
      'ACCEPTED': ['TASKER_ARRIVED', 'CANCELLED'],
      'TASKER_ARRIVED': ['IN_PROGRESS'],
      'IN_PROGRESS': ['COMPLETED'],
    };

    const currentStatus = order.status || '';

    if (!validTransitions[currentStatus] || !validTransitions[currentStatus].includes(status)) {
      throw new BadRequestException(`Cannot transition from ${currentStatus} to ${status}`);
    }

    const updatedOrder = await this.prisma.orders.update({
      where: { order_id: orderId },
      data: { status },
    });

    if (status === 'COMPLETED') {
      // Bug 3 FIX: Trừ tiền ví khách hàng khi đơn hoàn thành
      try {
        await this.walletsService.addTransaction(
          order.customer_id,
          -Number(order.total_price),
          'PAYMENT',
          order.order_id,
          'Thanh toán dịch vụ đơn hàng #' + order.order_id
        );
      } catch (e) {
        console.warn('[Order] Không trừ được tiền ví KH:', e.message);
      }

      if (order.payment_method === 'CASH') {
        await this.walletsService.addTransaction(
          order.tasker_id!,
          -Number(order.platform_fee),
          'FEE',
          order.order_id,
          'Thu phí nền tảng cho đơn hàng trả tiền mặt'
        );
      } else {
        await this.walletsService.addTransaction(
          order.tasker_id!,
          Number(order.tasker_earnings),
          'EARNING',
          order.order_id,
          'Thanh toán thu nhập đơn hàng'
        );
      }
    }

    return updatedOrder;
  }

  async cancelOrder(orderId: number, customerId: number) {
    const order = await this.prisma.orders.findFirst({
      where: { order_id: orderId, customer_id: customerId },
    });

    if (!order) {
      throw new BadRequestException('Order not found or does not belong to you');
    }

    const currentStatus = order.status || '';
    if (['IN_PROGRESS', 'COMPLETED', 'CANCELLED'].includes(currentStatus)) {
      throw new BadRequestException(`Cannot cancel order in status ${currentStatus}`);
    }

    return this.prisma.orders.update({
      where: { order_id: orderId },
      data: { status: 'CANCELLED' },
    });
  }

  async reviewOrder(orderId: number, customerId: number, rating: number, comment: string) {
    const order = await this.prisma.orders.findFirst({
      where: { order_id: orderId, customer_id: customerId, status: 'COMPLETED' },
    });

    if (!order || !order.tasker_id) {
      throw new BadRequestException('Order not eligible for review');
    }

    const existingReview = await this.prisma.reviews.findFirst({
      where: { order_id: orderId },
    });

    if (existingReview) {
      throw new BadRequestException('Order has already been reviewed');
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

    // Update average rating of tasker
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

  async getOrderById(orderId: number, userId: number) {
    const order = await this.prisma.orders.findFirst({
      where: { order_id: orderId, OR: [{ customer_id: userId }, { tasker_id: userId }] },
      include: {
        services: true,
        taskers: { include: { users: { select: { full_name: true, phone: true, avatar_url: true } } } },
        customers: { include: { users: { select: { full_name: true, phone: true } } } },
      },
    });
    if (!order) {
      throw new BadRequestException('Đơn hàng không tồn tại hoặc bạn không có quyền xem');
    }
    return order;
  }

  async getCustomerHistory(customerId: number) {
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

  async saveMessage(data: { order_id: number, sender_id: number, receiver_id: number, content: string }) {
    return this.prisma.messages.create({
      data: {
        order_id: data.order_id,
        sender_id: data.sender_id,
        receiver_id: data.receiver_id,
        content: data.content,
      }
    });
  }

  async getChatHistory(orderId: number) {
    return this.prisma.messages.findMany({
      where: { order_id: orderId },
      orderBy: { created_at: 'asc' }
    });
  }
}
