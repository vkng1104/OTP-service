// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract OTPSystem is EIP712, AccessControl {
    string private constant SIGNING_DOMAIN = "OTPSystem";
    string private constant SIGNATURE_VERSION = "1";

    // Structure to store OTP data
    struct OTPRequest {
        bytes32 transactionId;
        bytes32 hashedOtp;
        address userAddress;
        uint256 expirationTime;
    }

    // Type hash for the OTPRequest struct
    bytes32 private constant OTPREQUEST_TYPEHASH =
        keccak256(
            "OTPRequest(bytes32 transactionId,bytes32 hashedOtp,address userAddress,uint256 expirationTime)"
        );

    // Role identifiers
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    // Mapping to store OTP records by transaction ID
    mapping(bytes32 => OTPRequest) public otpRecords;

    // To track whether OTP has been used
    mapping(bytes32 => bool) public isUsed;

    // To track whether address is blacklisted
    mapping(address => bool) public blacklisted;

    // Event triggered when an OTP is requested
    event OtpRequested(bytes32 indexed transactionId, address indexed user);

    // Event triggered when an OTP is verified
    event OtpVerified(
        bytes32 indexed transactionId,
        address indexed user,
        bool success
    );

    event UserBlacklisted(address indexed user);
    event UserRemovedFromBlacklist(address indexed user);

    constructor() EIP712(SIGNING_DOMAIN, SIGNATURE_VERSION) {
        // Grant the deployer the admin role
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    modifier notBlacklisted(address user) {
        require(!blacklisted[user], "User is blacklisted");
        _;
    }

    /**
     * @dev Hashes the OTPRequest struct as per EIP-712 standard.
     * @param request The OTPRequest struct.
     * @return The hashed OTPRequest.
     */
    function hashOtpRequest(
        OTPRequest memory request
    ) public view returns (bytes32) {
        return
            _hashTypedDataV4(
                keccak256(
                    abi.encode(
                        OTPREQUEST_TYPEHASH,
                        request.transactionId,
                        request.hashedOtp,
                        request.userAddress,
                        request.expirationTime
                    )
                )
            );
    }

    /**
     * @dev Generate an OTP (hashed) and store it in the contract.
     * @param request The OTPRequest struct containing the request details.
     * @param signature The EIP-712-compliant signature of the request.
     */
    function requestOtp(
        OTPRequest memory request,
        bytes memory signature
    ) public notBlacklisted(request.userAddress) {
        require(
            verifySignature(request, signature, request.userAddress),
            "Invalid signature"
        );
        require(
            otpRecords[request.transactionId].expirationTime == 0,
            "OTP already exists for this transaction ID"
        );
        require(request.expirationTime >= block.timestamp, "OTP has expired");

        // Store the OTP request
        otpRecords[request.transactionId] = request;

        // Emit an event for OTP generation
        emit OtpRequested(request.transactionId, request.userAddress);
    }

    /**
     * @dev Verify the OTP by comparing the provided hash with the stored hash.
     * @param transactionId The unique transaction ID associated with this OTP.
     * @param hashedOtp The hashed OTP provided by the user.
     * @return success Boolean indicating whether the verification was successful.
     */
    function verifyOtp(
        bytes32 transactionId,
        bytes32 hashedOtp
    ) public returns (bool success) {
        OTPRequest storage otp = otpRecords[transactionId];

        // Check if the OTP is valid
        require(otp.expirationTime >= block.timestamp, "OTP has expired");
        require(!isUsed[transactionId], "OTP has already been used");
        require(otp.hashedOtp == hashedOtp, "Invalid OTP");

        // Mark the OTP as used
        isUsed[transactionId] = true;

        // Emit an event for successful verification
        emit OtpVerified(transactionId, otp.userAddress, true);

        return true;
    }

    function resetOtp(bytes32 transactionId) public onlyRole(ADMIN_ROLE) {
        require(
            otpRecords[transactionId].expirationTime < block.timestamp,
            "OTP is still valid"
        );
        delete otpRecords[transactionId];
    }

    function blacklistUser(address user) public onlyRole(ADMIN_ROLE) {
        blacklisted[user] = true;
        emit UserBlacklisted(user);
    }

    function removeUserFromBlacklist(address user) public onlyRole(ADMIN_ROLE) {
        blacklisted[user] = false;
        emit UserRemovedFromBlacklist(user);
    }

    /**
     * @dev Check if the OTP request is valid (not expired and not used).
     * @param transactionId The unique transaction ID.
     * @return valid Boolean indicating the validity of the OTP.
     */
    function isOtpValid(
        bytes32 transactionId
    ) public view returns (bool valid) {
        OTPRequest storage otp = otpRecords[transactionId];
        return (otp.expirationTime >= block.timestamp &&
            !isUsed[transactionId]);
    }

    /**
     * @dev Verifies the EIP-712 signature.
     * @param request The OTPRequest struct containing the data.
     * @param signature The EIP-712-compliant signature.
     * @param expectedSigner The expected signer of the request.
     * @return Boolean indicating whether the signature is valid.
     */
    function verifySignature(
        OTPRequest memory request,
        bytes memory signature,
        address expectedSigner
    ) public view returns (bool) {
        bytes32 digest = hashOtpRequest(request);
        address signer = ECDSA.recover(digest, signature);
        return signer == expectedSigner;
    }
}
