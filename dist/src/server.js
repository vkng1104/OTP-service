"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cors_1 = __importDefault(require("cors"));
const ethers_1 = require("ethers");
const express_1 = __importDefault(require("express"));
const OTPSystem_json_1 = __importDefault(require("./artifacts/src/contracts/OTPSystem.sol/OTPSystem.json")); // Import the ABI from the JSON file
const env_1 = require("./configs/env");
const handleException_1 = require("./utils/handleException");
const otpGenerator_1 = require("./utils/otpGenerator");
// Initialize Express
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use((0, cors_1.default)());
// Connect to Ethereum network
const provider = new ethers_1.ethers.JsonRpcProvider(env_1.ETHEREUM_PROVIDER_URL);
const signer = new ethers_1.ethers.Wallet(env_1.PRIVATE_KEY, provider);
// Connect to the deployed contract
const contract = new ethers_1.ethers.Contract(env_1.CONTRACT_ADDRESS, OTPSystem_json_1.default.abi, signer);
// Endpoint to generate OTP and provide related data
app.post("/api/generate-otp", async (req, res) => {
    try {
        const { duration } = req.body;
        // Generate an OTP
        const otp = (0, otpGenerator_1.generateOtp)(6);
        // Default to 5 minutes if duration is not provided
        const expectedDuration = duration || 300;
        // Calculate expiration time (current time + duration in seconds)
        const expirationTime = Math.floor(Date.now() / 1000) + expectedDuration;
        // Return the generated OTP and expiration time
        res.status(200).json({
            otp,
            expirationTime,
        });
    }
    catch (error) {
        const errorResponse = (0, handleException_1.handleException)("/api/generate-otp", error);
        res.status(errorResponse.code).json(errorResponse);
    }
});
// Endpoint to request an OTP
app.post("/api/request-otp", async (req, res) => {
    try {
        const { payload, transactionId, userAddress, signature } = req.body;
        // Validate request parameters
        if (!transactionId || !userAddress || !signature) {
            res.status(400).json({ code: 400, message: "Missing required fields" });
            return;
        }
        // Create OtpRequestRequest struct
        const value = {
            transactionId: transactionId,
            otp: payload.otp,
            expirationTime: payload.expirationTime,
            userAddress,
            nonce: 0,
        };
        // Submit OTP request to the blockchain
        const tx = await contract.requestOtp(value, signature);
        await tx.wait();
        res.status(200).json({
            message: "OTP requested successfully",
            transactionHash: tx.hash,
            transactionId: value.transactionId,
            otp: payload.otp,
        });
    }
    catch (error) {
        const errorResponse = (0, handleException_1.handleException)("/api/request-otp", error);
        res.status(errorResponse.code).json(errorResponse);
    }
});
// Endpoint to verify an OTP
app.post("/api/verify-otp", async (req, res) => {
    try {
        const { transactionId, otp, signature } = req.body;
        // Validate request parameters
        if (!transactionId || !otp || !signature) {
            res.status(400).json({ code: 400, message: "Missing required fields" });
            return;
        }
        // Interact with the smart contract to verify the OTP
        const tx = await contract.verifyOtp(transactionId, otp, signature);
        // Wait for the transaction to be mined
        const receipt = await tx.wait();
        res.status(200).json({
            success: true,
            message: "OTP verified successfully",
            transactionHash: receipt.transactionHash,
        });
    }
    catch (error) {
        const errorResponse = (0, handleException_1.handleException)("/api/verify-otp", error);
        res.status(errorResponse.code).json(errorResponse);
    }
});
// Endpoint to check OTP validity
app.get("/api/is-otp-valid/:transactionId", async (req, res) => {
    try {
        const { transactionId } = req.params;
        // Validate request parameters
        if (!transactionId) {
            res
                .status(400)
                .json({ code: 400, message: "Missing transactionId parameter" });
            return;
        }
        // Hash the transactionId to match the on-chain format
        const hashedTransactionId = ethers_1.ethers.keccak256(ethers_1.ethers.toUtf8Bytes(transactionId));
        // Check OTP validity on-chain
        const isValid = await contract.isOtpValid(hashedTransactionId);
        // Return the result
        res.status(200).json({ isValid });
    }
    catch (error) {
        const errorResponse = (0, handleException_1.handleException)("/api/is-otp-valid", error);
        res.status(errorResponse.code).json(errorResponse);
    }
});
// Start the server
const port = env_1.PORT || 3000;
app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Server running on http://localhost:${port}`);
});
