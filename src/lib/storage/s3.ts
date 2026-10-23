import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type {
  StorageAdapter,
  CreateUploadUrlOptions,
  UploadUrlResult,
} from "./adapter";

export interface S3Config {
  endpoint?: string;
  region?: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  publicUrl?: string;
  forcePathStyle?: boolean;
}

export class S3StorageAdapter implements StorageAdapter {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly publicUrlPrefix: string;

  constructor(config: S3Config) {
    this.bucket = config.bucket;

    const forcePathStyle =
      config.forcePathStyle ??
      (config.endpoint ? !config.endpoint.includes("amazonaws.com") : true);

    this.client = new S3Client({
      endpoint: config.endpoint,
      region: config.region || "auto",
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      forcePathStyle,
    });

    if (config.publicUrl) {
      this.publicUrlPrefix = config.publicUrl.replace(/\/+$/, "");
    } else if (config.endpoint) {
      const endpointClean = config.endpoint.replace(/\/+$/, "");
      if (forcePathStyle) {
        this.publicUrlPrefix = `${endpointClean}/${this.bucket}`;
      } else {
        const url = new URL(endpointClean);
        this.publicUrlPrefix = `${url.protocol}//${this.bucket}.${url.host}`;
      }
    } else {
      this.publicUrlPrefix = `https://${this.bucket}.s3.${config.region || "auto"}.amazonaws.com`;
    }
  }

  async createUploadUrl(
    options: CreateUploadUrlOptions
  ): Promise<UploadUrlResult> {
    const {
      key,
      contentType,
      expiresInSeconds = 300,
      cacheControl = "public, max-age=31536000, immutable",
    } = options;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
      CacheControl: cacheControl,
    });

    const uploadUrl = await getSignedUrl(this.client, command, {
      expiresIn: expiresInSeconds,
    });

    return {
      uploadUrl,
      publicUrl: this.getPublicUrl(key),
      key,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": cacheControl,
      },
    };
  }

  getPublicUrl(key: string): string {
    const cleanKey = key.replace(/^\/+/, "");
    return `${this.publicUrlPrefix}/${cleanKey}`;
  }

  async deleteObject(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    await this.client.send(command);
  }

  getDriverName(): "s3" | "local" {
    return "s3";
  }
}
