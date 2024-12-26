export interface OtpResponse {
  message: string;
  transactionHash: string;
  transactionId: string;
  otp: string;
}

export interface ErrorResponse {
  code: number;
  message: string;
  details?: unknown;
}

// Interface for the OTP verification response
export interface OtpVerificationResponse {
  success: boolean;
  message: string;
  transactionHash?: string;
}
