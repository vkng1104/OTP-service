import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
} from "@nestjs/common";

import { Merchant } from "~/module-auth/guard/merchant.decorator";
import {
  InitiatePaymentDto,
  VerifyTransactionOtpDto,
} from "~/module-banking/model";
import { TransactionOtpService } from "~/module-banking/transaction-otp.service";
import { currencyFromString } from "~/module-banking/util";
import { UserService } from "~/module-user/user.service";

@Controller("api/transaction-otp")
export class TransactionOtpController {
  constructor(
    private readonly transactionOtpService: TransactionOtpService,
    private readonly userService: UserService,
  ) {}

  @Post("initiate")
  @HttpCode(HttpStatus.OK)
  @Merchant()
  async initiatePayment(
    @Body() initiatePaymentDto: InitiatePaymentDto,
  ): Promise<{ transaction_id: string; status: string }> {
    const user = await this.userService.byUsernameOrEmail(
      initiatePaymentDto.username,
    );

    const currency = currencyFromString(initiatePaymentDto.currency);

    if (!currency) {
      throw new BadRequestException(
        "Invalid currency or currency not supported",
      );
    }

    return await this.transactionOtpService.initiatePayment(
      user,
      initiatePaymentDto.merchant_id,
      initiatePaymentDto.merchant_name,
      initiatePaymentDto.amount,
      currency,
    );
  }

  @Post("verify")
  @HttpCode(HttpStatus.OK)
  @Merchant()
  async verifyTransactionOtp(
    @Body() verifyOtpDto: VerifyTransactionOtpDto,
  ): Promise<{ isValid: boolean }> {
    const user = await this.userService.byUsernameOrEmail(
      verifyOtpDto.username,
    );

    const isValid = await this.transactionOtpService.verifyTransactionOtp(
      user,
      verifyOtpDto.transaction_id,
      verifyOtpDto.otp,
      verifyOtpDto.order_metadata,
    );

    return { isValid };
  }
}
