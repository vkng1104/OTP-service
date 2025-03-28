import { Expose } from "class-transformer";
import { IsString } from "class-validator";

export class SensitiveUserDetailDto {
  @Expose()
  @IsString()
  username: string;

  @Expose()
  @IsString()
  public_key: string;

  @Expose()
  @IsString()
  secret_key: string;
}
