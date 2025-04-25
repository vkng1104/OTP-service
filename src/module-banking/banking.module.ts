import { CacheModule } from "@nestjs/cache-manager";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { IpfsModule } from "~/module-ipfs/ipfs.module";
import { OtpModule } from "~/module-otp/otp.module";

import { BankingService } from "./banking.service";
import { AccountBalanceEntity } from "./entity/account-balance.entity";
import { TransactionHistoryEntity } from "./entity/transaction-history.entity";
import { TransactionOtpService } from "./transaction-otp.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([AccountBalanceEntity, TransactionHistoryEntity]),
    IpfsModule,
    OtpModule,
    CacheModule.register({
      isGlobal: true,
    }),
  ],
  providers: [BankingService, TransactionOtpService],
  exports: [BankingService, TransactionOtpService],
})
export class BankingModule {}
