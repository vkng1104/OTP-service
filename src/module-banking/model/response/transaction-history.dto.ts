import { TransactionType } from "~/module-banking/constant";

export class TransactionHistoryDto {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  balance_before: number;
  balance_after: number;
  reference_id?: string;
  transaction_type: TransactionType;
  description?: string;
  created_at: Date;
  updated_at: Date;

  constructor(partial: Partial<TransactionHistoryDto>) {
    Object.assign(this, partial);
  }
}
