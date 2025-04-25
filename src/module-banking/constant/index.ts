export enum Currency {
  USD = "USD",
  VND = "VND",
}

export enum TransactionType {
  DEPOSIT = "DEPOSIT",
  WITHDRAWAL = "WITHDRAWAL",
  TRANSFER = "TRANSFER",
  EXTERNAL_PAYMENT = "EXTERNAL_PAYMENT",
}

export enum AccountStatus {
  ACTIVE = "ACTIVE",
  FROZEN = "FROZEN",
  CLOSED = "CLOSED",
  PENDING = "PENDING",
  BLOCKED = "BLOCKED",
}

export enum PaymentStatus {
  PENDING = "PENDING",
  SUCCESS = "SUCCESS",
  FAILED = "FAILED",
}
