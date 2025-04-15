export * from "./user-role.dto";

// Define Enums for `authentication_type`, `role`, and `status`
export enum AuthenticationType {
  PASSWORD = "password",
  EXTERNAL_WALLET = "external_wallet",
  BIOMETRIC = "biometric",
  PIN = "pin",
}

export enum UserStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  BANNED = "banned",
}
