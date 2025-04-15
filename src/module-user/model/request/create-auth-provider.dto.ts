import { IsEnum, IsNotEmpty, IsString } from "class-validator";

import { AuthenticationType } from "~/module-user/constant";

export class CreateAuthProviderRequest {
  @IsNotEmpty()
  @IsEnum(AuthenticationType)
  provider: AuthenticationType;

  @IsNotEmpty()
  @IsString()
  provider_id: string;
}
