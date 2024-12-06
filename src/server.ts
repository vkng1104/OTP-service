import express from "express";
import { ethers } from "ethers";
import dotenv from "dotenv";
import * as OTPSystemABI from "../artifacts/contracts/OTPSystem.sol/OTPSystem.json"; // Import the ABI from the JSON file
import cors from "cors";
dotenv.config();

// Initialize Express
const app = express();
app.use(express.json());
app.use(cors());

// Load environment variables
const { PRIVATE_KEY, ETHEREUM_PROVIDER_URL, CONTRACT_ADDRESS, CHAIN_ID } =
  process.env;

// Connect to Ethereum network
const provider = new ethers.JsonRpcProvider(ETHEREUM_PROVIDER_URL);
const signer = new ethers.Wallet(PRIVATE_KEY as string, provider);

// Connect to the deployed contract
const contract = new ethers.Contract(
  CONTRACT_ADDRESS as string,
  OTPSystemABI.abi,
  signer
);

// EIP-712 domain configuration
const domain = {
  name: "OTPSystem",
  version: "1",
  chainId: CHAIN_ID as unknown as number,
  verifyingContract: CONTRACT_ADDRESS as string,
};

// EIP-712 struct types
const types = {
  OTPRequest: [
    { name: "transactionId", type: "bytes32" },
    { name: "hashedOtp", type: "bytes32" },
    { name: "userAddress", type: "address" },
    { name: "expirationTime", type: "uint256" },
  ],
};

// Helper function to hash the OTP
function hashOtp(otp: string): string {
  return ethers.keccak256(ethers.toUtf8Bytes(otp));
}

// Endpoint to request an OTP
app.post("/request-otp", async (req, res) => {
  try {
    const { transactionId, otp, userAddress } = req.body;

    // Hash the OTP
    const hashedOtp = hashOtp(otp);

    // Set expiration time (e.g., 5 minutes from now)
    const expirationTime = Math.floor(Date.now() / 1000) + 300;

    // Create OTPRequest struct
    const value = {
      transactionId: ethers.id(transactionId), // Hash the transaction ID for uniqueness
      hashedOtp,
      userAddress,
      expirationTime,
    };

    // Sign the request
    const signature = await signer.signTypedData(domain, types, value);

    // Submit OTP request to the blockchain
    const tx = await contract.requestOtp(value, signature);
    await tx.wait();

    res.status(200).json({
      message: "OTP requested successfully",
      transactionHash: tx.hash,
      transactionId: value.transactionId,
      hashedOtp,
    });
  } catch (error) {
    console.error("Error in /request-otp:", error);
    res.status(500).json({ error: error });
  }
});

// Endpoint to verify an OTP
app.post("/verify-otp", async (req, res) => {
  try {
    const { transactionId, otp } = req.body;

    // Hash the OTP
    const hashedOtp = hashOtp(otp);

    // Verify the OTP on-chain
    const tx = await contract.verifyOtp(ethers.id(transactionId), hashedOtp);
    const receipt = await tx.wait();

    res.status(200).json({
      message: "OTP verified successfully",
      transactionHash: tx.hash,
      success: true,
    });
  } catch (error) {
    console.error("Error in /verify-otp:", error);
    res.status(500).json({ error: error });
  }
});

// Endpoint to check OTP validity
app.get("/is-otp-valid/:transactionId", async (req, res) => {
  try {
    const transactionId = req.params.transactionId;

    // Check OTP validity on-chain
    const isValid = await contract.isOtpValid(ethers.id(transactionId));

    res.status(200).json({ transactionId, isValid });
  } catch (error) {
    console.error("Error in /is-otp-valid:", error);
    res.status(500).json({ error: error });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
