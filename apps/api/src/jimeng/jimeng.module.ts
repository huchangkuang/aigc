import { Module } from '@nestjs/common';
import { JimengService } from './jimeng.service';

@Module({
  providers: [JimengService],
  exports: [JimengService],
})
export class JimengModule {}
