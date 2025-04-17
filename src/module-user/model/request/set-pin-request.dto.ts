import { IsNotEmpty, IsString } from "class-validator";

export class SetPinRequest {
  @IsNotEmpty()
  @IsString()
  pin: string;

  @IsNotEmpty()
  @IsString()
  device_id: string;
}
