import { Body, Controller, Post } from "@nestjs/common";

import {
  OtpGeneratedRequest,
  OtpRegisterRequest,
  OtpVerificationRequest,
} from "~/module-otp/models";
import { OtpService } from "~/module-otp/otp.service";

@Controller("api/otp")
export class OtpController {
  constructor(private readonly otpService: OtpService) {}

  @Post("register-user")
  async registerUser(@Body() request: OtpRegisterRequest) {
    return this.otpService.registerUser(request);
  }

  @Post("generate")
  async generateOtp(@Body() request: OtpGeneratedRequest) {
    return this.otpService.generateOtp(request);
  }

  @Post("verify")
  async verifyOtp(@Body() request: OtpVerificationRequest) {
    return this.otpService.verifyOtp(request);
  }
}
