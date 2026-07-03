import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Interval } from '@nestjs/schedule';
import { AssetSource, AssetType, GenerationTask, Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { ArkVideoService } from '../ark/ark-video.service';
import { AssetService } from '../asset/asset.service';
import { JimengService } from '../jimeng/jimeng.service';
import { ShortVideoTaskLinkerService } from '../short-video/short-video-task-linker.service';
import { StorageService } from '../storage/storage.service';
import { isArkVideoReqKey } from './generation-capabilities';
import { GenerationTaskService } from './generation-task.service';

@Injectable()
export class GenerationPollerService {
  private readonly logger = new Logger(GenerationPollerService.name);
  private polling = false;

  constructor(
    private readonly tasks: GenerationTaskService,
    private readonly jimeng: JimengService,
    private readonly ark: ArkVideoService,
    private readonly storage: StorageService,
    private readonly assets: AssetService,
    private readonly config: ConfigService,
    private readonly shortVideoLinker: ShortVideoTaskLinkerService,
  ) {}

  @Interval(5000)
  async pollTasks() {
    const interval = Number(
      this.config.get<string>('GENERATION_POLL_INTERVAL_MS') ?? 5000,
    );
    if (interval !== 5000) {
      // Interval decorator is fixed; env kept for documentation/future refactor
    }

    if (
      this.polling ||
      (!this.jimeng.isConfigured() && !this.ark.isConfigured())
    ) {
      return;
    }

    this.polling = true;
    try {
      const active = await this.tasks.listActive();
      for (const task of active) {
        await this.pollOne(task);
      }
    } finally {
      this.polling = false;
    }
  }

  private async pollOne(
    task: Pick<
      GenerationTask,
      'id' | 'reqKey' | 'jimengTaskId' | 'userId' | 'type' | 'inputParams'
    >,
  ) {
    const { id: taskId, reqKey, jimengTaskId, userId, type, inputParams } = task;
    if (!jimengTaskId) return;

    const assetMetadata = this.buildAssetMetadata(inputParams);
    const assetSource = this.shortVideoLinker.assetSourceForTask(inputParams);

    try {
      if (isArkVideoReqKey(reqKey)) {
        await this.pollArkTask({
          taskId,
          externalTaskId: jimengTaskId,
          userId,
          assetMetadata,
          assetSource,
          inputParams,
        });
        return;
      }

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
        await this.persistVideo(userId, taskId, videoUrl, assetMetadata, assetSource, inputParams);
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
            await this.persistImageAsset({
              assetId,
              userId,
              taskId,
              persisted,
              assetMetadata,
              assetSource,
              inputParams,
              sourceUrl: url,
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
            await this.persistImageAsset({
              assetId,
              userId,
              taskId,
              persisted,
              assetMetadata,
              assetSource,
              inputParams,
              source: 'binary_data_base64',
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

  private async pollArkTask(params: {
    taskId: string;
    externalTaskId: string;
    userId: string;
    assetMetadata: Prisma.JsonObject;
    assetSource: AssetSource;
    inputParams: Prisma.JsonValue;
  }) {
    const { taskId, externalTaskId, userId, assetMetadata, assetSource, inputParams } =
      params;
    const result = await this.ark.getTask(externalTaskId);

    if (result.status === 'queued' || result.status === 'running') {
      await this.tasks.markProcessing(taskId);
      return;
    }

    if (result.status !== 'succeeded') {
      const message =
        result.error?.message ?? result.status ?? 'Ark task failed';
      await this.tasks.markFailed(taskId, message);
      return;
    }

    const videoUrl = result.content?.video_url;
    if (!videoUrl) {
      await this.tasks.markFailed(taskId, 'Missing video_url');
      return;
    }

    await this.persistVideo(
      userId,
      taskId,
      videoUrl,
      assetMetadata,
      assetSource,
      inputParams,
    );
    await this.tasks.markDone(taskId);
  }

  private async persistVideo(
    userId: string,
    taskId: string,
    videoUrl: string,
    assetMetadata: Prisma.JsonObject,
    assetSource: import('@prisma/client').AssetSource,
    inputParams: Prisma.JsonValue,
  ) {
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
      source: assetSource,
      ossKey: persisted.ossKey,
      mimeType: persisted.mimeType,
      metadata: { ...assetMetadata, sourceUrl: videoUrl },
    });
    await this.shortVideoLinker.onTaskCompleted(
      taskId,
      inputParams,
      assetId,
      AssetType.video,
    );
  }

  private async persistImageAsset(params: {
    assetId: string;
    userId: string;
    taskId: string;
    persisted: { ossKey: string; mimeType: string };
    assetMetadata: Prisma.JsonObject;
    assetSource: AssetSource;
    inputParams: Prisma.JsonValue;
    sourceUrl?: string;
    source?: string;
  }) {
    const {
      assetId,
      userId,
      taskId,
      persisted,
      assetMetadata,
      assetSource,
      inputParams,
      sourceUrl,
      source,
    } = params;

    await this.assets.createFromPersisted({
      id: assetId,
      userId,
      taskId,
      type: AssetType.image,
      source: assetSource,
      ossKey: persisted.ossKey,
      mimeType: persisted.mimeType,
      metadata: {
        ...assetMetadata,
        ...(sourceUrl ? { sourceUrl } : {}),
        ...(source ? { source } : {}),
      },
    });
    await this.shortVideoLinker.onTaskCompleted(
      taskId,
      inputParams,
      assetId,
      AssetType.image,
    );
  }

  private buildAssetMetadata(inputParams: Prisma.JsonValue): Prisma.JsonObject {
    const base =
      !inputParams || typeof inputParams !== 'object' || Array.isArray(inputParams)
        ? {}
        : (() => {
            const prompt = (inputParams as { prompt?: unknown }).prompt;
            return typeof prompt === 'string' && prompt.trim()
              ? { prompt: prompt.trim() }
              : {};
          })();

    return this.shortVideoLinker.buildAssetMetadata(inputParams, base);
  }
}
