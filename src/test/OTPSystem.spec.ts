import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "ethers";
import hre from "hardhat";

describe("OTPSystem", function () {
  async function deployOtpSystemFixture() {
    // Get signers
    const [owner, admin, user, other] = await hre.ethers.getSigners();

    // Deploy the contract
    const OTPSystem = await hre.ethers.getContractFactory("OTPSystem");
    const otpSystem = await OTPSystem.deploy();

    // Assign ADMIN_ROLE to admin
    const ADMIN_ROLE = ethers.keccak256(ethers.toUtf8Bytes("ADMIN_ROLE"));
    await otpSystem.connect(owner).grantRole(ADMIN_ROLE, admin.address);

    return { otpSystem, owner, admin, user, other, ADMIN_ROLE };
  }

  describe("Deployment", function () {
    it("Should deploy successfully", async function () {
      const { otpSystem } = await loadFixture(deployOtpSystemFixture);
      expect(otpSystem.target).to.be.properAddress;
    });

    it("Should assign address as an admin", async function () {
      const { otpSystem, admin, ADMIN_ROLE } = await loadFixture(
        deployOtpSystemFixture,
      );
      expect(await otpSystem.hasRole(ADMIN_ROLE, admin.address)).to.be.true;
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
      await expect(otpSystem.connect(user).requestOtp(request, signature))
        .to.emit(otpSystem, "OtpRequested")
        .withArgs(transactionId, user.address);

      // Check stored data
      const storedOtp = await otpSystem.otpRecords(transactionId);
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

      const isValid = await otpSystem.isOtpValid(transactionId);
      expect(isValid).to.be.true;

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
        otpSystem.connect(user).requestOtp(request, signature),
      ).to.be.revertedWith("OTP has expired");
    });

    it("Should not allow requesting an OTP for the same transactionId twice", async function () {
      const { otpSystem, user } = await loadFixture(deployOtpSystemFixture);

      const transactionId = ethers.id("transaction123");
      const hashedOtp = ethers.keccak256(ethers.toUtf8Bytes("123456"));
      const expirationTime = Math.floor(Date.now() / 1000) + 300;

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

      // Request OTP for the first time
      await otpSystem.connect(user).requestOtp(
        {
          transactionId,
          hashedOtp,
          userAddress: user.address,
          expirationTime,
        },
        signature,
      );

      // Try requesting OTP for the same transactionId again
      await expect(
        otpSystem.connect(user).requestOtp(
          {
            transactionId,
            hashedOtp,
            userAddress: user.address,
            expirationTime,
          },
          signature,
        ),
      ).to.be.revertedWith("OTP already exists for this transaction ID");
    });

    it("Should return false for non-existent transactionId", async function () {
      const { otpSystem } = await loadFixture(deployOtpSystemFixture);

      const nonExistentTransactionId = ethers.id("non-existent");
      const isValid = await otpSystem.isOtpValid(nonExistentTransactionId);
      expect(isValid).to.be.false;
    });
  });

  describe("Admin Functions", function () {
    it("Should allow admin to blacklist users", async function () {
      const { otpSystem, admin, user } = await loadFixture(
        deployOtpSystemFixture,
      );

      await expect(otpSystem.connect(admin).blacklistUser(user.address))
        .to.emit(otpSystem, "UserBlacklisted")
        .withArgs(user.address);

      expect(await otpSystem.blacklisted(user.address)).to.be.true;
    });

    it("Should reject non-admin blacklist attempt", async function () {
      const { otpSystem, user, other } = await loadFixture(
        deployOtpSystemFixture,
      );

      await expect(otpSystem.connect(other).blacklistUser(user.address)).to.be
        .reverted;
    });

    it("Should allow admin to reset expired OTPs", async function () {
      const { otpSystem, admin, user } = await loadFixture(
        deployOtpSystemFixture,
      );

      const transactionId = ethers.id("transaction123");
      const hashedOtp = ethers.id("123456");

      // Set an expiration time slightly in the future for `requestOtp`
      const expirationTime = Math.floor(Date.now() / 1000) + 5; // 5 seconds from now

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

      // Wait for the OTP to expire
      await new Promise((resolve) => setTimeout(resolve, 10000)); // 10 seconds

      // Reset expired OTP
      await expect(otpSystem.connect(admin).resetOtp(transactionId)).to.not.be
        .reverted;
    });

    it("Should allow admin to reset expired OTPs - failed since OTP is still valid", async function () {
      const { otpSystem, admin, user } = await loadFixture(
        deployOtpSystemFixture,
      );

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

      // Reset expired OTP
      await expect(
        otpSystem.connect(admin).resetOtp(transactionId),
      ).to.be.revertedWith("OTP is still valid");
    });
  });
});
