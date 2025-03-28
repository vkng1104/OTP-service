import { ErrorResponse } from "~/module-common/model/response/error-response.dto";

import { BlockchainTransactionRevertLog } from "../models/views/error";

export function handleBlockchainException(
  endpoint: string,
  error: unknown,
): ErrorResponse {
  // eslint-disable-next-line no-console
  console.error(`Error in ${endpoint}:`, error);

  // Try to extract the transaction revert details using the TransactionRevertLog type
  const transactionLog: BlockchainTransactionRevertLog = {
    code: (error as BlockchainTransactionRevertLog).code || "UNKNOWN",
    reason:
      (error as BlockchainTransactionRevertLog).reason || "Unknown reason",
    transaction: {
      to:
        (error as BlockchainTransactionRevertLog).transaction?.to || "Unknown",
      from:
        (error as BlockchainTransactionRevertLog).transaction?.from ||
        "Unknown",
      data:
        (error as BlockchainTransactionRevertLog).transaction?.data ||
        "Unknown",
    },
    revert: {
      name: (error as BlockchainTransactionRevertLog).revert?.name || "Unknown",
      args: (error as BlockchainTransactionRevertLog).revert?.args || [],
    },
    shortMessage:
      (error as BlockchainTransactionRevertLog).shortMessage ||
      "Unknown error occurred",
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
