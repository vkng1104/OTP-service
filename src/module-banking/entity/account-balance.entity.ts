import { Column, Entity } from "typeorm";

import { BaseEntity } from "~/module-common/entity/base.entity";

import { AccountStatus, Currency } from "../constant";

@Entity("account_balances")
export class AccountBalanceEntity extends BaseEntity {
  @Column({ type: "uuid" })
  user_id: string;

  @Column({ type: "bigint", default: 0 })
  balance: number;

  @Column({ type: "enum", enum: Currency })
  currency: Currency;

  @Column({
    type: "enum",
    enum: AccountStatus,
    default: AccountStatus.PENDING,
  })
  status: AccountStatus;
}
