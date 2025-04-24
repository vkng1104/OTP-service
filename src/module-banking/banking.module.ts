import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { IpfsModule } from "~/module-ipfs/ipfs.module";

import { BankingService } from "./banking.service";
import { AccountBalanceEntity } from "./entity/account-balance.entity";
import { TransactionHistoryEntity } from "./entity/transaction-history.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([AccountBalanceEntity, TransactionHistoryEntity]),
    IpfsModule,
  ],
  providers: [BankingService],
  exports: [BankingService],
})
export class BankingModule {}
