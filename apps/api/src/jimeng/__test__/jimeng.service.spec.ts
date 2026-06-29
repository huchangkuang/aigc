import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { REQ_KEY_MAP } from '../jimeng.types';
import { JimengService } from '../jimeng.service';

describe('JimengService', () => {
  it('reports not configured without credentials', async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JimengService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue(undefined),
          },
        },
      ],
    }).compile();

    const service = module.get(JimengService);
    expect(service.isConfigured()).toBe(false);
  });

  it('submits task with JSON body via fetchOpenAPI', async () => {
    const fetchOpenAPI = jest.fn().mockResolvedValue({
      code: 10000,
      data: { task_id: 'task-1' },
    });
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JimengService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'VOLCENGINE_ACCESS_KEY_ID') return 'ak';
              if (key === 'VOLCENGINE_SECRET_ACCESS_KEY') return 'sk';
              return undefined;
            }),
          },
        },
      ],
    }).compile();

    const service = module.get(JimengService);
    (service as unknown as { service: { fetchOpenAPI: typeof fetchOpenAPI } }).service = {
      fetchOpenAPI,
    };

    await service.submitTask('jimeng_seedream46_cvtob', {
      prompt: 'test',
      force_single: true,
    });

    expect(fetchOpenAPI).toHaveBeenCalledWith({
      Action: 'CVSync2AsyncSubmitTask',
      Version: '2022-08-31',
      method: 'POST',
      data: {
        req_key: 'jimeng_seedream46_cvtob',
        prompt: 'test',
        force_single: true,
      },
      headers: { 'content-type': 'application/json; charset=utf-8' },
    });
  });

  it('maps req keys for all generation types', () => {
    expect(REQ_KEY_MAP.image).toBe('jimeng_seedream46_cvtob');
    expect(REQ_KEY_MAP.video_t2v).toBe('jimeng_t2v_v30');
    expect(REQ_KEY_MAP.video_i2v_recamera).toBe('jimeng_i2v_recamera_v30');
  });
});
