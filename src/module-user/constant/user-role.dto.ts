export enum UserRole {
  ANONYMOUS = "anonymous",
  USER = "user",
  ADMIN = "admin",
  SUPER_ADMIN = "super_admin",
}

export const UserRoleList = Object.values(UserRole);

export class UserRoleHelper {
  private static readonly roleMeta: Record<
    UserRole,
    { level: number; excludedHigherRole?: boolean }
  > = {
    [UserRole.ANONYMOUS]: { level: 0 },
    [UserRole.USER]: { level: 1 },
    [UserRole.ADMIN]: { level: 10 },
    [UserRole.SUPER_ADMIN]: { level: 11 },
  };

  static getRolesFor(roles: UserRole[]): string[] {
    const highestRole = roles.reduce((max, role) => {
      return Math.max(max, this.roleMeta[role].level);
    }, 0);

    return Object.entries(this.roleMeta)
      .filter(([key, meta]) => {
        return (
          roles.includes(key as UserRole) ||
          (meta.level <= highestRole && !meta.excludedHigherRole)
        );
      })
      .map(([key]) => key);
  }

  static isAdmin(role: UserRole): boolean {
    return role === UserRole.ADMIN;
  }

  static isSuperAdmin(role: UserRole): boolean {
    return role === UserRole.SUPER_ADMIN;
  }

  static fromValue(value: string): UserRole {
    const key = value.trim().toLowerCase();
    return (
      (UserRoleList.find((r) => r === key) as UserRole) || UserRole.ANONYMOUS
    );
  }
}
