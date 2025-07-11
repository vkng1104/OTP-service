import { Column, Entity } from "typeorm";

import { BaseEntity } from "~/module-common/entity/base.entity";

import { UserStatus } from "../constant";

@Entity({ name: "users" }) // Maps to "users" table
export class UserEntity extends BaseEntity {
  @Column({ type: "text", unique: true })
  username: string;

  @Column({ type: "text", nullable: true })
  active_auth_provider_id: string;

  @Column({ type: "text" })
  role: string;

  @Column({ type: "enum", enum: UserStatus })
  status: UserStatus;

  @Column({ type: "text", nullable: true })
  phone: string;

  @Column({ type: "text", nullable: true })
  email: string;

  @Column({ type: "text", nullable: true })
  platform: string;

  @Column({ type: "text", nullable: true })
  language: string;

  @Column({ type: "text", nullable: true })
  image_url: string;

  @Column({ type: "text", nullable: true })
  password_reset_key: string;

  @Column({ type: "text", nullable: true })
  first_name: string;

  @Column({ type: "text", nullable: true })
  last_name: string;
}
