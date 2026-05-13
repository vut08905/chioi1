import { Controller, Post, Patch, Get, Body, Param, UseGuards, Request, ParseIntPipe } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { OrdersGateway } from './orders.gateway';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiBody } from '@nestjs/swagger';
import { BookOrderDto } from './dto/book-order.dto';
import { UpdateOrderStatusDto } from './dto/update-status.dto';
import { ReviewOrderDto } from './dto/review.dto';

@ApiTags('Orders (Đặt đơn, Nhận đơn)')
@ApiBearerAuth()
@Controller('api/orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  constructor(
    private ordersService: OrdersService,
    private ordersGateway: OrdersGateway
  ) {}

  @Post('book')
  @Roles('CUSTOMER')
  @ApiOperation({ summary: 'Đặt đơn mới (Cần Token Customer)' })
  @ApiBody({ type: BookOrderDto })
  async bookOrder(@Request() req, @Body() body: BookOrderDto) {
    const order = await this.ordersService.bookOrder(req.user.userId, body);
    
    // Find nearby taskers
    const nearbyTaskers = await this.ordersService.findNearbyTaskers(body.longitude, body.latitude);
    
    // Broadcast via Websocket to those specific taskers
    if (nearbyTaskers.length > 0) {
      const taskerIds = nearbyTaskers.map(t => t.tasker_id);
      this.ordersGateway.notifyTaskersNewOrder(taskerIds, order);
    }

    return { message: 'Order created and searching for taskers', order, nearbyTaskersCount: nearbyTaskers.length };
  }

  @Patch(':id/accept')
  @Roles('TASKER')
  @ApiOperation({ summary: 'Nhận đơn (Cần Token Tasker)' })
  async acceptOrder(@Request() req, @Param('id', ParseIntPipe) id: number) {
    const updatedOrder = await this.ordersService.acceptOrder(id, req.user.userId);
    
    // Notify customer that tasker accepted
    this.ordersGateway.notifyCustomerOrderAccepted(updatedOrder.customer_id, updatedOrder);
    
    return updatedOrder;
  }

  @Patch(':id/status')
  @Roles('TASKER')
  @ApiOperation({ summary: 'Cập nhật trạng thái đơn: TASKER_ARRIVED, IN_PROGRESS, COMPLETED (Cần Token Tasker)' })
  @ApiBody({ type: UpdateOrderStatusDto })
  async updateStatus(@Request() req, @Param('id', ParseIntPipe) id: number, @Body() body: UpdateOrderStatusDto) {
    const order = await this.ordersService.updateOrderStatus(id, req.user.userId, body.status);
    
    // Notify customer of status change
    this.ordersGateway.notifyCustomerOrderStatus(order.customer_id, { orderId: id, status: order.status });
    
    return order;
  }

  @Patch(':id/cancel')
  @Roles('CUSTOMER')
  @ApiOperation({ summary: 'Khách hàng Hủy đơn (Cần Token Customer)' })
  async cancelOrder(@Request() req, @Param('id', ParseIntPipe) id: number) {
    const order = await this.ordersService.cancelOrder(id, req.user.userId);
    
    // Notify tasker if assigned
    if (order.tasker_id) {
      this.ordersGateway.notifyTaskerOrderCancelled(order.tasker_id, order.order_id);
    }
    
    return { message: 'Order cancelled successfully', order };
  }

  @Post(':id/review')
  @Roles('CUSTOMER')
  @ApiOperation({ summary: 'Đánh giá Tasker sau khi hoàn thành đơn (Cần Token Customer)' })
  @ApiBody({ type: ReviewOrderDto })
  async reviewOrder(@Request() req, @Param('id', ParseIntPipe) id: number, @Body() body: ReviewOrderDto) {
    const review = await this.ordersService.reviewOrder(id, req.user.userId, body.rating, body.comment ?? '');
    return { message: 'Review submitted successfully', review };
  }

  @Get('customer/history')
  @Roles('CUSTOMER')
  @ApiOperation({ summary: 'Xem lịch sử đơn hàng của Khách hàng (Cần Token Customer)' })
  async getCustomerHistory(@Request() req) {
    return this.ordersService.getCustomerHistory(req.user.userId);
  }

  @Get('chat/:orderId')
  @Roles('CUSTOMER', 'TASKER')
  @ApiOperation({ summary: 'Lấy lịch sử chat của một đơn hàng' })
  async getChatHistory(@Param('orderId', ParseIntPipe) orderId: number) {
    return this.ordersService.getChatHistory(orderId);
  }

  @Get(':id')
  @Roles('CUSTOMER', 'TASKER')
  @ApiOperation({ summary: 'Lấy chi tiết đơn hàng theo ID' })
  async getOrderById(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.ordersService.getOrderById(id, req.user.userId);
  }
}
