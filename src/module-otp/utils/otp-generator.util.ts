/**
 * Generate a numeric OTP from a hash
 * @param hash - The hash to generate the OTP from
 * @param digits - The number of digits in the OTP
 * @returns The generated OTP
 */
export function generateNumericOtpFromHash(hash: string, digits = 6): string {
  // Check if prefix is not 0x and dont have at least 4 bytes after 0x throw error
  if (hash.slice(0, 2) !== "0x" || hash.slice(2).length < 8) {
    throw new Error(
      "Hash must start with 0x and have at least 4 bytes after 0x",
    );
  }

  // Remove '0x' prefix
  const hex = hash.slice(2);
  // Take the first 4 bytes (8 hex characters)
  const slice = hex.slice(0, 8);
  // Convert to integer
  const num = parseInt(slice, 16);
  // Convert to string and pad with leading zeros if needed
  const otp = (num % Math.pow(10, digits)).toString().padStart(digits, "0");
  return otp;
}
