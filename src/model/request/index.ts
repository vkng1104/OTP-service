import { OtpView } from "../view";

export interface OtpRequestRequest {
  payload: OtpView;
  transactionId: string;
  userAddress: string;
  signature: string;
}

export interface OtpGeneratedRequest {
  duration?: number; // in second
}

// Interface for the OTP verification request
export interface OtpVerificationRequest {
  transactionId: string;
  otp: string;
  signature: string;
}
