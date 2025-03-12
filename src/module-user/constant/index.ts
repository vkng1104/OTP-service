// Define Enums for `authentication_type`, `role`, and `status`
export enum AuthenticationType {
  PASSWORD = "password",
  OAUTH = "oauth",
  BIOMETRIC = "biometric",
}

export enum UserRole {
  ADMIN = "admin",
  USER = "user",
  MODERATOR = "moderator",
}

export enum UserStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  BANNED = "banned",
}
