export interface OtpResponse {
  message: string;
  transactionHash: string;
  transactionId: string;
  otp: string;
}

// Interface for the OTP verification response
export interface OtpVerificationResponse {
  success: boolean;
  message: string;
  transactionHash?: string;
}
