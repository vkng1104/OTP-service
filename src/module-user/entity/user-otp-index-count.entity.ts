import { Column, Entity } from "typeorm";

import { BaseEntity } from "~/module-common/entity/base.entity";

@Entity({ name: "user_otp_index_counts" })
export class UserOtpIndexCountEntity extends BaseEntity {
  @Column({ type: "uuid" })
  user_id: string;

  @Column({ type: "bigint" })
  otp_index: number;
}
