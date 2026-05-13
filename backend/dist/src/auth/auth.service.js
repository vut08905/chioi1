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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
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
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = __importStar(require("bcrypt"));
let AuthService = class AuthService {
    prisma;
    jwtService;
    constructor(prisma, jwtService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
    }
    async validateUser(phone, pass) {
        const user = await this.prisma.users.findUnique({ where: { phone } });
        if (user && await bcrypt.compare(pass, user.password_hash)) {
            const { password_hash, ...result } = user;
            return result;
        }
        return null;
    }
    async login(user) {
        const payload = { phone: user.phone, sub: user.user_id, role: user.role };
        let address = null;
        if (user.role === 'CUSTOMER') {
            const customer = await this.prisma.customers.findUnique({ where: { customer_id: user.user_id } });
            if (customer)
                address = customer.default_address;
        }
        return {
            access_token: this.jwtService.sign(payload),
            user: { ...user, address },
        };
    }
    async register(data) {
        const existingUser = await this.prisma.users.findUnique({ where: { phone: data.phone } });
        if (existingUser) {
            throw new common_1.BadRequestException('Phone number already exists');
        }
        const saltOrRounds = 10;
        const password_hash = await bcrypt.hash(data.password, saltOrRounds);
        const user = await this.prisma.users.create({
            data: {
                phone: data.phone,
                password_hash,
                full_name: data.full_name,
                role: data.role,
                status: 'ACTIVE',
            },
        });
        if (data.role === 'CUSTOMER') {
            await this.prisma.customers.create({
                data: { customer_id: user.user_id },
            });
        }
        else if (data.role === 'TASKER') {
            await this.prisma.taskers.create({
                data: { tasker_id: user.user_id },
            });
        }
        else if (data.role === 'ADMIN') {
            await this.prisma.admins.create({
                data: { admin_id: user.user_id, access_level: 'SUPPORT' },
            });
        }
        return this.login(user);
    }
    async requestPasswordReset(phone) {
        const user = await this.prisma.users.findUnique({ where: { phone } });
        if (!user) {
            throw new common_1.BadRequestException('User not found');
        }
        return {
            message: 'OTP sent to phone number',
            mock_otp: '123456'
        };
    }
    async resetPassword(data) {
        const user = await this.prisma.users.findUnique({ where: { phone: data.phone } });
        if (!user) {
            throw new common_1.BadRequestException('User not found');
        }
        if (data.otp !== '123456') {
            throw new common_1.BadRequestException('Invalid OTP');
        }
        const saltOrRounds = 10;
        const password_hash = await bcrypt.hash(data.new_password, saltOrRounds);
        await this.prisma.users.update({
            where: { phone: data.phone },
            data: { password_hash },
        });
        return { message: 'Password reset successfully' };
    }
    async changePassword(userId, currentPassword, newPassword) {
        if (!currentPassword || !newPassword) {
            throw new common_1.BadRequestException('Vui lòng nhập đầy đủ mật khẩu cũ và mới');
        }
        if (newPassword.length < 6) {
            throw new common_1.BadRequestException('Mật khẩu mới phải ít nhất 6 ký tự');
        }
        const user = await this.prisma.users.findUnique({ where: { user_id: userId } });
        if (!user) {
            throw new common_1.BadRequestException('Người dùng không tồn tại');
        }
        const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
        if (!isMatch) {
            throw new common_1.BadRequestException('Mật khẩu hiện tại không đúng');
        }
        const saltOrRounds = 10;
        const password_hash = await bcrypt.hash(newPassword, saltOrRounds);
        await this.prisma.users.update({
            where: { user_id: userId },
            data: { password_hash, updated_at: new Date() },
        });
        return { message: 'Đổi mật khẩu thành công' };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map