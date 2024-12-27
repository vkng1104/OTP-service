import { Expose } from "class-transformer";
import {
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
} from "class-validator";

import { OtpView } from "../views";

export class OtpGeneratedRequest {
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  length?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  duration?: number;
}

export class OtpRequestRequest {
  @Expose({ name: "transaction_id" })
  @IsString()
  @IsNotEmpty()
  transactionId: string;

  @IsObject()
  @IsNotEmpty()
  payload: OtpView;

  @Expose({ name: "user_address" })
  @IsString()
  @IsNotEmpty()
  userAddress: string;

  @IsString()
  @IsNotEmpty()
  signature: string;
}

export class OtpVerificationRequest {
  @Expose({ name: "transaction_id" })
  @IsString()
  @IsNotEmpty()
  transactionId: string;

  @IsString()
  @IsNotEmpty()
  otp: string;

  @IsString()
  @IsNotEmpty()
  signature: string;
}
