"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PORT = exports.CHAIN_ID = exports.CONTRACT_ADDRESS = exports.ETHEREUM_PROVIDER_URL = exports.PRIVATE_KEY = void 0;
// Load environment variables
_a = process.env, exports.PRIVATE_KEY = _a.PRIVATE_KEY, exports.ETHEREUM_PROVIDER_URL = _a.ETHEREUM_PROVIDER_URL, exports.CONTRACT_ADDRESS = _a.CONTRACT_ADDRESS, exports.CHAIN_ID = _a.CHAIN_ID, exports.PORT = _a.PORT;
