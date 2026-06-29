import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { REQ_KEY_MAP } from './jimeng.types';
import { JimengService } from './jimeng.service';

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

  it('maps req keys for all generation types', () => {
    expect(REQ_KEY_MAP.image).toBe('jimeng_seedream46_cvtob');
    expect(REQ_KEY_MAP.video_t2v).toBe('jimeng_t2v_v30');
    expect(REQ_KEY_MAP.video_i2v_recamera).toBe('jimeng_i2v_recamera_v30');
  });
});
