import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";

import { JwtAuthGuard, Roles, RolesGuard } from "~/module-auth";
import { OtpService } from "~/module-otp/otp.service";
import { UserRole } from "~/module-user/constant";
import {
  CreateUserRequest,
  ListUsersRequest,
  ListUsersResponse,
  UserDto,
} from "~/module-user/model";
import { UserService } from "~/module-user/user.service";

@Controller("api/user")
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly otpService: OtpService,
  ) {}

  /**
   * Creates a new user
   */
  @Post("create")
  async createUser(@Body() request: CreateUserRequest): Promise<UserDto> {
    let user: UserDto;

    try {
      // Create user and related records in a transaction
      user = await this.userService.createUser(request);

      // External blockchain registration
      await this.otpService.registerUser(user.id, {
        provider_id: request.provider_id,
      });

      return user;
    } catch (error) {
      // Cleanup if OTP registration fails
      if (user?.id) {
        await this.userService.deleteUserCascade(user.id);
      }

      throw error;
    }
  }

  /**
   * Handles user listing with pagination and search.
   * Accepts pagination parameters in the request body.
   */
  @Post("list")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @UsePipes(new ValidationPipe({ transform: true })) // Enables validation
  async listUsers(
    @Body() request: ListUsersRequest,
  ): Promise<ListUsersResponse> {
    const list = await this.userService.findAllUsers(
      request.limit(),
      request.offset(),
      request.search,
    );
    return {
      data: list.data,
      count: list.count,
    };
  }

  /**
   * Retrieves a user by ID
   */
  @Get("by-id/:id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  async getUserById(@Param("id") id: string): Promise<UserDto> {
    return await this.userService.byId(id);
  }

  /**
   * Deletes a user by ID
   */
  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  async deleteUser(@Param("id") id: string): Promise<boolean> {
    return this.userService.deleteById(id);
  }
}
