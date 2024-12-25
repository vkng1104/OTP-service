export interface OtpRequest {
  hashedTransactionId: string;
  reqOtp?: string;
  userAddress: string;
  signature: string;
}
