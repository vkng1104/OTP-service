import { IsOptional, IsString } from "class-validator";

import { PageableRequest } from "~/module-common/model/request/pageable-request.dto";

export class ListUsersRequest extends PageableRequest {
  @IsOptional()
  @IsString()
  search?: string; // Filters users by username
}
