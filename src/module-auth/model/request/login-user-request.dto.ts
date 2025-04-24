import { IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";

import { AuthenticationType } from "~/module-user/constant";

export class LoginUserRequest {
  @IsNotEmpty()
  username_or_email: string;

  @IsNotEmpty()
  @IsString()
  password: string;

  @IsNotEmpty()
  @IsEnum(AuthenticationType, { message: "Invalid authentication type." })
  auth_provider: AuthenticationType;

  @IsOptional()
  @IsString()
  device_id?: string;
}
