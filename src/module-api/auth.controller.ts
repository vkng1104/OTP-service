import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";

import { AuthService } from "~/module-auth/auth.service";
import { JwtAuthGuard } from "~/module-auth/guard/jwt-auth.guard";
import {
  LoginUserRequest,
  LoginUserResponse,
  TokenPayload,
} from "~/module-auth/model";
import { RefreshTokenRequest } from "~/module-auth/model/request/refresh-token-request.dto";
import { UserService } from "~/module-user/user.service";
@Controller("api/auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  @Post("login")
  async login(
    @Body() loginUserDto: LoginUserRequest,
  ): Promise<LoginUserResponse> {
    const user = await this.authService.validateUser(
      loginUserDto.username_or_email,
      loginUserDto.password,
    );
    return {
      ...(await this.authService.login(user.id)),
      user,
    };
  }

  @Get("user/profile")
  @UseGuards(JwtAuthGuard)
  async getUserProfile(@Request() req) {
    if (!req.user || !("id" in req.user)) {
      throw new UnauthorizedException("User not found");
    }
    return await this.userService.byId(req.user.id);
  }

  @Post("refresh-token")
  async refreshToken(
    @Body() refreshTokenDto: RefreshTokenRequest,
  ): Promise<TokenPayload> {
    return await this.authService.refreshToken(refreshTokenDto.refresh_token);
  }

  @UseGuards(JwtAuthGuard)
  @Get("verify")
  async verifyToken(@Request() req) {
    const token = req.headers.authorization?.split(" ")[1];
    return this.authService.verifyToken(token);
  }
}
