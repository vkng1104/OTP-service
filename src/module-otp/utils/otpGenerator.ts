import { ethers } from "ethers";

/**
 * Generates a random OTP of the specified length.
 * @param length - The length of the OTP (between 1 and 10).
 * @param random - A custom random function (default is Math.random).
 * @returns A string representing the generated OTP.
 * @throws Error if the length is out of range.
 */
export function generateOtp(
  length: number,
  random: () => number = Math.random,
): string {
  if (length < 1 || length > 10) {
    throw new Error("Length must be between 1 and 10");
  }

  const DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
  const shuffled = DIGITS.sort(() => random() - 0.5);

  return shuffled.slice(0, length).join("");
}

// Helper function to hash the OTP
export function hashOtp(otp: string): string {
  return ethers.keccak256(ethers.toUtf8Bytes(otp));
}
