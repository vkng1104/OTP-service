import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { plainToInstance } from "class-transformer";
import { Repository } from "typeorm";

import { PageableResponse } from "~/module-common/model/response/pageable-response.dto";

import { AuthProviderService } from "./auth-provider.service";
import { UserEntity } from "./entity/user.entity";
import { CreateUserRequest } from "./model/request/create-user-request.dto";
import { UserDto } from "./model/user.dto";
import { UserKeyService } from "./user-key.service";

interface RawUserResult {
  user_id: string;
  user_username: string;
  user_active_auth_provider_id: string;
  user_role: string;
  user_status: string;
  user_email?: string;
  user_phone?: string;
  user_platform?: string;
  user_language?: string;
  user_image_url?: string;
  user_first_name?: string;
  user_last_name?: string;
  user_created_at: Date;
  user_updated_at?: Date;
  user_deleted_at?: Date;
  auth_providers_provider?: string;
  user_keys_public_key?: string;
}

@Injectable()
export class UserService {
  /**
   * Using the data mapper pattern by injecting the repository.
   * TypeORM Active Record approach can also be used instead.
   */
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly authProviderService: AuthProviderService,
    private readonly userKeyService: UserKeyService,
  ) {}

  /**
   * Creates a new user.
   * @param request Data transfer object containing user creation fields.
   * @returns A Promise resolving to the created user entity.
   */
  async createUser(request: CreateUserRequest): Promise<UserDto> {
    // Start a transaction to ensure all operations succeed or none do
    const user = await this.userRepository.manager.transaction(
      async (transactionalEntityManager) => {
        // Create user
        const data = this.userRepository.create(request);
        const user = await transactionalEntityManager.save(data);

        // Generate and store the user's key
        await this.userKeyService.generateAndStoreKeys(user.id);

        // Create auth provider
        const authProvider = await this.authProviderService.upsertAuthProvider(
          user.id,
          request.provider, // This must be one of AuthenticationType enum values
          request.provider_id ?? "", // Can be OAuth ID, password hash, etc.
        );

        // Update user active_auth_provider_id
        user.active_auth_provider_id = authProvider.id;
        return await transactionalEntityManager.save(user);
      },
    );

    return this.getUserDetails(user.id);
  }

  /**
   * Maps raw query result to UserDto structure
   */
  private mapRawResultToUserDto(result: RawUserResult): UserDto {
    const user = {
      // User fields
      id: result.user_id,
      username: result.user_username,
      active_auth_provider_id: result.user_active_auth_provider_id,
      role: result.user_role,
      status: result.user_status,
      email: result.user_email,
      phone: result.user_phone,
      platform: result.user_platform,
      language: result.user_language,
      image_url: result.user_image_url,
      first_name: result.user_first_name,
      last_name: result.user_last_name,
      created_at: result.user_created_at,
      updated_at: result.user_updated_at,
      deleted_at: result.user_deleted_at,
      // Auth provider fields
      active_auth_provider: result.auth_providers_provider,
      // User key fields
      public_key: result.user_keys_public_key,
    };

    return plainToInstance(UserDto, user);
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
      .leftJoinAndSelect(
        "auth_providers",
        "auth_providers",
        "user.active_auth_provider_id = auth_providers.id",
      )
      .leftJoinAndSelect(
        "user_keys",
        "user_keys",
        "user.id = user_keys.user_id",
      )
      .where("user.deleted_at IS NULL")
      .take(limit)
      .skip(offset);

    if (search) {
      queryBuilder.andWhere("user.username ILIKE :search", {
        search: `%${search}%`, // Enables partial and case-insensitive search
      });
    }

    const [results, total] = await Promise.all([
      queryBuilder.getRawMany(),
      queryBuilder.getCount(),
    ]);

    return {
      data: results.map((result) => this.mapRawResultToUserDto(result)),
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
    return this.getUserDetails(id);
  }

  /**
   * Deletes a user by ID.
   * @param id The UUID of the user.
   * @returns A Promise resolving boolean indicating if deletion is successful or not.
   * @throws NotFoundException if the user does not exist.
   */
  async deleteById(id: string): Promise<boolean> {
    // Get the user entity instead of DTO
    const user = await this.userRepository.findOne({
      where: { id, deleted_at: null },
    });

    if (!user) throw new NotFoundException(`User with ID ${id} not found`);

    // Start a transaction to ensure all deletions succeed or none do
    await this.userRepository.manager.transaction(
      async (transactionalEntityManager) => {
        // Soft delete auth providers
        await transactionalEntityManager
          .createQueryBuilder()
          .update("auth_providers")
          .set({ deleted_at: new Date() })
          .where("user_id = :userId", { userId: id })
          .andWhere("deleted_at IS NULL")
          .execute();

        // Soft delete user keys
        await transactionalEntityManager
          .createQueryBuilder()
          .update("user_keys")
          .set({ deleted_at: new Date() })
          .where("user_id = :userId", { userId: id })
          .andWhere("deleted_at IS NULL")
          .execute();

        // Soft delete the user
        user.deleted_at = new Date();
        await transactionalEntityManager.save(user);
      },
    );

    return true;
  }

  /**
   * Helper function to retrieve user details with auth provider & public key.
   */
  private async getUserDetails(id: string): Promise<UserDto> {
    const result = await this.userRepository
      .createQueryBuilder("user")
      .leftJoinAndSelect(
        "auth_providers",
        "auth_providers",
        "user.active_auth_provider_id = auth_providers.id",
      )
      .leftJoinAndSelect(
        "user_keys",
        "user_keys",
        "user.id = user_keys.user_id",
      )
      .where("user.id = :id", { id })
      .andWhere("user.deleted_at IS NULL")
      .getRawOne();

    if (!result) throw new NotFoundException(`User with ID ${id} not found`);

    return this.mapRawResultToUserDto(result);
  }
}
