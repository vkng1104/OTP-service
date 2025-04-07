/* eslint-disable @typescript-eslint/no-empty-object-type */

export interface UserRegistrationResponse extends BlockchainBaseResponse {}

export interface OtpVerificationResponse extends BlockchainBaseResponse {}

export interface OtpWindowUpdateResponse extends BlockchainBaseResponse {}

export interface BlockchainBaseResponse {
  success: boolean;
  message: string;
  txnLogUrl: string;
}
