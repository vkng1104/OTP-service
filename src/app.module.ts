import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";

import { OtpController } from "./module-api/otp.controller";
import { UserController } from "./module-api/user.controller";
import { OtpService } from "./module-otp/otp.service";
import { AuthProviderService } from "./module-user/auth-provider.service";
import { AuthProviderEntity } from "./module-user/entity/auth-provider.entity";
import { UserEntity } from "./module-user/entity/user.entity";
import { UserKeyEntity } from "./module-user/entity/user-key.entity";
import { UserService } from "./module-user/user.service";
import { UserKeyService } from "./module-user/user-key.service";

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
      entities: [UserEntity, AuthProviderEntity, UserKeyEntity], // Register all entities
      synchronize: false, // Use migrations instead of auto-sync
      migrationsRun: true, // Run migrations automatically
    }),
    TypeOrmModule.forFeature([UserEntity, AuthProviderEntity, UserKeyEntity]), // Register UserEntity with TypeORM
  ],
  controllers: [OtpController, UserController],
  providers: [OtpService, UserService, UserKeyService, AuthProviderService],
})
export class AppModule {}
