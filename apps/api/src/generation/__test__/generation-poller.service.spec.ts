import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { AssetType } from '@prisma/client';
import { ArkVideoService } from '../../ark/ark-video.service';
import { AssetService } from '../../asset/asset.service';
import { JimengService } from '../../jimeng/jimeng.service';
import { StorageService } from '../../storage/storage.service';
import { GenerationTaskService } from '../generation-task.service';
import { GenerationPollerService } from '../generation-poller.service';

describe('GenerationPollerService', () => {
  it('marks task done after persisting image urls', async () => {
    const tasks = {
      listActive: jest.fn().mockResolvedValue([
        {
          id: 't1',
          reqKey: 'jimeng_seedream46_cvtob',
          jimengTaskId: 'j1',
          userId: 'u1',
          type: 'image',
          inputParams: { prompt: 'cat' },
        },
      ]),
      markProcessing: jest.fn(),
      markDone: jest.fn(),
      markFailed: jest.fn(),
    };
    const jimeng = {
      isConfigured: jest.fn().mockReturnValue(true),
      getResult: jest.fn().mockResolvedValue({
        code: 10000,
        data: { status: 'done', image_urls: ['https://img/1.png'] },
      }),
    };
    const ark = {
      isConfigured: jest.fn().mockReturnValue(false),
      getTask: jest.fn(),
    };
    const storage = {
      persistFromUrl: jest.fn().mockResolvedValue({
        ossKey: 'assets/u1/a.png',
        mimeType: 'image/png',
      }),
    };
    const assets = {
      createFromPersisted: jest.fn().mockResolvedValue({ id: 'a1' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GenerationPollerService,
        { provide: GenerationTaskService, useValue: tasks },
        { provide: JimengService, useValue: jimeng },
        { provide: ArkVideoService, useValue: ark },
        { provide: StorageService, useValue: storage },
        { provide: AssetService, useValue: assets },
        {
          provide: ConfigService,
          useValue: { get: jest.fn() },
        },
      ],
    }).compile();

    const poller = module.get(GenerationPollerService);
    await poller.pollTasks();

    expect(jimeng.getResult).toHaveBeenCalledWith(
      'jimeng_seedream46_cvtob',
      'j1',
      { returnUrl: true },
    );
    expect(assets.createFromPersisted).toHaveBeenCalledWith(
      expect.objectContaining({ type: AssetType.image }),
    );
    expect(tasks.markDone).toHaveBeenCalledWith('t1');
  });

  it('marks seedance task done after ark video url', async () => {
    const tasks = {
      listActive: jest.fn().mockResolvedValue([
        {
          id: 't2',
          reqKey: 'doubao-seedance-2-0-260128',
          jimengTaskId: 'cgt-1',
          userId: 'u1',
          type: 'video_seedance_r2v',
          inputParams: { prompt: 'tea ad' },
        },
      ]),
      markProcessing: jest.fn(),
      markDone: jest.fn(),
      markFailed: jest.fn(),
    };
    const jimeng = {
      isConfigured: jest.fn().mockReturnValue(false),
      getResult: jest.fn(),
    };
    const ark = {
      isConfigured: jest.fn().mockReturnValue(true),
      getTask: jest.fn().mockResolvedValue({
        status: 'succeeded',
        content: { video_url: 'https://example.com/out.mp4' },
      }),
    };
    const storage = {
      persistFromUrl: jest.fn().mockResolvedValue({
        ossKey: 'assets/u1/v.mp4',
        mimeType: 'video/mp4',
      }),
    };
    const assets = {
      createFromPersisted: jest.fn().mockResolvedValue({ id: 'a1' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GenerationPollerService,
        { provide: GenerationTaskService, useValue: tasks },
        { provide: JimengService, useValue: jimeng },
        { provide: ArkVideoService, useValue: ark },
        { provide: StorageService, useValue: storage },
        { provide: AssetService, useValue: assets },
        {
          provide: ConfigService,
          useValue: { get: jest.fn() },
        },
      ],
    }).compile();

    const poller = module.get(GenerationPollerService);
    await poller.pollTasks();

    expect(ark.getTask).toHaveBeenCalledWith('cgt-1');
    expect(assets.createFromPersisted).toHaveBeenCalledWith(
      expect.objectContaining({ type: AssetType.video }),
    );
    expect(tasks.markDone).toHaveBeenCalledWith('t2');
  });
});
