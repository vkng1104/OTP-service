import { Injectable, UnauthorizedException } from "@nestjs/common";

import { AuthProviderService } from "~/module-user/auth-provider.service";
import { UserDto } from "~/module-user/model";
import { UserService } from "~/module-user/user.service";

import { JwtService } from "./jwt.service";
import { TokenPayload } from "./model";

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly authProviderService: AuthProviderService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(
    usernameOrEmail: string,
    password: string,
  ): Promise<UserDto> {
    const user = await this.userService.byUsernameOrEmail(usernameOrEmail);

    await this.authProviderService.validatePassword(user.id, password);

    return user;
  }

  async login(userId: string): Promise<TokenPayload> {
    return {
      access_token: await this.jwtService.generateToken(userId),
      refresh_token: await this.jwtService.generateRefreshToken(userId),
    };
  }

  async verifyToken(token: string): Promise<string> {
    try {
      const payload = await this.jwtService.verifyToken(token);
      return payload.sub as string;
    } catch (error) {
      throw new UnauthorizedException("Invalid token", error);
    }
  }

  async refreshToken(refreshToken: string): Promise<TokenPayload> {
    const payload = await this.jwtService.verifyRefreshToken(refreshToken);
    return this.login(payload.sub as string);
  }
}
