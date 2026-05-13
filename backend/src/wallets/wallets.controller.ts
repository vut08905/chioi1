import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { WalletsService } from './wallets.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiBody } from '@nestjs/swagger';

@ApiTags('Wallets (Ví điện tử)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/wallets')
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) {}

  @Get('balance')
  @ApiOperation({ summary: 'Lấy thông tin ví và số dư hiện tại' })
  async getBalance(@Request() req) {
    return this.walletsService.getWallet(req.user.userId);
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Lấy lịch sử giao dịch của ví' })
  async getTransactions(@Request() req) {
    return this.walletsService.getTransactions(req.user.userId);
  }

  @Post('deposit')
  @ApiOperation({ summary: 'Nạp tiền vào ví' })
  @ApiBody({ schema: { example: { amount: 100000 } } })
  async deposit(@Request() req, @Body('amount') amount: number) {
    return this.walletsService.deposit(req.user.userId, amount);
  }

  @Post('withdraw')
  @ApiOperation({ summary: 'Yêu cầu rút tiền từ ví' })
  @ApiBody({ schema: { example: { amount: 50000 } } })
  async withdraw(@Request() req, @Body('amount') amount: number) {
    return this.walletsService.withdraw(req.user.userId, amount);
  }
}
