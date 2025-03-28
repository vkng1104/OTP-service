import { IsArray, IsNotEmpty, IsString } from "class-validator";

export class GrantRoleRequest {
  @IsString()
  @IsNotEmpty()
  role: string;

  @IsString()
  @IsNotEmpty()
  wallet_address: string;
}

export class BlacklistUserRequest {
  @IsString()
  @IsNotEmpty()
  user_id: string;
}

export class RemoveUserFromBlacklistRequest {
  @IsString()
  @IsNotEmpty()
  user_id: string;
}

export class RefundToAdminWalletRequest {
  @IsString()
  @IsNotEmpty()
  user_id: string;

  @IsString()
  @IsNotEmpty()
  amount_in_eth: string;

  @IsString()
  @IsNotEmpty()
  admin_wallet_address: string;
}

export class FundUserWalletRequest {
  @IsString()
  @IsNotEmpty()
  user_wallet_address: string;

  @IsString()
  @IsNotEmpty()
  amount_in_eth: string;
}

export class ResetManyOtpsRequest {
  @IsArray()
  @IsString({ each: true })
  user_ids: string[];
}
