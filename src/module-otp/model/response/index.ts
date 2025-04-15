/* eslint-disable @typescript-eslint/no-empty-object-type */
import { OtpView } from "../view";

export interface UserRegistrationResponse
  extends BlockchainBaseResponse<unknown> {}

export interface OtpVerificationResponse
  extends BlockchainBaseResponse<unknown> {}

export interface OtpWindowUpdateResponse
  extends BlockchainBaseResponse<unknown> {}

export interface OtpGeneratedResponse extends BlockchainBaseResponse<OtpView> {}

export interface BlockchainBaseResponse<T = unknown> {
  success: boolean;
  message: string;
  txnLogUrls: string[];
  data?: T;
}
