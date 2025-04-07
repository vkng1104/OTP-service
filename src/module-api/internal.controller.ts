import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";

import { JwtAuthGuard } from "~/module-auth/guard/jwt-auth.guard";
import { Roles } from "~/module-auth/guard/roles.decorator";
import {
  BlacklistUserRequest,
  FundUserWalletRequest,
  GrantRoleRequest,
  RefundToAdminWalletRequest,
  RemoveUserFromBlacklistRequest,
  ResetManyOtpsRequest,
} from "~/module-otp/model";
import { OtpService } from "~/module-otp/otp.service";
import { UserRole } from "~/module-user/constant";

@Controller("api/internal")
export class InternalController {
  constructor(private readonly otpService: OtpService) {}

  @Get("user-wallet-balance/:user_wallet_address")
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.SUPER_ADMIN)
  async getUserWalletBalance(
    @Param("user_wallet_address") user_wallet_address: string,
  ) {
    return this.otpService.getUserWalletBalance(user_wallet_address);
  }

  @Post("refund-to-admin-wallet")
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.SUPER_ADMIN)
  async refundToAdminWallet(@Body() request: RefundToAdminWalletRequest) {
    return this.otpService.refundToAdminWallet(
      request.user_id,
      request.amount_in_eth,
      request.admin_wallet_address,
    );
  }

  @Post("fund-user-wallet")
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.SUPER_ADMIN)
  async fundUserWallet(@Body() request: FundUserWalletRequest) {
    return this.otpService.fundUserWallet(
      request.user_wallet_address,
      request.amount_in_eth,
    );
  }

  @Get("check-role/:wallet_address/:role")
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.SUPER_ADMIN)
  async checkRole(
    @Param("wallet_address") wallet_address: string,
    @Param("role") role: string,
  ) {
    return this.otpService.checkRole(wallet_address, role);
  }

  @Post("grant-role")
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.SUPER_ADMIN)
  async grantRole(@Body() request: GrantRoleRequest) {
    return this.otpService.grantRole(request.role, request.wallet_address);
  }

  @Post("blacklist-user")
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.SUPER_ADMIN)
  async blacklistUser(@Body() request: BlacklistUserRequest) {
    return this.otpService.blacklistUser(request.user_id);
  }

  @Post("remove-user-from-blacklist")
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.SUPER_ADMIN)
  async removeUserFromBlacklist(
    @Body() request: RemoveUserFromBlacklistRequest,
  ) {
    return this.otpService.removeFromBlacklist(request.user_id);
  }

  @Post("reset-many-otps")
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.SUPER_ADMIN)
  async resetManyOtps(@Body() request: ResetManyOtpsRequest) {
    return this.otpService.resetManyOtps(request.user_ids);
  }

  @Get("view-otp-data/:user_id")
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.SUPER_ADMIN)
  async viewOtpData(@Param("user_id") user_id: string) {
    return this.otpService.viewOtpData(user_id);
  }
}
