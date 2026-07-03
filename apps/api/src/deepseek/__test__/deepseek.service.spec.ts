import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { DeepSeekService } from '../deepseek.service';

describe('DeepSeekService', () => {
  it('isConfigured returns false without API key', async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeepSeekService,
        {
          provide: ConfigService,
          useValue: { get: () => undefined },
        },
      ],
    }).compile();

    const service = module.get(DeepSeekService);
    expect(service.isConfigured()).toBe(false);
  });

  it('isConfigured returns true with API key', async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeepSeekService,
        {
          provide: ConfigService,
          useValue: { get: (key: string) => (key === 'DEEPSEEK_API_KEY' ? 'sk-test' : undefined) },
        },
      ],
    }).compile();

    const service = module.get(DeepSeekService);
    expect(service.isConfigured()).toBe(true);
  });
});
