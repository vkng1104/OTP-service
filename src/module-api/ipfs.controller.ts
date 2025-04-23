import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";

import { JwtAuthGuard } from "~/module-auth/guard/jwt-auth.guard";
import { Roles } from "~/module-auth/guard/roles.decorator";
import { RolesGuard } from "~/module-auth/guard/roles.guard";
import { Metadata } from "~/module-common/model/metadata.model";
import { IpfsService } from "~/module-ipfs/ipfs.service";
import { PinataFile, PinataGetFileResponse } from "~/module-ipfs/model";
import { UserRole } from "~/module-user/constant";

@Controller("api/ipfs")
export class IpfsController {
  constructor(private readonly ipfsService: IpfsService) {}

  @Post("json")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.USER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async uploadJson(
    @Body() data: { json: Record<string, unknown>; filename?: string },
  ): Promise<{ cid: string; filename: string }> {
    // Convert the JSON data to a Metadata object
    const metadata = new Metadata(data.json);

    const filename = (data.filename ?? `json+${Date.now()}`) + ".json";

    // Create a PinataFile with the JSON data
    const file = new PinataFile(filename, "application/json", metadata);

    // Upload the file to IPFS
    const cid = await this.ipfsService.uploadFile(file);

    return { cid, filename };
  }

  @Get("json/:cid")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.USER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getJson(@Param("cid") cid: string): Promise<PinataGetFileResponse> {
    return await this.ipfsService.getFile(cid);
  }
}
