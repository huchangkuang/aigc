import { Module, forwardRef } from '@nestjs/common';
import { DeepSeekModule } from '../deepseek/deepseek.module';
import { GenerationModule } from '../generation/generation.module';
import { StorageModule } from '../storage/storage.module';
import { ShortVideoController } from './short-video.controller';
import { ShortVideoProjectService } from './short-video-project.service';
import { ShortVideoTaskLinkerService } from './short-video-task-linker.service';

@Module({
  imports: [
    DeepSeekModule,
    forwardRef(() => GenerationModule),
    StorageModule,
  ],
  controllers: [ShortVideoController],
  providers: [ShortVideoProjectService, ShortVideoTaskLinkerService],
  exports: [ShortVideoTaskLinkerService],
})
export class ShortVideoModule {}
