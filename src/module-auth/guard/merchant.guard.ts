import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Reflector } from "@nestjs/core";

@Injectable()
export class MerchantGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly configService: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const clientId = request.headers["x-client-id"];
    const clientSecret = request.headers["x-client-secret"];

    if (!clientId || !clientSecret) {
      throw new UnauthorizedException("Missing client credentials");
    }

    // Get allowed merchants from environment variables
    const allowedMerchants =
      this.configService.get<string>("ALLOWED_MERCHANTS");

    if (!allowedMerchants) {
      throw new UnauthorizedException("Merchant validation not configured");
    }

    // Parse the allowed merchants JSON string
    let merchants: Record<string, string>;
    try {
      merchants = JSON.parse(allowedMerchants);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);
      throw new UnauthorizedException("Invalid merchant configuration");
    }

    // Check if the client ID exists and the secret matches
    if (!merchants[clientId] || merchants[clientId] !== clientSecret) {
      throw new UnauthorizedException("Invalid client credentials");
    }

    // Add the merchant ID to the request for later use
    request.merchantId = clientId;

    return true;
  }
}
