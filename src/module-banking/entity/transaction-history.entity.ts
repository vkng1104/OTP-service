import { Column, Entity } from "typeorm";

import { BaseEntity } from "~/module-common/entity/base.entity";

@Entity("transaction_history")
export class TransactionHistoryEntity extends BaseEntity {
  @Column({ type: "uuid" })
  user_id: string;

  @Column({ type: "bigint" })
  amount: number;

  @Column({ type: "text" })
  currency: string;

  @Column({ type: "bigint" })
  balance_before: number;

  @Column({ type: "bigint" })
  balance_after: number;

  @Column({ type: "uuid", nullable: true })
  reference_id: string;

  @Column({ type: "text" })
  transaction_type: string;

  @Column({ type: "text", nullable: true })
  description: string;
}
