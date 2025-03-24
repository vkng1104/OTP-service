import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ethers, TypedDataDomain } from "ethers";

import OTPSystemJSON from "~/artifacts/src/contracts/OTPSystem.sol/OTPSystem.json"; // Import the ABI from the JSON file
import { UserService } from "~/module-user/user.service";
import { UserKeyService } from "~/module-user/user-key.service";
import { UserOtpIndexCountService } from "~/module-user/user-otp-index-count.service";

import {
  OtpGeneratedRequest,
  OtpRegisterRequest,
  OtpVerificationRequest,
  OtpVerificationResponse,
  OtpView,
  SignerContractPair,
  UserRegistrationResponse,
} from "./models";
import {
  OTP_VERIFICATION_TYPE,
  OTPVerification,
  USER_REGISTRATION_TYPE,
  UserRegistration,
} from "./models/eip-712-structs.model";
import { handleException } from "./utils/handleException";
@Injectable()
export class OtpService {
  private readonly provider: ethers.JsonRpcProvider;
  private readonly admin: ethers.Wallet;
  private readonly contractCalledByAdmin: ethers.Contract;
  private readonly contractAddress: string;
  private readonly chainId: number;
  private readonly servicePublicKey: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly userOtpIndexCountService: UserOtpIndexCountService,
    private readonly userKeyService: UserKeyService,
    private readonly userService: UserService,
  ) {
    const CONTRACT_ADDRESS = this.configService.get<string>("CONTRACT_ADDRESS");

    const ETHEREUM_PROVIDER_URL = this.configService.get<string>(
      "ETHEREUM_PROVIDER_URL",
    );

    const CHAIN_ID = this.configService.get<number>("CHAIN_ID");

    const SERVICE_PUBLIC_KEY = this.configService.get<string>("SERVICE");

    const PRIVATE_KEY = this.configService.get<string>("PRIVATE_KEY");

    if (!CONTRACT_ADDRESS || !ETHEREUM_PROVIDER_URL || !PRIVATE_KEY) {
      throw new Error(
        "Missing required environment variables for OTP service.",
      );
    }

    // Initialize Ethereum components
    this.contractAddress = CONTRACT_ADDRESS;
    this.chainId = CHAIN_ID;
    this.servicePublicKey = SERVICE_PUBLIC_KEY;
    this.provider = new ethers.JsonRpcProvider(ETHEREUM_PROVIDER_URL);
    const pair = this.getSignerAndContractBySecretKey(PRIVATE_KEY);
    this.admin = pair.signer;
    this.contractCalledByAdmin = pair.contract;
  }

  getDomain(): TypedDataDomain {
    return {
      name: "OTPSystem",
      version: "1",
      chainId: this.chainId,
      verifyingContract: this.contractAddress,
    };
  }

  getSignerAndContractBySecretKey(sk: string): SignerContractPair {
    const signer = new ethers.Wallet(sk, this.provider);
    const contract = new ethers.Contract(
      this.contractAddress,
      OTPSystemJSON.abi,
      signer,
    );
    return { signer, contract };
  }

  getBlockchainUserId(userId: string): string {
    return ethers.keccak256(
      ethers.toUtf8Bytes(`${userId}:${this.servicePublicKey}`),
    );
  }

  async getSignedTypedData(
    type: "register",
    data: UserRegistration,
    signer: ethers.Wallet,
  ): Promise<string>;
  async getSignedTypedData(
    type: "verify",
    data: OTPVerification,
    signer: ethers.Wallet,
  ): Promise<string>;
  async getSignedTypedData(
    type: "register" | "verify",
    data: UserRegistration | OTPVerification,
    signer: ethers.Wallet,
  ): Promise<string> {
    const types =
      type === "register" ? USER_REGISTRATION_TYPE : OTP_VERIFICATION_TYPE;

    return signer.signTypedData(this.getDomain(), types, data);
  }

  async generateOtp({
    user_id,
    provider_id,
  }: OtpGeneratedRequest): Promise<OtpView> {
    const user = await this.userService.byId(user_id);

    if (!user) {
      throw new HttpException("User not found", HttpStatus.NOT_FOUND);
    }

    const { secretKey: userSk } =
      await this.userKeyService.getKeyPairs(user_id);

    if (!userSk) {
      throw new HttpException("User key not found", HttpStatus.NOT_FOUND);
    }

    const otp_index =
      await this.userOtpIndexCountService.getOtpIndexAndIncrement(user_id);

    return {
      otp: ethers.keccak256(
        ethers.toUtf8Bytes(
          `${user.username}:${provider_id}:${userSk}:${otp_index}`,
        ),
      ),
    };
  }

  async registerUser({
    user_id,
    provider_id,
  }: OtpRegisterRequest): Promise<UserRegistrationResponse> {
    try {
      const user = await this.userService.byId(user_id);

      if (!user) {
        throw new HttpException("User not found", HttpStatus.NOT_FOUND);
      }

      const { secretKey: userSk } =
        await this.userKeyService.getKeyPairs(user_id);

      if (!userSk) {
        throw new HttpException("User key not found", HttpStatus.NOT_FOUND);
      }

      const otp_index = 1;
      const nextOtp = ethers.keccak256(
        ethers.toUtf8Bytes(
          `${user.username}:${provider_id}:${userSk}:${otp_index}`,
        ),
      );

      const { signer, contract } = this.getSignerAndContractBySecretKey(userSk);

      const request = {
        username: user.username,
        service: this.servicePublicKey,
        commitmentValue: ethers.keccak256(nextOtp),
      };

      const signature = await this.getSignedTypedData(
        "register",
        request,
        signer,
      );

      const tx = await contract.registerUser(
        this.getBlockchainUserId(user_id),
        request,
        signature,
      );
      // Wait for the transaction to be mined
      const receipt = await tx.wait();

      return {
        success: true,
        message: "User registered successfully",
        transactionHash: receipt.transactionHash,
      };
    } catch (error: unknown) {
      const errorResponse = handleException("registering user", error);
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
      const tx = await this.contractCalledByAdmin.verifyOtp(
        transactionId,
        otp,
        signature,
      );

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
      const isValid =
        await this.contractCalledByAdmin.isOtpValid(hashedTransactionId);

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
