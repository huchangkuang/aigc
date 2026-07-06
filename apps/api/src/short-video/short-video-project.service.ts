import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AssetSource, AssetType, Prisma } from '@prisma/client';
import { AssetService } from '../asset/asset.service';
import { DeepSeekService } from '../deepseek/deepseek.service';
import { CreateGenerationTaskDto } from '../generation/dto/create-generation-task.dto';
import { GenerationTaskService } from '../generation/generation-task.service';
import { StorageService } from '../storage/storage.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  findEntity,
  findSegment,
  mergeParsedEntities,
  mergeSegments,
  updateEntityInParsed,
  updateSegmentInData,
} from './entity-merge';
import {
  buildEntityParseMessages,
  buildSegmentParseMessages,
  parseEntitiesJson,
  parseSegmentsJson,
} from './script-parser';
import { ShortVideoTaskLinkerService } from './short-video-task-linker.service';
import type { ParsedEntities, SegmentsData } from './short-video.types';

const MAX_SEGMENT_REFERENCE_IMAGES = 14;

function flattenEntities(data: ParsedEntities) {
  return [...data.characters, ...data.scenes, ...data.props];
}

@Injectable()
export class ShortVideoProjectService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly deepseek: DeepSeekService,
    private readonly generation: GenerationTaskService,
    private readonly storage: StorageService,
    private readonly linker: ShortVideoTaskLinkerService,
    private readonly assets: AssetService,
  ) {}

  listForUser(userId: string) {
    return this.prisma.shortVideoProject.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        updatedAt: true,
        createdAt: true,
        parsedEntities: true,
        segments: true,
      },
    });
  }

  async create(userId: string, title: string) {
    return this.prisma.shortVideoProject.create({
      data: {
        userId,
        title,
        rawScript: '',
      },
    });
  }

  async getForUser(userId: string, id: string) {
    const project = await this.prisma.shortVideoProject.findFirst({
      where: { id, userId },
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    return project;
  }

  async update(
    userId: string,
    id: string,
    data: { title?: string; rawScript?: string },
  ) {
    await this.getForUser(userId, id);
    return this.prisma.shortVideoProject.update({
      where: { id },
      data,
    });
  }

  async delete(userId: string, id: string) {
    await this.getForUser(userId, id);
    await this.prisma.shortVideoProject.delete({ where: { id } });
    return { id };
  }

  async parseEntities(userId: string, id: string) {
    const project = await this.getForUser(userId, id);
    if (!project.rawScript.trim()) {
      throw new BadRequestException('Script is empty');
    }
    if (!this.deepseek.isConfigured()) {
      throw new BadRequestException('LLM is not configured');
    }

    const json = await this.deepseek.chatJson(
      buildEntityParseMessages(project.rawScript),
    );
    const incoming = parseEntitiesJson(json);
    const existing = project.parsedEntities as ParsedEntities | null;
    const parsedEntities = mergeParsedEntities(existing, incoming);

    return this.prisma.shortVideoProject.update({
      where: { id },
      data: { parsedEntities: parsedEntities as unknown as Prisma.InputJsonValue },
    });
  }

  async parseSegments(userId: string, id: string) {
    const project = await this.getForUser(userId, id);
    if (!project.rawScript.trim()) {
      throw new BadRequestException('Script is empty');
    }
    if (!this.deepseek.isConfigured()) {
      throw new BadRequestException('LLM is not configured');
    }

    const entities = (project.parsedEntities as ParsedEntities | null) ?? {
      characters: [],
      scenes: [],
      props: [],
    };

    const json = await this.deepseek.chatJson(
      buildSegmentParseMessages(project.rawScript, entities),
    );
    const incoming = parseSegmentsJson(json);
    const existing = project.segments as SegmentsData | null;
    const segments = mergeSegments(existing, incoming);

    return this.prisma.shortVideoProject.update({
      where: { id },
      data: { segments: segments as unknown as Prisma.InputJsonValue },
    });
  }

  async generateEntityImage(
    userId: string,
    projectId: string,
    entityId: string,
    promptOverride?: string,
  ) {
    const project = await this.getForUser(userId, projectId);
    const entities = project.parsedEntities as ParsedEntities | null;
    const entity = findEntity(entities, entityId);
    if (!entity) {
      throw new NotFoundException('Entity not found');
    }

    const prompt = promptOverride?.trim() || entity.imagePrompt;
    if (!prompt) {
      throw new BadRequestException('Image prompt is empty');
    }

    const taskDto: CreateGenerationTaskDto = {
      type: 'image',
      prompt,
      model: 'seedream46',
      shortVideoProjectId: projectId,
      shortVideoEntityId: entityId,
    };
    const task = await this.generation.create(userId, taskDto);

    const updatedEntities = updateEntityInParsed(entities!, entityId, {
      imagePrompt: prompt,
      imageTaskId: task.id,
    });

    await this.prisma.shortVideoProject.update({
      where: { id: projectId },
      data: {
        parsedEntities: updatedEntities as unknown as Prisma.InputJsonValue,
      },
    });

    return task;
  }

  private entityAssetMatches(
    metadata: Prisma.JsonValue,
    projectId: string,
    entityId: string,
  ) {
    if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
      return false;
    }
    const record = metadata as Record<string, unknown>;
    return (
      record.shortVideoProjectId === projectId &&
      record.shortVideoEntityId === entityId
    );
  }

  async listEntityImages(userId: string, projectId: string, entityId: string) {
    const project = await this.getForUser(userId, projectId);
    const entities = project.parsedEntities as ParsedEntities | null;
    const entity = findEntity(entities, entityId);
    if (!entity) {
      throw new NotFoundException('Entity not found');
    }

    const assets = await this.prisma.asset.findMany({
      where: {
        userId,
        source: AssetSource.short_video,
        type: AssetType.image,
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    const matched = assets.filter((asset) =>
      this.entityAssetMatches(asset.metadata, projectId, entityId),
    );

    const items = await Promise.all(
      matched.map(async (asset) => ({
        id: asset.id,
        previewUrl: await this.storage.getSignedUrl(asset.ossKey),
        createdAt: asset.createdAt.toISOString(),
        adopted: asset.id === entity.assetId,
      })),
    );

    return { items };
  }

  async adoptEntityImage(
    userId: string,
    projectId: string,
    entityId: string,
    assetId: string,
  ) {
    const project = await this.getForUser(userId, projectId);
    const entities = project.parsedEntities as ParsedEntities | null;
    const entity = findEntity(entities, entityId);
    if (!entity) {
      throw new NotFoundException('Entity not found');
    }

    const asset = await this.prisma.asset.findFirst({
      where: {
        id: assetId,
        userId,
        deletedAt: null,
        source: AssetSource.short_video,
        type: AssetType.image,
      },
    });
    if (!asset || !this.entityAssetMatches(asset.metadata, projectId, entityId)) {
      throw new BadRequestException('Asset not valid for this entity');
    }

    const updated = updateEntityInParsed(entities!, entityId, { assetId });
    await this.prisma.shortVideoProject.update({
      where: { id: projectId },
      data: { parsedEntities: updated as unknown as Prisma.InputJsonValue },
    });

    return { assetId };
  }

  async uploadEntityImage(
    userId: string,
    projectId: string,
    entityId: string,
    ossKey: string,
    mimeType: string,
  ) {
    const project = await this.getForUser(userId, projectId);
    const entities = project.parsedEntities as ParsedEntities | null;
    const entity = findEntity(entities, entityId);
    if (!entity) {
      throw new NotFoundException('Entity not found');
    }

    const asset = await this.assets.createFromPersisted({
      userId,
      type: AssetType.image,
      source: AssetSource.short_video,
      ossKey,
      mimeType,
      metadata: {
        shortVideoProjectId: projectId,
        shortVideoEntityId: entityId,
        entityKind: entity.kind,
        entityName: entity.name,
        uploaded: true,
      },
    });

    return {
      id: asset.id,
      previewUrl: await this.storage.getSignedUrl(asset.ossKey),
      createdAt: asset.createdAt.toISOString(),
      adopted: asset.id === entity.assetId,
    };
  }

  async listAdoptedEntityImages(userId: string, projectId: string) {
    const project = await this.getForUser(userId, projectId);
    const entities = project.parsedEntities as ParsedEntities | null;
    if (!entities) {
      return { items: [] };
    }

    const adopted = flattenEntities(entities).filter((entity) => entity.assetId);
    if (!adopted.length) {
      return { items: [] };
    }

    const assetIds = adopted.map((entity) => entity.assetId!);
    const assets = await this.prisma.asset.findMany({
      where: { id: { in: assetIds }, userId, deletedAt: null },
    });
    const assetById = new Map(assets.map((asset) => [asset.id, asset]));

    const items = await Promise.all(
      adopted
        .filter((entity) => assetById.has(entity.assetId!))
        .map(async (entity) => {
          const asset = assetById.get(entity.assetId!)!;
          return {
            assetId: asset.id,
            entityId: entity.id,
            entityName: entity.name,
            entityKind: entity.kind,
            previewUrl: await this.storage.getSignedUrl(asset.ossKey),
          };
        }),
    );

    return { items };
  }

  private adoptedAssetIds(entities: ParsedEntities | null | undefined) {
    if (!entities) return new Set<string>();
    return new Set(
      flattenEntities(entities)
        .map((entity) => entity.assetId)
        .filter((id): id is string => Boolean(id)),
    );
  }

  private assertAdoptedAssetIds(
    entities: ParsedEntities | null | undefined,
    assetIds: string[] | undefined,
  ) {
    if (!assetIds?.length) return;
    const allowed = this.adoptedAssetIds(entities);
    for (const assetId of assetIds) {
      if (!allowed.has(assetId)) {
        throw new BadRequestException('Asset not valid for this project');
      }
    }
    if (assetIds.length > MAX_SEGMENT_REFERENCE_IMAGES) {
      throw new BadRequestException(
        `At most ${MAX_SEGMENT_REFERENCE_IMAGES} reference images allowed`,
      );
    }
  }

  async updateSegmentPrompt(
    userId: string,
    projectId: string,
    segmentId: string,
    data: {
      seedancePrompt: string;
      referenceAssetIds?: string[];
      seedancePromptDoc: Record<string, unknown>;
    },
  ) {
    const project = await this.getForUser(userId, projectId);
    const segments = project.segments as SegmentsData | null;
    const segment = findSegment(segments, segmentId);
    if (!segment) {
      throw new NotFoundException('Segment not found');
    }

    const entities = project.parsedEntities as ParsedEntities | null;
    this.assertAdoptedAssetIds(entities, data.referenceAssetIds);

    const updatedSegments = updateSegmentInData(segments!, segmentId, {
      seedancePrompt: data.seedancePrompt,
      referenceAssetIds: data.referenceAssetIds ?? [],
      seedancePromptDoc: data.seedancePromptDoc,
    });

    await this.prisma.shortVideoProject.update({
      where: { id: projectId },
      data: { segments: updatedSegments as unknown as Prisma.InputJsonValue },
    });

    return { id: segmentId };
  }

  async generateSegmentVideo(
    userId: string,
    projectId: string,
    segmentId: string,
    dto: { prompt: string; model?: string; assetIds?: string[] },
  ) {
    const project = await this.getForUser(userId, projectId);
    const segments = project.segments as SegmentsData | null;
    const segment = findSegment(segments, segmentId);
    if (!segment) {
      throw new NotFoundException('Segment not found');
    }

    const entities = project.parsedEntities as ParsedEntities | null;
    const assetIds = dto.assetIds ?? [];
    this.assertAdoptedAssetIds(entities, assetIds);

    const imageUrls: string[] = [];
    for (const assetId of assetIds) {
      const asset = await this.prisma.asset.findFirst({
        where: { id: assetId, userId, deletedAt: null },
      });
      if (asset) {
        imageUrls.push(await this.storage.getSignedUrl(asset.ossKey));
      }
    }

    const model = (dto.model ?? segment.model ?? '2.0') as SegmentsData['segments'][0]['model'];
    const taskDto: CreateGenerationTaskDto = {
      type: 'video_seedance_r2v',
      prompt: dto.prompt,
      model,
      duration: segment.durationSec,
      aspect_ratio: '16:9',
      generate_audio: true,
      watermark: false,
      image_urls: imageUrls.length ? imageUrls : undefined,
      shortVideoProjectId: projectId,
      shortVideoSegmentId: segmentId,
    };
    const task = await this.generation.create(userId, taskDto);

    const updatedSegments = updateSegmentInData(segments!, segmentId, {
      seedancePrompt: dto.prompt,
      referenceAssetIds: assetIds,
      videoTaskId: task.id,
      model,
    });

    await this.prisma.shortVideoProject.update({
      where: { id: projectId },
      data: { segments: updatedSegments as unknown as Prisma.InputJsonValue },
    });

    return task;
  }
}
