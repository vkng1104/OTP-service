import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from "class-validator";

import { Currency } from "~/module-banking/constant";

export class TransferMoneyDto {
  @IsNotEmpty()
  @IsUUID()
  recipient_id: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  amount: number;

  @IsNotEmpty()
  @IsString()
  currency: Currency;

  @IsOptional()
  @IsString()
  description?: string;
}
