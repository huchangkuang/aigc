import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { StorageService } from './storage.service';

describe('StorageService', () => {
  it('uploads in mock mode', async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StorageService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'STORAGE_MOCK') return 'true';
              return undefined;
            }),
          },
        },
      ],
    }).compile();

    const service = module.get(StorageService);
    const result = await service.uploadBuffer(
      'assets/u1/a1.png',
      Buffer.from('x'),
      'image/png',
    );
    expect(result.ossKey).toBe('assets/u1/a1.png');
    expect(await service.getSignedUrl('assets/u1/a1.png')).toContain('mock.local');
  });

  it('throws when oss is not configured', async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StorageService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(() => undefined),
          },
        },
      ],
    }).compile();

    const service = module.get(StorageService);
    await expect(
      service.uploadBuffer('key', Buffer.from('x'), 'image/jpeg'),
    ).rejects.toThrow('对象存储未配置');
  });

  it('persistFromUrl downloads and uploads in mock mode', async () => {
    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer,
    }) as typeof fetch;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StorageService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'STORAGE_MOCK') return 'true';
              return undefined;
            }),
          },
        },
      ],
    }).compile();

    const service = module.get(StorageService);
    const result = await service.persistFromUrl(
      'u1',
      'asset1',
      'https://example.com/image.png',
      'image/png',
    );
    expect(result.ossKey).toBe('assets/u1/asset1.png');

    global.fetch = originalFetch;
  });
});
