import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { plainToInstance } from "class-transformer";
import { Repository } from "typeorm";

import { UserEntity } from "./entity/user.entity";
import { CreateUserRequest } from "./model/request/create-user-request.dto";
import { UserDto } from "./model/user.dto";

@Injectable()
export class UserService {
  /**
   * Using the data mapper pattern by injecting the repository.
   * TypeORM Active Record approach can also be used instead.
   */
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  /**
   * Creates a new user.
   * @param request Data transfer object containing user creation fields.
   * @returns A Promise resolving to the created user entity.
   */
  async createUser(request: CreateUserRequest): Promise<UserDto> {
    const user = this.userRepository.create(request);
    const savedUser = await this.userRepository.save(user);
    return plainToInstance(UserDto, savedUser);
  }

  /**
   * Retrieves all users.
   * @returns A Promise resolving to an array of UserDto objects.
   */
  async findAllUsers(): Promise<UserDto[]> {
    const users = await this.userRepository.find();
    return users.map((user) => plainToInstance(UserDto, user));
  }

  /**
   * Retrieves a user by ID.
   * @param id The UUID of the user.
   * @returns A Promise resolving to a UserDto.
   * @throws NotFoundException if the user does not exist.
   */
  async byId(id: string): Promise<UserDto> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return plainToInstance(UserDto, user);
  }

  /**
   * Deletes a user by ID.
   * @param id The UUID of the user.
   * @returns A Promise resolving to the number of affected rows.
   */
  async deleteById(id: string): Promise<number> {
    const result = await this.userRepository.delete(id);
    return result.affected || 0;
  }
}
