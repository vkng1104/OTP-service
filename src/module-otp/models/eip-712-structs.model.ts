export interface UserRegistration {
  username: string;
  service: string;
  commitmentValue: string; // bytes32 string
}

export interface OTPVerification {
  username: string;
  service: string;
  otp: string; // bytes32 string
  newCommitmentValue: string; // bytes32 string
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
