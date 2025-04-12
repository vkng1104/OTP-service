import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Request,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";

import { JwtAuthGuard, Roles, RolesGuard } from "~/module-auth";
import { BankingService } from "~/module-banking/banking.service";
import { Currency } from "~/module-banking/constant";
import {
  AccountBalanceDto,
  CreateAccountBalanceRequest,
  ListTransactionsRequest,
  TransactionHistoryListDto,
  TransferMoneyDto,
} from "~/module-banking/model";
import { UserRole } from "~/module-user/constant";

@Controller("api/banking")
export class BankingController {
  constructor(private readonly bankingService: BankingService) {}

  /**
   * Creates a new bank account for a user
   */
  @Post("account/create")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.USER)
  @UsePipes(new ValidationPipe({ transform: true }))
  async createAccount(
    @Body() createAccountDto: CreateAccountBalanceRequest,
    @Request() req,
  ): Promise<AccountBalanceDto> {
    return await this.bankingService.createAccount(
      req.user.id,
      createAccountDto,
    );
  }

  /**
   * Retrieves account balance for a user and currency
   */
  @Get("account/balance")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.USER)
  async getAccountBalance(
    @Query("currency") currency: string,
    @Request() req,
  ): Promise<AccountBalanceDto> {
    return await this.bankingService.getBalance(
      req.user.id,
      currency as Currency,
    );
  }

  /**
   * Transfers money between accounts
   */
  @Post("transfer")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.USER)
  @UsePipes(new ValidationPipe({ transform: true }))
  async transferMoney(
    @Body() transferMoneyDto: TransferMoneyDto,
    @Request() req,
  ): Promise<{ success: boolean; message: string }> {
    return await this.bankingService.transferMoney(
      req.user.id,
      transferMoneyDto,
    );
  }

  /**
   * Retrieves transaction history for a user and currency
   */
  @Post("transactions")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.USER)
  async getTransactionHistory(
    @Body() request: ListTransactionsRequest,
    @Request() req,
  ): Promise<TransactionHistoryListDto> {
    return await this.bankingService.listTransactions(req.user.id, request);
  }
}
