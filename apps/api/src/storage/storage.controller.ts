import {
  BadRequestException,
  Controller,
  Post,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Request } from 'express';
import { StorageService } from './storage.service';

type AuthRequest = Request & { user: { id: string; email: string } };

const MAX_SIZE = 10 * 1024 * 1024;
const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp']);

@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_SIZE },
    }),
  )
  async upload(
    @Req() req: AuthRequest,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    if (!ALLOWED.has(file.mimetype)) {
      throw new BadRequestException('仅支持 JPG、PNG、WEBP 图片');
    }

    const result = await this.storageService.uploadTemp(
      req.user.id,
      file.buffer,
      file.mimetype,
    );
    const url = await this.storageService.getSignedUrl(result.ossKey);

    return {
      ossKey: result.ossKey,
      url,
      mimeType: result.mimeType,
    };
  }
}
