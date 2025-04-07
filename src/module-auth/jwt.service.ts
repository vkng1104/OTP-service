import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService as NestJwtService } from "@nestjs/jwt";

@Injectable()
export class JwtService {
  private readonly accessTokenExpiresIn: string;
  private readonly refreshTokenExpiresIn: string;
  constructor(
    private readonly jwtService: NestJwtService,
    private readonly configService: ConfigService,
  ) {
    this.accessTokenExpiresIn = this.configService.get<string>(
      "JWT_EXPIRES_IN",
      "1h",
    );
    this.refreshTokenExpiresIn = this.configService.get<string>(
      "JWT_REFRESH_EXPIRES_IN",
      "7d",
    );
  }

  /**
   * Generate a JWT token for a user
   * @param userId The user ID to include in the token
   * @param additionalData Any additional data to include in the token payload
   * @returns The generated JWT token
   */
  async generateToken(
    userId: string,
    additionalData: Record<string, unknown> = {},
  ): Promise<string> {
    const payload = {
      sub: userId,
      ...additionalData,
    };

    return this.jwtService.signAsync(payload, {
      expiresIn: this.accessTokenExpiresIn,
    });
  }

  /**
   * Verify a JWT token
   * @param token The JWT token to verify
   * @returns The decoded token payload
   */
  async verifyToken(token: string): Promise<Record<string, unknown>> {
    try {
      return await this.jwtService.verifyAsync(token);
    } catch (error) {
      throw new UnauthorizedException("Invalid token", error);
    }
  }

  /**
   * Decode a JWT token without verification
   * @param token The JWT token to decode
   * @returns The decoded token payload
   */
  decodeToken(token: string): Record<string, unknown> {
    try {
      return this.jwtService.decode(token);
    } catch (error) {
      throw new UnauthorizedException("Invalid token format", error);
    }
  }

  /**
   * Generate a refresh token
   * @param userId The user ID to include in the token
   * @returns The generated refresh token
   */
  async generateRefreshToken(userId: string): Promise<string> {
    return this.jwtService.signAsync(
      { sub: userId, type: "refresh" },
      { expiresIn: this.refreshTokenExpiresIn },
    );
  }

  /**
   * Verify a refresh token
   * @param token The refresh token to verify
   * @returns The decoded token payload
   */
  async verifyRefreshToken(token: string): Promise<Record<string, unknown>> {
    try {
      const payload = await this.jwtService.verifyAsync(token);

      if (payload.type !== "refresh") {
        throw new UnauthorizedException("Invalid token type");
      }

      return payload;
    } catch (error) {
      throw new UnauthorizedException("Invalid refresh token", error);
    }
  }
}
