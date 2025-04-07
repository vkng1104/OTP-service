import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";

import { UserModule } from "~/module-user/user.module";

import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "./guard/jwt-auth.guard";
import { RolesGuard } from "./guard/roles.guard";
import { JwtService } from "./jwt.service";
import { JwtStrategy } from "./strategies/jwt.strategy";
@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>("JWT_SECRET"),
        signOptions: {
          expiresIn: configService.get<string>("JWT_EXPIRES_IN", "1h"),
        },
      }),
      inject: [ConfigService],
    }),
    UserModule,
  ],
  providers: [JwtService, JwtAuthGuard, RolesGuard, AuthService, JwtStrategy],
  exports: [JwtService, JwtAuthGuard, RolesGuard, AuthService],
})
export class JwtAuthModule {}
