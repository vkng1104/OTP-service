import { CacheModule } from "@nestjs/cache-manager";
import { Module } from "@nestjs/common";

import { IpfsModule } from "~/module-ipfs/ipfs.module";
import { UserModule } from "~/module-user/user.module";

import { OtpService } from "./otp.service";

@Module({
  imports: [
    UserModule,
    CacheModule.register({
      isGlobal: true,
    }),
    IpfsModule,
  ],
  providers: [OtpService],
  exports: [OtpService],
})
export class OtpModule {}
