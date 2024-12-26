"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const network_helpers_1 = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const chai_1 = require("chai");
const ethers_1 = require("ethers");
const hardhat_1 = __importDefault(require("hardhat"));
describe("OTPSystem", function () {
    async function deployOtpSystemFixture() {
        // Get signers
        const [owner, admin, user, other] = await hardhat_1.default.ethers.getSigners();
        // Deploy the contract
        const OTPSystem = await hardhat_1.default.ethers.getContractFactory("OTPSystem");
        const otpSystem = await OTPSystem.deploy();
        // Assign ADMIN_ROLE to admin
        const ADMIN_ROLE = ethers_1.ethers.keccak256(ethers_1.ethers.toUtf8Bytes("ADMIN_ROLE"));
        await otpSystem.connect(owner).grantRole(ADMIN_ROLE, admin.address);
        return { otpSystem, owner, admin, user, other, ADMIN_ROLE };
    }
    describe("Deployment", function () {
        it("Should deploy successfully", async function () {
            const { otpSystem } = await (0, network_helpers_1.loadFixture)(deployOtpSystemFixture);
            (0, chai_1.expect)(otpSystem.target).to.be.properAddress;
        });
        it("Should assign address as an admin", async function () {
            const { otpSystem, admin, ADMIN_ROLE } = await (0, network_helpers_1.loadFixture)(deployOtpSystemFixture);
            (0, chai_1.expect)(await otpSystem.hasRole(ADMIN_ROLE, admin.address)).to.be.true;
        });
    });
    describe("OTP Functionality", function () {
        it("Should request OTP successfully with valid signature", async function () {
            const { otpSystem, user } = await (0, network_helpers_1.loadFixture)(deployOtpSystemFixture);
            const expirationTime = Math.floor(Date.now() / 1000) + 3600;
            const request = {
                transactionId: "transaction123",
                otp: "123456",
                userAddress: user.address,
                expirationTime,
                nonce: 0,
            };
            const domain = {
                name: "OTPSystem",
                version: "1",
                chainId: 31337,
                verifyingContract: otpSystem.target,
            };
            const types = {
                OTPRequest: [
                    { name: "transactionId", type: "string" },
                    { name: "otp", type: "string" },
                    { name: "userAddress", type: "address" },
                    { name: "expirationTime", type: "uint256" },
                    { name: "nonce", type: "uint256" },
                ],
            };
            const signature = await user.signTypedData(domain, types, request);
            await (0, chai_1.expect)(otpSystem.connect(user).requestOtp(request, signature))
                .to.emit(otpSystem, "OtpRequested")
                .withArgs(ethers_1.ethers.keccak256(ethers_1.ethers.toUtf8Bytes(request.transactionId)), user.address);
            const hashedTransactionId = ethers_1.ethers.keccak256(ethers_1.ethers.toUtf8Bytes(request.transactionId));
            const storedOtp = await otpSystem.otpRecords(hashedTransactionId);
            (0, chai_1.expect)(storedOtp.userAddress).to.equal(user.address);
            (0, chai_1.expect)(storedOtp.expirationTime).to.equal(expirationTime);
        });
        it("Should verify OTP successfully", async function () {
            const { otpSystem, user } = await (0, network_helpers_1.loadFixture)(deployOtpSystemFixture);
            const expirationTime = Math.floor(Date.now() / 1000) + 3600;
            const request = {
                transactionId: "transaction123",
                otp: "123456",
                userAddress: user.address,
                expirationTime,
                nonce: 0,
            };
            const domain = {
                name: "OTPSystem",
                version: "1",
                chainId: 31337,
                verifyingContract: otpSystem.target,
            };
            const types = {
                OTPRequest: [
                    { name: "transactionId", type: "string" },
                    { name: "otp", type: "string" },
                    { name: "userAddress", type: "address" },
                    { name: "expirationTime", type: "uint256" },
                    { name: "nonce", type: "uint256" },
                ],
            };
            const signature = await user.signTypedData(domain, types, request);
            await otpSystem.connect(user).requestOtp(request, signature);
            const hashedTransactionId = ethers_1.ethers.keccak256(ethers_1.ethers.toUtf8Bytes(request.transactionId));
            const verification = {
                transactionId: request.transactionId,
                otp: request.otp,
                userAddress: request.userAddress,
            };
            const verificationTypes = {
                OTPVerification: [
                    { name: "transactionId", type: "string" },
                    { name: "otp", type: "string" },
                    { name: "userAddress", type: "address" },
                ],
            };
            const verificationSignature = await user.signTypedData(domain, verificationTypes, verification);
            await (0, chai_1.expect)(otpSystem
                .connect(user)
                .verifyOtp(request.transactionId, request.otp, verificationSignature))
                .to.emit(otpSystem, "OtpVerified")
                .withArgs(hashedTransactionId, user.address, true);
            (0, chai_1.expect)(await otpSystem.isUsed(hashedTransactionId)).to.be.true;
        });
        it("Should reject OTP verification for expired OTP", async function () {
            const { otpSystem, user } = await (0, network_helpers_1.loadFixture)(deployOtpSystemFixture);
            const expirationTime = Math.floor(Date.now() / 1000) - 1;
            const request = {
                transactionId: "transaction123",
                otp: "123456",
                userAddress: user.address,
                expirationTime,
                nonce: 0,
            };
            const domain = {
                name: "OTPSystem",
                version: "1",
                chainId: 31337,
                verifyingContract: otpSystem.target,
            };
            const types = {
                OTPRequest: [
                    { name: "transactionId", type: "string" },
                    { name: "otp", type: "string" },
                    { name: "userAddress", type: "address" },
                    { name: "expirationTime", type: "uint256" },
                    { name: "nonce", type: "uint256" },
                ],
            };
            const signature = await user.signTypedData(domain, types, request);
            await (0, chai_1.expect)(otpSystem.connect(user).requestOtp(request, signature)).to.be.revertedWith("OTP has expired");
        });
        it("Should not allow requesting an OTP for the same request - prevent OTP replay attack", async function () {
            const { otpSystem, user } = await (0, network_helpers_1.loadFixture)(deployOtpSystemFixture);
            const expirationTime = Math.floor(Date.now() / 1000) + 3600;
            const request = {
                transactionId: "transaction123",
                otp: "123456",
                userAddress: user.address,
                expirationTime,
                nonce: 0,
            };
            const domain = {
                name: "OTPSystem",
                version: "1",
                chainId: 31337,
                verifyingContract: otpSystem.target,
            };
            const types = {
                OTPRequest: [
                    { name: "transactionId", type: "string" },
                    { name: "otp", type: "string" },
                    { name: "userAddress", type: "address" },
                    { name: "expirationTime", type: "uint256" },
                    { name: "nonce", type: "uint256" },
                ],
            };
            const signature = await user.signTypedData(domain, types, request);
            // Request OTP for the first time
            await otpSystem.connect(user).requestOtp(request, signature);
            // Attempt to request OTP with the same transactionId
            await (0, chai_1.expect)(otpSystem.connect(user).requestOtp(request, signature)).to.be.revertedWith("Invalid nonce");
        });
        it("Should return false for non-existent transactionId", async function () {
            const { otpSystem } = await (0, network_helpers_1.loadFixture)(deployOtpSystemFixture);
            const nonExistentTransactionId = ethers_1.ethers.id("non-existent");
            const isValid = await otpSystem.isOtpValid(nonExistentTransactionId);
            (0, chai_1.expect)(isValid).to.be.false;
        });
    });
    describe("Admin Functions", function () {
        it("Should allow admin to blacklist users", async function () {
            const { otpSystem, admin, user } = await (0, network_helpers_1.loadFixture)(deployOtpSystemFixture);
            await (0, chai_1.expect)(otpSystem.connect(admin).blacklistUser(user.address))
                .to.emit(otpSystem, "UserBlacklisted")
                .withArgs(user.address);
            (0, chai_1.expect)(await otpSystem.blacklisted(user.address)).to.be.true;
        });
        it("Should reject non-admin blacklist attempt", async function () {
            const { otpSystem, user, other } = await (0, network_helpers_1.loadFixture)(deployOtpSystemFixture);
            await (0, chai_1.expect)(otpSystem.connect(other).blacklistUser(user.address)).to.be
                .reverted;
        });
        it("Should allow admin to remove users from blacklist", async function () {
            const { otpSystem, admin, user } = await (0, network_helpers_1.loadFixture)(deployOtpSystemFixture);
            // Blacklist the user first
            await otpSystem.connect(admin).blacklistUser(user.address);
            // Remove the user from blacklist
            await (0, chai_1.expect)(otpSystem.connect(admin).removeUserFromBlacklist(user.address))
                .to.emit(otpSystem, "UserRemovedFromBlacklist")
                .withArgs(user.address);
            (0, chai_1.expect)(await otpSystem.blacklisted(user.address)).to.be.false;
        });
        it("Should allow admin to reset expired OTPs", async function () {
            const { otpSystem, admin, user } = await (0, network_helpers_1.loadFixture)(deployOtpSystemFixture);
            const expirationTime = Math.floor(Date.now() / 1000) + 5; // Expires in 5 seconds
            const nonce = 0;
            const request = {
                transactionId: "transaction123",
                otp: "123456",
                userAddress: user.address,
                expirationTime,
                nonce,
            };
            const domain = {
                name: "OTPSystem",
                version: "1",
                chainId: 31337,
                verifyingContract: otpSystem.target,
            };
            const types = {
                OTPRequest: [
                    { name: "transactionId", type: "string" },
                    { name: "otp", type: "string" },
                    { name: "userAddress", type: "address" },
                    { name: "expirationTime", type: "uint256" },
                    { name: "nonce", type: "uint256" },
                ],
            };
            const signature = await user.signTypedData(domain, types, request);
            // Request OTP
            await otpSystem.connect(user).requestOtp(request, signature);
            // Wait for OTP to expire
            await new Promise((resolve) => setTimeout(resolve, 6000)); // Wait 6 seconds
            const hashedTransactionId = ethers_1.ethers.keccak256(ethers_1.ethers.toUtf8Bytes(request.transactionId));
            // Reset expired OTP
            await (0, chai_1.expect)(otpSystem.connect(admin).resetOtp(hashedTransactionId)).to
                .not.be.reverted;
            // Ensure OTP record is deleted
            const otpRecord = await otpSystem.otpRecords(hashedTransactionId);
            (0, chai_1.expect)(otpRecord.transactionId).to.equal(""); // Should be cleared
        });
        it("Should allow admin to reset expired OTPs - failed since OTP is still valid", async function () {
            const { otpSystem, admin, user } = await (0, network_helpers_1.loadFixture)(deployOtpSystemFixture);
            const expirationTime = Math.floor(Date.now() / 1000) + 3600; // Expires in 1 hour
            const nonce = 0;
            const request = {
                transactionId: "transaction123",
                otp: "123456",
                userAddress: user.address,
                expirationTime,
                nonce,
            };
            const domain = {
                name: "OTPSystem",
                version: "1",
                chainId: 31337,
                verifyingContract: otpSystem.target,
            };
            const types = {
                OTPRequest: [
                    { name: "transactionId", type: "string" },
                    { name: "otp", type: "string" },
                    { name: "userAddress", type: "address" },
                    { name: "expirationTime", type: "uint256" },
                    { name: "nonce", type: "uint256" },
                ],
            };
            const signature = await user.signTypedData(domain, types, request);
            // Request OTP
            await otpSystem.connect(user).requestOtp(request, signature);
            const hashedTransactionId = ethers_1.ethers.keccak256(ethers_1.ethers.toUtf8Bytes(request.transactionId));
            // Attempt to reset valid OTP
            await (0, chai_1.expect)(otpSystem.connect(admin).resetOtp(hashedTransactionId)).to.be.revertedWith("OTP is still valid");
        });
    });
});
