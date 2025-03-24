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
   * Insert a new user OTP index count record.
   * @param userId The user ID.
   * @returns The created user OTP index count record.
   */
  async insert(userId: string): Promise<UserOtpIndexCountEntity> {
    const userOtpIndexCount = this.userOtpIndexCountRepository.create({
      user_id: userId,
    });
    return await this.userOtpIndexCountRepository.save(userOtpIndexCount);
  }

  /**
   * Get OTP index and increment it with pessimistic locking.
   * Throws if user record doesn't exist.
   * @param userId The user ID.
   * @returns The incremented OTP index.
   */
  async getOtpIndexAndIncrement(userId: string): Promise<number> {
    return await this.userOtpIndexCountRepository.manager.transaction(
      async (manager) => {
        const userOtpIndexCount = await manager.findOne(
          UserOtpIndexCountEntity,
          {
            where: { user_id: userId, deleted_at: IsNull() },
            lock: { mode: "pessimistic_write" }, // SELECT ... FOR UPDATE
          },
        );

        if (!userOtpIndexCount) {
          throw new NotFoundException(
            `User OTP index not found for user_id: ${userId}`,
          );
        }

        userOtpIndexCount.otp_index += 1;
        await manager.save(userOtpIndexCount);

        return userOtpIndexCount.otp_index;
      },
    );
  }
}
