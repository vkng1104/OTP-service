import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { AuthProviderService } from "./auth-provider.service";
import { AuthProviderEntity } from "./entity/auth-provider.entity";
import { UserEntity } from "./entity/user.entity";
import { UserKeyEntity } from "./entity/user-key.entity";
import { UserOtpIndexCountEntity } from "./entity/user-otp-index-count.entity";
import { UserService } from "./user.service";
import { UserKeyService } from "./user-key.service";
import { UserOtpIndexCountService } from "./user-otp-index-count.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      AuthProviderEntity,
      UserKeyEntity,
      UserOtpIndexCountEntity,
    ]),
  ],
  providers: [
    UserService,
    UserKeyService,
    UserOtpIndexCountService,
    AuthProviderService,
  ],
  exports: [
    UserService,
    UserKeyService,
    UserOtpIndexCountService,
    AuthProviderService,
  ],
})
export class UserModule {}
