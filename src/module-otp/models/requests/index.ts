export * from "./internal-request.dto";

import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";
export class OtpGeneratedRequest {
  @IsString()
  @IsNotEmpty()
  user_id: string;

  @IsString()
  @IsNotEmpty()
  provider_id: string;

  @IsNumber()
  @IsOptional()
  duration?: number; // in seconds
}

export class OtpRegisterRequest {
  @IsString()
  @IsNotEmpty()
  user_id: string;

  @IsString()
  @IsNotEmpty()
  provider_id: string;
}

export class OtpWindowUpdateRequest {
  @IsString()
  @IsNotEmpty()
  user_id: string;

  @IsNumber()
  @IsNotEmpty()
  start_time: number;

  @IsNumber()
  @IsNotEmpty()
  end_time: number;
}

export class OtpVerificationRequest {
  @IsString()
  @IsNotEmpty()
  user_id: string;

  @IsString()
  @IsNotEmpty()
  otp: string;

  @IsString()
  @IsNotEmpty()
  new_commitment_value: string;
}
