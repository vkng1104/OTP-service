import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";

import { CreateUserRequest } from "~/module-user/model/request/create-user-request.dto";
import { ListUsersRequest } from "~/module-user/model/request/list-users-request.dto";
import { ListUsersResponse } from "~/module-user/model/response/list-users-response.dto";
import { UserDto } from "~/module-user/model/user.dto";
import { UserService } from "~/module-user/user.service";

@Controller("api/user")
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * Creates a new user
   */
  @Post("create")
  async createUser(@Body() request: CreateUserRequest): Promise<UserDto> {
    return await this.userService.createUser(request);
  }

  /**
   * Handles user listing with pagination and search.
   * Accepts pagination parameters in the request body.
   */
  @Post("list")
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
  async getUserById(@Param("id") id: string): Promise<UserDto> {
    return await this.userService.byId(id);
  }

  /**
   * Deletes a user by ID
   */
  @Delete(":id")
  async deleteUser(@Param("id") id: string): Promise<boolean> {
    return this.userService.deleteById(id);
  }
}
