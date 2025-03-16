import { Exclude, Expose } from "class-transformer";
import { IsEmail, IsEnum, IsOptional, IsString, IsUUID } from "class-validator";

import {
  AuthenticationType,
  UserRole,
  UserStatus,
} from "~/module-user/constant";

export class UserDto {
  @Expose()
  @IsUUID()
  id: string;

  @Expose()
  @IsString()
  username: string;

  // 🔹 Active authentication provider details
  @Expose()
  @IsUUID()
  active_auth_provider_id: string;

  @Expose()
  @IsEnum(AuthenticationType)
  active_auth_provider?: AuthenticationType;

  // 🔹 Public key from the user keys table
  @Expose()
  @IsOptional()
  public_key?: string;

  @Expose()
  @IsEnum(UserRole)
  role: UserRole;

  @Expose()
  @IsEnum(UserStatus)
  status: UserStatus;

  @Expose()
  @IsOptional()
  @IsEmail()
  email?: string;

  @Expose()
  @IsOptional()
  @IsString()
  phone?: string;

  @Expose()
  @IsOptional()
  @IsString()
  platform?: string;

  @Expose()
  @IsOptional()
  @IsString()
  language?: string;

  @Expose()
  @IsOptional()
  @IsString()
  image_url?: string;

  @Expose()
  @IsOptional()
  @IsString()
  first_name?: string;

  @Expose()
  @IsOptional()
  @IsString()
  last_name?: string;

  @Expose()
  created_at: Date;

  @Expose()
  @IsOptional()
  updated_at?: Date;

  @Expose()
  @IsOptional()
  deleted_at?: Date;

  // Exclude sensitive fields
  @Exclude()
  password_reset_key?: string;

  constructor(partial: Partial<UserDto>) {
    Object.assign(this, partial);
  }
}
