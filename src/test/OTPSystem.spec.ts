import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

const ipfsCid = "QmS4ghgMgPXqX5fM5vVYZ8Y8Y8Y8Y8Y8Y8Y8Y8Y8Y8Y8Y8Y8Y8Y8Y8Y"; // random ipfs cid

describe("OTPSystem", function () {
  async function deployOtpSystemFixture() {
    const [owner, admin, user, attacker] = await ethers.getSigners();

    // Deploy the OTPSystem contract
    const OTPSystem = await ethers.getContractFactory("OTPSystem");
    const otpSystem = await OTPSystem.deploy();

    // Default admin role as specified in @openzeppelin/contracts/access/AccessControl.sol
    const DEFAULT_ADMIN_ROLE = ethers.ZeroHash; // 0x00

    // Assign ADMIN_ROLE to admin
    const ADMIN_ROLE = ethers.keccak256(ethers.toUtf8Bytes("ADMIN_ROLE"));
    await otpSystem.connect(owner).grantRole(ADMIN_ROLE, admin.address);

    return {
      otpSystem,
      owner,
      admin,
      user,
      attacker,
      ADMIN_ROLE,
      DEFAULT_ADMIN_ROLE,
    };
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

    it("Owner should have DEFAULT_ADMIN_ROLE and ADMIN_ROLE", async function () {
      const { otpSystem, owner, DEFAULT_ADMIN_ROLE, ADMIN_ROLE } =
        await loadFixture(deployOtpSystemFixture);
      expect(await otpSystem.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.be
        .true;
      expect(await otpSystem.hasRole(ADMIN_ROLE, owner.address)).to.be.true;
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

  /* Get the current blockchain timestamp (not system time).
  This ensures consistency with `block.timestamp` in Solidity, which is what the contract actually uses.
  Avoid using `Date.now()` here because local system time may drift from the blockchain time in tests.
  */
  async function getCurrentTimestamp() {
    return await ethers.provider.getBlock("latest").then((b) => b.timestamp);
  }

  async function registerUserSuccessfully(
    otpSystem,
    user,
    username,
    service,
    commitmentValue,
  ) {
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
        ipfsCid,
      );
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
            ipfsCid,
          ),
      )
        .to.emit(otpSystem, "UserRegistered")
        .withArgs(userId, user.address, ipfsCid);

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
          ipfsCid,
        );

      await expect(
        otpSystem
          .connect(user)
          .registerUser(
            userId,
            { username, service, commitmentValue },
            signature,
            ipfsCid,
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
            ipfsCid,
          ),
      ).to.be.revertedWith("Invalid signature for User Registration");
    });
  });

  describe("OTP Verification", function () {
    it("Should verify OTP successfully", async function () {
      const { otpSystem, user, admin } = await loadFixture(
        deployOtpSystemFixture,
      );
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

      await registerUserSuccessfully(
        otpSystem,
        user,
        username,
        service,
        commitmentValue,
      );

      // Set a valid window (now to now + 60s)
      let now = await getCurrentTimestamp();

      await expect(
        otpSystem
          .connect(admin)
          .updateOtpWindow(userId, now, now + 60, ipfsCid),
      )
        .to.emit(otpSystem, "OtpActivated")
        .withArgs(userId, admin.address, ipfsCid);

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
            ipfsCid,
          ),
      )
        .to.emit(otpSystem, "OtpVerified")
        .withArgs(userId, user.address, otp, true, ipfsCid);

      // 🔹 Ensure the commitment is updated correctly
      const updatedData = await otpSystem.otpRecords(userId);
      expect(updatedData.commitmentValue).to.equal(newCommitmentValue);
      expect(updatedData.index).to.equal(2);
      expect(updatedData.startTime).to.equal(0);
      expect(updatedData.endTime).to.equal(0);

      /************** FOR THE NEXT INDEX ***************/

      // 🔹 Compute the second next OTP and second new commitment for the next index
      index += 1;
      const secondNextOtp = ethers.keccak256(
        ethers.toUtf8Bytes(username + password + index),
      );
      const secondNewCommitmentValue = ethers.keccak256(secondNextOtp);

      // Set a valid window (now to now + 60s)
      now = await getCurrentTimestamp();
      await otpSystem
        .connect(admin)
        .updateOtpWindow(userId, now, now + 60, ipfsCid);

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
          ipfsCid,
        ),
      )
        .to.emit(otpSystem, "OtpVerified")
        .withArgs(userId, user.address, nextOtp, true, ipfsCid);

      // 🔹 Ensure the commitment is updated correctly
      const secondUpdatedData = await otpSystem.otpRecords(userId);
      expect(secondUpdatedData.commitmentValue).to.equal(
        secondNewCommitmentValue,
      );
      expect(secondUpdatedData.index).to.equal(3);
      expect(secondUpdatedData.startTime).to.equal(0);
      expect(secondUpdatedData.endTime).to.equal(0);
    });

    it("Should reject OTP verification with bad request", async function () {
      const { otpSystem, user, admin } = await loadFixture(
        deployOtpSystemFixture,
      );
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

      await registerUserSuccessfully(
        otpSystem,
        user,
        username,
        service,
        commitmentValue,
      );

      // Set a valid window (now to now + 60s)
      const now = await getCurrentTimestamp();
      await otpSystem
        .connect(admin)
        .updateOtpWindow(userId, now, now + 60, ipfsCid);

      // 🔹 Attempt to verify with an invalid index - should fail
      await expect(
        otpSystem
          .connect(user)
          .verifyOtp(
            userId,
            2,
            { username, service, otp: invalidOtp, newCommitmentValue },
            "0x",
            ipfsCid,
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
            ipfsCid,
          ),
      ).to.be.revertedWith("OTP is invalid");
    });

    it("Should reject OTP verification with an invalid signature", async function () {
      const { otpSystem, user, attacker, admin } = await loadFixture(
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

      await registerUserSuccessfully(
        otpSystem,
        user,
        username,
        service,
        commitmentValue,
      );

      // Set a valid window (now to now + 60s)
      const now = await getCurrentTimestamp();
      await otpSystem
        .connect(admin)
        .updateOtpWindow(userId, now, now + 60, ipfsCid);

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
            ipfsCid,
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
            ipfsCid,
          ),
      ).to.be.revertedWith("Invalid signature for OTP verification");
    });

    it("Should verify OTP within the valid time window", async function () {
      const { otpSystem, admin, user } = await loadFixture(
        deployOtpSystemFixture,
      );
      const username = "alice";
      const service = "email";
      const password = "securepassword";
      let index = 1;

      const otp = ethers.keccak256(
        ethers.toUtf8Bytes(username + password + index),
      );
      const commitmentValue = ethers.keccak256(otp);

      index += 1;
      const nextOtp = ethers.keccak256(
        ethers.toUtf8Bytes(username + password + index),
      );
      const newCommitmentValue = ethers.keccak256(nextOtp);

      const userId = ethers.keccak256(
        ethers.toUtf8Bytes(username + service + user.address),
      );
      const registrationSignature = await signUserRegistration(
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
          registrationSignature,
          ipfsCid,
        );

      // Set a valid window (now to now + 60s)
      const now = await getCurrentTimestamp();
      await otpSystem
        .connect(admin)
        .updateOtpWindow(userId, now, now + 60, ipfsCid);

      const verificationSignature = await signOtpVerification(
        otpSystem,
        user,
        username,
        service,
        otp,
        newCommitmentValue,
      );

      await expect(
        otpSystem
          .connect(user)
          .verifyOtp(
            userId,
            index - 1,
            { username, service, otp, newCommitmentValue },
            verificationSignature,
            ipfsCid,
          ),
      )
        .to.emit(otpSystem, "OtpVerified")
        .withArgs(userId, user.address, otp, true, ipfsCid);
    });

    it("Should reject OTP if verification is attempted before startTime", async function () {
      const { otpSystem, admin, user } = await loadFixture(
        deployOtpSystemFixture,
      );
      const username = "alice";
      const service = "email";
      const password = "securepassword";
      let index = 1;

      const otp = ethers.keccak256(
        ethers.toUtf8Bytes(username + password + index),
      );
      const commitmentValue = ethers.keccak256(otp);

      index += 1;
      const nextOtp = ethers.keccak256(
        ethers.toUtf8Bytes(username + password + index),
      );
      const newCommitmentValue = ethers.keccak256(nextOtp);

      const userId = ethers.keccak256(
        ethers.toUtf8Bytes(username + service + user.address),
      );
      const registrationSignature = await signUserRegistration(
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
          registrationSignature,
          ipfsCid,
        );

      // Set future window (starts in 60s)
      const now = await getCurrentTimestamp();
      await otpSystem
        .connect(admin)
        .updateOtpWindow(userId, now + 60, now + 120, ipfsCid);

      const verificationSignature = await signOtpVerification(
        otpSystem,
        user,
        username,
        service,
        otp,
        newCommitmentValue,
      );

      await expect(
        otpSystem
          .connect(user)
          .verifyOtp(
            userId,
            index - 1,
            { username, service, otp, newCommitmentValue },
            verificationSignature,
            ipfsCid,
          ),
      ).to.be.revertedWith("OTP is expired or not active");
    });

    it("Should reject OTP if verification is attempted after endTime", async function () {
      const { otpSystem, admin, user } = await loadFixture(
        deployOtpSystemFixture,
      );
      const username = "alice";
      const service = "email";
      const password = "securepassword";
      let index = 1;

      const otp = ethers.keccak256(
        ethers.toUtf8Bytes(username + password + index),
      );
      const commitmentValue = ethers.keccak256(otp);

      index += 1;
      const nextOtp = ethers.keccak256(
        ethers.toUtf8Bytes(username + password + index),
      );
      const newCommitmentValue = ethers.keccak256(nextOtp);

      const userId = ethers.keccak256(
        ethers.toUtf8Bytes(username + service + user.address),
      );
      const registrationSignature = await signUserRegistration(
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
          registrationSignature,
          ipfsCid,
        );

      // Set short-lived window: now to now + 2s
      const now = await getCurrentTimestamp();
      await otpSystem
        .connect(admin)
        .updateOtpWindow(userId, now, now + 2, ipfsCid);

      const verificationSignature = await signOtpVerification(
        otpSystem,
        user,
        username,
        service,
        otp,
        newCommitmentValue,
      );

      // Wait until after expiry
      await ethers.provider.send("evm_increaseTime", [3]);
      await ethers.provider.send("evm_mine");

      await expect(
        otpSystem
          .connect(user)
          .verifyOtp(
            userId,
            index - 1,
            { username, service, otp, newCommitmentValue },
            verificationSignature,
            ipfsCid,
          ),
      ).to.be.revertedWith("OTP is expired or not active");
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

      await expect(otpSystem.connect(admin).blacklistUser(userId, ipfsCid))
        .to.emit(otpSystem, "UserBlacklisted")
        .withArgs(userId, admin.address, ipfsCid);

      expect(await otpSystem.blacklisted(userId)).to.be.true;
    });

    it("Should prevent a blacklisted user from registering", async function () {
      const { otpSystem, admin, user } = await loadFixture(
        deployOtpSystemFixture,
      );
      const userId = ethers.keccak256(
        ethers.toUtf8Bytes("aliceemail" + user.address),
      );

      await otpSystem.connect(admin).blacklistUser(userId, ipfsCid);

      await expect(
        otpSystem.connect(user).registerUser(
          userId,
          {
            username: "alice",
            service: "email",
            commitmentValue: ethers.id("commitment"),
          },
          "0x",
          ipfsCid,
        ),
      ).to.be.revertedWith("User is blacklisted");
    });
  });

  describe("Admin Utilities", function () {
    it("Should allow admin to reset multiple OTP records", async function () {
      const { otpSystem, admin, user } = await loadFixture(
        deployOtpSystemFixture,
      );
      const commitment = ethers.keccak256(ethers.toUtf8Bytes("dummy"));

      const userId1 = ethers.keccak256(
        ethers.toUtf8Bytes("user1" + "email" + user.address),
      );
      const userId2 = ethers.keccak256(
        ethers.toUtf8Bytes("user2" + "email" + user.address),
      );

      await registerUserSuccessfully(
        otpSystem,
        user,
        "user1",
        "email",
        commitment,
      );

      await registerUserSuccessfully(
        otpSystem,
        user,
        "user2",
        "email",
        commitment,
      );

      await otpSystem.connect(admin).updateOtpWindow(userId1, 1, 2, ipfsCid); // just to set dummy values
      await otpSystem.connect(admin).updateOtpWindow(userId2, 1, 2, ipfsCid);

      // Check before reset
      expect(
        (await otpSystem.otpRecords(userId1)).commitmentValue,
      ).to.not.equal(ethers.ZeroHash);
      expect(
        (await otpSystem.otpRecords(userId2)).commitmentValue,
      ).to.not.equal(ethers.ZeroHash);

      // Reset both
      expect(
        await otpSystem
          .connect(admin)
          .resetManyOtps([userId1, userId2], ipfsCid),
      )
        .to.emit(otpSystem, "OtpReset")
        .withArgs(admin.address, ipfsCid);

      // Check after reset
      expect((await otpSystem.otpRecords(userId1)).commitmentValue).to.equal(
        ethers.ZeroHash,
      );
      expect((await otpSystem.otpRecords(userId2)).commitmentValue).to.equal(
        ethers.ZeroHash,
      );
    });

    it("Should allow admin to view OTP data", async function () {
      const { otpSystem, admin, owner, user } = await loadFixture(
        deployOtpSystemFixture,
      );
      const commitment = ethers.keccak256(ethers.toUtf8Bytes("viewdata"));
      const userId = ethers.keccak256(
        ethers.toUtf8Bytes("viewUser" + "email" + user.address),
      );

      await registerUserSuccessfully(
        otpSystem,
        user,
        "viewUser",
        "email",
        commitment,
      );

      await otpSystem
        .connect(admin)
        .updateOtpWindow(userId, 1234, 4567, ipfsCid);

      const data = await otpSystem.connect(admin).getOtpDetails(userId);

      expect(data.commitmentValue).to.equal(commitment);
      expect(data.startTime).to.equal(1234);
      expect(data.endTime).to.equal(4567);

      const dataFetchedByOwner = await otpSystem
        .connect(owner)
        .getOtpDetails(userId);

      expect(dataFetchedByOwner.commitmentValue).to.equal(commitment);
      expect(dataFetchedByOwner.startTime).to.equal(1234);
      expect(dataFetchedByOwner.endTime).to.equal(4567);
    });

    it("Should revert viewOtpData for non-admin", async function () {
      const { otpSystem, user } = await loadFixture(deployOtpSystemFixture);
      const userId = ethers.keccak256(ethers.toUtf8Bytes("unauthorized"));

      await expect(otpSystem.connect(user).getOtpDetails(userId)).to.be
        .reverted;
    });
  });
});
