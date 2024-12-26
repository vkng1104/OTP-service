import cors from "cors";
import { ethers } from "ethers";
import express, { Request, Response } from "express";

import OTPSystemJSON from "./artifacts/src/contracts/OTPSystem.sol/OTPSystem.json"; // Import the ABI from the JSON file
import {
  CONTRACT_ADDRESS,
  ETHEREUM_PROVIDER_URL,
  PORT,
  PRIVATE_KEY,
} from "./configs/env";
import {
  OtpGeneratedRequest,
  OtpRequestRequest,
  OtpVerificationRequest,
} from "./model/request";
import {
  ErrorResponse,
  OtpResponse,
  OtpVerificationResponse,
} from "./model/response";
import { OtpView } from "./model/view";
import { handleException } from "./utils/handleException";
import { generateOtp } from "./utils/otpGenerator";

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

// Endpoint to generate OTP and provide related data
app.post(
  "/api/generate-otp",
  async (
    req: Request<unknown, unknown, OtpGeneratedRequest>,
    res: Response<OtpView | ErrorResponse>,
  ) => {
    try {
      const { duration } = req.body;

      // Generate an OTP
      const otp = generateOtp(6);

      // Default to 5 minutes if duration is not provided
      const expectedDuration = duration || 300;
      // Calculate expiration time (current time + duration in seconds)
      const expirationTime = Math.floor(Date.now() / 1000) + expectedDuration;

      // Return the generated OTP and expiration time
      res.status(200).json({
        otp,
        expirationTime,
      });
    } catch (error: unknown) {
      const errorResponse = handleException("/api/generate-otp", error);
      res.status(errorResponse.code).json(errorResponse);
    }
  },
);

// Endpoint to request an OTP
app.post(
  "/api/request-otp",
  async (
    req: Request<unknown, unknown, OtpRequestRequest>,
    res: Response<OtpResponse | ErrorResponse>,
  ) => {
    try {
      const { payload, transactionId, userAddress, signature } = req.body;

      // Validate request parameters
      if (!transactionId || !userAddress || !signature) {
        res.status(400).json({ code: 400, message: "Missing required fields" });
        return;
      }

      // Create OtpRequestRequest struct
      const value = {
        transactionId: transactionId,
        otp: payload.otp,
        expirationTime: payload.expirationTime,
        userAddress,
        nonce: 0,
      };

      // Submit OTP request to the blockchain
      const tx = await contract.requestOtp(value, signature);
      await tx.wait();

      res.status(200).json({
        message: "OTP requested successfully",
        transactionHash: tx.hash,
        transactionId: value.transactionId,
        otp: payload.otp,
      });
    } catch (error: unknown) {
      const errorResponse = handleException("/api/request-otp", error);
      res.status(errorResponse.code).json(errorResponse);
    }
  },
);

// Endpoint to verify an OTP
app.post(
  "/api/verify-otp",
  async (
    req: Request<unknown, unknown, OtpVerificationRequest>,
    res: Response<OtpVerificationResponse | ErrorResponse>,
  ) => {
    try {
      const { transactionId, otp, signature } = req.body;

      // Validate request parameters
      if (!transactionId || !otp || !signature) {
        res.status(400).json({ code: 400, message: "Missing required fields" });
        return;
      }

      // Interact with the smart contract to verify the OTP
      const tx = await contract.verifyOtp(transactionId, otp, signature);

      // Wait for the transaction to be mined
      const receipt = await tx.wait();

      res.status(200).json({
        success: true,
        message: "OTP verified successfully",
        transactionHash: receipt.transactionHash,
      });
    } catch (error: unknown) {
      const errorResponse = handleException("/api/verify-otp", error);
      res.status(errorResponse.code).json(errorResponse);
    }
  },
);

// Endpoint to check OTP validity
app.get(
  "/api/is-otp-valid/:transactionId",
  async (
    req: Request<{ transactionId: string }>,
    res: Response<{ isValid: boolean } | ErrorResponse>,
  ) => {
    try {
      const { transactionId } = req.params;

      // Validate request parameters
      if (!transactionId) {
        res
          .status(400)
          .json({ code: 400, message: "Missing transactionId parameter" });
        return;
      }

      // Hash the transactionId to match the on-chain format
      const hashedTransactionId = ethers.keccak256(
        ethers.toUtf8Bytes(transactionId),
      );

      // Check OTP validity on-chain
      const isValid = await contract.isOtpValid(hashedTransactionId);

      // Return the result
      res.status(200).json({ isValid });
    } catch (error: unknown) {
      const errorResponse = handleException("/api/is-otp-valid", error);
      res.status(errorResponse.code).json(errorResponse);
    }
  },
);

// Start the server
const port = PORT || 3000;
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Server running on http://localhost:${port}`);
});
