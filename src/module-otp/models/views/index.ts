import { ethers } from "ethers";

export interface OtpView {
  otp: string;
  new_commitment_value: string;
}

export interface SignerContractPair {
  signer: ethers.Wallet;
  contract: ethers.Contract;
}
