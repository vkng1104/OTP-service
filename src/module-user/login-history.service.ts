import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { AuthenticationType } from "./constant";
import { LoginHistoryEntity } from "./entity/login-history.entity";

@Injectable()
export class LoginHistoryService {
  constructor(
    @InjectRepository(LoginHistoryEntity)
    private readonly loginHistoryRepository: Repository<LoginHistoryEntity>,
  ) {}

  /**
   * Creates a new login history record
   * @param data The login history data to create
   * @returns The created login history entity
   */
  async createLoginHistory(data: {
    user_id: string;
    auth_provider_id: string;
    auth_provider: AuthenticationType;
    device_id: string;
    ipfs_cid: string;
    description: string;
  }): Promise<LoginHistoryEntity> {
    const loginHistory = this.loginHistoryRepository.create(data);
    return await this.loginHistoryRepository.save(loginHistory);
  }
}
