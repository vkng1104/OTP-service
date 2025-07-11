import { Type } from "class-transformer";
import { IsOptional, ValidateNested } from "class-validator";

import { PageableRequest } from "~/module-common/model/request/pageable-request.dto";

import { HistoryTransactionFilter } from "../filter";

export class ListTransactionsRequest extends PageableRequest {
  @IsOptional()
  @ValidateNested()
  @Type(() => HistoryTransactionFilter)
  filter: HistoryTransactionFilter;
}
