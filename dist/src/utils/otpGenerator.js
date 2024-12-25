"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateOtp = generateOtp;
exports.hashOtp = hashOtp;
const ethers_1 = require("ethers");
/**
 * Generates a random OTP of the specified length.
 * @param length - The length of the OTP (between 1 and 10).
 * @param random - A custom random function (default is Math.random).
 * @returns A string representing the generated OTP.
 * @throws Error if the length is out of range.
 */
function generateOtp(length, random = Math.random) {
    if (length < 1 || length > 10) {
        throw new Error("Length must be between 1 and 10");
    }
    const DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
    const shuffled = DIGITS.sort(() => random() - 0.5);
    return shuffled.slice(0, length).join("");
}
// Helper function to hash the OTP
function hashOtp(otp) {
    return ethers_1.ethers.keccak256(ethers_1.ethers.toUtf8Bytes(otp));
}
