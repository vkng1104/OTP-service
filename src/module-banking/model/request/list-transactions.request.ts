import { IsOptional, IsString } from "class-validator";

import { Currency, TransactionType } from "~/module-banking/constant";
import { PageableRequest } from "~/module-common/model/request/pageable-request.dto";

export class ListTransactionsRequest extends PageableRequest {
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
