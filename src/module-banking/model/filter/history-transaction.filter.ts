import { IsOptional, IsString } from "class-validator";

import { Currency, TransactionType } from "~/module-banking/constant";

export class HistoryTransactionFilter {
  @IsOptional()
  @IsString()
  currency?: Currency;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  transaction_type?: TransactionType;

  @IsOptional()
  @IsString()
  reference_id?: string;
}
