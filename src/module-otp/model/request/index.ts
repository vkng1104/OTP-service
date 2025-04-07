export * from "./internal-request.dto";

import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";
export class OtpGeneratedRequest {
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
  provider_id: string;
}

export type OtpWindowUpdateRequest = {
  user_id: string;
  start_time: number;
  end_time: number;
};

export class OtpVerificationRequest {
  @IsString()
  @IsNotEmpty()
  otp: string;

  @IsString()
  @IsNotEmpty()
  new_commitment_value: string;
}
