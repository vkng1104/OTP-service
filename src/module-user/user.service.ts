import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { plainToInstance } from "class-transformer";
import { IsNull, Repository } from "typeorm";

import { PageableResponse } from "~/module-common/model/response/pageable-response.dto";

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
   * Retrieves a paginated list of users with optional username search filtering.
   *
   * @param limit The number of users to return per page (should be positive).
   * @param offset The starting index for pagination (calculated as `page * size`).
   * @param search (Optional) A search term to filter users by username (case-insensitive).
   * @returns A Promise resolving to an array of `UserDto` objects.
   */
  async findAllUsers(
    limit: number,
    offset: number,
    search?: string,
  ): Promise<PageableResponse<UserDto>> {
    const queryBuilder = this.userRepository
      .createQueryBuilder("user")
      .where("user.deleted_at IS NULL")
      .take(limit)
      .skip(offset);

    if (search) {
      queryBuilder.andWhere("user.username ILIKE :search", {
        search: `%${search}%`, // Enables partial and case-insensitive search
      });
    }

    const [users, total] = await queryBuilder.getManyAndCount();
    return {
      data: users.map((user) => plainToInstance(UserDto, user)),
      count: total,
    };
  }

  /**
   * Retrieves a user by ID.
   * @param id The UUID of the user.
   * @returns A Promise resolving to a UserDto.
   * @throws NotFoundException if the user does not exist.
   */
  async byId(id: string): Promise<UserDto> {
    const user = await this.userRepository.findOne({
      where: { id, deleted_at: IsNull() },
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return plainToInstance(UserDto, user);
  }

  /**
   * Deletes a user by ID.
   * @param id The UUID of the user.
   * @returns A Promise resolving boolean indicating if deletion is successful or not.
   * @throws NotFoundException if the user does not exist.
   */
  async deleteById(id: string): Promise<boolean> {
    const user = await this.byId(id);

    const deletedUser = await this.userRepository.update(user.id, {
      deleted_at: new Date(),
    });

    return (deletedUser.affected || 0) > 0;
  }
}
