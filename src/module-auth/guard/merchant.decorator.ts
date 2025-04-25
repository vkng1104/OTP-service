import { applyDecorators, UseGuards } from "@nestjs/common";

import { MerchantGuard } from "./merchant.guard";

export function Merchant() {
  return applyDecorators(UseGuards(MerchantGuard));
}
