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
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcrypt"));
const prisma = new client_1.PrismaClient();
async function seed() {
    const adminHash = await bcrypt.hash('admin123456', 10);
    const admin = await prisma.users.upsert({
        where: { phone: '0666666666' },
        update: {},
        create: { phone: '0666666666', password_hash: adminHash, full_name: 'Admin Quan Tri', role: 'ADMIN', status: 'ACTIVE' }
    });
    await prisma.admins.upsert({
        where: { admin_id: admin.user_id },
        update: {},
        create: { admin_id: admin.user_id, department: 'Ban Giam Doc', access_level: 'SUPER_ADMIN' }
    });
    const custHash = await bcrypt.hash('123456', 10);
    const cust = await prisma.users.upsert({
        where: { phone: '0901234567' },
        update: {},
        create: { phone: '0901234567', password_hash: custHash, full_name: 'Khach Hang VIP', role: 'CUSTOMER', status: 'ACTIVE' }
    });
    await prisma.customers.upsert({
        where: { customer_id: cust.user_id },
        update: {},
        create: { customer_id: cust.user_id, default_address: 'Vinhomes Central Park, Binh Thanh', loyalty_points: 150 }
    });
    await prisma.wallets.upsert({
        where: { user_id: cust.user_id },
        update: {},
        create: { user_id: cust.user_id, balance: 5000000 }
    });
    const taskerHash = await bcrypt.hash('123456', 10);
    const tasker = await prisma.users.upsert({
        where: { phone: '0909876543' },
        update: {},
        create: { phone: '0909876543', password_hash: taskerHash, full_name: 'Chi Lan Don Nha', role: 'TASKER', status: 'ACTIVE' }
    });
    await prisma.taskers.upsert({
        where: { tasker_id: tasker.user_id },
        update: {},
        create: { tasker_id: tasker.user_id, bio: 'Kinh nghiem 5 nam', kyc_status: 'VERIFIED', average_rating: 4.9, total_jobs: 120, is_online: true }
    });
    await prisma.wallets.upsert({
        where: { user_id: tasker.user_id },
        update: {},
        create: { user_id: tasker.user_id, balance: 2000000 }
    });
    const services = [
        { name: 'Don dep nha cua', description: 'Don dep tieu chuan 2 gio', base_price: 150000, icon_url: 'icon_cleaning.png' },
        { name: 'Trong tre', description: 'Giu tre so sinh va tre nho', base_price: 200000, icon_url: 'icon_babysitting.png' },
        { name: 'Nau an', description: 'Nau an gia dinh 3-4 nguoi', base_price: 180000, icon_url: 'icon_cooking.png' },
        { name: 'Di cho', description: 'Mua ho thuc pham theo yeu cau', base_price: 100000, icon_url: 'icon_shopping.png' },
        { name: 'Mua ho WinMart', description: 'Mua ho hang hoa tai WinMart', base_price: 120000, icon_url: 'icon_winmart.png' },
    ];
    for (const svc of services) {
        const existing = await prisma.services.findFirst({ where: { name: svc.name } });
        if (!existing) {
            await prisma.services.create({ data: svc });
        }
    }
    console.log('Seed completed!');
    await prisma.$disconnect();
}
seed().catch(console.error);
//# sourceMappingURL=seed.js.map