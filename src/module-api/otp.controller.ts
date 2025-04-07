import { Body, Controller, Post, Request, UseGuards } from "@nestjs/common";

import { JwtAuthGuard } from "~/module-auth/guard/jwt-auth.guard";
import { Roles } from "~/module-auth/guard/roles.decorator";
import {
  OtpGeneratedRequest,
  OtpRegisterRequest,
  OtpVerificationRequest,
} from "~/module-otp/model";
import { OtpService } from "~/module-otp/otp.service";
import { UserRole } from "~/module-user/constant";

@Controller("api/otp")
export class OtpController {
  constructor(private readonly otpService: OtpService) {}

  @Post("register-user")
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.USER)
  async registerUser(@Body() request: OtpRegisterRequest, @Request() req) {
    return this.otpService.registerUser(req.user.id, request);
  }

  @Post("generate")
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.USER)
  async generateOtp(@Body() request: OtpGeneratedRequest, @Request() req) {
    return this.otpService.generateOtp(req.user.id, request);
  }

  @Post("verify")
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.USER)
  async verifyOtp(@Body() request: OtpVerificationRequest, @Request() req) {
    return this.otpService.verifyOtp(req.user.id, request);
  }
}
