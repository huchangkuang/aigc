import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { AssetType } from '@prisma/client';
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
});
