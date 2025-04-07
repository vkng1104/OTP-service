import { ethers } from "ethers";

export interface UserRegistration {
  username: string;
  service: string;
  commitmentValue: ethers.BytesLike; // bytes32
}

export interface OTPVerification {
  username: string;
  service: string;
  otp: ethers.BytesLike; // bytes32
  newCommitmentValue: ethers.BytesLike; // bytes32
}

export const USER_REGISTRATION_TYPE = {
  UserRegistration: [
    { name: "username", type: "string" },
    { name: "service", type: "string" },
    { name: "commitmentValue", type: "bytes32" },
  ],
};

export const OTP_VERIFICATION_TYPE = {
  OTPVerification: [
    { name: "username", type: "string" },
    { name: "service", type: "string" },
    { name: "otp", type: "bytes32" },
    { name: "newCommitmentValue", type: "bytes32" },
  ],
};
