import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { StorageService } from '../storage/storage.service';
import { CreateGenerationTaskDto } from './dto/create-generation-task.dto';
import { GenerationTaskService } from './generation-task.service';

type AuthRequest = Request & { user: { id: string; email: string } };

@Controller('generation-tasks')
export class GenerationController {
  constructor(
    private readonly tasks: GenerationTaskService,
    private readonly storage: StorageService,
  ) {}

  @Post()
  create(@Req() req: AuthRequest, @Body() dto: CreateGenerationTaskDto) {
    return this.tasks.create(req.user.id, dto);
  }

  @Get()
  async list(@Req() req: AuthRequest) {
    const items = await this.tasks.listForUser(req.user.id);
    return Promise.all(
      items.map(async (task) => ({
        ...task,
        assets: await Promise.all(
          task.assets.map(async (asset) => ({
            ...asset,
            previewUrl: await this.storage.getSignedUrl(asset.ossKey),
          })),
        ),
      })),
    );
  }

  @Get('active')
  listActive(@Req() req: AuthRequest) {
    return this.tasks.listActiveForUser(req.user.id);
  }

  @Get(':id')
  getOne(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.tasks.getForUser(req.user.id, id);
  }
}
