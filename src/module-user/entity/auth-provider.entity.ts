import { Column, Entity } from "typeorm";

import { BaseEntity } from "~/module-common/entity/base.entity";

import { AuthenticationType } from "../constant";

@Entity({ name: "auth_providers" })
export class AuthProviderEntity extends BaseEntity {
  @Column({ type: "uuid" })
  user_id: string;

  @Column({ type: "enum", enum: AuthenticationType })
  provider: AuthenticationType; // e.g., "password", "google", "github"

  @Column({ type: "text", nullable: true })
  provider_id?: string; // Stores hashed password or OAuth ID

  @Column({ type: "text", nullable: true })
  device_id?: string; // Stores device ID for device-specific authentication methods like PIN
}
