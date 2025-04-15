import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import * as bcrypt from "bcrypt";
import { plainToInstance } from "class-transformer";
import { IsNull, Repository } from "typeorm";

import { AuthenticationType } from "./constant";
import { AuthProviderEntity } from "./entity/auth-provider.entity";
import { UserOtpIndexCountEntity } from "./entity/user-otp-index-count.entity";
import { AuthProviderDto } from "./model/auth-provider.dto";
import { UserOtpIndexCountService } from "./user-otp-index-count.service";
@Injectable()
export class AuthProviderService {
  constructor(
    @InjectRepository(AuthProviderEntity)
    private readonly authProviderRepository: Repository<AuthProviderEntity>,
    private readonly userOtpIndexCountService: UserOtpIndexCountService,
  ) {}

  /**
   * Creates or updates an auth provider for a user.
   * @param user_id The user's UUID.
   * @param provider The authentication provider (e.g., "password", "google", "wallet").
   * @param provider_id (optional) The associated identifier (hashed password, OAuth ID, etc.).
   * @returns The created or updated auth provider.
   */
  async create(
    user_id: string,
    provider: AuthenticationType,
    provider_id?: string,
  ): Promise<AuthProviderDto> {
    let hashedProviderId = provider_id;
    if (
      provider === AuthenticationType.PASSWORD ||
      provider === AuthenticationType.PIN
    ) {
      // Hash the password
      hashedProviderId = await bcrypt.hash(provider_id, 10);
    }

    let authProvider = await this.authProviderRepository.findOne({
      where: { user_id, provider, deleted_at: IsNull() },
    });

    if (authProvider) {
      throw new HttpException(
        "Auth provider already exists",
        HttpStatus.BAD_REQUEST,
      );
    }

    const savedAuthProvider =
      await this.authProviderRepository.manager.transaction(
        async (transactionalEntityManager) => {
          authProvider = transactionalEntityManager.create(AuthProviderEntity, {
            user_id,
            provider,
            provider_id: hashedProviderId,
          });

          // Create user OTP index count
          await this.userOtpIndexCountService.create(user_id, authProvider.id);

          return await transactionalEntityManager.save(authProvider);
        },
      );

    return plainToInstance(AuthProviderDto, savedAuthProvider);
  }

  /**
   * Hard delete an auth provider for a user and all related data (OTP index count).
   * @param user_id The user's UUID.
   * @param provider The authentication provider (e.g., "password", "google", "wallet").
   * @returns void
   */
  async deleteAuthProviderCascade(
    user_id: string,
    provider: AuthenticationType,
  ): Promise<void> {
    const authProvider = await this.byProviderAndUserId(provider, user_id);

    await this.authProviderRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const providerResult = await transactionalEntityManager.delete(
          AuthProviderEntity,
          {
            user_id,
            provider,
            deleted_at: IsNull(),
          },
        );

        const otpIndexCountResult = await transactionalEntityManager.delete(
          UserOtpIndexCountEntity,
          {
            user_id,
            auth_provider_id: authProvider.id,
            deleted_at: IsNull(),
          },
        );

        const allDeleted =
          (providerResult.affected ?? 0) > 0 &&
          (otpIndexCountResult.affected ?? 0) > 0;

        if (!allDeleted) {
          throw new Error("Failed to delete all user-related entities");
        }
      },
    );
  }

  /**
   * Validates a password against an auth provider.
   * @param user_id The user's UUID.
   * @param password The password to validate.
   * @returns true if the password is valid, false otherwise.
   */
  async validatePassword(user_id: string, password: string): Promise<boolean> {
    const authProvider = await this.authProviderRepository.findOne({
      where: {
        user_id,
        provider: AuthenticationType.PASSWORD,
        deleted_at: IsNull(),
      },
    });

    if (!authProvider) {
      return false;
    }

    return await bcrypt.compare(password, authProvider.provider_id);
  }

  /**
   * Finds all auth providers for a user. Returns an empty array if no auth providers are found.
   * @param user_id The user's UUID.
   * @returns The auth providers.
   */
  async byUserId(user_id: string): Promise<AuthProviderDto[]> {
    const authProviders = await this.authProviderRepository.find({
      where: { user_id, deleted_at: IsNull() },
    });
    return plainToInstance(AuthProviderDto, authProviders);
  }

  /**
   * Finds all auth providers for a user or throws an error if not found.
   * @param user_id The user's UUID.
   * @returns The auth providers.
   */
  async byUserIdOrThrow(user_id: string): Promise<AuthProviderDto[]> {
    const authProviders = await this.byUserId(user_id);
    if (authProviders.length === 0) {
      throw new HttpException("Auth provider not found", HttpStatus.NOT_FOUND);
    }
    return authProviders;
  }

  /**
   * Finds an auth provider for a user and provider. Throws an error if not found.
   * @param provider_id The provider's UUID.
   * @param user_id The user's UUID.
   * @returns The auth provider.
   */
  async byProviderIdAndUserId(
    provider_id: string,
    user_id: string,
  ): Promise<AuthProviderDto> {
    const authProvider = await this.authProviderRepository.findOne({
      where: { id: provider_id, user_id, deleted_at: IsNull() },
    });
    if (!authProvider) {
      throw new HttpException("Auth provider not found", HttpStatus.NOT_FOUND);
    }
    return plainToInstance(AuthProviderDto, authProvider);
  }

  /**
   * Finds an auth provider for a user and provider. Throws an error if not found.
   * @param provider The provider (e.g., "password", "google", "wallet").
   * @param user_id The user's UUID.
   * @returns The auth provider.
   */
  async byProviderAndUserId(
    provider: AuthenticationType,
    user_id: string,
  ): Promise<AuthProviderDto> {
    const authProvider = await this.authProviderRepository.findOne({
      where: { provider, user_id, deleted_at: IsNull() },
    });
    if (!authProvider) {
      throw new HttpException("Auth provider not found", HttpStatus.NOT_FOUND);
    }
    return plainToInstance(AuthProviderDto, authProvider);
  }

  /**
   * Deletes an auth provider by ID.
   * @param id The auth provider's UUID.
   * @throws NotFoundException if the auth provider is not found.
   * @throws BadRequestException if the auth provider is the default password auth provider.
   */
  async deleteAuthProviderById(id: string): Promise<void> {
    const authProvider = await this.authProviderRepository.findOne({
      where: { id, deleted_at: IsNull() },
    });

    if (!authProvider) {
      throw new HttpException("Auth provider not found", HttpStatus.NOT_FOUND);
    }

    if (authProvider.provider === AuthenticationType.PASSWORD) {
      throw new HttpException(
        "Cannot delete password auth provider",
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.authProviderRepository.update(
      { id, deleted_at: IsNull() },
      { deleted_at: new Date() },
    );
  }
}
