"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleException = handleException;
function handleException(endpoint, error) {
    // eslint-disable-next-line no-console
    console.error(`Error in ${endpoint}:`, error);
    // Try to extract the transaction revert details using the TransactionRevertLog type
    const transactionLog = {
        code: error.code || "UNKNOWN",
        reason: error.reason || "Unknown reason",
        transaction: {
            to: error.transaction?.to || "Unknown",
            from: error.transaction?.from || "Unknown",
            data: error.transaction?.data || "Unknown",
        },
        revert: {
            name: error.revert?.name || "Unknown",
            args: error.revert?.args || [],
        },
        shortMessage: error.shortMessage || "Unknown error occurred",
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
