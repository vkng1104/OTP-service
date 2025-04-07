import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import * as bcrypt from "bcrypt";
import { IsNull, Repository } from "typeorm";

import { AuthenticationType } from "./constant";
import { AuthProviderEntity } from "./entity/auth-provider.entity";
@Injectable()
export class AuthProviderService {
  constructor(
    @InjectRepository(AuthProviderEntity)
    private readonly authProviderRepository: Repository<AuthProviderEntity>,
  ) {}

  /**
   * Creates or updates an auth provider for a user.
   * @param userId The user's UUID.
   * @param provider The authentication provider (e.g., "password", "google", "wallet").
   * @param providerId (optional) The associated identifier (hashed password, OAuth ID, etc.).
   * @returns The created or updated auth provider.
   */
  async upsertAuthProvider(
    userId: string,
    provider: string,
    providerId?: string,
  ): Promise<AuthProviderEntity> {
    let authProvider = await this.authProviderRepository.findOne({
      where: { user_id: userId, provider, deleted_at: IsNull() },
    });

    if (!authProvider) {
      authProvider = this.authProviderRepository.create({
        user_id: userId,
        provider,
        provider_id: providerId,
      });
    } else {
      authProvider.provider_id = providerId;
      authProvider.updated_at = new Date();
    }

    return await this.authProviderRepository.save(authProvider);
  }

  async validatePassword(userId: string, password: string): Promise<boolean> {
    const authProvider = await this.authProviderRepository.findOne({
      where: {
        user_id: userId,
        provider: AuthenticationType.PASSWORD,
        deleted_at: IsNull(),
      },
    });

    if (!authProvider) {
      return false;
    }

    return await bcrypt.compare(password, authProvider.provider_id);
  }
}
