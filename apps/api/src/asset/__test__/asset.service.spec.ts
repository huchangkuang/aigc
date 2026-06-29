import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AssetType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../../storage/storage.service';
import { AssetService } from '../asset.service';

describe('AssetService', () => {
  let service: AssetService;
  const prisma = {
    asset: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
  };
  const storage = {
    getSignedUrl: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssetService,
        { provide: PrismaService, useValue: prisma },
        { provide: StorageService, useValue: storage },
      ],
    }).compile();

    service = module.get(AssetService);
  });

  it('lists assets filtered by type', async () => {
    prisma.asset.findMany.mockResolvedValue([{ id: 'a1' }]);
    await service.listForUser('u1', AssetType.video);
    expect(prisma.asset.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'u1', type: AssetType.video },
      }),
    );
  });

  it('throws when asset not found', async () => {
    prisma.asset.findFirst.mockResolvedValue(null);
    await expect(service.getForUser('u1', 'missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
