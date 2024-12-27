import { ErrorResponse } from "~/module-common/models";

import { TransactionRevertLog } from "../models/views/error";

export function handleException(
  endpoint: string,
  error: unknown,
): ErrorResponse {
  // eslint-disable-next-line no-console
  console.error(`Error in ${endpoint}:`, error);

  // Try to extract the transaction revert details using the TransactionRevertLog type
  const transactionLog: TransactionRevertLog = {
    code: (error as TransactionRevertLog).code || "UNKNOWN",
    reason: (error as TransactionRevertLog).reason || "Unknown reason",
    transaction: {
      to: (error as TransactionRevertLog).transaction?.to || "Unknown",
      from: (error as TransactionRevertLog).transaction?.from || "Unknown",
      data: (error as TransactionRevertLog).transaction?.data || "Unknown",
    },
    revert: {
      name: (error as TransactionRevertLog).revert?.name || "Unknown",
      args: (error as TransactionRevertLog).revert?.args || [],
    },
    shortMessage:
      (error as TransactionRevertLog).shortMessage || "Unknown error occurred",
  };

  // Check if the error is a revert error
  if (transactionLog.code === "CALL_EXCEPTION") {
    return {
      code: 400,
      message: `Transaction reverted: ${transactionLog.reason}`,
      details: transactionLog,
    };
  }

  return { code: 500, message: "Internal Server Error", details: error };
}
