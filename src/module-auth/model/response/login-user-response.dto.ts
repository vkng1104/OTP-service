import { UserDto } from "~/module-user/model";

export type TokenInfo = {
  value: string;
  expires_in: number;
};

export type TokenPayload = {
  access_token: TokenInfo;
  refresh_token: TokenInfo;
};

export class LoginUserResponse implements TokenPayload {
  access_token: TokenInfo;
  refresh_token: TokenInfo;
  user: UserDto;
}
