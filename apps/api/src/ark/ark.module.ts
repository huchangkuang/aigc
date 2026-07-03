import { Module } from '@nestjs/common';
import { ArkVideoService } from './ark-video.service';

@Module({
  providers: [ArkVideoService],
  exports: [ArkVideoService],
})
export class ArkModule {}
