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
import {
  maxBytesForKind,
  resolveUploadKind,
  uploadKindLabel,
} from './upload-policy';

type AuthRequest = Request & { user: { id: string; email: string } };

const MAX_UPLOAD_BYTES = 200 * 1024 * 1024;

@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_UPLOAD_BYTES },
    }),
  )
  async upload(
    @Req() req: AuthRequest,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const kind = resolveUploadKind(file.mimetype);
    if (!kind) {
      throw new BadRequestException(
        '仅支持 JPG/PNG/WEBP 图片、MP4/MOV 视频、MP3/WAV 音频',
      );
    }

    const maxSize = maxBytesForKind(kind);
    if (file.size > maxSize) {
      throw new BadRequestException(
        `${uploadKindLabel(kind)}大小不能超过 ${Math.round(maxSize / 1024 / 1024)}MB`,
      );
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
      kind,
    };
  }
}
