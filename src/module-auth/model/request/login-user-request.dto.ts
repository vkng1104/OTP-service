import { IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";

import { AuthenticationType } from "~/module-user/constant";

export class LoginUserRequest {
  @IsNotEmpty()
  username_or_email: string;

  @IsNotEmpty()
  @IsString()
  password: string;

  @IsOptional()
  @IsEnum(AuthenticationType, { message: "Invalid authentication type." })
  auth_provider?: AuthenticationType;
}
