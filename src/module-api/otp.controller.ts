import { Body, Controller, Get, Param, Post } from "@nestjs/common";

import {
  OtpGeneratedRequest,
  OtpRequestRequest,
  OtpVerificationRequest,
} from "~/module-otp/models";
import { OtpService } from "~/module-otp/otp.service";

@Controller("api/otp")
export class OtpController {
  constructor(private readonly otpService: OtpService) {}

  @Post("generate")
  async generateOtp(@Body() request: OtpGeneratedRequest) {
    return this.otpService.generateOtp(request);
  }

  @Post("request")
  async requestOtp(@Body() request: OtpRequestRequest) {
    return this.otpService.requestOtp(request);
  }

  @Post("verify")
  async verifyOtp(@Body() request: OtpVerificationRequest) {
    return this.otpService.verifyOtp(request);
  }

  @Get("is-valid/:transaction_id")
  async isOtpValid(@Param("transaction_id") transactionId: string) {
    return this.otpService.isOtpValid(transactionId);
  }
}
