export * from "./internal-request.dto";

import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from "class-validator";

import { AuthenticationType } from "~/module-user/constant";
export class OtpGeneratedRequest {
  @IsEnum(AuthenticationType)
  @IsNotEmpty()
  provider: AuthenticationType;

  @IsString()
  @IsOptional()
  device_id?: string;

  @IsString()
  @IsNotEmpty()
  provider_id: string;

  @IsNumber()
  @IsOptional()
  duration?: number; // in seconds
}

export class OtpRegisterRequest {
  @IsEnum(AuthenticationType)
  @IsNotEmpty()
  provider: AuthenticationType;

  @IsString()
  @IsOptional()
  device_id?: string;

  @IsString()
  @IsNotEmpty()
  provider_id: string;
}

export type OtpWindowUpdateRequest = {
  auth_provider_id: string;
  user_id: string;
  start_time: number;
  end_time: number;
};

export class OtpVerificationRequest {
  @IsString()
  @IsNotEmpty()
  otp: string;
}
