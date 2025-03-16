// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract OTPSystem is EIP712, AccessControl {
  string private constant SIGNING_DOMAIN = "OTPSystem";
  string private constant SIGNATURE_VERSION = "1";

  // Structure to store OTP data
  struct OTPData {
    bytes32 commitmentValue; // Stores hashed OTP
    uint256 index; // Tracks OTP usage order
  }

  struct UserRegistration {
    string username;
    string service;
    bytes32 commitmentValue; // Initial OTP commitment
  }

  struct OTPVerification {
    string username;
    string service;
    bytes32 otp; // Raw OTP (will be hashed for comparison)
    bytes32 newCommitmentValue; // Next OTP commitment
  }

  // Type hashes for EIP-712 structs
  bytes32 private constant USERREGISTRATION_TYPEHASH =
    keccak256(
      "UserRegistration(string username,string service,bytes32 commitmentValue)"
    );

  bytes32 private constant OTPVERIFICATION_TYPEHASH =
    keccak256(
      "OTPVerification(string username,string service,bytes32 otp,bytes32 newCommitmentValue)"
    );

  // Role identifiers
  bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

  // Mapping to store OTP records by user ID
  mapping(bytes32 => OTPData) public otpRecords;
  // To track whether user is blacklisted
  mapping(bytes32 => bool) public blacklisted;

  // Event triggered when a user is registered
  event UserRegistered(bytes32 indexed userId, address indexed user);
  // Event triggered when an OTP is verified
  event OtpVerified(
    bytes32 indexed userId,
    address indexed user,
    bytes32 otp,
    bool success
  );
  // Event triggered when user is blacklisted
  event UserBlacklisted(bytes32 indexed userId);
  // Event triggered when user is removed from blacklist
  event UserRemovedFromBlacklist(bytes32 indexed userId);

  constructor() EIP712(SIGNING_DOMAIN, SIGNATURE_VERSION) {
    // Grant the deployer the admin role
    _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
  }

  modifier notBlacklisted(bytes32 userId) {
    require(!blacklisted[userId], "User is blacklisted");
    _;
  }

  /**
   * @dev Hashes the UserRegistration struct as per EIP-712 standard.
   *
   * @param request The UserRegistration struct.
   * @return The hashed UserRegistration.
   */
  function hashUserRegistration(
    UserRegistration memory request
  ) public view returns (bytes32) {
    return
      _hashTypedDataV4(
        keccak256(
          abi.encode(
            USERREGISTRATION_TYPEHASH,
            keccak256(bytes(request.username)),
            keccak256(bytes(request.service)),
            request.commitmentValue
          )
        )
      );
  }

  /**
   * @dev Hashes the OTPVerification struct as per EIP-712 standard.
   *
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
            keccak256(bytes(verification.username)),
            keccak256(bytes(verification.service)),
            verification.otp,
            verification.newCommitmentValue
          )
        )
      );
  }

  /**
   * @dev Registers a new user by storing their OTP commitment.
   *
   * This function initializes a user's OTP authentication process by storing
   * an initial commitment value (`y0 = H(x1)`). The commitment value is used to verify
   * the validity of future OTPs.
   *
   * The function ensures:
   * - The provided `signature` is valid and was signed by `msg.sender`.
   * - The user is not already registered on the same service.
   * - The OTP commitment is stored securely in the contract.
   *
   * @param userId A unique identifier for the user.
   * @param request The UserRegistration struct containing the request details.
   * @param signature The EIP-712-compliant signature for the user registration.
   */
  function registerUser(
    bytes32 userId,
    UserRegistration memory request,
    bytes memory signature
  ) public notBlacklisted(userId) {
    require(
      verifySignature(request, signature, msg.sender),
      "Invalid signature for User Registration"
    );
    require(
      otpRecords[userId].commitmentValue == 0,
      "User already registered on this service"
    );

    otpRecords[userId] = OTPData(request.commitmentValue, 1);

    emit UserRegistered(userId, msg.sender);
  }

  /**
   * @dev Verify the OTP.
   *
   * @param userId The unique user ID associated with this OTP.
   * @param request A OTPVerification struct.
   * @param signature The EIP-712-compliant signature for the OTP verification.
   *
   * @return success Boolean indicating whether the verification was successful.
   */
  function verifyOtp(
    bytes32 userId,
    uint256 index,
    OTPVerification memory request,
    bytes memory signature
  ) public returns (bool success) {
    OTPData storage otpData = otpRecords[userId];

    require(otpData.index == index, "Invalid index");

    // 🔹 Ensure that hashed OTP matches the stored commitment
    require(
      keccak256(abi.encodePacked(request.otp)) == otpData.commitmentValue,
      "OTP is invalid"
    );

    require(
      verifySignature(request, signature, msg.sender),
      "Invalid signature for OTP verification"
    );

    // 🔹 Update commitment to prevent OTP reuse
    otpData.commitmentValue = request.newCommitmentValue;
    otpData.index++;

    emit OtpVerified(userId, msg.sender, request.otp, true);
    return true;
  }

  function resetOtp(bytes32 userId) public onlyRole(ADMIN_ROLE) {
    delete otpRecords[userId];
  }

  function blacklistUser(bytes32 userId) public onlyRole(ADMIN_ROLE) {
    blacklisted[userId] = true;
    emit UserBlacklisted(userId);
  }

  function removeUserFromBlacklist(bytes32 userId) public onlyRole(ADMIN_ROLE) {
    blacklisted[userId] = false;
    emit UserRemovedFromBlacklist(userId);
  }

  /**
   * @dev Verifies the EIP-712 signature for UserRegistration.
   * @param request The UserRegistration struct containing the data.
   * @param signature The EIP-712-compliant signature.
   * @param expectedSigner The expected signer of the request.
   * @return Boolean indicating whether the signature is valid.
   */
  function verifySignature(
    UserRegistration memory request,
    bytes memory signature,
    address expectedSigner
  ) public view returns (bool) {
    bytes32 digest = hashUserRegistration(request);
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
