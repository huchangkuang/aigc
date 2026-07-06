import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  CreateShortVideoProjectDto,
  AdoptEntityImageDto,
  GenerateEntityImageDto,
  GenerateSegmentVideoDto,
  UploadEntityImageDto,
  UpdateShortVideoProjectDto,
} from './dto/short-video.dto';
import { ShortVideoProjectService } from './short-video-project.service';

type AuthRequest = Request & { user: { id: string; email: string } };

@Controller('short-video/projects')
export class ShortVideoController {
  constructor(private readonly projects: ShortVideoProjectService) {}

  @Get()
  list(@Req() req: AuthRequest) {
    return this.projects.listForUser(req.user.id);
  }

  @Post()
  create(@Req() req: AuthRequest, @Body() dto: CreateShortVideoProjectDto) {
    return this.projects.create(req.user.id, dto.title);
  }

  @Get(':id')
  getOne(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.projects.getForUser(req.user.id, id);
  }

  @Patch(':id')
  update(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body() dto: UpdateShortVideoProjectDto,
  ) {
    return this.projects.update(req.user.id, id, dto);
  }

  @Delete(':id')
  remove(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.projects.delete(req.user.id, id);
  }

  @Post(':id/parse-entities')
  parseEntities(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.projects.parseEntities(req.user.id, id);
  }

  @Post(':id/parse-segments')
  parseSegments(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.projects.parseSegments(req.user.id, id);
  }

  @Post(':id/entities/:entityId/generate-image')
  generateEntityImage(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Param('entityId') entityId: string,
    @Body() dto: GenerateEntityImageDto,
  ) {
    return this.projects.generateEntityImage(
      req.user.id,
      id,
      entityId,
      dto.prompt,
    );
  }

  @Get(':id/entities/:entityId/images')
  listEntityImages(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Param('entityId') entityId: string,
  ) {
    return this.projects.listEntityImages(req.user.id, id, entityId);
  }

  @Post(':id/entities/:entityId/adopt-image')
  adoptEntityImage(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Param('entityId') entityId: string,
    @Body() dto: AdoptEntityImageDto,
  ) {
    return this.projects.adoptEntityImage(
      req.user.id,
      id,
      entityId,
      dto.assetId,
    );
  }

  @Post(':id/entities/:entityId/upload-image')
  uploadEntityImage(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Param('entityId') entityId: string,
    @Body() dto: UploadEntityImageDto,
  ) {
    return this.projects.uploadEntityImage(
      req.user.id,
      id,
      entityId,
      dto.ossKey,
      dto.mimeType,
    );
  }

  @Post(':id/segments/:segmentId/generate-video')
  generateSegmentVideo(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Param('segmentId') segmentId: string,
    @Body() dto: GenerateSegmentVideoDto,
  ) {
    return this.projects.generateSegmentVideo(
      req.user.id,
      id,
      segmentId,
      dto.model,
    );
  }
}
