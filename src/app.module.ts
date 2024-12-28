import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { OtpController } from "./module-api/otp.controller";
import { OtpService } from "./module-otp/otp.service";

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  controllers: [OtpController],
  providers: [OtpService],
})
export class AppModule {}
