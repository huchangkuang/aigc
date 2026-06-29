import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { CreateGenerationTaskDto } from './dto/create-generation-task.dto';
import { GenerationTaskService } from './generation-task.service';

type AuthRequest = Request & { user: { id: string; email: string } };

@Controller('generation-tasks')
export class GenerationController {
  constructor(private readonly tasks: GenerationTaskService) {}

  @Post()
  create(@Req() req: AuthRequest, @Body() dto: CreateGenerationTaskDto) {
    return this.tasks.create(req.user.id, dto);
  }

  @Get()
  list(@Req() req: AuthRequest) {
    return this.tasks.listForUser(req.user.id);
  }

  @Get(':id')
  getOne(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.tasks.getForUser(req.user.id, id);
  }
}
