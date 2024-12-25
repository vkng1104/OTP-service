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
// Endpoint to request an OTP
app.post("/api/request-otp", async (req, res) => {
    try {
        const { hashedTransactionId, reqOtp, userAddress, signature } = req.body;
        // Validate request parameters
        if (!hashedTransactionId || !userAddress || !signature) {
            res.status(400).json({ error: "Missing required fields" });
            return;
        }
        // Generate OTP if not provided
        const otp = reqOtp || (0, otpGenerator_1.generateOtp)(6);
        // Hash the OTP
        const hashedOtp = (0, otpGenerator_1.hashOtp)(otp);
        // Set expiration time (e.g., 5 minutes from now)
        const expirationTime = Math.floor(Date.now() / 1000) + 300;
        // Create OTPRequest struct
        const value = {
            transactionId: hashedTransactionId, // Hash the transaction ID for uniqueness
            hashedOtp,
            userAddress,
            expirationTime,
        };
        // Submit OTP request to the blockchain
        const tx = await contract.requestOtp(value, signature);
        await tx.wait();
        res.status(200).json({
            message: "OTP requested successfully",
            transactionHash: tx.hash,
            transactionId: value.transactionId,
            otp,
        });
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.error("Error in /api/request-otp:", error);
        res.status(500).json({ error: String(error) || "Internal Server Error" });
    }
});
// Endpoint to verify an OTP
app.post("/verify-otp", async (req, res) => {
    try {
        const { transactionId, otp } = req.body;
        // Hash the OTP
        const hashedOtp = (0, otpGenerator_1.hashOtp)(otp);
        // Verify the OTP on-chain
        const tx = await contract.verifyOtp(ethers_1.ethers.id(transactionId), hashedOtp);
        const receipt = await tx.wait();
        // eslint-disable-next-line no-console
        console.log(receipt.events);
        res.status(200).json({
            message: "OTP verified successfully",
            transactionHash: tx.hash,
            success: true,
        });
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.error("Error in /verify-otp:", error);
        res.status(500).json({ error: error });
    }
});
// Endpoint to check OTP validity
app.get("/is-otp-valid/:transactionId", async (req, res) => {
    try {
        const transactionId = req.params.transactionId;
        // Check OTP validity on-chain
        const isValid = await contract.isOtpValid(ethers_1.ethers.id(transactionId));
        res.status(200).json({ transactionId, isValid });
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.error("Error in /is-otp-valid:", error);
        res.status(500).json({ error: error });
    }
});
// Start the server
const port = env_1.PORT || 3000;
app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Server running on http://localhost:${port}`);
});
