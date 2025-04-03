import { Body, Controller, Get, Param, Post } from "@nestjs/common";

import {
  BlacklistUserRequest,
  FundUserWalletRequest,
  GrantRoleRequest,
  RefundToAdminWalletRequest,
  RemoveUserFromBlacklistRequest,
  ResetManyOtpsRequest,
} from "~/module-otp/models";
import { OtpService } from "~/module-otp/otp.service";

@Controller("api/internal")
export class InternalController {
  constructor(private readonly otpService: OtpService) {}

  @Get("user-wallet-balance/:user_wallet_address")
  async getUserWalletBalance(
    @Param("user_wallet_address") user_wallet_address: string,
  ) {
    return this.otpService.getUserWalletBalance(user_wallet_address);
  }

  @Post("refund-to-admin-wallet")
  async refundToAdminWallet(@Body() request: RefundToAdminWalletRequest) {
    return this.otpService.refundToAdminWallet(
      request.user_id,
      request.amount_in_eth,
      request.admin_wallet_address,
    );
  }

  @Post("fund-user-wallet")
  async fundUserWallet(@Body() request: FundUserWalletRequest) {
    return this.otpService.fundUserWallet(
      request.user_wallet_address,
      request.amount_in_eth,
    );
  }

  @Get("check-role/:wallet_address/:role")
  async checkRole(
    @Param("wallet_address") wallet_address: string,
    @Param("role") role: string,
  ) {
    return this.otpService.checkRole(wallet_address, role);
  }

  @Post("grant-role")
  async grantRole(@Body() request: GrantRoleRequest) {
    return this.otpService.grantRole(request.role, request.wallet_address);
  }

  @Post("blacklist-user")
  async blacklistUser(@Body() request: BlacklistUserRequest) {
    return this.otpService.blacklistUser(request.user_id);
  }

  @Post("remove-user-from-blacklist")
  async removeUserFromBlacklist(
    @Body() request: RemoveUserFromBlacklistRequest,
  ) {
    return this.otpService.removeFromBlacklist(request.user_id);
  }

  @Post("reset-many-otps")
  async resetManyOtps(@Body() request: ResetManyOtpsRequest) {
    return this.otpService.resetManyOtps(request.user_ids);
  }

  @Get("view-otp-data/:user_id")
  async viewOtpData(@Param("user_id") user_id: string) {
    return this.otpService.viewOtpData(user_id);
  }
}
