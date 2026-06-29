import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Interval } from '@nestjs/schedule';
import { AssetType } from '@prisma/client';
import { randomUUID } from 'crypto';
import { AssetService } from '../asset/asset.service';
import { JimengService } from '../jimeng/jimeng.service';
import { StorageService } from '../storage/storage.service';
import { GenerationTaskService } from './generation-task.service';

@Injectable()
export class GenerationPollerService {
  private readonly logger = new Logger(GenerationPollerService.name);
  private polling = false;

  constructor(
    private readonly tasks: GenerationTaskService,
    private readonly jimeng: JimengService,
    private readonly storage: StorageService,
    private readonly assets: AssetService,
    private readonly config: ConfigService,
  ) {}

  @Interval(5000)
  async pollTasks() {
    const interval = Number(
      this.config.get<string>('GENERATION_POLL_INTERVAL_MS') ?? 5000,
    );
    if (interval !== 5000) {
      // Interval decorator is fixed; env kept for documentation/future refactor
    }

    if (this.polling || !this.jimeng.isConfigured()) {
      return;
    }

    this.polling = true;
    try {
      const active = await this.tasks.listActive();
      for (const task of active) {
        await this.pollOne(task.id, task.reqKey, task.jimengTaskId!, task.userId, task.type);
      }
    } finally {
      this.polling = false;
    }
  }

  private async pollOne(
    taskId: string,
    reqKey: string,
    jimengTaskId: string,
    userId: string,
    type: string,
  ) {
    try {
      const isVideo = type.startsWith('video_');
      const result = await this.jimeng.getResult(reqKey, jimengTaskId, {
        returnUrl: !isVideo,
      });
      if (result.code !== 10000) {
        await this.tasks.markFailed(taskId, result.message ?? 'Jimeng error');
        return;
      }

      const status = result.data?.status;
      if (status === 'in_queue' || status === 'generating') {
        await this.tasks.markProcessing(taskId);
        return;
      }

      if (status !== 'done') {
        await this.tasks.markFailed(taskId, status ?? 'Unknown status');
        return;
      }

      if (isVideo) {
        const videoUrl = result.data?.video_url;
        if (!videoUrl) {
          await this.tasks.markFailed(taskId, 'Missing video_url');
          return;
        }
        const assetId = randomUUID();
        const persisted = await this.storage.persistFromUrl(
          userId,
          assetId,
          videoUrl,
          'video/mp4',
        );
        await this.assets.createFromPersisted({
          id: assetId,
          userId,
          taskId,
          type: AssetType.video,
          ossKey: persisted.ossKey,
          mimeType: persisted.mimeType,
          metadata: { sourceUrl: videoUrl },
        });
      } else {
        const urls = result.data?.image_urls ?? [];
        const base64List = result.data?.binary_data_base64 ?? [];

        if (urls.length) {
          for (const url of urls) {
            const assetId = randomUUID();
            const persisted = await this.storage.persistFromUrl(
              userId,
              assetId,
              url,
              'image/png',
            );
            await this.assets.createFromPersisted({
              id: assetId,
              userId,
              taskId,
              type: AssetType.image,
              ossKey: persisted.ossKey,
              mimeType: persisted.mimeType,
              metadata: { sourceUrl: url },
            });
          }
        } else if (base64List.length) {
          for (const encoded of base64List) {
            const assetId = randomUUID();
            const persisted = await this.storage.persistFromBase64(
              userId,
              assetId,
              encoded,
              'image/png',
            );
            await this.assets.createFromPersisted({
              id: assetId,
              userId,
              taskId,
              type: AssetType.image,
              ossKey: persisted.ossKey,
              mimeType: persisted.mimeType,
              metadata: { source: 'binary_data_base64' },
            });
          }
        } else {
          await this.tasks.markFailed(taskId, '生成结果中未包含图片');
          return;
        }
      }

      await this.tasks.markDone(taskId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Poll failed';
      this.logger.error(`Poll failed for ${taskId}: ${message}`);
      await this.tasks.markFailed(taskId, message);
    }
  }
}
