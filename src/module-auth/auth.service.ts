import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";

import { AuthProviderService } from "~/module-user/auth-provider.service";
import { AuthenticationType } from "~/module-user/constant";
import { AuthProviderDto, UserDto } from "~/module-user/model";
import { UserService } from "~/module-user/user.service";

import { JwtService } from "./jwt.service";
import { LoginUserRequest, TokenPayload } from "./model";

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly authProviderService: AuthProviderService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(
    request: LoginUserRequest,
  ): Promise<{ user: UserDto; auth_provider: AuthProviderDto }> {
    const { username_or_email, password, auth_provider, device_id } = request;

    const user = await this.userService.byUsernameOrEmail(username_or_email);

    let authentication_provider: AuthProviderDto;
    switch (auth_provider) {
      case AuthenticationType.PASSWORD:
        authentication_provider =
          await this.authProviderService.validatePassword(
            user.id,
            password,
            auth_provider,
          );
        break;

      case AuthenticationType.PIN:
        if (!device_id) {
          throw new BadRequestException(
            "Device ID is required for PIN authentication",
          );
        }
        authentication_provider =
          await this.authProviderService.validatePassword(
            user.id,
            password,
            auth_provider,
            device_id,
          );
        break;

      default:
        throw new BadRequestException(
          `Unsupported authentication provider: ${auth_provider}`,
        );
    }

    return { user, auth_provider: authentication_provider };
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
