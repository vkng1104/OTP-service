import { IsEnum, IsNotEmpty, IsNumber, IsOptional, Min } from "class-validator";

import { AccountStatus, Currency } from "~/module-banking/constant";

export class CreateAccountBalanceRequest {
  @IsNotEmpty()
  @IsEnum(Currency)
  currency: Currency;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  initial_balance: number;

  @IsOptional()
  @IsEnum(AccountStatus)
  status?: AccountStatus;
}
