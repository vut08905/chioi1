import { Controller, Post, Body, Headers, Req, HttpCode, Logger } from '@nestjs/common';
import type { Request } from 'express';
import { ApiTags, ApiOperation, ApiExcludeEndpoint } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';

/**
 * Webhook endpoint nhận callback từ Casso/Sepay/VietQR khi user chuyển khoản thành công.
 * KHÔNG cần JWT — bảo vệ bằng signature/secret từ provider.
 *
 * URL công khai: POST /api/payments/webhook
 */
@ApiTags('Payments Webhook')
@Controller('api/payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(private readonly payments: PaymentsService) {}

  @Post('webhook')
  @HttpCode(200)
  @ApiExcludeEndpoint()
  @ApiOperation({ summary: 'Webhook nhận thông báo chuyển khoản từ ngân hàng (Casso/Sepay)' })
  async handleWebhook(
    @Body() body: any,
    @Headers() headers: Record<string, string>,
    @Req() req: Request,
  ) {
    const rawBody = JSON.stringify(body);

    if (!this.payments.verifyWebhook(headers, rawBody)) {
      this.logger.warn(`Webhook signature INVALID từ ${req.ip}`);
      return { ok: false, error: 'invalid_signature' };
    }

    const event = this.payments.parseWebhook(body);
    if (!event) {
      this.logger.warn(`Không parse được webhook payload: ${rawBody.slice(0, 200)}`);
      return { ok: false, error: 'unparseable_payload' };
    }

    this.logger.log(`Nhận webhook ${event.provider}: ${event.transactionCode} - ${event.amount}đ`);

    // TODO: Khi đã có credentials thật, kết nối với WalletsService:
    //   - Tìm transaction theo transactionCode (status = PENDING)
    //   - Kiểm tra amount khớp
    //   - Update transaction.status = COMPLETED
    //   - Cộng wallet.balance
    //   - Tạo notification cho user
    // Implementation sẽ được thêm vào Phase 2 khi swap mock → real provider.

    return { ok: true, received: event.transactionCode };
  }
}
