import {
  Injectable,
  InternalServerErrorException,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OSS from 'ali-oss';
import { randomUUID } from 'crypto';
import { Readable } from 'stream';

export type PersistedObject = {
  ossKey: string;
  mimeType: string;
};

type SignedUrlCacheEntry = {
  url: string;
  expiresAt: number;
};

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly client: OSS | null;
  private readonly mockMode: boolean;
  private readonly signedUrlCache = new Map<string, SignedUrlCacheEntry>();

  constructor(private readonly config: ConfigService) {
    this.mockMode = config.get<string>('STORAGE_MOCK') === 'true';
    const region = config.get<string>('OSS_REGION');
    const accessKeyId = config.get<string>('OSS_ACCESS_KEY_ID');
    const accessKeySecret = config.get<string>('OSS_ACCESS_KEY_SECRET');
    const bucket = config.get<string>('OSS_BUCKET');

    if (!this.mockMode && region && accessKeyId && accessKeySecret && bucket) {
      this.client = new OSS({
        region,
        accessKeyId,
        accessKeySecret,
        bucket,
        endpoint: config.get<string>('OSS_ENDPOINT') || undefined,
        secure: true,
      });
      this.logger.log(`OSS 已启用（Bucket: ${bucket}）`);
    } else {
      this.client = null;
      if (!this.mockMode) {
        this.logger.warn('OSS 凭证不完整，请检查 .env 或设置 STORAGE_MOCK=true');
      }
    }
  }

  isConfigured() {
    return this.mockMode || this.client !== null;
  }

  async uploadBuffer(
    key: string,
    buffer: Buffer,
    mimeType: string,
  ): Promise<PersistedObject> {
    if (this.mockMode) {
      this.logger.debug(`Mock upload: ${key}`);
      return { ossKey: key, mimeType };
    }
    if (!this.client) {
      throw new ServiceUnavailableException(
        '对象存储未配置，请设置 STORAGE_MOCK=true 或填写 OSS 凭证',
      );
    }
    try {
      await this.client.put(key, buffer, {
        headers: { 'Content-Type': mimeType },
      });
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'unknown error';
      this.logger.error(`OSS put failed: ${detail}`);
      throw new ServiceUnavailableException(`OSS 上传失败：${detail}`);
    }
    return { ossKey: key, mimeType };
  }

  async uploadTemp(userId: string, buffer: Buffer, mimeType: string) {
    const ext =
      mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg';
    const key = `temp/${userId}/${randomUUID()}.${ext}`;
    return this.uploadBuffer(key, buffer, mimeType);
  }

  async persistFromBase64(
    userId: string,
    assetId: string,
    base64: string,
    mimeType: string,
  ): Promise<PersistedObject> {
    const buffer = Buffer.from(base64, 'base64');
    const ext = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg';
    const key = `assets/${userId}/${assetId}.${ext}`;
    return this.uploadBuffer(key, buffer, mimeType);
  }

  async persistFromUrl(
    userId: string,
    assetId: string,
    url: string,
    mimeType: string,
  ): Promise<PersistedObject> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download ${url}: ${response.status}`);
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    const ext = mimeType.includes('video') ? 'mp4' : mimeType === 'image/png' ? 'png' : 'jpg';
    const key = `assets/${userId}/${assetId}.${ext}`;
    return this.uploadBuffer(key, buffer, mimeType);
  }

  async getSignedUrl(ossKey: string, expiresSeconds = 3600) {
    if (this.mockMode) {
      return `https://mock.local/${ossKey}`;
    }
    if (!this.client) {
      throw new ServiceUnavailableException(
        '对象存储未配置，请设置 STORAGE_MOCK=true 或填写 OSS 凭证',
      );
    }

    const cached = this.signedUrlCache.get(ossKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.url;
    }

    try {
      const url = this.client.signatureUrl(ossKey, { expires: expiresSeconds });
      this.signedUrlCache.set(ossKey, {
        url,
        expiresAt: Date.now() + expiresSeconds * 0.9 * 1000,
      });
      return url;
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'unknown error';
      this.logger.error(`OSS signatureUrl failed: ${detail}`);
      throw new InternalServerErrorException(`生成访问链接失败：${detail}`);
    }
  }

  getReadableStream(_ossKey: string): Readable {
    throw new Error('Stream proxy not implemented in MVP');
  }

  async deleteObject(ossKey: string): Promise<void> {
    if (this.mockMode) {
      this.logger.debug(`Mock delete: ${ossKey}`);
      return;
    }
    if (!this.client) {
      throw new ServiceUnavailableException(
        '对象存储未配置，请设置 STORAGE_MOCK=true 或填写 OSS 凭证',
      );
    }
    try {
      await this.client.delete(ossKey);
    } catch (error) {
      const code =
        error && typeof error === 'object' && 'code' in error
          ? String((error as { code: unknown }).code)
          : '';
      if (code === 'NoSuchKey') {
        return;
      }
      const detail = error instanceof Error ? error.message : 'unknown error';
      this.logger.error(`OSS delete failed: ${detail}`);
      throw new InternalServerErrorException(`删除对象失败：${detail}`);
    }
    this.signedUrlCache.delete(ossKey);
  }
}
