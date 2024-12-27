"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.types = exports.domain = void 0;
const configuration_1 = require("./configuration");
exports.domain = {
    name: "OTPSystem",
    version: "1",
    chainId: configuration_1.CHAIN_ID,
    verifyingContract: configuration_1.CONTRACT_ADDRESS,
};
exports.types = {
    OTPRequest: [
        { name: "transactionId", type: "bytes32" },
        { name: "hashedOtp", type: "bytes32" },
        { name: "userAddress", type: "address" },
        { name: "expirationTime", type: "uint256" },
    ],
};
//# sourceMappingURL=common.js.map