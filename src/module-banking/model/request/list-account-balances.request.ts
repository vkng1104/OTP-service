import { Type } from "class-transformer";
import { IsOptional, ValidateNested } from "class-validator";

import { PageableRequest } from "~/module-common/model/request/pageable-request.dto";

import { AccountBalanceFilter } from "../filter";

export class ListAccountBalancesRequest extends PageableRequest {
  @IsOptional()
  @ValidateNested()
  @Type(() => AccountBalanceFilter)
  filter: AccountBalanceFilter;
}
