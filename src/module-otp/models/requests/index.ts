import { Expose } from "class-transformer";
import { IsNotEmpty, IsNumber, IsString, Min } from "class-validator";

export class OtpGeneratedRequest {
  @IsString()
  @IsNotEmpty()
  user_id: string;

  @IsString()
  @IsNotEmpty()
  provider_id: string;
}

export class OtpRegisterRequest {
  @IsString()
  @IsNotEmpty()
  user_id: string;

  @IsString()
  @IsNotEmpty()
  provider_id: string;
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
