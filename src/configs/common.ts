import { CHAIN_ID, CONTRACT_ADDRESS } from "./env";

// EIP-712 domain configuration
export const domain = {
  name: "OTPSystem",
  version: "1",
  chainId: CHAIN_ID as unknown as number,
  verifyingContract: CONTRACT_ADDRESS as string,
};

// EIP-712 struct types
export const types = {
  OTPRequest: [
    { name: "transactionId", type: "bytes32" },
    { name: "hashedOtp", type: "bytes32" },
    { name: "userAddress", type: "address" },
    { name: "expirationTime", type: "uint256" },
  ],
};
