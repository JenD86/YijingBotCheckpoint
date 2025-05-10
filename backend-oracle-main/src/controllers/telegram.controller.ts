import { Controller, Post, Body } from '@nestjs/common';
import { PaymentService } from '../services/payment.service';

@Controller('telegram')
export class TelegramController {
  constructor(private paymentService: PaymentService) {}

  @Post('create-invoice')
  async createInvoice(@Body() body: { amount: number }) {
    const invoice = await this.paymentService.createPayment(body.amount, 'stars');
    return invoice;
  }

  @Post('payment-callback')
  async handlePaymentCallback(@Body() update: any) {
    if (update.pre_checkout_query) {
      // Validate the payment before accepting
      return {
        ok: true,
        pre_checkout_query_id: update.pre_checkout_query.id
      };
    }

    if (update.message?.successful_payment) {
      // Process successful payment
      const payment = update.message.successful_payment;
      // Trigger the reading service
      return { ok: true };
    }
  }
}
