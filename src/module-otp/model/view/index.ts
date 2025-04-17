import { ethers } from "ethers";

export interface OtpView {
  otp: string;
  start_time: number;
  end_time: number;
}

export interface SignerContractPair {
  signer: ethers.Wallet;
  contract: ethers.Contract;
}
