import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ApiService {
  constructor(private prisma: PrismaService) {}

  // --- User Profile ---
  async updateUserProfile(userId: number, data: { full_name?: string; gender?: string; email?: string; address?: string; bio?: string }) {
    // Input validation
    if (data.full_name !== undefined && (typeof data.full_name !== 'string' || data.full_name.trim().length === 0)) {
      throw new BadRequestException('Họ tên không được để trống');
    }
    if (data.full_name && data.full_name.length > 100) {
      throw new BadRequestException('Họ tên tối đa 100 ký tự');
    }
    if (data.gender !== undefined && !['male', 'female', 'other', ''].includes(data.gender)) {
      throw new BadRequestException('Giới tính không hợp lệ');
    }
    if (data.email !== undefined && data.email !== '' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      throw new BadRequestException('Email không hợp lệ');
    }
    if (data.bio !== undefined && typeof data.bio === 'string' && data.bio.length > 500) {
      throw new BadRequestException('Mô tả bản thân tối đa 500 ký tự');
    }

    // Build update data for users table
    const updateData: any = { updated_at: new Date() };
    if (data.full_name !== undefined) updateData.full_name = data.full_name.trim();
    if (data.email !== undefined) updateData.email = data.email.trim() || null;
    if (data.gender !== undefined) updateData.gender = data.gender || null;

    const user = await this.prisma.users.update({
      where: { user_id: userId },
      data: updateData,
      select: { user_id: true, phone: true, full_name: true, email: true, gender: true, avatar_url: true, role: true, status: true, created_at: true },
    });

    // Update customer address if provided
    if (data.address !== undefined) {
      await this.prisma.customers.updateMany({
        where: { customer_id: userId },
        data: { default_address: data.address.trim() },
      });
    }

    // Bug 6 FIX: Update tasker bio if provided
    if (data.bio !== undefined) {
      await this.prisma.taskers.updateMany({
        where: { tasker_id: userId },
        data: { bio: data.bio.trim() },
      });
    }

    // Bug 5.1+6.3 FIX: Update tasker address if provided (cần migration thêm column taskers.address)
    if (data.address !== undefined) {
      await this.prisma.taskers.updateMany({
        where: { tasker_id: userId },
        data: { address: data.address.trim() },
      });
    }

    // Fetch address for response
    const customer = await this.prisma.customers.findUnique({ where: { customer_id: userId } });
    // Fetch tasker bio + address for response
    const tasker = await this.prisma.taskers.findUnique({ where: { tasker_id: userId } });

    const resolvedAddress = customer?.default_address || tasker?.address || data.address || null;
    return { ...user, address: resolvedAddress, bio: tasker?.bio || data.bio || null };
  }

  async getServices() {
    return this.prisma.services.findMany({ where: { is_active: true } });
  }

  // --- Package Subscription (Lỗi 7 FIX) ---
  async subscribePackage(userId: number, packageId: number) {
    if (!packageId || isNaN(packageId)) {
      throw new BadRequestException('Package ID không hợp lệ');
    }

    // Lấy thông tin gói
    const pkg = await this.prisma.family_packages.findUnique({ where: { package_id: packageId } });
    if (!pkg || !pkg.is_active) {
      throw new BadRequestException('Gói không tồn tại hoặc đã ngưng');
    }

    // Lấy ví
    const wallet = await this.prisma.wallets.findUnique({ where: { user_id: userId } });
    if (!wallet) {
      throw new BadRequestException('Ví không tồn tại. Vui lòng liên hệ hỗ trợ.');
    }

    const price = Number(pkg.price);
    const balance = Number(wallet.balance);

    if (balance < price) {
      throw new BadRequestException('Số dư không đủ. Cần ' + price + ' nhưng chỉ có ' + balance);
    }

    // Trừ tiền + tạo gói trong transaction
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + (pkg.duration_days || 30));

    const [updatedWallet, subscription, transaction] = await this.prisma.$transaction([
      this.prisma.wallets.update({
        where: { wallet_id: wallet.wallet_id },
        data: { balance: { decrement: price }, updated_at: new Date() },
      }),
      this.prisma.customer_packages.create({
        data: {
          customer_id: userId,
          package_id: packageId,
          start_date: startDate,
          end_date: endDate,
          status: 'ACTIVE',
        },
      }),
      this.prisma.transactions.create({
        data: {
          transaction_code: `PKG${Date.now()}`,
          wallet_id: wallet.wallet_id,
          amount: price,
          type: 'PAYMENT',
          status: 'COMPLETED',
          description: 'Đăng ký gói ' + pkg.name,
        },
      }),
    ]);

    return {
      message: 'Đăng ký gói thành công',
      subscription,
      wallet: { balance: updatedWallet.balance },
    };
  }

  async getPackages() {
    return this.prisma.family_packages.findMany({ where: { is_active: true } });
  }

  async getTaskerHistory(taskerId: number) {
    return this.prisma.orders.findMany({
      where: { tasker_id: taskerId },
      include: { services: true, customers: { include: { users: true } } },
      orderBy: { created_at: 'desc' },
    });
  }

  async getActiveTaskers(lat?: number, lng?: number) {
    const activeTaskers = await this.prisma.users.findMany({
      where: { role: 'TASKER', taskers: { is_online: true, kyc_status: 'VERIFIED' } },
      include: { taskers: { include: { tasker_services: { include: { services: { select: { name: true } } } } } } },
      take: 20,
    });

    if (lat !== undefined && lng !== undefined) {
      const distances = await this.prisma.$queryRaw<any[]>`
        SELECT tasker_id, ST_DistanceSphere(current_location, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)) as distance
        FROM taskers WHERE is_online = true AND current_location IS NOT NULL
      `;
      const distanceMap = new Map();
      distances.forEach(d => distanceMap.set(d.tasker_id, d.distance));

      return activeTaskers.map(t => ({
        ...t,
        distance: distanceMap.get(t.user_id) || null
      }));
    }

    return activeTaskers;
  }

  async getAdminDashboard() {
    const totalOrders = await this.prisma.orders.count();
    const totalRevenueResult = await this.prisma.orders.aggregate({
      _sum: { total_price: true },
      where: { status: 'COMPLETED' },
    });
    
    return {
      total_orders: totalOrders,
      total_revenue: totalRevenueResult._sum.total_price || 0,
    };
  }

  // --- Tasker APIs ---
  async submitKyc(taskerId: number, kycData: any) {
    return this.prisma.taskers.update({
      where: { tasker_id: taskerId },
      data: { kyc_status: 'PENDING_APPROVAL' },
    });
  }

  async updateTaskerStatus(taskerId: number, isOnline: boolean) {
    return this.prisma.taskers.update({
      where: { tasker_id: taskerId },
      data: { is_online: isOnline },
    });
  }

  // --- Support APIs ---
  async createTicket(userId: number, subject: string, description: string) {
    return this.prisma.support_tickets.create({
      data: {
        ticket_code: `TCK${Date.now()}`,
        user_id: userId,
        subject,
        description,
        status: 'OPEN',
      },
    });
  }

  // --- Admin APIs ---
  async approveTaskerKyc(adminId: number, taskerId: number, status: string) {
    const tasker = await this.prisma.taskers.update({
      where: { tasker_id: taskerId },
      data: { kyc_status: status }, // 'VERIFIED' or 'REJECTED'
    });
    
    // Log admin action
    await this.prisma.admin_audit_logs.create({
      data: {
        admin_id: adminId,
        action: 'APPROVE_KYC',
        target_table: 'taskers',
        target_id: taskerId,
        new_data: { kyc_status: status }
      }
    });

    return tasker;
  }

  async approveTaskerService(adminId: number, taskerId: number, serviceId: number, status: string) {
    if (!['APPROVED', 'REJECTED'].includes(status)) {
      throw new BadRequestException('Status phải là APPROVED hoặc REJECTED');
    }

    const record = await this.prisma.tasker_services.findUnique({
      where: { tasker_id_service_id: { tasker_id: taskerId, service_id: serviceId } },
    });
    if (!record) {
      throw new BadRequestException('Không tìm thấy đăng ký dịch vụ này');
    }

    const updated = await this.prisma.tasker_services.update({
      where: { tasker_id_service_id: { tasker_id: taskerId, service_id: serviceId } },
      data: { status },
    });

    // Ghi audit log (best-effort, không block nếu FK fail)
    try {
      await this.prisma.admin_audit_logs.create({
        data: {
          admin_id: adminId,
          action: 'APPROVE_TASKER_SERVICE',
          target_table: 'tasker_services',
          target_id: taskerId,
          new_data: { service_id: serviceId, status },
        },
      });
    } catch (e) {
      console.warn('[AuditLog] Không ghi được audit log:', e.message);
    }

    return updated;
  }

  async getTaskerServicesPending() {
    return this.prisma.tasker_services.findMany({
      where: { status: 'PENDING_APPROVAL' },
      include: {
        services: { select: { name: true, service_id: true } },
        taskers: { include: { users: { select: { full_name: true, phone: true } } } },
      },
    });
  }

  async manageService(action: string, data: any, serviceId?: number) {
    if (action === 'CREATE') {
      return this.prisma.services.create({ data });
    } else if (action === 'UPDATE') {
      return this.prisma.services.update({ where: { service_id: serviceId }, data });
    } else if (action === 'DELETE') {
      return this.prisma.services.delete({ where: { service_id: serviceId } });
    }
  }

  async managePackage(action: string, data: any, packageId?: number) {
    if (action === 'CREATE') {
      return this.prisma.family_packages.create({ data });
    } else if (action === 'UPDATE') {
      return this.prisma.family_packages.update({ where: { package_id: packageId }, data });
    } else if (action === 'DELETE') {
      return this.prisma.family_packages.delete({ where: { package_id: packageId } });
    }
  }

  async approveWithdrawal(adminId: number, transactionId: number, status: string) {
    // status should be 'COMPLETED' or 'FAILED'
    const transaction = await this.prisma.transactions.update({
      where: { transaction_id: transactionId },
      data: { status },
    });

    if (status === 'FAILED') {
      // refund the wallet
      await this.prisma.wallets.update({
        where: { wallet_id: transaction.wallet_id },
        data: { balance: { increment: transaction.amount } }
      });
    }

    return transaction;
  }

  async resolveTicket(adminId: number, ticketId: number, status: string) {
    return this.prisma.support_tickets.update({
      where: { ticket_id: ticketId },
      data: { status, admin_id: adminId, updated_at: new Date() }
    });
  }

  async getAdminUsers() {
    return this.prisma.users.findMany({
      select: { 
        user_id: true, 
        phone: true, 
        full_name: true, 
        role: true, 
        status: true, 
        created_at: true,
        taskers: true // Include tasker relation
      }
    });
  }

  async getAdminOrders() {
    return this.prisma.orders.findMany({
      orderBy: { created_at: 'desc' },
      take: 100 // limit for performance
    });
  }

  async adminCancelOrder(adminId: number, orderId: number) {
    const order = await this.prisma.orders.update({
      where: { order_id: orderId },
      data: { status: 'CANCELLED', updated_at: new Date() }
    });

    await this.prisma.admin_audit_logs.create({
      data: {
        admin_id: adminId,
        action: 'FORCE_CANCEL_ORDER',
        target_table: 'orders',
        target_id: orderId,
        new_data: { status: 'CANCELLED' }
      }
    });

    return order;
  }

  async getAdminTickets() {
    return this.prisma.support_tickets.findMany({
      include: { users: true },
      orderBy: { created_at: 'desc' }
    });
  }

  async getAdminWithdrawals() {
    return this.prisma.transactions.findMany({
      where: { type: 'WITHDRAWAL' },
      orderBy: { created_at: 'desc' }
    });
  }

  // --- Tasker: Available Pending Orders ---
  async getAvailableOrdersForTasker(taskerId: number) {
    // Get tasker's registered and approved services
    const taskerServices = await this.prisma.tasker_services.findMany({
      where: { tasker_id: taskerId, status: 'APPROVED' },
      select: { service_id: true },
    });
    const serviceIds = taskerServices.map(ts => ts.service_id);
    if (serviceIds.length === 0) return [];

    return this.prisma.orders.findMany({
      where: {
        status: 'PENDING',
        service_id: { in: serviceIds },
        tasker_id: null,
      },
      include: {
        services: true,
        customers: { include: { users: { select: { full_name: true } } } },
      },
      orderBy: { created_at: 'desc' },
      take: 20,
    });
  }

  // --- Tasker: Get All Services with registration status ---
  async getAllServicesForTasker(taskerId: number) {
    const allServices = await this.prisma.services.findMany({ where: { is_active: true } });
    const registered = await this.prisma.tasker_services.findMany({
      where: { tasker_id: taskerId },
      select: { service_id: true, status: true },
    });
    const regMap = new Map<number, string>();
    registered.forEach(r => regMap.set(r.service_id, r.status || 'PENDING_APPROVAL'));

    return allServices.map(s => ({
      ...s,
      is_registered: regMap.has(s.service_id),
      registration_status: regMap.get(s.service_id) || null,
    }));
  }

  // --- Tasker: Register for a service ---
  async registerTaskerService(taskerId: number, serviceId: number) {
    if (!serviceId || isNaN(serviceId)) {
      throw new BadRequestException('Service ID không hợp lệ');
    }

    const service = await this.prisma.services.findUnique({ where: { service_id: serviceId } });
    if (!service || !service.is_active) {
      throw new BadRequestException('Dịch vụ không tồn tại hoặc đã ngưng');
    }

    // Check if already registered
    const existing = await this.prisma.tasker_services.findUnique({
      where: { tasker_id_service_id: { tasker_id: taskerId, service_id: serviceId } },
    });
    if (existing) {
      throw new BadRequestException('Bạn đã đăng ký dịch vụ này rồi');
    }

    return this.prisma.tasker_services.create({
      data: {
        tasker_id: taskerId,
        service_id: serviceId,
        status: 'PENDING_APPROVAL',
      },
    });
  }
}
