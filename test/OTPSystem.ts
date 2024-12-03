import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";
import { ethers } from "ethers";

describe("OTPSystem", function () {
  async function deployOtpSystemFixture() {
    // Deploy the contract
    const OTPSystem = await hre.ethers.getContractFactory("OTPSystem");
    const otpSystem = await OTPSystem.deploy();

    // Get signers
    const [owner, user] = await hre.ethers.getSigners();

    return { otpSystem, owner, user };
  }

  describe("Deployment", function () {
    it("Should deploy successfully", async function () {
      const { otpSystem } = await loadFixture(deployOtpSystemFixture);
      expect(otpSystem.target).to.be.properAddress;
    });
  });

  describe("OTP Functionality", function () {
    it("Should request OTP successfully with valid signature", async function () {
      const { otpSystem, user } = await loadFixture(deployOtpSystemFixture);

      // Define OTPRequest parameters
      const transactionId = ethers.id("transaction123");
      const hashedOtp = ethers.id("123456");
      const expirationTime = Math.floor(Date.now() / 1000) + 3600;

      const request = {
        transactionId,
        hashedOtp,
        userAddress: user.address,
        expirationTime,
      };

      // Generate the hash for the OTP request
      const domain = {
        name: "OTPSystem",
        version: "1",
        chainId: 31337, // Hardhat's default chain ID
        verifyingContract: otpSystem.target as string,
      };

      const types = {
        OTPRequest: [
          { name: "transactionId", type: "bytes32" },
          { name: "hashedOtp", type: "bytes32" },
          { name: "userAddress", type: "address" },
          { name: "expirationTime", type: "uint256" },
        ],
      };

      const signature = await user.signTypedData(domain, types, request);

      // Request OTP
      await expect(otpSystem.connect(user).requestOtp(request, signature))
        .to.emit(otpSystem, "OtpRequested")
        .withArgs(transactionId, user.address, expirationTime);

      // Check stored data
      const storedOtp = await otpSystem.otpRecords(transactionId);
      expect(storedOtp.transactionId).to.equal(transactionId);
      expect(storedOtp.hashedOtp).to.equal(hashedOtp);
      expect(storedOtp.userAddress).to.equal(user.address);
      expect(storedOtp.expirationTime).to.equal(expirationTime);
    });

    it("Should verify OTP successfully", async function () {
      const { otpSystem, user } = await loadFixture(deployOtpSystemFixture);

      // Define OTPRequest parameters
      const transactionId = ethers.id("transaction123");
      const hashedOtp = ethers.id("123456");
      const expirationTime = Math.floor(Date.now() / 1000) + 3600;

      const request = {
        transactionId,
        hashedOtp,
        userAddress: user.address,
        expirationTime,
      };

      // Generate signature
      const domain = {
        name: "OTPSystem",
        version: "1",
        chainId: 31337,
        verifyingContract: otpSystem.target as string,
      };

      const types = {
        OTPRequest: [
          { name: "transactionId", type: "bytes32" },
          { name: "hashedOtp", type: "bytes32" },
          { name: "userAddress", type: "address" },
          { name: "expirationTime", type: "uint256" },
        ],
      };

      const signature = await user.signTypedData(domain, types, request);

      // Request OTP
      await otpSystem.connect(user).requestOtp(request, signature);

      // Verify OTP
      await expect(otpSystem.connect(user).verifyOtp(transactionId, hashedOtp))
        .to.emit(otpSystem, "OtpVerified")
        .withArgs(transactionId, user.address, true);

      // Ensure OTP is marked as used
      expect(await otpSystem.isUsed(transactionId)).to.be.true;
    });

    it("Should reject expired OTP", async function () {
      const { otpSystem, user } = await loadFixture(deployOtpSystemFixture);

      // Define OTPRequest parameters
      const transactionId = ethers.id("transaction123");
      const hashedOtp = ethers.id("123456");
      const expirationTime = Math.floor(Date.now() / 1000) - 3600; // Expired time

      const request = {
        transactionId,
        hashedOtp,
        userAddress: user.address,
        expirationTime,
      };

      // Generate signature
      const domain = {
        name: "OTPSystem",
        version: "1",
        chainId: 31337,
        verifyingContract: otpSystem.target as string,
      };

      const types = {
        OTPRequest: [
          { name: "transactionId", type: "bytes32" },
          { name: "hashedOtp", type: "bytes32" },
          { name: "userAddress", type: "address" },
          { name: "expirationTime", type: "uint256" },
        ],
      };

      const signature = await user.signTypedData(domain, types, request);

      // Attempt to request OTP with expired time
      await expect(
        otpSystem.connect(user).requestOtp(request, signature)
      ).to.be.revertedWith("OTP has expired");
    });

    it("Should validate OTP correctly", async function () {
      const { otpSystem, user } = await loadFixture(deployOtpSystemFixture);

      // Define OTPRequest parameters
      const transactionId = ethers.id("transaction123");
      const hashedOtp = ethers.id("123456");
      const expirationTime = Math.floor(Date.now() / 1000) + 3600;

      const request = {
        transactionId,
        hashedOtp,
        userAddress: user.address,
        expirationTime,
      };

      // Generate signature
      const domain = {
        name: "OTPSystem",
        version: "1",
        chainId: 31337,
        verifyingContract: otpSystem.target as string,
      };

      const types = {
        OTPRequest: [
          { name: "transactionId", type: "bytes32" },
          { name: "hashedOtp", type: "bytes32" },
          { name: "userAddress", type: "address" },
          { name: "expirationTime", type: "uint256" },
        ],
      };

      const signature = await user.signTypedData(domain, types, request);

      // Request OTP
      await otpSystem.connect(user).requestOtp(request, signature);

      // Validate OTP
      expect(await otpSystem.isOtpValid(transactionId)).to.be.true;

      // Verify OTP
      await otpSystem.connect(user).verifyOtp(transactionId, hashedOtp);

      // Validate OTP after verification
      expect(await otpSystem.isOtpValid(transactionId)).to.be.false;
    });
  });
});
