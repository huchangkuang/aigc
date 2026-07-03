import { Injectable } from '@nestjs/common';
import { AssetSource, AssetType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  findEntity,
  findSegment,
  updateEntityInParsed,
  updateSegmentInData,
} from './entity-merge';
import type {
  ParsedEntities,
  SegmentsData,
  ShortVideoTaskContext,
} from './short-video.types';

@Injectable()
export class ShortVideoTaskLinkerService {
  constructor(private readonly prisma: PrismaService) {}

  readTaskContext(inputParams: unknown): ShortVideoTaskContext | null {
    if (!inputParams || typeof inputParams !== 'object' || Array.isArray(inputParams)) {
      return null;
    }
    const record = inputParams as Record<string, unknown>;
    const projectId =
      typeof record.shortVideoProjectId === 'string'
        ? record.shortVideoProjectId
        : undefined;
    if (!projectId) return null;

    return {
      projectId,
      entityId:
        typeof record.shortVideoEntityId === 'string'
          ? record.shortVideoEntityId
          : undefined,
      segmentId:
        typeof record.shortVideoSegmentId === 'string'
          ? record.shortVideoSegmentId
          : undefined,
    };
  }

  buildAssetMetadata(
    inputParams: unknown,
    base: Prisma.JsonObject,
  ): Prisma.JsonObject {
    const ctx = this.readTaskContext(inputParams);
    if (!ctx) return base;

    return {
      ...base,
      shortVideoProjectId: ctx.projectId,
      shortVideoEntityId: ctx.entityId,
      shortVideoSegmentId: ctx.segmentId,
    };
  }

  assetSourceForTask(inputParams: unknown): AssetSource {
    return this.readTaskContext(inputParams)
      ? AssetSource.short_video
      : AssetSource.material;
  }

  async onTaskCompleted(
    taskId: string,
    inputParams: unknown,
    assetId: string,
    assetType: AssetType,
  ) {
    const ctx = this.readTaskContext(inputParams);
    if (!ctx) return;

    const project = await this.prisma.shortVideoProject.findUnique({
      where: { id: ctx.projectId },
    });
    if (!project) return;

    if (ctx.entityId && assetType === AssetType.image) {
      const entities = project.parsedEntities as ParsedEntities | null;
      if (!entities) return;
      const updated = updateEntityInParsed(entities, ctx.entityId, {
        assetId,
        imageTaskId: taskId,
      });
      await this.prisma.shortVideoProject.update({
        where: { id: ctx.projectId },
        data: { parsedEntities: updated as unknown as Prisma.InputJsonValue },
      });
      return;
    }

    if (ctx.segmentId && assetType === AssetType.video) {
      const segments = project.segments as SegmentsData | null;
      if (!segments) return;
      const updated = updateSegmentInData(segments, ctx.segmentId, {
        videoAssetId: assetId,
        videoTaskId: taskId,
      });
      await this.prisma.shortVideoProject.update({
        where: { id: ctx.projectId },
        data: { segments: updated as unknown as Prisma.InputJsonValue },
      });
    }
  }

  findEntityInProject(
    entities: ParsedEntities | null | undefined,
    entityId: string,
  ) {
    return findEntity(entities, entityId);
  }

  findSegmentInProject(
    segments: SegmentsData | null | undefined,
    segmentId: string,
  ) {
    return findSegment(segments, segmentId);
  }
}
