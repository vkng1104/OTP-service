import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { plainToInstance } from "class-transformer";
import { DataSource, IsNull, Repository } from "typeorm";

import { AccountStatus, Currency, TransactionType } from "./constant";
import { AccountBalanceEntity } from "./entity/account-balance.entity";
import { TransactionHistoryEntity } from "./entity/transaction-history.entity";
import {
  AccountBalanceDto,
  CreateAccountBalanceRequest,
  ListAccountsRequest,
  ListAccountsResponse,
  ListTransactionsRequest,
  TransactionHistoryDto,
  TransactionHistoryListDto,
  TransferMoneyDto,
} from "./model";

@Injectable()
export class BankingService {
  constructor(
    @InjectRepository(AccountBalanceEntity)
    private readonly accountBalanceRepository: Repository<AccountBalanceEntity>,
    @InjectRepository(TransactionHistoryEntity)
    private readonly transactionHistoryRepository: Repository<TransactionHistoryEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async createAccount(
    user_id: string,
    createAccountDto: CreateAccountBalanceRequest,
  ): Promise<AccountBalanceDto> {
    const existingAccount = await this.accountBalanceRepository.findOne({
      where: {
        user_id,
        currency: createAccountDto.currency,
        deleted_at: IsNull(),
      },
    });

    if (existingAccount) {
      throw new BadRequestException("Account already exists for this currency");
    }

    const account = this.accountBalanceRepository.create({
      user_id,
      balance: createAccountDto.initial_balance,
      currency: createAccountDto.currency,
      status: createAccountDto.status || AccountStatus.PENDING,
    });

    const savedAccount = await this.accountBalanceRepository.save(account);

    if (createAccountDto.initial_balance > 0) {
      await this.createTransactionHistory({
        user_id,
        amount: createAccountDto.initial_balance,
        currency: createAccountDto.currency,
        balance_before: 0,
        balance_after: createAccountDto.initial_balance,
        transaction_type: TransactionType.DEPOSIT,
        description: "Initial deposit",
      });
    }

    return plainToInstance(AccountBalanceDto, savedAccount);
  }

  async getBalance(
    user_id: string,
    currency: Currency,
    transactionalRepository?: Repository<AccountBalanceEntity>,
  ): Promise<AccountBalanceDto> {
    const repository = transactionalRepository || this.accountBalanceRepository;
    const account = await repository.findOne({
      where: { user_id, currency, deleted_at: IsNull() },
      lock: transactionalRepository && { mode: "pessimistic_read" },
    });

    if (!account) {
      throw new NotFoundException("Account with this currency not found");
    }

    return plainToInstance(AccountBalanceDto, account);
  }

  async listAccounts(
    user_id: string,
    request: ListAccountsRequest,
  ): Promise<ListAccountsResponse> {
    const queryBuilder = this.accountBalanceRepository
      .createQueryBuilder("account")
      .where("account.user_id = :user_id", { user_id })
      .andWhere("account.deleted_at IS NULL");

    if (request.currency) {
      queryBuilder.andWhere("account.currency = :currency", {
        currency: request.currency,
      });
    }

    if (request.search) {
      queryBuilder.andWhere("account.currency ILIKE :search", {
        search: `%${request.search}%`,
      });
    }

    const [accounts, count] = await queryBuilder
      .orderBy("account.created_at", "DESC")
      .skip(request.offset())
      .take(request.limit())
      .getManyAndCount();

    return new ListAccountsResponse(
      count,
      accounts.map((account) => plainToInstance(AccountBalanceDto, account)),
    );
  }

  async transferMoney(
    sender_id: string,
    transferMoneyDto: TransferMoneyDto,
  ): Promise<{ success: boolean; message: string }> {
    if (sender_id === transferMoneyDto.recipient_id) {
      throw new BadRequestException("Cannot transfer money to yourself");
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction("SERIALIZABLE");

    try {
      // Get transaction-scoped repositories
      const accountBalanceRepo =
        queryRunner.manager.getRepository(AccountBalanceEntity);
      const transactionHistoryRepo = queryRunner.manager.getRepository(
        TransactionHistoryEntity,
      );

      const senderAccount = await this.getBalance(
        sender_id,
        transferMoneyDto.currency,
        accountBalanceRepo,
      );
      const recipientAccount = await this.getBalance(
        transferMoneyDto.recipient_id,
        transferMoneyDto.currency,
        accountBalanceRepo,
      );

      // Check account statuses
      if (senderAccount.status !== AccountStatus.ACTIVE) {
        throw new BadRequestException(
          `Sender account is not active. Current status: ${senderAccount.status}`,
        );
      }
      if (recipientAccount.status !== AccountStatus.ACTIVE) {
        throw new BadRequestException(
          `Recipient account is not active. Current status: ${recipientAccount.status}`,
        );
      }

      if (senderAccount.balance < transferMoneyDto.amount) {
        throw new BadRequestException("Insufficient funds");
      }

      // Update sender's balance
      const senderBalanceBefore = senderAccount.balance;
      senderAccount.balance =
        Number(senderAccount.balance) - Number(transferMoneyDto.amount);
      await accountBalanceRepo.save(senderAccount);

      // Update recipient's balance
      const recipientBalanceBefore = recipientAccount.balance;
      recipientAccount.balance =
        Number(recipientAccount.balance) + Number(transferMoneyDto.amount);
      await accountBalanceRepo.save(recipientAccount);

      // Create transaction history for sender
      const senderTransaction = transactionHistoryRepo.create({
        user_id: sender_id,
        amount: -transferMoneyDto.amount,
        currency: transferMoneyDto.currency,
        balance_before: senderBalanceBefore,
        balance_after: senderAccount.balance,
        transaction_type: TransactionType.TRANSFER,
        reference_id: recipientAccount.id,
        description:
          transferMoneyDto.description ||
          `Transfer money to user with id: ${recipientAccount.user_id}`,
      });
      await transactionHistoryRepo.save(senderTransaction);

      // Create transaction history for recipient
      const recipientTransaction = transactionHistoryRepo.create({
        user_id: transferMoneyDto.recipient_id,
        amount: transferMoneyDto.amount,
        currency: transferMoneyDto.currency,
        balance_before: recipientBalanceBefore,
        balance_after: recipientAccount.balance,
        transaction_type: TransactionType.TRANSFER,
        reference_id: senderAccount.id,
        description:
          transferMoneyDto.description ||
          `Money received from user with id: ${senderAccount.user_id}`,
      });
      await transactionHistoryRepo.save(recipientTransaction);

      await queryRunner.commitTransaction();
      return {
        success: true,
        message: "Transfer completed successfully",
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async listTransactions(
    user_id: string,
    request: ListTransactionsRequest,
  ): Promise<TransactionHistoryListDto> {
    const queryBuilder = this.transactionHistoryRepository
      .createQueryBuilder("transaction")
      .where("transaction.user_id = :user_id", { user_id });

    if (request.currency) {
      queryBuilder.andWhere("transaction.currency = :currency", {
        currency: request.currency,
      });
    }

    if (request.search) {
      queryBuilder.andWhere("transaction.description ILIKE :search", {
        search: `%${request.search}%`,
      });
    }

    const [transactions, total] = await queryBuilder
      .orderBy("transaction.created_at", "DESC")
      .skip(request.offset())
      .take(request.limit())
      .getManyAndCount();

    return new TransactionHistoryListDto(
      total,
      transactions.map((transaction) =>
        plainToInstance(TransactionHistoryDto, transaction),
      ),
    );
  }

  private async createTransactionHistory(data: {
    user_id: string;
    amount: number;
    currency: Currency;
    balance_before: number;
    balance_after: number;
    transaction_type: TransactionType;
    reference_id?: string;
    description?: string;
  }): Promise<TransactionHistoryEntity> {
    const transaction = this.transactionHistoryRepository.create(data);
    return await this.transactionHistoryRepository.save(transaction);
  }

  /**
   * Deletes all account balances and transaction history for a user.
   * This is used during user deletion to clean up all banking-related records.
   */
  async deleteUserBankingRecords(userId: string): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Delete transaction history first (due to potential foreign key constraints)
      await queryRunner.manager.delete(TransactionHistoryEntity, {
        user_id: userId,
      });

      // Delete account balances
      await queryRunner.manager.delete(AccountBalanceEntity, {
        user_id: userId,
      });

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
