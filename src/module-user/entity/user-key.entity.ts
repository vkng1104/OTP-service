import { Column, Entity } from "typeorm";

import { BaseEntity } from "~/module-common/entity/base.entity";

@Entity({ name: "user_keys" })
export class UserKeyEntity extends BaseEntity {
  @Column({ type: "uuid" })
  user_id: string;

  @Column({ type: "text" })
  public_key: string;

  @Column({ type: "text" })
  encrypted_private_key: string;

  @Column({ type: "text" })
  encrypted_mnemonic_phrase: string;
}
