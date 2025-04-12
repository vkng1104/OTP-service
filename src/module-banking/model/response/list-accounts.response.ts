import { PageableResponse } from "~/module-common/model/response/pageable-response.dto";

import { AccountBalanceDto } from "../account-balance.dto";

export class ListAccountsResponse extends PageableResponse<AccountBalanceDto> {
  constructor(count: number, data: AccountBalanceDto[]) {
    super(count, data);
  }
}
