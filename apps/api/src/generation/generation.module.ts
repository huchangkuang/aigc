import { Module, forwardRef } from '@nestjs/common';
import { ArkModule } from '../ark/ark.module';
import { JimengModule } from '../jimeng/jimeng.module';
import { ShortVideoModule } from '../short-video/short-video.module';
import { StorageModule } from '../storage/storage.module';
import { AssetModule } from '../asset/asset.module';
import { GenerationController } from './generation.controller';
import { GenerationMetaController } from './generation-meta.controller';
import { GenerationPollerService } from './generation-poller.service';
import { GenerationTaskService } from './generation-task.service';

@Module({
  imports: [
    JimengModule,
    ArkModule,
    StorageModule,
    AssetModule,
    forwardRef(() => ShortVideoModule),
  ],
  controllers: [GenerationController, GenerationMetaController],
  providers: [GenerationTaskService, GenerationPollerService],
  exports: [GenerationTaskService],
})
export class GenerationModule {}
