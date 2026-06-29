import { Module } from '@nestjs/common';
import { JimengModule } from '../jimeng/jimeng.module';
import { StorageModule } from '../storage/storage.module';
import { AssetModule } from '../asset/asset.module';
import { GenerationController } from './generation.controller';
import { GenerationPollerService } from './generation-poller.service';
import { GenerationTaskService } from './generation-task.service';

@Module({
  imports: [JimengModule, StorageModule, AssetModule],
  controllers: [GenerationController],
  providers: [GenerationTaskService, GenerationPollerService],
  exports: [GenerationTaskService],
})
export class GenerationModule {}
