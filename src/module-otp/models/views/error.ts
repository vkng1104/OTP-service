export interface BlockchainTransactionRevertLog {
  code: string; // Error code (e.g., 'CALL_EXCEPTION')
  reason: string; // Reason for the revert (e.g., 'OTP has expired')
  transaction: {
    to: string; // Contract address the transaction interacted with
    from: string; // Address that sent the transaction
    data: string; // Call data for the transaction
  };
  revert: {
    name: string; // Type of the revert error (e.g., 'Error')
    args: string[]; // Arguments for the revert (e.g., ['OTP has expired'])
  };
  shortMessage: string; // Short description of the error
}
