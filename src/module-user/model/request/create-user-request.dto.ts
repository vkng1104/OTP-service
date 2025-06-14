import {
  IsAlphanumeric,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from "class-validator";

import { AuthenticationType, UserRole } from "~/module-user/constant";

export class CreateUserRequest {
  @IsNotEmpty()
  @MinLength(3, { message: "Username must have at least 3 characters." })
  @IsAlphanumeric("en-US", {
    message: "Username must only contain alphanumeric characters.",
  })
  username: string;

  @IsNotEmpty()
  @IsEnum(AuthenticationType, { message: "Invalid authentication type." })
  provider: AuthenticationType;

  @IsNotEmpty()
  @IsString()
  provider_id: string;

  @IsNotEmpty()
  @IsEnum(UserRole, { message: "Invalid role type." })
  role: UserRole;

  @IsNotEmpty()
  @IsEmail({}, { message: "Invalid email format." })
  email: string;

  @IsOptional()
  @Matches(/^\+?[1-9]\d{1,14}$/, {
    message: "Invalid phone number format.",
  })
  phone?: string;

  @IsOptional()
  @IsString()
  platform?: string;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsString()
  image_url?: string;

  @IsOptional()
  @IsString()
  password_reset_key?: string;

  @IsOptional()
  @IsString()
  first_name?: string;

  @IsOptional()
  @IsString()
  last_name?: string;
}
