// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract OTPSystem is EIP712, AccessControl, ReentrancyGuard {
  string private constant SIGNING_DOMAIN = "OTPSystem";
  string private constant SIGNATURE_VERSION = "1";

  // Structure to store OTP data
  struct OTPData {
    bytes32 commitmentValue; // Stores hashed OTP
    uint256 index; // Tracks OTP usage order
    uint256 startTime; // OTP valid-from timestamp
    uint256 endTime; // OTP valid-until timestamp
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
    _grantRole(ADMIN_ROLE, msg.sender);
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
    UserRegistration calldata request
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
    OTPVerification calldata verification
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
    UserRegistration calldata request,
    bytes calldata signature
  ) external notBlacklisted(userId) {
    require(
      _verifyUserRegistration(request, signature, msg.sender),
      "Invalid signature for User Registration"
    );
    require(
      otpRecords[userId].commitmentValue == 0,
      "User already registered on this service"
    );

    otpRecords[userId] = OTPData(request.commitmentValue, 1, 0, 0);

    emit UserRegistered(userId, msg.sender);
  }

  /**
   * @dev Updates the OTP window for a user.
   *
   * @param userId The unique user ID associated with this OTP.
   * @param startTime The start time of the OTP window.
   * @param endTime The end time of the OTP window.
   */
  function updateOtpWindow(
    bytes32 userId,
    uint256 startTime,
    uint256 endTime
  ) external onlyRole(ADMIN_ROLE) {
    require(otpRecords[userId].commitmentValue != 0, "User not registered");
    require(startTime < endTime, "Invalid time window");

    otpRecords[userId].startTime = startTime;
    otpRecords[userId].endTime = endTime;
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
    OTPVerification calldata request,
    bytes calldata signature
  ) external nonReentrant returns (bool success) {
    OTPData storage otpData = otpRecords[userId];

    require(otpData.index == index, "Invalid index");
    require(
      block.timestamp >= otpData.startTime &&
        block.timestamp <= otpData.endTime,
      "OTP is expired or not active"
    );

    // 🔹 Ensure that hashed OTP matches the stored commitment
    require(
      keccak256(abi.encodePacked(request.otp)) == otpData.commitmentValue,
      "OTP is invalid"
    );
    require(
      _verifyOtpVerification(request, signature, msg.sender),
      "Invalid signature for OTP verification"
    );

    // 🔹 Update commitment to prevent OTP reuse
    otpData.commitmentValue = request.newCommitmentValue;
    otpData.index++;
    // 🔐 Reset time window
    otpData.startTime = 0;
    otpData.endTime = 0;

    emit OtpVerified(userId, msg.sender, request.otp, true);
    return true;
  }

  function resetOtp(bytes32 userId) external onlyRole(ADMIN_ROLE) {
    delete otpRecords[userId];
  }

  /**
   * @dev Resets the OTP records for multiple users.
   *
   * @param userIds An array of user IDs to reset.
   */
  function resetManyOtps(
    bytes32[] calldata userIds
  ) external onlyRole(ADMIN_ROLE) {
    for (uint i = 0; i < userIds.length; i++) {
      delete otpRecords[userIds[i]];
    }
  }

  /**
   * @dev Retrieves the OTP data for a specific user.
   *
   * @param userId The unique user ID to retrieve OTP data for.
   * @return commitmentValue The commitment value of the OTP.
   * @return index The index of the OTP.
   * @return startTime The start time of the OTP.
   * @return endTime The end time of the OTP.
   */
  function getOtpDetails(
    bytes32 userId
  )
    external
    view
    onlyRole(ADMIN_ROLE)
    returns (
      bytes32 commitmentValue,
      uint256 index,
      uint256 startTime,
      uint256 endTime
    )
  {
    OTPData memory otp = otpRecords[userId];
    return (otp.commitmentValue, otp.index, otp.startTime, otp.endTime);
  }

  function blacklistUser(bytes32 userId) external onlyRole(ADMIN_ROLE) {
    blacklisted[userId] = true;
    emit UserBlacklisted(userId);
  }

  function removeUserFromBlacklist(
    bytes32 userId
  ) external onlyRole(ADMIN_ROLE) {
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
  function _verifyUserRegistration(
    UserRegistration calldata request,
    bytes calldata signature,
    address expectedSigner
  ) internal view returns (bool) {
    bytes32 digest = hashUserRegistration(request);
    return ECDSA.recover(digest, signature) == expectedSigner;
  }

  /**
   * @dev Verifies the EIP-712 signature for OTPVerification.
   * @param request The OTPVerification struct containing the data.
   * @param signature The EIP-712-compliant signature.
   * @param expectedSigner The expected signer of the verification.
   * @return Boolean indicating whether the signature is valid.
   */
  function _verifyOtpVerification(
    OTPVerification calldata request,
    bytes calldata signature,
    address expectedSigner
  ) internal view returns (bool) {
    bytes32 digest = hashOtpVerification(request);
    return ECDSA.recover(digest, signature) == expectedSigner;
  }
}
