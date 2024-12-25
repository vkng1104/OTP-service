export interface OtpResponse {
  message: string;
  transactionHash: string;
  transactionId: string;
  otp: string;
}

export interface ErrorResponse {
  error: string;
}
