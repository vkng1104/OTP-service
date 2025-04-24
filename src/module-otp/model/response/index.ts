import { OtpView } from "../view";

export interface UserRegistrationResponse
  extends BlockchainBaseResponse<unknown> {
  cid: string;
  receipt: string;
}

export interface OtpVerificationResponse
  extends BlockchainBaseResponse<unknown> {
  cid: string;
  receipt: string;
}

export interface OtpWindowUpdateResponse
  extends BlockchainBaseResponse<unknown> {
  cid: string;
  receipt: string;
}

export interface OtpGeneratedResponse extends BlockchainBaseResponse<OtpView> {
  cid: string;
  receipt: string;
}

export interface BlockchainBaseResponse<T = unknown> {
  success: boolean;
  message: string;
  txnLogUrls: string[];
  data?: T;
}
