import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { GenerationStatus, GenerationType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { JimengService } from '../jimeng/jimeng.service';
import { REQ_KEY_MAP } from '../jimeng/jimeng.types';
import { CreateGenerationTaskDto } from './dto/create-generation-task.dto';

@Injectable()
export class GenerationTaskService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jimeng: JimengService,
  ) {}

  async create(userId: string, dto: CreateGenerationTaskDto) {
    this.validateDto(dto);

    const reqKey = REQ_KEY_MAP[dto.type];
    const inputParams = this.buildInputParams(dto);

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
      const response = await this.jimeng.submitTask(reqKey, inputParams);
      if (response.code !== 10000 || !response.data?.task_id) {
        throw new Error(response.message ?? 'Jimeng submit failed');
      }

      return this.prisma.generationTask.update({
        where: { id: task.id },
        data: {
          jimengTaskId: response.data.task_id,
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
  }

  private buildInputParams(dto: CreateGenerationTaskDto): Prisma.JsonObject {
    const params: Prisma.JsonObject = {
      prompt: dto.prompt,
    };

    if (dto.image_urls) params.image_urls = dto.image_urls;
    if (dto.frames !== undefined) params.frames = dto.frames;
    if (dto.aspect_ratio) params.aspect_ratio = dto.aspect_ratio;
    if (dto.seed !== undefined) params.seed = dto.seed;
    if (dto.template_id) params.template_id = dto.template_id;
    if (dto.camera_strength) params.camera_strength = dto.camera_strength;
    if (dto.force_single !== undefined) params.force_single = dto.force_single;
    if (dto.width !== undefined) params.width = dto.width;
    if (dto.height !== undefined) params.height = dto.height;

    return params;
  }
}
