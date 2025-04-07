import { SetMetadata } from "@nestjs/common";

import { UserRole, UserRoleHelper } from "~/module-user/constant";

export const ROLES_KEY = "roles";
export const Roles = (...roles: UserRole[]) =>
  SetMetadata(ROLES_KEY, UserRoleHelper.getRolesFor(roles));
