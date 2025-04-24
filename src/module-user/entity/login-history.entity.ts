import { Column, Entity } from "typeorm";

import { BaseEntity } from "~/module-common/entity/base.entity";
import { AuthenticationType } from "~/module-user/constant";

@Entity({ name: "login_history" })
export class LoginHistoryEntity extends BaseEntity {
  @Column({ type: "uuid" })
  user_id: string;

  @Column({ type: "uuid" })
  auth_provider_id: string;

  @Column({ type: "enum", enum: AuthenticationType })
  auth_provider: AuthenticationType;

  @Column({ type: "text" })
  device_id: string;

  @Column({ type: "text" })
  ipfs_cid: string;

  @Column({ type: "text" })
  description: string;
}
