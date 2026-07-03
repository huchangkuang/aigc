import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { GenerationStatus, GenerationType, Prisma } from '@prisma/client';
import { ArkVideoService } from '../ark/ark-video.service';
import { PrismaService } from '../prisma/prisma.service';
import { JimengService } from '../jimeng/jimeng.service';
import { buildArkCreateBody } from './ark-payload';
import { CreateGenerationTaskDto } from './dto/create-generation-task.dto';
import {
  isArkVideoReqKey,
  resolveModelId,
  resolveReqKey,
} from './generation-capabilities';

@Injectable()
export class GenerationTaskService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jimeng: JimengService,
    private readonly ark: ArkVideoService,
  ) {}

  async create(userId: string, dto: CreateGenerationTaskDto) {
    this.validateDto(dto);

    let reqKey: string;
    let modelId: string;
    try {
      modelId = resolveModelId(dto.type, dto.model);
      reqKey = resolveReqKey(dto.type, dto.model);
    } catch {
      throw new BadRequestException('Invalid model for generation type');
    }

    const inputParams = this.buildInputParams(dto, modelId);
    const task = await this.prisma.generationTask.create({
      data: {
        userId,
        type: dto.type,
        status: GenerationStatus.pending,
        reqKey,
        inputParams,
      },
    });

    try {
      const externalTaskId = isArkVideoReqKey(reqKey)
        ? await this.submitArkTask(reqKey, inputParams)
        : await this.submitJimengTask(reqKey, inputParams);

      return this.prisma.generationTask.update({
        where: { id: task.id },
        data: {
          jimengTaskId: externalTaskId,
          status: GenerationStatus.processing,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Submit failed';
      return this.prisma.generationTask.update({
        where: { id: task.id },
        data: {
          status: GenerationStatus.failed,
          errorMessage: message,
          completedAt: new Date(),
        },
      });
    }
  }

  listForUser(userId: string) {
    return this.prisma.generationTask.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        assets: {
          select: {
            id: true,
            type: true,
            ossKey: true,
            mimeType: true,
            metadata: true,
            createdAt: true,
          },
        },
      },
    });
  }

  listActiveForUser(userId: string) {
    return this.prisma.generationTask.findMany({
      where: {
        userId,
        status: { in: [GenerationStatus.pending, GenerationStatus.processing] },
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        status: true,
        errorMessage: true,
        type: true,
        createdAt: true,
      },
    });
  }

  async getForUser(userId: string, id: string) {
    const task = await this.prisma.generationTask.findFirst({
      where: { id, userId },
      include: { assets: true },
    });
    if (!task) {
      throw new NotFoundException('Task not found');
    }
    return task;
  }

  listActive() {
    return this.prisma.generationTask.findMany({
      where: {
        status: { in: [GenerationStatus.pending, GenerationStatus.processing] },
        jimengTaskId: { not: null },
      },
    });
  }

  async markFailed(id: string, message: string) {
    return this.prisma.generationTask.update({
      where: { id },
      data: {
        status: GenerationStatus.failed,
        errorMessage: message,
        completedAt: new Date(),
      },
    });
  }

  async markProcessing(id: string) {
    return this.prisma.generationTask.update({
      where: { id },
      data: { status: GenerationStatus.processing },
    });
  }

  async markDone(id: string) {
    return this.prisma.generationTask.update({
      where: { id },
      data: {
        status: GenerationStatus.done,
        completedAt: new Date(),
      },
    });
  }

  private async submitJimengTask(
    reqKey: string,
    inputParams: Prisma.JsonObject,
  ): Promise<string> {
    const jimengPayload = { ...inputParams };
    delete jimengPayload.model;

    const response = await this.jimeng.submitTask(reqKey, jimengPayload);
    if (response.code !== 10000 || !response.data?.task_id) {
      throw new Error(response.message ?? 'Jimeng submit failed');
    }
    return response.data.task_id;
  }

  private async submitArkTask(
    reqKey: string,
    inputParams: Prisma.JsonObject,
  ): Promise<string> {
    const body = buildArkCreateBody(reqKey, {
      prompt: String(inputParams.prompt ?? ''),
      image_urls: this.readStringArray(inputParams.image_urls),
      video_urls: this.readStringArray(inputParams.video_urls),
      audio_urls: this.readStringArray(inputParams.audio_urls),
      aspect_ratio:
        typeof inputParams.aspect_ratio === 'string'
          ? inputParams.aspect_ratio
          : undefined,
      duration:
        typeof inputParams.duration === 'number'
          ? inputParams.duration
          : undefined,
      generate_audio:
        typeof inputParams.generate_audio === 'boolean'
          ? inputParams.generate_audio
          : undefined,
      watermark:
        typeof inputParams.watermark === 'boolean'
          ? inputParams.watermark
          : undefined,
    });

    const response = await this.ark.createTask(body);
    if (!response.id) {
      throw new Error('Ark submit failed: missing task id');
    }
    return response.id;
  }

  private readStringArray(value: unknown): string[] | undefined {
    if (!Array.isArray(value)) return undefined;
    const items = value.filter((item): item is string => typeof item === 'string');
    return items.length ? items : undefined;
  }

  private validateDto(dto: CreateGenerationTaskDto) {
    if (
      dto.type === GenerationType.video_i2v_recamera &&
      (!dto.template_id || !dto.camera_strength)
    ) {
      throw new BadRequestException(
        'template_id and camera_strength are required for recamera',
      );
    }

    if (
      (dto.type === GenerationType.video_i2v_first ||
        dto.type === GenerationType.video_i2v_first_tail ||
        dto.type === GenerationType.video_i2v_recamera) &&
      !dto.image_urls?.length
    ) {
      throw new BadRequestException('image_urls are required for image-to-video');
    }

    if (
      dto.type === GenerationType.video_i2v_first_tail &&
      dto.image_urls &&
      dto.image_urls.length !== 2
    ) {
      throw new BadRequestException('first_tail requires exactly 2 images');
    }

    if (dto.type === GenerationType.video_seedance_r2v) {
      if (!this.ark.isConfigured()) {
        throw new BadRequestException('Seedance API is not configured');
      }
      if (dto.duration !== undefined && (dto.duration < 4 || dto.duration > 15)) {
        throw new BadRequestException('duration must be between 4 and 15 seconds');
      }
    }
  }

  private buildInputParams(
    dto: CreateGenerationTaskDto,
    modelId: string,
  ): Prisma.JsonObject {
    const params: Prisma.JsonObject = {
      prompt: dto.prompt,
      model: modelId,
    };

    if (dto.image_urls) params.image_urls = dto.image_urls;
    if (dto.video_urls) params.video_urls = dto.video_urls;
    if (dto.audio_urls) params.audio_urls = dto.audio_urls;
    if (dto.frames !== undefined) params.frames = dto.frames;
    if (dto.duration !== undefined) params.duration = dto.duration;
    if (dto.aspect_ratio) params.aspect_ratio = dto.aspect_ratio;
    if (dto.seed !== undefined) params.seed = dto.seed;
    if (dto.template_id) params.template_id = dto.template_id;
    if (dto.camera_strength) params.camera_strength = dto.camera_strength;
    if (dto.force_single !== undefined) params.force_single = dto.force_single;
    if (dto.width !== undefined) params.width = dto.width;
    if (dto.height !== undefined) params.height = dto.height;
    if (dto.generate_audio !== undefined) {
      params.generate_audio = dto.generate_audio;
    }
    if (dto.watermark !== undefined) params.watermark = dto.watermark;

    return params;
  }
}
