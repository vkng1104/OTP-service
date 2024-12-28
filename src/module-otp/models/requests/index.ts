import { Expose } from "class-transformer";
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from "class-validator";

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

  @IsString()
  @IsNotEmpty()
  otp: string;

  @Expose({ name: "expiration_time" })
  @IsNumber()
  @Min(1)
  expirationTime: number;

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
