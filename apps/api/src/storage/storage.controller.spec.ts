import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { StorageController } from './storage.controller';
import { StorageService } from './storage.service';

describe('StorageController', () => {
  let controller: StorageController;
  const storageService = {
    uploadTemp: jest.fn(),
    getSignedUrl: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StorageController],
      providers: [{ provide: StorageService, useValue: storageService }],
    }).compile();

    controller = module.get(StorageController);
  });

  it('rejects missing file', async () => {
    await expect(
      controller.upload({ user: { id: 'u1', email: 'a@b.com' } } as never, undefined),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('uploads valid image', async () => {
    storageService.uploadTemp.mockResolvedValue({
      ossKey: 'temp/u1/x.jpg',
      mimeType: 'image/jpeg',
    });
    storageService.getSignedUrl.mockResolvedValue('https://signed');

    await expect(
      controller.upload(
        { user: { id: 'u1', email: 'a@b.com' } } as never,
        {
          buffer: Buffer.from('x'),
          mimetype: 'image/jpeg',
        } as Express.Multer.File,
      ),
    ).resolves.toEqual({
      ossKey: 'temp/u1/x.jpg',
      url: 'https://signed',
      mimeType: 'image/jpeg',
    });
  });
});
