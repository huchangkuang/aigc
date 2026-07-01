import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { AssetType } from '@prisma/client';
import type { Request } from 'express';
import { AssetService } from './asset.service';
import { RenameAssetDto } from './dto/rename-asset.dto';
import { StorageService } from '../storage/storage.service';

type AuthRequest = Request & { user: { id: string; email: string } };

@Controller('assets')
export class AssetController {
  constructor(
    private readonly assets: AssetService,
    private readonly storage: StorageService,
  ) {}

  @Get()
  async list(
    @Req() req: AuthRequest,
    @Query('type') type?: AssetType,
  ) {
    const items = await this.assets.listForUser(req.user.id, type);
    return Promise.all(
      items.map(async (asset) => ({
        ...asset,
        previewUrl: await this.storage.getSignedUrl(asset.ossKey),
      })),
    );
  }

  @Get('trash')
  async listTrash(
    @Req() req: AuthRequest,
    @Query('type') type?: AssetType,
  ) {
    const items = await this.assets.listTrashForUser(req.user.id, type);
    return Promise.all(
      items.map(async (asset) => ({
        ...asset,
        previewUrl: await this.storage.getSignedUrl(asset.ossKey),
      })),
    );
  }

  @Get(':id/compose-context')
  getComposeContext(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.assets.getComposeContext(req.user.id, id);
  }

  @Get(':id/download')
  getDownload(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.assets.getDownloadUrl(req.user.id, id);
  }

  @Get(':id')
  getOne(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.assets.getForUser(req.user.id, id);
  }

  @Patch(':id')
  rename(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body() dto: RenameAssetDto,
  ) {
    return this.assets.renameForUser(req.user.id, id, dto.title);
  }

  @Post(':id/restore')
  restore(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.assets.restoreForUser(req.user.id, id);
  }

  @Delete(':id/permanent')
  destroyPermanent(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.assets.destroyForUser(req.user.id, id);
  }

  @Delete(':id')
  remove(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.assets.softDeleteForUser(req.user.id, id);
  }
}
