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
        ...(type ? { type } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getForUser(userId: string, id: string) {
    const asset = await this.prisma.asset.findFirst({
      where: { id, userId },
    });
    if (!asset) {
      throw new NotFoundException('Asset not found');
    }
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
}
