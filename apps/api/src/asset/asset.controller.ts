import { Controller, Get, Param, Query, Req } from '@nestjs/common';
import { AssetType } from '@prisma/client';
import type { Request } from 'express';
import { AssetService } from './asset.service';
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

  @Get(':id')
  getOne(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.assets.getForUser(req.user.id, id);
  }

  @Get(':id/download')
  getDownload(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.assets.getDownloadUrl(req.user.id, id);
  }
}
