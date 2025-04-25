import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { HttpException, HttpStatus, Inject, Injectable } from "@nestjs/common";
import { Cache } from "cache-manager";

import { OtpService } from "~/module-otp/otp.service";
import { UserDto } from "~/module-user/model";

import { BankingService } from "./banking.service";
import { Currency, PaymentStatus, TransactionType } from "./constant";

interface CachedPaymentInitiateValue {
  user_id: string;
  username: string;
  transaction_id: string;
  merchant_id: string;
  merchant_name: string;
  amount: number;
  currency: Currency;
  status: string;
}

@Injectable()
export class TransactionOtpService {
  constructor(
    private readonly otpService: OtpService,
    private readonly bankingService: BankingService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  private validateCachedPaymentInitiateValue(
    cachedValue: unknown,
  ): cachedValue is CachedPaymentInitiateValue {
    return (
      typeof cachedValue === "object" &&
      cachedValue !== null &&
      "user_id" in cachedValue &&
      "username" in cachedValue &&
      "transaction_id" in cachedValue &&
      "merchant_id" in cachedValue &&
      "merchant_name" in cachedValue &&
      "amount" in cachedValue &&
      "currency" in cachedValue &&
      "status" in cachedValue
    );
  }

  /**
   * Initiates a payment transaction
   * @param user The user object
   * @param merchant_id The ID of the merchant
   * @param merchant_name The name of the merchant
   * @param amount The amount of the transaction
   * @param currency The currency of the transaction
   * @param device_id The ID of the device used for the transaction
   * @param description Optional description of the transaction
   * @returns The transaction ID and status
   */
  async initiatePayment(
    user: UserDto,
    merchant_id: string,
    merchant_name: string,
    amount: number,
    currency: Currency,
  ): Promise<{ transaction_id: string; status: string }> {
    // Generate a unique transaction ID
    const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    this.cacheManager.set(`otp:${user.id}:${transactionId}`, {
      user_id: user.id,
      username: user.username,
      transaction_id: transactionId,
      merchant_id: merchant_id,
      merchant_name: merchant_name,
      amount,
      currency,
      status: PaymentStatus.PENDING,
    });

    return {
      transaction_id: transactionId,
      status: PaymentStatus.PENDING,
    };
  }

  /**
   * Verifies a transaction OTP
   * @param user The user object
   * @param transaction_id The ID of the transaction
   * @param otp The OTP to verify
   * @param device_id The ID of the device used for the transaction
   * @returns Whether the OTP is valid
   */
  async verifyTransactionOtp(
    user: UserDto,
    transaction_id: string,
    otp: string,
    order_metadata?: Record<string, unknown>,
  ): Promise<boolean> {
    const cachedValue = await this.cacheManager.get(
      `otp:${user.id}:${transaction_id}`,
    );
    if (!this.validateCachedPaymentInitiateValue(cachedValue)) {
      throw new HttpException("Transaction not found", HttpStatus.BAD_REQUEST);
    }
    if (cachedValue.status !== PaymentStatus.PENDING) {
      throw new HttpException(
        "Transaction is not pending",
        HttpStatus.BAD_REQUEST,
      );
    }
    if (cachedValue.user_id !== user.id) {
      throw new HttpException("User ID mismatch", HttpStatus.BAD_REQUEST);
    }

    const user_account_balance = await this.bankingService.getBalance(
      user.id,
      cachedValue.currency,
    );

    if (user_account_balance.balance < cachedValue.amount) {
      throw new HttpException("Insufficient balance", HttpStatus.BAD_REQUEST);
    }

    try {
      // Verify OTP using the OTP service
      const verificationResponse = await this.otpService.verifyOtp(
        user.id,
        {
          otp,
        },
        {
          ...cachedValue,
          status: PaymentStatus.SUCCESS,
          transaction_id: transaction_id,
          order_metadata: order_metadata,
        },
      );

      const { success: isValid, cid } = verificationResponse;

      if (isValid) {
        const new_balance = user_account_balance.balance - cachedValue.amount;

        await this.bankingService.updateAccountBalance(
          user.id,
          cachedValue.currency,
          new_balance,
        );

        // Log the OTP verification in login history
        await this.bankingService.createTransactionHistory({
          user_id: user.id,
          amount: cachedValue.amount,
          currency: cachedValue.currency,
          balance_before: user_account_balance.balance,
          balance_after: new_balance,
          transaction_type: TransactionType.EXTERNAL_PAYMENT,
          ipfs_cid: cid,
          reference_id: transaction_id,
          description: `Transaction OTP verified for transaction ${transaction_id}`,
        });
      } else {
        throw new Error("Failed to verify transaction OTP");
      }

      return isValid;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }
}
