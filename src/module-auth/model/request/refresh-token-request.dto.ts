import { IsNotEmpty } from "class-validator";

export class RefreshTokenRequest {
  @IsNotEmpty()
  refresh_token: string;
}
