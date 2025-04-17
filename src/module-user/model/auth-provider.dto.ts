import { Exclude, Expose } from "class-transformer";
import { IsDate, IsOptional, IsString, IsUUID } from "class-validator";

import { AuthenticationType } from "~/module-user/constant";

export class AuthProviderDto {
  @Expose()
  @IsUUID()
  id: string;

  @Expose()
  @IsString()
  provider: AuthenticationType;

  @Expose()
  @IsString()
  user_id: string;

  @Expose()
  @IsString()
  @IsOptional()
  device_id?: string;

  @Expose()
  @IsDate()
  @IsOptional()
  created_at?: Date;

  @Expose()
  @IsDate()
  @IsOptional()
  updated_at?: Date;

  @Expose()
  @IsDate()
  @IsOptional()
  deleted_at?: Date;

  @Exclude()
  provider_id: string;

  constructor(partial: Partial<AuthProviderDto>) {
    Object.assign(this, partial);
  }
}
