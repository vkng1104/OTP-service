import { UserDto } from "~/module-user/model";

export type TokenPayload = {
  access_token: string;
  refresh_token: string;
};

export class LoginUserResponse implements TokenPayload {
  access_token: string;
  refresh_token: string;
  user: UserDto;
}
