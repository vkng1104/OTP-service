import { generateNumericOtpFromHash } from "~/module-otp/utils/otp-generator.util";

describe("generateNumericOtpFromHash", () => {
  it("should generate a 6-digit numeric OTP by default", () => {
    const hash =
      "0x9a7df5bd71d5cb4d34951b7c99d6b39b1e9fa7b239c51f3cba26b5072baf44a4";
    const otp = generateNumericOtpFromHash(hash);
    expect(otp).toMatch(/^\d{6}$/);
  });

  it("should generate a 4-digit numeric OTP when specified", () => {
    const hash =
      "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890";
    const otp = generateNumericOtpFromHash(hash, 4);
    expect(otp).toMatch(/^\d{4}$/);
  });

  it("should generate a 10-digit numeric OTP when specified", () => {
    const hash =
      "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
    const otp = generateNumericOtpFromHash(hash, 10);
    expect(otp).toMatch(/^\d{10}$/);
  });

  it("should throw or return fallback for empty hash", () => {
    expect(() => generateNumericOtpFromHash("")).toThrow();
  });

  it("should generate consistent OTP for same hash + digits", () => {
    const hash =
      "0x123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0";
    const otp1 = generateNumericOtpFromHash(hash, 6);
    const otp2 = generateNumericOtpFromHash(hash, 6);
    expect(otp1).toBe(otp2);
  });

  it("should generate different OTPs for same hash but different digits", () => {
    const hash =
      "0x123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0";
    const otp6 = generateNumericOtpFromHash(hash, 6);
    const otp8 = generateNumericOtpFromHash(hash, 8);
    expect(otp6).not.toBe(otp8);
  });
});
