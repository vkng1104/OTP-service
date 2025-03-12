import { Body, Controller, Delete, Get, Param, Post } from "@nestjs/common";

import { CreateUserRequest } from "~/module-user/model/request/create-user-request.dto";
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
   * Retrieves all users
   */
  @Get("list")
  async getAllUsers(): Promise<UserDto[]> {
    return await this.userService.findAllUsers();
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
  async deleteUser(@Param("id") id: string): Promise<number> {
    return this.userService.deleteById(id);
  }
}
