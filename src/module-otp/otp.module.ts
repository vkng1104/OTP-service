import { CacheModule } from "@nestjs/cache-manager";
import { Module } from "@nestjs/common";

import { UserModule } from "~/module-user/user.module";

import { OtpService } from "./otp.service";

@Module({
  imports: [UserModule, CacheModule.register()],
  providers: [OtpService],
  exports: [OtpService],
})
export class OtpModule {}
