import { IsOptional, IsString } from "class-validator";

import { Currency } from "~/module-banking/constant";

export class AccountBalanceFilter {
  @IsOptional()
  @IsString()
  currency?: Currency;

  @IsOptional()
  @IsString()
  search?: string;
}
