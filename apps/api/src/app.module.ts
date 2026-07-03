import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { join } from 'path';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AssetModule } from './asset/asset.module';
import { AuthModule } from './auth/auth.module';
import { GenerationModule } from './generation/generation.module';
import { JimengModule } from './jimeng/jimeng.module';
import { PrismaModule } from './prisma/prisma.module';
import { ShortVideoModule } from './short-video/short-video.module';
import { StorageModule } from './storage/storage.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [join(process.cwd(), '.env'), join(__dirname, '..', '.env')],
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    JimengModule,
    StorageModule,
    AssetModule,
    GenerationModule,
    ShortVideoModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
