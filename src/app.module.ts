import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";

import {
  AuthController,
  BankingController,
  InternalController,
  OtpController,
  UserAuthProviderController,
  UserController,
} from "./module-api";
import { JwtAuthModule } from "./module-auth/jwt-auth.module";
import { BankingModule } from "./module-banking/banking.module";
import { AccountBalanceEntity } from "./module-banking/entity/account-balance.entity";
import { TransactionHistoryEntity } from "./module-banking/entity/transaction-history.entity";
import { OtpModule } from "./module-otp/otp.module";
import { AuthProviderEntity } from "./module-user/entity/auth-provider.entity";
import { UserEntity } from "./module-user/entity/user.entity";
import { UserKeyEntity } from "./module-user/entity/user-key.entity";
import { UserOtpIndexCountEntity } from "./module-user/entity/user-otp-index-count.entity";
import { UserModule } from "./module-user/user.module";
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: "postgres",
      host: process.env.DB_HOST || "localhost",
      port: parseInt(process.env.DB_PORT, 10) || 2345, // Match docker-compose port
      username: process.env.DB_USER || "local",
      password: process.env.DB_PASSWORD || "local",
      database: process.env.DB_NAME || "thesis",
      entities: [
        UserEntity,
        AuthProviderEntity,
        UserKeyEntity,
        UserOtpIndexCountEntity,
        AccountBalanceEntity,
        TransactionHistoryEntity,
      ], // Register all entities
      synchronize: false, // Use migrations instead of auto-sync
      migrationsRun: true, // Run migrations automatically
    }),
    JwtAuthModule,
    UserModule,
    OtpModule,
    BankingModule,
  ],
  controllers: [
    OtpController,
    UserController,
    InternalController,
    AuthController,
    BankingController,
    UserAuthProviderController,
  ],
})
export class AppModule {}
