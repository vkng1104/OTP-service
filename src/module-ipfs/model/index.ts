import { Metadata } from "~/module-common/model/metadata.model";

export class PinataFile {
  name: string;
  contentType: string;
  data: Metadata;

  constructor(name: string, contentType: string, data: Metadata) {
    this.name = name;
    this.contentType = contentType;
    this.data = data;
  }

  toFile() {
    return new File([this.data.toBlob()], this.name, {
      type: this.contentType,
    });
  }
}

export interface PinataGetFileResponse {
  json: Record<string, unknown>;
  url: string;
}
