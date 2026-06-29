import { Module } from '@nestjs/common';
import { StorageModule } from '../storage/storage.module';
import { AssetController } from './asset.controller';
import { AssetService } from './asset.service';

@Module({
  imports: [StorageModule],
  controllers: [AssetController],
  providers: [AssetService],
  exports: [AssetService],
})
export class AssetModule {}
