import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ethers } from "ethers";

import OTPSystemJSON from "~/artifacts/src/contracts/OTPSystem.sol/OTPSystem.json"; // Import the ABI from the JSON file

import {
  OtpGeneratedRequest,
  OtpRequestRequest,
  OtpResponse,
  OtpVerificationRequest,
  OtpVerificationResponse,
  OtpView,
} from "./models";
import { handleException } from "./utils/handleException";
import { generateOtp } from "./utils/otpGenerator";

@Injectable()
export class OtpService {
  private readonly provider: ethers.JsonRpcProvider;
  private readonly signer: ethers.Wallet;
  private readonly contract: ethers.Contract;

  constructor(private readonly configService: ConfigService) {
    const CONTRACT_ADDRESS = this.configService.get<string>("CONTRACT_ADDRESS");
    const ETHEREUM_PROVIDER_URL = this.configService.get<string>(
      "ETHEREUM_PROVIDER_URL",
    );
    const PRIVATE_KEY = this.configService.get<string>("PRIVATE_KEY");

    if (!CONTRACT_ADDRESS || !ETHEREUM_PROVIDER_URL || !PRIVATE_KEY) {
      throw new Error(
        "Missing required environment variables for OTP service.",
      );
    }

    // Initialize Ethereum components
    this.provider = new ethers.JsonRpcProvider(ETHEREUM_PROVIDER_URL);
    this.signer = new ethers.Wallet(PRIVATE_KEY, this.provider);
    this.contract = new ethers.Contract(
      CONTRACT_ADDRESS,
      OTPSystemJSON.abi,
      this.signer,
    );
  }

  async generateOtp({
    length,
    duration,
  }: OtpGeneratedRequest): Promise<OtpView> {
    const otp = generateOtp(length || 6);
    const expirationTime = Math.floor(Date.now() / 1000) + (duration || 300);

    return { otp, expirationTime };
  }

  async requestOtp({
    transactionId,
    payload,
    userAddress,
    signature,
  }: OtpRequestRequest): Promise<OtpResponse> {
    try {
      // Create OtpRequestRequest struct
      const value = {
        transactionId: transactionId,
        otp: payload.otp,
        userAddress,
        expirationTime: payload.expirationTime,
        nonce: 0,
      };

      // Submit OTP request to the blockchain
      const tx = await this.contract.requestOtp(value, signature);
      await tx.wait();

      return {
        message: "OTP requested successfully",
        transactionHash: tx.hash,
        transactionId: value.transactionId,
        otp: payload.otp,
      };
    } catch (error: unknown) {
      const errorResponse = handleException("requesting OTP", error);
      throw new HttpException(
        {
          message: errorResponse.message,
          details: errorResponse.details,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async verifyOtp({
    transactionId,
    otp,
    signature,
  }: OtpVerificationRequest): Promise<OtpVerificationResponse> {
    try {
      // Interact with the smart contract to verify the OTP
      const tx = await this.contract.verifyOtp(transactionId, otp, signature);

      // Wait for the transaction to be mined
      const receipt = await tx.wait();

      return {
        success: true,
        message: "OTP verified successfully",
        transactionHash: receipt.transactionHash,
      };
    } catch (error: unknown) {
      const errorResponse = handleException("verifying OTP", error);
      throw new HttpException(
        {
          message: errorResponse.message,
          details: errorResponse.details,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async isOtpValid(transactionId: string) {
    try {
      // Hash the transactionId to match the on-chain format
      const hashedTransactionId = ethers.keccak256(
        ethers.toUtf8Bytes(transactionId),
      );

      // Check OTP validity on-chain
      const isValid = await this.contract.isOtpValid(hashedTransactionId);

      // Return the result
      return { isValid };
    } catch (error: unknown) {
      const errorResponse = handleException("checking OTP valid", error);
      throw new HttpException(
        {
          message: errorResponse.message,
          details: errorResponse.details,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
