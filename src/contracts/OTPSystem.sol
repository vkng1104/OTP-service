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
    string transactionId;
    string otp; // Store OTP as plain text
    address userAddress;
    uint256 expirationTime;
    uint256 nonce; // Replay protection for request phase
  }

  struct OTPVerification {
    string transactionId;
    string otp;
    address userAddress;
  }

  // Type hashes for EIP-712 structs
  bytes32 private constant OTPREQUEST_TYPEHASH =
    keccak256(
      "OTPRequest(string transactionId,string otp,address userAddress,uint256 expirationTime,uint256 nonce)"
    );
  bytes32 private constant OTPVERIFICATION_TYPEHASH =
    keccak256(
      "OTPVerification(string transactionId,string otp,address userAddress)"
    );

  // Role identifiers
  bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

  // Mapping to store OTP records by transaction ID
  mapping(bytes32 => OTPRequest) public otpRecords;

  // To track whether OTP has been used
  mapping(bytes32 => bool) public isUsed;

  // To track whether address is blacklisted
  mapping(address => bool) public blacklisted;

  // Nonces for replay protection during OTP requests
  mapping(address => uint256) public userNonces;

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
            keccak256(bytes(request.transactionId)),
            keccak256(bytes(request.otp)),
            request.userAddress,
            request.expirationTime,
            request.nonce
          )
        )
      );
  }

  /**
   * @dev Hashes the OTPVerification struct as per EIP-712 standard.
   * @param verification The OTPVerification struct.
   * @return The hashed OTPVerification.
   */
  function hashOtpVerification(
    OTPVerification memory verification
  ) public view returns (bytes32) {
    return
      _hashTypedDataV4(
        keccak256(
          abi.encode(
            OTPVERIFICATION_TYPEHASH,
            keccak256(bytes(verification.transactionId)),
            keccak256(bytes(verification.otp)),
            verification.userAddress
          )
        )
      );
  }

  /**
   * @dev Generate an OTP and store it in the contract.
   * @param request The OTPRequest struct containing the request details.
   * @param signature The EIP-712-compliant signature of the request.
   */
  function requestOtp(
    OTPRequest memory request,
    bytes memory signature
  ) public notBlacklisted(request.userAddress) {
    bytes32 hashedTransactionId = keccak256(bytes(request.transactionId));

    // Ensure the transaction ID hasn't been processed before
    require(!isUsed[hashedTransactionId], "Transaction ID already processed");

    // Check the nonce for the user
    require(request.nonce == userNonces[request.userAddress], "Invalid nonce");

    require(
      otpRecords[hashedTransactionId].expirationTime == 0,
      "OTP already exists for this transaction ID"
    );

    require(request.expirationTime >= block.timestamp, "OTP has expired");

    // Verify the signature for the OTP request
    require(
      verifySignature(request, signature, request.userAddress),
      "Invalid signature"
    );

    // Increment the user's nonce
    userNonces[request.userAddress]++;

    // Store the OTP request
    otpRecords[hashedTransactionId] = request;

    // Emit an event for OTP generation
    emit OtpRequested(hashedTransactionId, request.userAddress);
  }

  /**
   * @dev Verify the OTP by comparing the provided OTP with the stored OTP.
   * @param transactionId The unique transaction ID associated with this OTP.
   * @param otp The plain text OTP provided by the user.
   * @param signature The EIP-712-compliant signature for the OTP verification.
   * @return success Boolean indicating whether the verification was successful.
   */
  function verifyOtp(
    string memory transactionId,
    string memory otp,
    bytes memory signature
  ) public returns (bool success) {
    bytes32 hashedTransactionId = keccak256(bytes(transactionId));
    OTPRequest storage otpRequest = otpRecords[hashedTransactionId];

    // Check if the OTP is valid
    require(otpRequest.expirationTime >= block.timestamp, "OTP has expired");
    require(!isUsed[hashedTransactionId], "OTP has already been used");

    // Recreate the OTPVerification struct
    OTPVerification memory verification = OTPVerification({
      transactionId: transactionId,
      otp: otp,
      userAddress: otpRequest.userAddress
    });

    // Verify the signature for OTP verification
    require(
      verifySignature(verification, signature, otpRequest.userAddress),
      "Invalid signature for OTP verification"
    );

    // Mark the OTP as used
    isUsed[hashedTransactionId] = true;

    // Emit an event for successful verification
    emit OtpVerified(hashedTransactionId, otpRequest.userAddress, true);

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
  function isOtpValid(bytes32 transactionId) public view returns (bool valid) {
    OTPRequest storage otp = otpRecords[transactionId];
    return (otp.expirationTime >= block.timestamp && !isUsed[transactionId]);
  }

  /**
   * @dev Verifies the EIP-712 signature for OTPRequest.
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

  /**
   * @dev Verifies the EIP-712 signature for OTPVerification.
   * @param verification The OTPVerification struct containing the data.
   * @param signature The EIP-712-compliant signature.
   * @param expectedSigner The expected signer of the verification.
   * @return Boolean indicating whether the signature is valid.
   */
  function verifySignature(
    OTPVerification memory verification,
    bytes memory signature,
    address expectedSigner
  ) public view returns (bool) {
    bytes32 digest = hashOtpVerification(verification);
    address signer = ECDSA.recover(digest, signature);
    return signer == expectedSigner;
  }
}
