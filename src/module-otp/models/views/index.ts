import { ethers } from "ethers";

export interface OtpView {
  otp: string;
}

export interface SignerContractPair {
  signer: ethers.Wallet;
  contract: ethers.Contract;
}
