import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { IsNull, Repository } from "typeorm";

import { UserOtpIndexCountEntity } from "./entity/user-otp-index-count.entity";

@Injectable()
export class UserOtpIndexCountService {
  constructor(
    @InjectRepository(UserOtpIndexCountEntity)
    private readonly userOtpIndexCountRepository: Repository<UserOtpIndexCountEntity>,
  ) {}

  /**
   * Create a new user OTP index count record.
   * @param user_id The user ID.
   * @param auth_provider_id The auth provider ID.
   * @returns The created user OTP index count record.
   */
  async create(
    user_id: string,
    auth_provider_id: string,
  ): Promise<UserOtpIndexCountEntity> {
    const userOtpIndexCount = this.userOtpIndexCountRepository.create({
      user_id,
      auth_provider_id,
    });
    return await this.userOtpIndexCountRepository.save(userOtpIndexCount);
  }

  /**
   * Get the current OTP index for a user.
   * @param user_id The user ID.
   * @param auth_provider_id The auth provider ID.
   * @returns The current OTP index.
   */
  async getOtpIndex(
    user_id: string,
    auth_provider_id: string,
  ): Promise<number> {
    const userOtpIndexCount = await this.userOtpIndexCountRepository.findOne({
      where: { user_id, auth_provider_id, deleted_at: IsNull() },
    });

    if (!userOtpIndexCount) {
      throw new NotFoundException(
        `User OTP index not found for user_id: ${user_id} and auth_provider_id: ${auth_provider_id}`,
      );
    }

    return Number(userOtpIndexCount.otp_index);
  }

  /**
   * Increment the OTP index for a user.
   * @param user_id The user ID.
   * @param auth_provider_id The auth provider ID.
   * @returns The incremented OTP index.
   */
  async incrementOtpIndex(
    user_id: string,
    auth_provider_id: string,
  ): Promise<number> {
    const userOtpIndexCount = await this.userOtpIndexCountRepository.findOne({
      where: { user_id, auth_provider_id, deleted_at: IsNull() },
    });

    if (!userOtpIndexCount) {
      throw new NotFoundException(
        `User OTP index not found for user_id: ${user_id} and auth_provider_id: ${auth_provider_id}`,
      );
    }

    userOtpIndexCount.otp_index = Number(userOtpIndexCount.otp_index) + 1;
    await this.userOtpIndexCountRepository.save(userOtpIndexCount);

    return userOtpIndexCount.otp_index;
  }

  /**
   * Get OTP index and increment it with pessimistic locking.
   * Throws if user record doesn't exist.
   * @param user_id The user ID.
   * @param auth_provider_id The auth provider ID.
   * @returns The incremented OTP index.
   */
  async getOtpIndexAndIncrement(
    user_id: string,
    auth_provider_id: string,
  ): Promise<number> {
    return await this.userOtpIndexCountRepository.manager.transaction(
      async (manager) => {
        const userOtpIndexCount = await manager.findOne(
          UserOtpIndexCountEntity,
          {
            where: { user_id, auth_provider_id, deleted_at: IsNull() },
            lock: { mode: "pessimistic_write" }, // SELECT ... FOR UPDATE
          },
        );

        if (!userOtpIndexCount) {
          throw new NotFoundException(
            `User OTP index not found for user_id: ${user_id} and auth_provider_id: ${auth_provider_id}`,
          );
        }

        userOtpIndexCount.otp_index = Number(userOtpIndexCount.otp_index) + 1;
        await manager.save(userOtpIndexCount);

        return Number(userOtpIndexCount.otp_index);
      },
    );
  }
}
