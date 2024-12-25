import cors from "cors";
import dotenv from "dotenv";
import { ethers } from "ethers";
import express, { Request, Response } from "express";

import OTPSystemJSON from "./artifacts/src/contracts/OTPSystem.sol/OTPSystem.json"; // Import the ABI from the JSON file
import {
  CONTRACT_ADDRESS,
  ETHEREUM_PROVIDER_URL,
  PORT,
  PRIVATE_KEY,
} from "./configs/env";
import { OtpRequest } from "./model/request";
import { ErrorResponse, OtpResponse } from "./model/response";
import { generateOtp, hashOtp } from "./utils/otpGenerator";
dotenv.config();

// Initialize Express
const app = express();
app.use(express.json());
app.use(cors());

// Connect to Ethereum network
const provider = new ethers.JsonRpcProvider(ETHEREUM_PROVIDER_URL);
const signer = new ethers.Wallet(PRIVATE_KEY as string, provider);

// Connect to the deployed contract
const contract = new ethers.Contract(
  CONTRACT_ADDRESS as string,
  OTPSystemJSON.abi,
  signer,
);

// Endpoint to request an OTP
app.post(
  "/api/request-otp",
  async (
    req: Request<unknown, unknown, OtpRequest>,
    res: Response<OtpResponse | ErrorResponse>,
  ) => {
    try {
      const { hashedTransactionId, reqOtp, userAddress, signature } = req.body;

      // Validate request parameters
      if (!hashedTransactionId || !userAddress || !signature) {
        res.status(400).json({ error: "Missing required fields" });
        return;
      }

      // Generate OTP if not provided
      const otp = reqOtp || generateOtp(6);

      // Hash the OTP
      const hashedOtp = hashOtp(otp);

      // Set expiration time (e.g., 5 minutes from now)
      const expirationTime = Math.floor(Date.now() / 1000) + 300;

      // Create OTPRequest struct
      const value = {
        transactionId: hashedTransactionId, // Hash the transaction ID for uniqueness
        hashedOtp,
        userAddress,
        expirationTime,
      };

      // Submit OTP request to the blockchain
      const tx = await contract.requestOtp(value, signature);
      await tx.wait();

      res.status(200).json({
        message: "OTP requested successfully",
        transactionHash: tx.hash,
        transactionId: value.transactionId,
        otp,
      });
    } catch (error: unknown) {
      // eslint-disable-next-line no-console
      console.error("Error in /api/request-otp:", error);
      res.status(500).json({ error: String(error) || "Internal Server Error" });
    }
  },
);

// Endpoint to verify an OTP
app.post("/verify-otp", async (req, res) => {
  try {
    const { transactionId, otp } = req.body;

    // Hash the OTP
    const hashedOtp = hashOtp(otp);

    // Verify the OTP on-chain
    const tx = await contract.verifyOtp(ethers.id(transactionId), hashedOtp);
    const receipt = await tx.wait();

    // eslint-disable-next-line no-console
    console.log(receipt.events);

    res.status(200).json({
      message: "OTP verified successfully",
      transactionHash: tx.hash,
      success: true,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
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
    // eslint-disable-next-line no-console
    console.error("Error in /is-otp-valid:", error);
    res.status(500).json({ error: error });
  }
});

// Start the server
const port = PORT || 3000;
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Server running on http://localhost:${port}`);
});
