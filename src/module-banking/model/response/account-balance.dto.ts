import { AccountStatus, Currency } from "~/module-banking/constant";

export class AccountBalanceDto {
  id: string;
  user_id: string;
  balance: number;
  currency: Currency;
  status: AccountStatus;
  created_at: Date;
  updated_at: Date;

  constructor(partial: Partial<AccountBalanceDto>) {
    Object.assign(this, partial);
  }
}
