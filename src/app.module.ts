import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";

import { AuthController } from "./module-api/auth.controller";
import { InternalController } from "./module-api/internal.controller";
import { OtpController } from "./module-api/otp.controller";
import { UserController } from "./module-api/user.controller";
import { JwtAuthModule } from "./module-auth/jwt-auth.module";
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
      ], // Register all entities
      synchronize: false, // Use migrations instead of auto-sync
      migrationsRun: true, // Run migrations automatically
    }),
    JwtAuthModule,
    UserModule,
    OtpModule,
  ],
  controllers: [
    OtpController,
    UserController,
    InternalController,
    AuthController,
  ],
})
export class AppModule {}
