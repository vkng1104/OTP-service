import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { HttpException, HttpStatus, Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Cache } from "cache-manager";
import { ethers, TypedDataDomain } from "ethers";

import OTPSystemJSON from "~/artifacts/src/contracts/OTPSystem.sol/OTPSystem.json"; // Import the ABI from the JSON file
import { AuthProviderService } from "~/module-user/auth-provider.service";
import { UserService } from "~/module-user/user.service";
import { UserOtpIndexCountService } from "~/module-user/user-otp-index-count.service";

import {
  BlockchainBaseResponse,
  BlockchainOtpData,
  OtpGeneratedRequest,
  OtpGeneratedResponse,
  OtpRegisterRequest,
  OtpVerificationRequest,
  OtpVerificationResponse,
  OtpWindowUpdateRequest,
  OtpWindowUpdateResponse,
  SignerContractPair,
  UserRegistrationResponse,
} from "./model";
import {
  OTP_VERIFICATION_TYPE,
  OTPVerification,
  USER_REGISTRATION_TYPE,
  UserRegistration,
} from "./model/eip-712-structs.model";
import { handleBlockchainException } from "./util/handle-exception.util";
import { generateNumericOtpFromHash } from "./util/otp-generator.util";

interface CachedOtpValue {
  raw_otp: string;
  auth_provider_id: string;
  new_commitment_value: string;
}
@Injectable()
export class OtpService {
  private readonly provider: ethers.JsonRpcProvider;
  private readonly admin: ethers.Wallet;
  private readonly contractCalledByAdmin: ethers.Contract;
  private readonly contractAddress: string;
  private readonly chainId: number;
  private readonly servicePublicKey: string;
  private readonly etherscanUrl: string;
  constructor(
    private readonly configService: ConfigService,
    private readonly userOtpIndexCountService: UserOtpIndexCountService,
    private readonly userService: UserService,
    private readonly authProviderService: AuthProviderService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
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
    this.etherscanUrl = this.configService.get<string>("ETHERSCAN_URL");
    this.contractAddress = CONTRACT_ADDRESS;
    this.chainId = CHAIN_ID;
    this.servicePublicKey = SERVICE_PUBLIC_KEY;
    this.provider = new ethers.JsonRpcProvider(ETHEREUM_PROVIDER_URL);
    const pair = this.getSignerAndContractBySecretKey(PRIVATE_KEY);
    this.admin = pair.signer;
    this.contractCalledByAdmin = pair.contract;
  }

  private getDomain(): TypedDataDomain {
    return {
      name: "OTPSystem",
      version: "1",
      chainId: this.chainId,
      verifyingContract: this.contractAddress,
    };
  }

  private getSignerAndContractBySecretKey(sk: string): SignerContractPair {
    const signer = new ethers.Wallet(sk, this.provider);
    const contract = new ethers.Contract(
      this.contractAddress,
      OTPSystemJSON.abi,
      signer,
    );
    return { signer, contract };
  }

  private getBlockchainUserId(
    user_id: string,
    auth_provider_id: string,
  ): string {
    return ethers.keccak256(
      ethers.toUtf8Bytes(
        `${user_id}:${this.servicePublicKey}:${auth_provider_id}`,
      ),
    );
  }

  private getTxnLogUrl(txnHash: string): string {
    return `${this.etherscanUrl}/tx/${txnHash}`;
  }

  private async getSignedTypedData(
    type: "register",
    data: UserRegistration,
    signer: ethers.Wallet,
  ): Promise<string>;
  private async getSignedTypedData(
    type: "verify",
    data: OTPVerification,
    signer: ethers.Wallet,
  ): Promise<string>;
  private async getSignedTypedData(
    type: "register" | "verify",
    data: UserRegistration | OTPVerification,
    signer: ethers.Wallet,
  ): Promise<string> {
    const types =
      type === "register" ? USER_REGISTRATION_TYPE : OTP_VERIFICATION_TYPE;

    return signer.signTypedData(this.getDomain(), types, data);
  }

  private validateCachedOtpValue(
    cachedValue: unknown,
  ): cachedValue is CachedOtpValue {
    return (
      typeof cachedValue === "object" &&
      cachedValue !== null &&
      "raw_otp" in cachedValue &&
      "auth_provider_id" in cachedValue &&
      "new_commitment_value" in cachedValue
    );
  }

  async generateOtp(
    user_id: string,
    {
      provider,
      provider_id,
      device_id,
      duration = 5 * 60, // 5 minutes
    }: OtpGeneratedRequest,
  ): Promise<OtpGeneratedResponse> {
    const authProvider = await this.authProviderService.validatePassword(
      user_id,
      provider_id,
      provider,
      device_id,
    );

    const { username, secret_key } =
      await this.userService.getSensitiveUserDetails(user_id);

    const otp_index = await this.userOtpIndexCountService.getOtpIndex(
      user_id,
      authProvider.id,
    );

    const currentTimeInSeconds = Math.floor(Date.now() / 1000);
    const endTimeInSeconds = currentTimeInSeconds + duration;

    const tx = await this.updateOtpWindow({
      user_id,
      auth_provider_id: authProvider.id,
      start_time: currentTimeInSeconds, // epoch time
      end_time: endTimeInSeconds, // epoch time
    });

    const rawOtp = ethers.keccak256(
      ethers.toUtf8Bytes(
        `${username}:${provider_id}:${secret_key}:${otp_index}`,
      ),
    );
    const otp = generateNumericOtpFromHash(rawOtp);

    const rawNextOtp = ethers.keccak256(
      ethers.toUtf8Bytes(
        `${username}:${provider_id}:${secret_key}:${otp_index + 1}`,
      ),
    );
    const newCommitmentValue = ethers.keccak256(rawNextOtp);

    await this.cacheManager.set(`otp:${user_id}:${otp}`, {
      raw_otp: rawOtp,
      auth_provider_id: authProvider.id,
      new_commitment_value: newCommitmentValue,
    });

    return {
      success: true,
      message: "OTP generated successfully",
      txnLogUrls: tx.txnLogUrls,
      data: {
        otp,
        start_time: currentTimeInSeconds,
        end_time: endTimeInSeconds,
      },
    };
  }

  async getUserWalletBalance(user_wallet_address: string): Promise<string> {
    try {
      const balanceInWei = await this.provider.getBalance(user_wallet_address);
      const balanceInEth = ethers.formatEther(balanceInWei);
      return balanceInEth; // Returns balance as a string, e.g., "0.013"
    } catch (error: unknown) {
      throw new HttpException(
        {
          message: "Failed to retrieve user balance",
          details: error instanceof Error ? error.message : String(error),
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async refundToAdminWallet(
    user_id: string,
    amountInEth: string,
    admin_wallet_address: string,
  ): Promise<BlockchainBaseResponse> {
    const { secret_key } =
      await this.userService.getSensitiveUserDetails(user_id);

    const { signer } = this.getSignerAndContractBySecretKey(secret_key);

    try {
      const tx = await signer.sendTransaction({
        to: admin_wallet_address,
        value: ethers.parseEther(amountInEth),
      });

      return {
        success: true,
        message: "Refund to admin wallet successful",
        txnLogUrls: [this.getTxnLogUrl(tx.hash)],
      };
    } catch (error: unknown) {
      throw new HttpException(
        {
          message: "Failed to refund to admin wallet",
          details: error instanceof Error ? error.message : String(error),
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async fundUserWallet(user_wallet_address: string, amountInEth = "0.01") {
    try {
      const tx = await this.admin.sendTransaction({
        to: user_wallet_address,
        value: ethers.parseEther(amountInEth),
      });

      return {
        success: true,
        message: "User wallet funded successfully",
        txnLogUrls: [this.getTxnLogUrl(tx.hash)],
      };
    } catch (error: unknown) {
      throw new HttpException(
        {
          message: "Failed to fund user wallet",
          details: error instanceof Error ? error.message : String(error),
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async registerUser(
    user_id: string,
    { provider, provider_id, device_id }: OtpRegisterRequest,
  ): Promise<UserRegistrationResponse> {
    const authProvider = await this.authProviderService.validatePassword(
      user_id,
      provider_id,
      provider,
      device_id,
    );

    const { username, secret_key, public_key } =
      await this.userService.getSensitiveUserDetails(user_id);

    const otp_index = await this.userOtpIndexCountService.getOtpIndex(
      user_id,
      authProvider.id,
    );

    const rawOtp = ethers.keccak256(
      ethers.toUtf8Bytes(
        `${username}:${provider_id}:${secret_key}:${otp_index}`,
      ),
    );

    const { signer, contract } =
      this.getSignerAndContractBySecretKey(secret_key);

    const request: UserRegistration = {
      username,
      service: this.servicePublicKey,
      commitmentValue: ethers.keccak256(rawOtp),
    };

    const signature = await this.getSignedTypedData(
      "register",
      request,
      signer,
    );

    try {
      // fund user wallet for registering
      await this.fundUserWallet(public_key, "0.001");

      const tx = await contract.registerUser(
        this.getBlockchainUserId(user_id, authProvider.id),
        request,
        signature,
      );

      // fund user wallet after registering
      await this.fundUserWallet(public_key, "0.009");

      return {
        success: true,
        message: "User registered successfully",
        txnLogUrls: [this.getTxnLogUrl(tx.hash)],
      };
    } catch (error: unknown) {
      const errorResponse = handleBlockchainException(
        "registering user",
        error,
      );
      throw new HttpException(
        {
          message: errorResponse.message,
          details: errorResponse.details,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async updateOtpWindow({
    user_id,
    auth_provider_id,
    start_time,
    end_time,
  }: OtpWindowUpdateRequest): Promise<OtpWindowUpdateResponse> {
    try {
      const tx = await this.contractCalledByAdmin.updateOtpWindow(
        this.getBlockchainUserId(user_id, auth_provider_id),
        start_time,
        end_time,
      );

      return {
        success: true,
        message: "OTP window updated successfully",
        txnLogUrls: [this.getTxnLogUrl(tx.hash)],
      };
    } catch (error: unknown) {
      const errorResponse = handleBlockchainException(
        "updating OTP window",
        error,
      );
      throw new HttpException(
        {
          message: errorResponse.message,
          details: errorResponse.details,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async verifyOtp(
    user_id: string,
    { otp }: OtpVerificationRequest,
  ): Promise<OtpVerificationResponse> {
    const { username, secret_key } =
      await this.userService.getSensitiveUserDetails(user_id);

    const { signer, contract } =
      this.getSignerAndContractBySecretKey(secret_key);

    const cachedValue = await this.cacheManager.get(`otp:${user_id}:${otp}`);

    if (!this.validateCachedOtpValue(cachedValue)) {
      throw new HttpException(
        {
          message: "Invalid OTP",
          details: "OTP is not valid",
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    const authProvider = await this.authProviderService.byProviderIdAndUserId(
      cachedValue.auth_provider_id,
      user_id,
    );

    const otp_index = await this.userOtpIndexCountService.getOtpIndex(
      user_id,
      authProvider.id,
    );

    const request: OTPVerification = {
      username,
      service: this.servicePublicKey,
      otp: cachedValue.raw_otp,
      newCommitmentValue: cachedValue.new_commitment_value,
    };

    const signature = await this.getSignedTypedData("verify", request, signer);

    try {
      // Interact with the smart contract to verify the OTP
      const tx = await contract.verifyOtp(
        this.getBlockchainUserId(user_id, authProvider.id),
        otp_index,
        request,
        signature,
      );

      // update otp index after successful verification
      await this.userOtpIndexCountService.incrementOtpIndex(
        user_id,
        authProvider.id,
      );

      return {
        success: true,
        message: "OTP verified successfully",
        txnLogUrls: [this.getTxnLogUrl(tx.hash)],
      };
    } catch (error: unknown) {
      const errorResponse = handleBlockchainException("verifying OTP", error);
      throw new HttpException(
        {
          message: errorResponse.message,
          details: errorResponse.details,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async checkRole(wallet_address: string, role: string) {
    try {
      const roleHash = ethers.keccak256(ethers.toUtf8Bytes(role));
      const isGranted = await this.contractCalledByAdmin.hasRole(
        roleHash,
        wallet_address,
      );

      return isGranted;
    } catch (error: unknown) {
      const errorResponse = handleBlockchainException("checking role", error);
      throw new HttpException(
        {
          message: errorResponse.message,
          details: errorResponse.details,
        },
        errorResponse.code,
      );
    }
  }

  async grantRole(
    role: string,
    wallet_address: string,
  ): Promise<BlockchainBaseResponse> {
    try {
      const tx = await this.contractCalledByAdmin.grantRole(
        ethers.keccak256(ethers.toUtf8Bytes(role)),
        wallet_address,
      );

      return {
        success: true,
        message: "Role granted successfully",
        txnLogUrls: [this.getTxnLogUrl(tx.hash)],
      };
    } catch (error: unknown) {
      const errorResponse = handleBlockchainException("granting role", error);
      throw new HttpException(
        {
          message: errorResponse.message,
          details: errorResponse.details,
        },
        errorResponse.code,
      );
    }
  }

  async blacklistUser(user_id: string): Promise<BlockchainBaseResponse> {
    const authProviders =
      await this.authProviderService.byUserIdOrThrow(user_id);

    const txs = authProviders.map((authProvider) => {
      return this.contractCalledByAdmin.blacklistUser(
        this.getBlockchainUserId(user_id, authProvider.id),
      );
    });

    try {
      const tx = await Promise.all(txs);

      return {
        success: true,
        message: "User blacklisted successfully",
        txnLogUrls: tx.map((t) => this.getTxnLogUrl(t.hash)),
      };
    } catch (error: unknown) {
      const errorResponse = handleBlockchainException(
        "blacklisting user",
        error,
      );
      throw new HttpException(
        {
          message: errorResponse.message,
          details: errorResponse.details,
        },
        errorResponse.code,
      );
    }
  }

  async removeFromBlacklist(user_id: string): Promise<BlockchainBaseResponse> {
    const authProviders =
      await this.authProviderService.byUserIdOrThrow(user_id);

    const txs = authProviders.map((authProvider) => {
      return this.contractCalledByAdmin.removeFromBlacklist(
        this.getBlockchainUserId(user_id, authProvider.id),
      );
    });

    try {
      const tx = await Promise.all(txs);

      return {
        success: true,
        message: "User removed from blacklist successfully",
        txnLogUrls: tx.map((t) => this.getTxnLogUrl(t.hash)),
      };
    } catch (error: unknown) {
      const errorResponse = handleBlockchainException(
        "removing user from blacklist",
        error,
      );
      throw new HttpException(
        {
          message: errorResponse.message,
          details: errorResponse.details,
        },
        errorResponse.code,
      );
    }
  }

  async resetManyOtps(user_id: string): Promise<BlockchainBaseResponse> {
    const authProviders =
      await this.authProviderService.byUserIdOrThrow(user_id);

    try {
      const tx = await this.contractCalledByAdmin.resetManyOtps(
        authProviders.map((authProvider) =>
          this.getBlockchainUserId(user_id, authProvider.id),
        ),
      );

      return {
        success: true,
        message: "OTPs reset successfully",
        txnLogUrls: [this.getTxnLogUrl(tx.hash)],
      };
    } catch (error: unknown) {
      const errorResponse = handleBlockchainException(
        "resetting many otps",
        error,
      );
      throw new HttpException(
        {
          message: errorResponse.message,
          details: errorResponse.details,
        },
        errorResponse.code,
      );
    }
  }

  async viewOtpData(user_id: string): Promise<BlockchainOtpData[]> {
    const authProviders =
      await this.authProviderService.byUserIdOrThrow(user_id);

    const otpData = authProviders.map(async (authProvider) => {
      try {
        const [commitmentValue, index, startTime, endTime] =
          await this.contractCalledByAdmin.getOtpDetails(
            this.getBlockchainUserId(user_id, authProvider.id),
          );

        return {
          commitment_value: commitmentValue,
          index: index.toString(),
          start_time: startTime.toString(),
          end_time: endTime.toString(),
        } as BlockchainOtpData;
      } catch (error: unknown) {
        throw new HttpException(
          {
            message: "Failed to retrieve OTP data",
            details: error instanceof Error ? error.message : String(error),
          },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    });

    return await Promise.all(otpData);
  }
}
