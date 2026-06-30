import { Injectable, NotFoundException } from '@nestjs/common';
import { AssetType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';

type CreateAssetInput = {
  id?: string;
  userId: string;
  taskId?: string;
  type: AssetType;
  ossKey: string;
  mimeType: string;
  metadata: Prisma.InputJsonValue;
};

type InputParams = {
  prompt?: unknown;
  image_urls?: unknown;
  frames?: unknown;
  aspect_ratio?: unknown;
  template_id?: unknown;
  camera_strength?: unknown;
};

@Injectable()
export class AssetService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  createFromPersisted(input: CreateAssetInput) {
    return this.prisma.asset.create({
      data: {
        id: input.id,
        userId: input.userId,
        taskId: input.taskId,
        type: input.type,
        ossKey: input.ossKey,
        mimeType: input.mimeType,
        metadata: input.metadata,
      },
    });
  }

  listForUser(userId: string, type?: AssetType) {
    return this.prisma.asset.findMany({
      where: {
        userId,
        deletedAt: null,
        ...(type ? { type } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  private async findActiveForUser(userId: string, id: string) {
    const asset = await this.prisma.asset.findFirst({
      where: { id, userId, deletedAt: null },
    });
    if (!asset) {
      throw new NotFoundException('Asset not found');
    }
    return asset;
  }

  async getForUser(userId: string, id: string) {
    const asset = await this.findActiveForUser(userId, id);
    const previewUrl = await this.storage.getSignedUrl(asset.ossKey);
    return { ...asset, previewUrl };
  }

  async getDownloadUrl(userId: string, id: string) {
    const asset = await this.getForUser(userId, id);
    return {
      url: asset.previewUrl,
      mimeType: asset.mimeType,
    };
  }

  async renameForUser(userId: string, id: string, title: string) {
    const asset = await this.findActiveForUser(userId, id);
    const metadata =
      asset.metadata && typeof asset.metadata === 'object' && !Array.isArray(asset.metadata)
        ? (asset.metadata as Prisma.JsonObject)
        : {};

    return this.prisma.asset.update({
      where: { id },
      data: {
        metadata: {
          ...metadata,
          title: title.trim(),
        },
      },
    });
  }

  async softDeleteForUser(userId: string, id: string) {
    await this.findActiveForUser(userId, id);
    return this.prisma.asset.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async getComposeContext(userId: string, id: string) {
    const asset = await this.findActiveForUser(userId, id);
    const task = asset.taskId
      ? await this.prisma.generationTask.findFirst({
          where: { id: asset.taskId, userId },
        })
      : null;

    const inputParams = (task?.inputParams ?? {}) as InputParams;
    const metadata =
      asset.metadata && typeof asset.metadata === 'object' && !Array.isArray(asset.metadata)
        ? (asset.metadata as Record<string, unknown>)
        : {};

    const prompt =
      typeof metadata.prompt === 'string' && metadata.prompt.trim()
        ? metadata.prompt.trim()
        : undefined;

    const rawUrls = Array.isArray(inputParams.image_urls)
      ? inputParams.image_urls.filter((item): item is string => typeof item === 'string')
      : [];

    const imageUrls = await Promise.all(
      rawUrls.map((url) => this.refreshImageUrl(url)),
    );

    return {
      assetId: asset.id,
      assetType: asset.type,
      prompt,
      imageUrls,
      generationType: task?.type,
      frames: typeof inputParams.frames === 'number' ? inputParams.frames : undefined,
      aspectRatio:
        typeof inputParams.aspect_ratio === 'string' ? inputParams.aspect_ratio : undefined,
      templateId:
        typeof inputParams.template_id === 'string' ? inputParams.template_id : undefined,
      cameraStrength:
        typeof inputParams.camera_strength === 'string'
          ? inputParams.camera_strength
          : undefined,
    };
  }

  private async refreshImageUrl(url: string) {
    try {
      const pathname = decodeURIComponent(new URL(url).pathname.replace(/^\//, ''));
      if (pathname.startsWith('temp/') || pathname.startsWith('assets/')) {
        return this.storage.getSignedUrl(pathname);
      }
    } catch {
      // use original url
    }
    return url;
  }
}
