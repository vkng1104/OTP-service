import { PageableResponse } from "~/module-common/model/response/pageable-response.dto";

import { TransactionHistoryDto } from "./transaction-history.dto";

export class TransactionHistoryListDto extends PageableResponse<TransactionHistoryDto> {
  constructor(count: number, data: TransactionHistoryDto[]) {
    super(count, data);
  }
}
