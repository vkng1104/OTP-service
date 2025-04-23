import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PinataSDK } from "pinata";

import { Metadata } from "~/module-common/model/metadata.model";

import { PinataFile, PinataGetFileResponse } from "./model";

@Injectable()
export class IpfsService {
  private readonly pinataService: PinataSDK;
  constructor(private readonly configService: ConfigService) {
    const PINATA_API_KEY = this.configService.get<string>("PINATA_API_KEY");
    const PINATA_API_SECRET =
      this.configService.get<string>("PINATA_API_SECRET");
    const PINATA_JWT = this.configService.get<string>("PINATA_JWT");
    const PINATA_GATEWAY = this.configService.get<string>("PINATA_GATEWAY");

    if (
      !PINATA_API_KEY ||
      !PINATA_API_SECRET ||
      !PINATA_JWT ||
      !PINATA_GATEWAY
    ) {
      throw new Error(
        "Missing required environment variables for IPFS service.",
      );
    }

    this.pinataService = new PinataSDK({
      pinataJwt: PINATA_JWT,
      pinataGateway: PINATA_GATEWAY,
    });
  }

  async uploadFile(file: PinataFile): Promise<string> {
    try {
      const result = await this.pinataService.upload.public.file(file.toFile());
      return result.cid;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);
      throw new HttpException(
        "Failed to upload file to IPFS.",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getFile(cid: string): Promise<PinataGetFileResponse> {
    try {
      const result = await this.pinataService.gateways.public.get(cid);
      const url = await this.pinataService.gateways.public.convert(cid);

      const metadata = await Metadata.fromData(result.data);

      return {
        url,
        json: metadata.toObject(),
      };
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);
      throw new HttpException(
        "Failed to get file from IPFS.",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getUrl(cid: string): Promise<string> {
    try {
      return await this.pinataService.gateways.public.convert(cid);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);
      throw new HttpException(
        "Failed to get URL from IPFS.",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
