import { IsOptional, IsString } from "class-validator";

import { Currency } from "~/module-banking/constant";
import { PageableRequest } from "~/module-common/model/request/pageable-request.dto";

export class ListAccountsRequest extends PageableRequest {
  @IsOptional()
  @IsString()
  currency?: Currency;

  @IsOptional()
  @IsString()
  search?: string;
}
