import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("OTPSystem", function () {
  async function deployOtpSystemFixture() {
    const [owner, admin, user, attacker] = await ethers.getSigners();

    // Deploy the OTPSystem contract
    const OTPSystem = await ethers.getContractFactory("OTPSystem");
    const otpSystem = await OTPSystem.deploy();

    // Assign ADMIN_ROLE to admin
    const ADMIN_ROLE = ethers.keccak256(ethers.toUtf8Bytes("ADMIN_ROLE"));
    await otpSystem.connect(owner).grantRole(ADMIN_ROLE, admin.address);

    return { otpSystem, owner, admin, user, attacker, ADMIN_ROLE };
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

  /**
   * Helper function to generate a signature for UserRegistration.
   */
  async function signUserRegistration(
    otpSystem,
    user,
    username,
    service,
    commitmentValue,
  ) {
    const domain = {
      name: "OTPSystem",
      version: "1",
      chainId: 31337,
      verifyingContract: otpSystem.target as string,
    };

    const types = {
      UserRegistration: [
        { name: "username", type: "string" },
        { name: "service", type: "string" },
        { name: "commitmentValue", type: "bytes32" },
      ],
    };

    const value = {
      username,
      service,
      commitmentValue,
    };

    return await user.signTypedData(domain, types, value);
  }

  /**
   * Helper function to generate a signature for OTPVerification.
   */
  async function signOtpVerification(
    otpSystem,
    user,
    username,
    service,
    otp,
    newCommitmentValue,
  ) {
    const domain = {
      name: "OTPSystem",
      version: "1",
      chainId: 31337,
      verifyingContract: otpSystem.target as string,
    };

    const types = {
      OTPVerification: [
        { name: "username", type: "string" },
        { name: "service", type: "string" },
        { name: "otp", type: "bytes32" },
        { name: "newCommitmentValue", type: "bytes32" },
      ],
    };

    const value = {
      username,
      service,
      otp,
      newCommitmentValue,
    };

    return await user.signTypedData(domain, types, value);
  }

  describe("User Registration", function () {
    it("Should allow a user to register successfully", async function () {
      const { otpSystem, user } = await loadFixture(deployOtpSystemFixture);
      const username = "alice";
      const service = "email";
      const commitmentValue = ethers.keccak256(
        ethers.toUtf8Bytes("commitment1"),
      );

      const userId = ethers.keccak256(
        ethers.toUtf8Bytes(username + service + user.address),
      );
      const signature = await signUserRegistration(
        otpSystem,
        user,
        username,
        service,
        commitmentValue,
      );

      await expect(
        otpSystem
          .connect(user)
          .registerUser(
            userId,
            { username, service, commitmentValue },
            signature,
          ),
      )
        .to.emit(otpSystem, "UserRegistered")
        .withArgs(userId, user.address);

      const userData = await otpSystem.otpRecords(userId);
      expect(userData.commitmentValue).to.equal(commitmentValue);
    });

    it("Should not allow duplicate registration for the same service", async function () {
      const { otpSystem, user } = await loadFixture(deployOtpSystemFixture);
      const username = "alice";
      const service = "email";
      const commitmentValue = ethers.keccak256(
        ethers.toUtf8Bytes("commitment1"),
      );

      const userId = ethers.keccak256(
        ethers.toUtf8Bytes(username + service + user.address),
      );
      const signature = await signUserRegistration(
        otpSystem,
        user,
        username,
        service,
        commitmentValue,
      );

      await otpSystem
        .connect(user)
        .registerUser(
          userId,
          { username, service, commitmentValue },
          signature,
        );

      await expect(
        otpSystem
          .connect(user)
          .registerUser(
            userId,
            { username, service, commitmentValue },
            signature,
          ),
      ).to.be.revertedWith("User already registered on this service");
    });

    it("Should reject user registration with an invalid signature", async function () {
      const { otpSystem, user, attacker } = await loadFixture(
        deployOtpSystemFixture,
      );
      const username = "alice";
      const service = "email";
      const password = "securepassword";
      const index = 1;

      // 🔹 Compute valid commitment for registration
      const commitmentValue = ethers.keccak256(
        ethers.toUtf8Bytes(username + password + index),
      );

      // 🔹 Generate the user ID (hash of username + service + address)
      const userId = ethers.keccak256(
        ethers.toUtf8Bytes(username + service + user.address),
      );

      // 🔹 Attacker (not the user) signs the registration request
      const badSignature = await signUserRegistration(
        otpSystem,
        attacker, // 🔴 WRONG SIGNER (attacker)
        username,
        service,
        commitmentValue,
      );

      // 🔹 Attempt to register the user with the invalid signature - should fail
      await expect(
        otpSystem
          .connect(user)
          .registerUser(
            userId,
            { username, service, commitmentValue },
            badSignature,
          ),
      ).to.be.revertedWith("Invalid signature for User Registration");
    });
  });

  describe("OTP Verification", function () {
    it("Should verify OTP successfully", async function () {
      const { otpSystem, user } = await loadFixture(deployOtpSystemFixture);
      const username = "alice";
      const service = "email";
      const password = "securepassword"; // Simulating a password input
      let index = 1;

      // 🔹 Compute valid initial OTP and commitment
      const otp = ethers.keccak256(
        ethers.toUtf8Bytes(username + password + index),
      );
      const commitmentValue = ethers.keccak256(otp);

      // 🔹 Compute the next OTP and new commitment for the next index
      index += 1;
      const nextOtp = ethers.keccak256(
        ethers.toUtf8Bytes(username + password + index),
      );
      const newCommitmentValue = ethers.keccak256(nextOtp);

      // 🔹 Generate the user ID (hash of username + service + address)
      const userId = ethers.keccak256(
        ethers.toUtf8Bytes(username + service + user.address),
      );

      // 🔹 Sign the registration request
      const registrationSignature = await signUserRegistration(
        otpSystem,
        user,
        username,
        service,
        commitmentValue,
      );

      // 🔹 Register the user with the initial OTP commitment
      await otpSystem
        .connect(user)
        .registerUser(
          userId,
          { username, service, commitmentValue },
          registrationSignature,
        );

      // 🔹 Sign the OTP verification request
      const verificationSignature = await signOtpVerification(
        otpSystem,
        user,
        username,
        service,
        otp, // Correctly use the hashed OTP
        newCommitmentValue,
      );

      // 🔹 Verify OTP - should pass
      await expect(
        otpSystem
          .connect(user)
          .verifyOtp(
            userId,
            index - 1,
            { username, service, otp, newCommitmentValue },
            verificationSignature,
          ),
      )
        .to.emit(otpSystem, "OtpVerified")
        .withArgs(userId, user.address, otp, true);

      // 🔹 Ensure the commitment is updated correctly
      const updatedData = await otpSystem.otpRecords(userId);
      expect(updatedData.commitmentValue).to.equal(newCommitmentValue);

      /************** FOR THE NEXT INDEX ***************/

      // 🔹 Compute the second next OTP and second new commitment for the next index
      index += 1;
      const secondNextOtp = ethers.keccak256(
        ethers.toUtf8Bytes(username + password + index),
      );
      const secondNewCommitmentValue = ethers.keccak256(secondNextOtp);

      // 🔹 Sign the OTP verification request
      const secondVerificationSignature = await signOtpVerification(
        otpSystem,
        user,
        username,
        service,
        nextOtp, // Correctly use the hashed OTP
        secondNewCommitmentValue,
      );

      // 🔹 Verify OTP - should pass
      await expect(
        otpSystem.connect(user).verifyOtp(
          userId,
          index - 1,
          {
            username,
            service,
            otp: nextOtp,
            newCommitmentValue: secondNewCommitmentValue,
          },
          secondVerificationSignature,
        ),
      )
        .to.emit(otpSystem, "OtpVerified")
        .withArgs(userId, user.address, nextOtp, true);

      // 🔹 Ensure the commitment is updated correctly
      const secondUpdatedData = await otpSystem.otpRecords(userId);
      expect(secondUpdatedData.commitmentValue).to.equal(
        secondNewCommitmentValue,
      );
    });

    it("Should reject OTP verification with bad request", async function () {
      const { otpSystem, user } = await loadFixture(deployOtpSystemFixture);
      const username = "alice";
      const service = "email";
      const password = "securepassword"; // Simulating a user password
      let index = 1;

      // 🔹 Compute valid initial OTP and commitment
      const otp = ethers.keccak256(
        ethers.toUtf8Bytes(username + password + index),
      );
      const commitmentValue = ethers.keccak256(otp);

      // 🔹 Compute the next commitment (for next index)
      index += 1;
      const nextOtp = ethers.keccak256(
        ethers.toUtf8Bytes(username + password + index),
      );
      const newCommitmentValue = ethers.keccak256(nextOtp);

      // 🔹 Compute an invalid OTP (incorrect hash)
      const invalidOtp = ethers.keccak256(
        ethers.toUtf8Bytes(username + password + "wrong_index"),
      );

      // 🔹 Generate the user ID (hash of username + service + address)
      const userId = ethers.keccak256(
        ethers.toUtf8Bytes(username + service + user.address),
      );

      // 🔹 Sign the registration request
      const registrationSignature = await signUserRegistration(
        otpSystem,
        user,
        username,
        service,
        commitmentValue,
      );

      // 🔹 Register the user with the initial OTP commitment
      await otpSystem
        .connect(user)
        .registerUser(
          userId,
          { username, service, commitmentValue },
          registrationSignature,
        );

      // 🔹 Attempt to verify with an invalid index - should fail
      await expect(
        otpSystem
          .connect(user)
          .verifyOtp(
            userId,
            2,
            { username, service, otp: invalidOtp, newCommitmentValue },
            "0x",
          ),
      ).to.be.revertedWith("Invalid index");

      // 🔹 Attempt to verify with an invalid OTP - should fail
      await expect(
        otpSystem
          .connect(user)
          .verifyOtp(
            userId,
            1,
            { username, service, otp: invalidOtp, newCommitmentValue },
            "0x",
          ),
      ).to.be.revertedWith("OTP is invalid");
    });

    it("Should reject OTP verification with an invalid signature", async function () {
      const { otpSystem, user, attacker } = await loadFixture(
        deployOtpSystemFixture,
      );
      const username = "alice";
      const service = "email";
      const password = "securepassword";
      let index = 1;

      // 🔹 Compute valid initial OTP and commitment
      const otp = ethers.keccak256(
        ethers.toUtf8Bytes(username + password + index),
      );
      const commitmentValue = ethers.keccak256(otp);

      // 🔹 Compute the next OTP and new commitment for the next index
      index += 1;
      const nextOtp = ethers.keccak256(
        ethers.toUtf8Bytes(username + password + index),
      );
      const newCommitmentValue = ethers.keccak256(nextOtp);

      // 🔹 Generate the user ID (hash of username + service + address)
      const userId = ethers.keccak256(
        ethers.toUtf8Bytes(username + service + user.address),
      );

      // 🔹 Correct user signs the registration request
      const registrationSignature = await signUserRegistration(
        otpSystem,
        user,
        username,
        service,
        commitmentValue,
      );

      // 🔹 Register the user with the initial OTP commitment
      await otpSystem
        .connect(user)
        .registerUser(
          userId,
          { username, service, commitmentValue },
          registrationSignature,
        );

      // 🔹 Attacker (not the user) signs the OTP verification request
      const badSignature = await signOtpVerification(
        otpSystem,
        attacker, // 🔴 WRONG SIGNER (attacker)
        username,
        service,
        otp,
        newCommitmentValue,
      );

      // 🔹 Attempt to verify OTP with an invalid signature - should fail
      await expect(
        otpSystem
          .connect(user)
          .verifyOtp(
            userId,
            1,
            { username, service, otp, newCommitmentValue },
            badSignature,
          ),
      ).to.be.revertedWith("Invalid signature for OTP verification");

      // 🔹 Information in OTP verification request is wrong
      const badSignatureUsername = await signOtpVerification(
        otpSystem,
        attacker, // 🔴 WRONG SIGNER (attacker)
        "randomInvalidName",
        service,
        otp,
        newCommitmentValue,
      );

      // 🔹 Attempt to verify OTP with an invalid signature - should fail
      await expect(
        otpSystem
          .connect(user)
          .verifyOtp(
            userId,
            1,
            { username, service, otp, newCommitmentValue },
            badSignatureUsername,
          ),
      ).to.be.revertedWith("Invalid signature for OTP verification");
    });
  });

  describe("Blacklist Functionality", function () {
    it("Should allow an admin to blacklist a user", async function () {
      const { otpSystem, admin, user } = await loadFixture(
        deployOtpSystemFixture,
      );
      const userId = ethers.keccak256(
        ethers.toUtf8Bytes("aliceemail" + user.address),
      );

      await expect(otpSystem.connect(admin).blacklistUser(userId))
        .to.emit(otpSystem, "UserBlacklisted")
        .withArgs(userId);

      expect(await otpSystem.blacklisted(userId)).to.be.true;
    });

    it("Should prevent a blacklisted user from registering", async function () {
      const { otpSystem, admin, user } = await loadFixture(
        deployOtpSystemFixture,
      );
      const userId = ethers.keccak256(
        ethers.toUtf8Bytes("aliceemail" + user.address),
      );

      await otpSystem.connect(admin).blacklistUser(userId);

      await expect(
        otpSystem.connect(user).registerUser(
          userId,
          {
            username: "alice",
            service: "email",
            commitmentValue: ethers.id("commitment"),
          },
          "0x",
        ),
      ).to.be.revertedWith("User is blacklisted");
    });
  });
});
