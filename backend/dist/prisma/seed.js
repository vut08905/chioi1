"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcrypt"));
const pg_1 = require("pg");
const adapter_pg_1 = require("@prisma/adapter-pg");
const pool = new pg_1.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new adapter_pg_1.PrismaPg(pool);
const prisma = new client_1.PrismaClient({ adapter });
async function main() {
    const passwordHash = await bcrypt.hash('123456', 10);
    const customer = await prisma.users.upsert({
        where: { phone: '0901234567' },
        update: { password_hash: passwordHash, role: 'CUSTOMER' },
        create: {
            phone: '0901234567',
            password_hash: passwordHash,
            full_name: 'Khách Hàng VIP',
            role: 'CUSTOMER',
            customers: {
                create: {
                    default_address: '123 Đường ABC, Quận 1, TP.HCM',
                },
            },
            wallets: {
                create: { balance: 5000000 },
            },
        },
    });
    const tasker = await prisma.users.upsert({
        where: { phone: '0909876543' },
        update: {
            password_hash: passwordHash,
            role: 'TASKER',
            taskers: {
                update: {
                    kyc_status: 'VERIFIED',
                }
            }
        },
        create: {
            phone: '0909876543',
            password_hash: passwordHash,
            full_name: 'Chị Lan Dọn Nhà',
            role: 'TASKER',
            taskers: {
                create: {
                    kyc_status: 'VERIFIED',
                    bio: 'Chuyên gia dọn dẹp',
                },
            },
            wallets: {
                create: { balance: 0 },
            },
        },
    });
    const admin = await prisma.users.upsert({
        where: { phone: '0901111111' },
        update: { password_hash: passwordHash, role: 'ADMIN' },
        create: {
            phone: '0901111111',
            password_hash: passwordHash,
            full_name: 'Admin Quản Trị',
            role: 'ADMIN',
            admins: {
                create: {
                    department: 'Operations',
                    access_level: 'SUPER_ADMIN',
                },
            },
        },
    });
    console.log('✅ Đã tạo 3 tài khoản mẫu thành công:');
    console.log('Khách hàng:', customer.phone);
    console.log('Tasker:', tasker.phone);
    console.log('Admin:', admin.phone);
    console.log('Seeding Services...');
    const servicesData = [
        { name: 'Dọn dẹp nhà', base_price: 100000, icon_url: 'cleaning_services' },
        { name: 'Gói tháng', base_price: 500000, icon_url: 'calendar_month' },
        { name: 'Trông trẻ', base_price: 150000, icon_url: 'child_care' },
        { name: 'Mua hộ WinMart', base_price: 50000, icon_url: 'shopping_cart' }
    ];
    const createdServices = [];
    for (const s of servicesData) {
        const svc = await prisma.services.findFirst({ where: { name: s.name } });
        if (!svc) {
            createdServices.push(await prisma.services.create({ data: s }));
        }
        else {
            createdServices.push(svc);
        }
    }
    const tasker2 = await prisma.users.upsert({
        where: { phone: '0901112222' },
        update: {
            password_hash: passwordHash, role: 'TASKER',
            taskers: { update: { kyc_status: 'VERIFIED', is_online: true } }
        },
        create: {
            phone: '0901112222', password_hash: passwordHash, full_name: 'Nguyễn Lan (Dọn Nhà)', role: 'TASKER',
            taskers: { create: { kyc_status: 'VERIFIED', bio: 'Nhanh nhẹn, sạch sẽ', is_online: true, average_rating: 4.8 } },
            wallets: { create: { balance: 0 } },
        },
    });
    console.log('Seeding Orders...');
    const existingOrder = await prisma.orders.findFirst({ where: { order_code: 'DH20261020-001' } });
    if (!existingOrder) {
        await prisma.orders.create({
            data: {
                order_code: 'DH20261020-001',
                customer_id: customer.user_id,
                tasker_id: tasker.user_id,
                service_id: createdServices[0].service_id,
                status: 'COMPLETED',
                scheduled_time: new Date(),
                address: '123 Đường ABC, Quận 1',
                total_price: 150000,
                tasker_earnings: 120000,
                platform_fee: 30000,
            }
        });
        await prisma.orders.create({
            data: {
                order_code: 'DH20261020-002',
                customer_id: customer.user_id,
                service_id: createdServices[2].service_id,
                status: 'PENDING',
                scheduled_time: new Date(),
                address: '456 Lê Lợi, Quận 1',
                total_price: 150000,
                tasker_earnings: 120000,
                platform_fee: 30000,
            }
        });
    }
    console.log('✅ Seed data successfully added!');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map