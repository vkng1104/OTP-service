import { PageableResponse } from "~/module-common/model/response/pageable-response.dto";

import { UserDto } from "../user.dto";

/**
 * A pageable response specifically for users.
 */
export class ListUsersResponse extends PageableResponse<UserDto> {
  constructor(count: number, data: UserDto[]) {
    super(count, data);
  }
}
