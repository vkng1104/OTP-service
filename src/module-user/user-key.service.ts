import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import * as crypto from "crypto";
import { ethers } from "ethers";
import { Repository } from "typeorm";

import { UserKeyEntity } from "./entity/user-key.entity";

@Injectable()
export class UserKeyService {
  private secretKey: Buffer;

  constructor(
    @InjectRepository(UserKeyEntity)
    private readonly userKeyRepository: Repository<UserKeyEntity>,
  ) {
    // Create a 32-byte key from the environment variable or default value
    const rawKey = process.env.KEY_ENCRYPTION_SECRET || "my-secret-key";
    this.secretKey = crypto.scryptSync(rawKey, "salt", 32);
  }

  /**
   * Encrypts the private key using AES-256-CBC.
   */
  private encryptPrivateKey(privateKey: string): string {
    const iv = crypto.randomBytes(16); // Initialization vector
    const cipher = crypto.createCipheriv("aes-256-cbc", this.secretKey, iv);
    let encrypted = cipher.update(privateKey, "utf8", "hex");
    encrypted += cipher.final("hex");
    return iv.toString("hex") + ":" + encrypted; // Store IV + encrypted key
  }

  /**
   * Encrypts the mnemonic phrase using AES-256-GCM.
   */
  private encryptMnemonic(mnemonic: string): string {
    const iv = crypto.randomBytes(12); // 12 bytes for AES-GCM
    const cipher = crypto.createCipheriv("aes-256-gcm", this.secretKey, iv);

    let encrypted = cipher.update(mnemonic, "utf8", "hex");
    encrypted += cipher.final("hex");

    const authTag = cipher.getAuthTag().toString("hex"); // Get authentication tag

    return iv.toString("hex") + ":" + encrypted + ":" + authTag; // Store IV + encrypted mnemonic + auth tag
  }

  /**
   * Generates a new wallet and securely stores the keys & mnemonic phrase.
   */
  async generateAndStoreKeys(userId: string): Promise<void> {
    // Generate a new Ethereum wallet
    const wallet = ethers.Wallet.createRandom();

    // Encrypt private key
    const encryptedPrivateKey = this.encryptPrivateKey(wallet.privateKey);

    // Encrypt mnemonic phrase
    const encryptedMnemonic = this.encryptMnemonic(wallet.mnemonic.phrase);

    // Store keys in database
    await this.userKeyRepository.save({
      user_id: userId,
      public_key: wallet.address,
      encrypted_private_key: encryptedPrivateKey,
      encrypted_mnemonic_phrase: encryptedMnemonic,
    });
  }

  /**
   * Retrieves the encrypted private key and decrypts it.
   */
  async getDecryptedPrivateKey(userId: string): Promise<string> {
    const userKey = await this.userKeyRepository.findOne({
      where: { user_id: userId },
    });
    if (!userKey) throw new Error("Private key not found");

    return this.decryptPrivateKey(userKey.encrypted_private_key);
  }

  /**
   * Decrypts the private key.
   */
  private decryptPrivateKey(encryptedPrivateKey: string): string {
    const [ivHex, encryptedText] = encryptedPrivateKey.split(":");
    const iv = Buffer.from(ivHex, "hex");
    const decipher = crypto.createDecipheriv("aes-256-cbc", this.secretKey, iv);
    let decrypted = decipher.update(encryptedText, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  }

  /**
   * Decrypts the mnemonic phrase.
   */
  private decryptMnemonic(encryptedMnemonic: string): string {
    const [ivHex, encryptedText, authTagHex] = encryptedMnemonic.split(":");
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");

    const decipher = crypto.createDecipheriv("aes-256-gcm", this.secretKey, iv);
    decipher.setAuthTag(authTag); // Set authentication tag

    let decrypted = decipher.update(encryptedText, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  }

  /**
   * Retrieves and decrypts the mnemonic phrase.
   */
  async getDecryptedMnemonic(userId: string): Promise<string> {
    const userKey = await this.userKeyRepository.findOne({
      where: { user_id: userId },
    });
    if (!userKey || !userKey.encrypted_mnemonic_phrase) {
      throw new Error("Mnemonic phrase not found");
    }

    return this.decryptMnemonic(userKey.encrypted_mnemonic_phrase);
  }
}
