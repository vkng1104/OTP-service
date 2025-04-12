import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { BankingService } from "./banking.service";
import { AccountBalanceEntity } from "./entity/account-balance.entity";
import { TransactionHistoryEntity } from "./entity/transaction-history.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([AccountBalanceEntity, TransactionHistoryEntity]),
  ],
  providers: [BankingService],
  exports: [BankingService],
})
export class BankingModule {}
