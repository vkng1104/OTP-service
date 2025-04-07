import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";

import { UserService } from "~/module-user/user.service";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get("JWT_SECRET"),
    });
  }
  async validate(payload: unknown) {
    if (!payload || typeof payload !== "object" || !("sub" in payload)) {
      throw new UnauthorizedException("Invalid token payload");
    }

    const user = await this.userService.byId(payload.sub as string);
    if (!user) {
      throw new UnauthorizedException(`User ${payload.sub} not found`);
    }

    return {
      id: payload.sub,
      email: user.email,
      role: user.role,
    };
  }
}
