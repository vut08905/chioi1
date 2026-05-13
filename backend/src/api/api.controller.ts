import { Controller, Get, Post, Patch, Put, Delete, Body, UseGuards, Request, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiService } from './api.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiBody } from '@nestjs/swagger';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { SubscribePackageDto } from './dto/subscribe-package.dto';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { ManageServiceDto } from './dto/manage-service.dto';
import { ManagePackageDto } from './dto/manage-package.dto';

@ApiTags('Data (Dịch vụ, Gói, Lịch sử)')
@ApiBearerAuth()
@Controller('api')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ApiController {
  constructor(private apiService: ApiService) {}

  @Put('users/profile')
  @Roles('CUSTOMER', 'TASKER')
  @ApiOperation({ summary: 'Cập nhật hồ sơ cá nhân' })
  @ApiBody({ type: UpdateProfileDto })
  async updateProfile(@Request() req, @Body() body: UpdateProfileDto) {
    return this.apiService.updateUserProfile(req.user.userId, {
      full_name: body.full_name,
      gender: body.gender,
      email: body.email,
      address: body.address,
      bio: body.bio,
    });
  }

  @Get('services')
  @Roles('CUSTOMER', 'ADMIN') // Tasker doesn't typically need this, but we can allow
  @ApiOperation({ summary: 'Lấy danh sách dịch vụ (Cần Token Customer/Admin)' })
  async getServices() {
    return this.apiService.getServices();
  }

  @Get('packages')
  @Roles('CUSTOMER', 'ADMIN')
  @ApiOperation({ summary: 'Lấy danh sách gói gia đình (Cần Token Customer/Admin)' })
  async getPackages() {
    return this.apiService.getPackages();
  }

  @Get('taskers/active')
  @Roles('CUSTOMER')
  @ApiOperation({ summary: 'Lấy danh sách Tasker đang online' })
  async getActiveTaskers(@Query('lat') lat?: string, @Query('lng') lng?: string) {
    const latNum = lat ? parseFloat(lat) : undefined;
    const lngNum = lng ? parseFloat(lng) : undefined;
    return this.apiService.getActiveTaskers(latNum, lngNum);
  }

  @Get('taskers/history')
  @Roles('TASKER')
  @ApiOperation({ summary: 'Lấy lịch sử đơn hàng của Tasker (Cần Token Tasker)' })
  async getTaskerHistory(@Request() req) {
    // req.user is set by JwtAuthGuard
    return this.apiService.getTaskerHistory(req.user.userId);
  }

  @Get('admin/dashboard')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Thống kê Admin Dashboard (Cần Token Admin)' })
  async getAdminDashboard() {
    return this.apiService.getAdminDashboard();
  }

  // --- Tasker APIs ---
  @Post('taskers/kyc')
  @Roles('TASKER')
  @ApiOperation({ summary: 'Nộp hồ sơ KYC Tasker' })
  async submitKyc(@Request() req, @Body() body: any) {
    return this.apiService.submitKyc(req.user.userId, body);
  }

  @Patch('taskers/status')
  @Roles('TASKER')
  @ApiOperation({ summary: 'Bật/Tắt trạng thái nhận việc Online' })
  async updateTaskerStatus(@Request() req, @Body('is_online') isOnline: boolean) {
    return this.apiService.updateTaskerStatus(req.user.userId, isOnline);
  }

  @Get('taskers/available-orders')
  @Roles('TASKER')
  @ApiOperation({ summary: 'Lấy danh sách đơn hàng PENDING mà Tasker có thể nhận' })
  async getAvailableOrders(@Request() req) {
    return this.apiService.getAvailableOrdersForTasker(req.user.userId);
  }

  @Get('taskers/all-services')
  @Roles('TASKER')
  @ApiOperation({ summary: 'Lấy danh sách tất cả dịch vụ (kèm trạng thái đăng ký của Tasker)' })
  async getAllServicesForTasker(@Request() req) {
    return this.apiService.getAllServicesForTasker(req.user.userId);
  }

  @Post('taskers/register-service')
  @Roles('TASKER')
  @ApiOperation({ summary: 'Tasker đăng ký thêm dịch vụ mới' })
  @ApiBody({ schema: { example: { service_id: 1 } } })
  async registerService(@Request() req, @Body('service_id', ParseIntPipe) serviceId: number) {
    return this.apiService.registerTaskerService(req.user.userId, serviceId);
  }

  // --- Support APIs ---
  @Post('support/tickets')
  @Roles('CUSTOMER', 'TASKER')
  @ApiOperation({ summary: 'Tạo ticket hỗ trợ/khiếu nại' })
  @ApiBody({ type: CreateTicketDto })
  async createTicket(@Request() req, @Body() body: CreateTicketDto) {
    return this.apiService.createTicket(req.user.userId, body.subject, body.description);
  }

  // --- Admin APIs ---
  @Patch('admin/taskers/:id/approve')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Duyệt hồ sơ Tasker (KYC)' })
  async approveTaskerKyc(@Request() req, @Param('id', ParseIntPipe) id: number, @Body('status') status: string) {
    return this.apiService.approveTaskerKyc(req.user.userId, id, status);
  }

  @Patch('admin/tasker-services/:taskerId/:serviceId/approve')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Duyệt dịch vụ đăng ký của Tasker (APPROVED / REJECTED)' })
  @ApiBody({ schema: { example: { status: 'APPROVED' } } })
  async approveTaskerService(
    @Request() req,
    @Param('taskerId', ParseIntPipe) taskerId: number,
    @Param('serviceId', ParseIntPipe) serviceId: number,
    @Body('status') status: string,
  ) {
    return this.apiService.approveTaskerService(req.user.userId, taskerId, serviceId, status);
  }

  @Get('admin/tasker-services')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Lấy danh sách đăng ký dịch vụ cần duyệt' })
  async getTaskerServicesPending() {
    return this.apiService.getTaskerServicesPending();
  }

  @Post('services')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Tạo dịch vụ mới' })
  @ApiBody({ type: ManageServiceDto })
  async createService(@Body() body: ManageServiceDto) {
    return this.apiService.manageService('CREATE', body);
  }

  @Put('services/:id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Cập nhật dịch vụ' })
  @ApiBody({ type: ManageServiceDto })
  async updateService(@Param('id', ParseIntPipe) id: number, @Body() body: ManageServiceDto) {
    return this.apiService.manageService('UPDATE', body, id);
  }

  @Delete('services/:id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Xóa dịch vụ' })
  async deleteService(@Param('id', ParseIntPipe) id: number) {
    return this.apiService.manageService('DELETE', {}, id);
  }

  @Post('packages/subscribe')
  @Roles('CUSTOMER')
  @ApiOperation({ summary: 'Khách hàng đăng ký gói gia đình' })
  @ApiBody({ type: SubscribePackageDto })
  async subscribePackage(@Request() req, @Body() body: SubscribePackageDto) {
    return this.apiService.subscribePackage(req.user.userId, body.package_id);
  }

  @Post('packages')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Tạo gói gia đình mới' })
  @ApiBody({ type: ManagePackageDto })
  async createPackage(@Body() body: ManagePackageDto) {
    return this.apiService.managePackage('CREATE', body);
  }

  @Put('packages/:id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Cập nhật gói gia đình' })
  @ApiBody({ type: ManagePackageDto })
  async updatePackage(@Param('id', ParseIntPipe) id: number, @Body() body: ManagePackageDto) {
    return this.apiService.managePackage('UPDATE', body, id);
  }

  @Delete('packages/:id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Xóa gói gia đình' })
  async deletePackage(@Param('id', ParseIntPipe) id: number) {
    return this.apiService.managePackage('DELETE', {}, id);
  }

  @Patch('admin/withdrawals/:id/approve')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Duyệt yêu cầu rút tiền' })
  async approveWithdrawal(@Request() req, @Param('id', ParseIntPipe) id: number, @Body('status') status: string) {
    return this.apiService.approveWithdrawal(req.user.userId, id, status);
  }

  @Patch('admin/tickets/:id/resolve')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Giải quyết khiếu nại' })
  async resolveTicket(@Request() req, @Param('id', ParseIntPipe) id: number, @Body('status') status: string) {
    return this.apiService.resolveTicket(req.user.userId, id, status);
  }

  @Get('admin/users')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Lấy danh sách Users' })
  async getAdminUsers() {
    return this.apiService.getAdminUsers();
  }

  @Get('admin/orders')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Lấy danh sách Orders' })
  async getAdminOrders() {
    return this.apiService.getAdminOrders();
  }

  @Patch('admin/orders/:id/cancel')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Admin can thiệp hủy đơn hàng (UC-AD-03)' })
  async adminCancelOrder(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.apiService.adminCancelOrder(req.user.userId, id);
  }

  @Get('admin/tickets')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Lấy danh sách khiếu nại/hỗ trợ (UC-AD-07)' })
  async getAdminTickets() {
    return this.apiService.getAdminTickets();
  }

  @Get('admin/withdrawals')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Lấy danh sách yêu cầu rút tiền (UC-AD-06)' })
  async getAdminWithdrawals() {
    return this.apiService.getAdminWithdrawals();
  }
}
