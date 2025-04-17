import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";

import { JwtAuthGuard, Roles, RolesGuard } from "~/module-auth";
import { OtpService } from "~/module-otp/otp.service";
import { AuthProviderService } from "~/module-user/auth-provider.service";
import { AuthenticationType, UserRole } from "~/module-user/constant";
import {
  AuthProviderDto,
  CreateAuthProviderRequest,
  SetPinRequest,
  UserDto,
} from "~/module-user/model";
import { UserService } from "~/module-user/user.service";

@Controller("api/user/auth-provider")
export class UserAuthProviderController {
  constructor(
    private readonly userService: UserService,
    private readonly otpService: OtpService,
    private readonly authProviderService: AuthProviderService,
  ) {}

  /**
   * Creates a new user auth provider
   */
  @Post("create")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.USER)
  @UsePipes(new ValidationPipe({ transform: true })) // Enables validation
  async createUser(
    @Body() request: CreateAuthProviderRequest,
    @Request() req,
  ): Promise<AuthProviderDto> {
    let authProvider: AuthProviderDto;

    if (request.provider === AuthenticationType.PIN) {
      throw new BadRequestException(
        "PIN is not supported. Please use the set-pin endpoint to set a PIN.",
      );
    }

    try {
      // Create auth provider
      authProvider = await this.authProviderService.create(
        req.user.id,
        request.provider,
        request.provider_id,
      );

      // External blockchain registration
      await this.otpService.registerUser(authProvider.user_id, {
        provider: request.provider,
        provider_id: request.provider_id,
      });

      return authProvider;
    } catch (error) {
      // Cleanup if OTP registration fails
      if (authProvider?.id) {
        await this.authProviderService.deleteAuthProviderCascade(
          authProvider.id,
          authProvider.user_id,
        );
      }

      throw error;
    }
  }

  /**
   * Handles listing all auth providers for a user
   */
  @Get("list")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.USER)
  @UsePipes(new ValidationPipe({ transform: true })) // Enables validation
  async listUsers(@Request() req): Promise<AuthProviderDto[]> {
    return await this.authProviderService.byUserId(req.user.id);
  }

  /**
   * Sets the default auth provider for a user
   */
  @Post("set-default")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.USER)
  async setDefaultAuthProvider(
    @Request() req,
    @Body() request: { auth_provider_id: string },
  ): Promise<UserDto> {
    return await this.userService.setDefaultAuthProvider(
      req.user.id,
      request.auth_provider_id,
    );
  }

  /**
   * Sets the pin for a user device
   */
  @Post("set-pin")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.USER)
  async setPin(
    @Request() req,
    @Body() request: SetPinRequest,
  ): Promise<AuthProviderDto> {
    let authProvider: AuthProviderDto;

    try {
      authProvider = await this.authProviderService.setPin(
        req.user.id,
        request.device_id,
        request.pin,
      );

      // If the auth provider is new, we need to register it on the blockchain
      if (!authProvider.updated_at) {
        // External blockchain registration
        await this.otpService.registerUser(authProvider.user_id, {
          provider: AuthenticationType.PIN,
          device_id: authProvider.device_id,
          provider_id: request.pin,
        });
      }

      return authProvider;
    } catch (error) {
      // Cleanup if OTP registration fails
      if (authProvider?.id) {
        await this.authProviderService.deleteAuthProviderCascade(
          authProvider.id,
          authProvider.user_id,
        );
      }

      throw error;
    }
  }

  /**
   * Deletes an auth provider by ID
   */
  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.USER)
  async deleteAuthProvider(
    @Request() req,
    @Param("id") id: string,
  ): Promise<void> {
    const user = await this.userService.byId(req.user.id);

    if (user.active_auth_provider_id === id) {
      throw new BadRequestException("Cannot delete default auth provider");
    }

    return await this.authProviderService.deleteAuthProviderById(id);
  }
}
