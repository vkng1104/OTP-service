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
import { Metadata } from "~/module-common/model/metadata.model";
import { IpfsService } from "~/module-ipfs/ipfs.service";
import { PinataFile } from "~/module-ipfs/model";
import { LoginHistoryService } from "~/module-user/login-history.service";
import { UserService } from "~/module-user/user.service";

@Controller("api/auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly loginHistoryService: LoginHistoryService,
    private readonly ipfsService: IpfsService,
  ) {}

  @Post("login")
  async login(@Body() request: LoginUserRequest): Promise<LoginUserResponse> {
    const { user, auth_provider } =
      await this.authService.validateUser(request);
    const tokens = await this.authService.login(user.id);

    const context = {
      user_id: user.id,
      auth_provider_id: auth_provider.id,
      auth_provider: request.auth_provider,
      device_id: request.device_id,
      description: `user ${user.username} logged in on date ${new Date().toISOString()}`,
    };

    const ipfs_cid = await this.ipfsService.uploadFile(
      new PinataFile(
        `${user.username}-${new Date().toISOString()}.json`,
        "application/json",
        new Metadata(context),
      ),
    );

    await this.loginHistoryService.createLoginHistory({
      ...context,
      ipfs_cid,
    });

    return {
      ...tokens,
      user,
      receipt: await this.ipfsService.getUrl(ipfs_cid),
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
