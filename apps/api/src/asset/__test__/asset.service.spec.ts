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
      update: jest.fn(),
      delete: jest.fn(),
    },
    generationTask: {
      findFirst: jest.fn(),
    },
  };
  const storage = {
    getSignedUrl: jest.fn(),
    deleteObject: jest.fn(),
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

  it('lists assets filtered by type and excludes soft-deleted', async () => {
    prisma.asset.findMany.mockResolvedValue([{ id: 'a1' }]);
    await service.listForUser('u1', AssetType.video);
    expect(prisma.asset.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'u1', deletedAt: null, type: AssetType.video },
      }),
    );
  });

  it('throws when asset not found', async () => {
    prisma.asset.findFirst.mockResolvedValue(null);
    await expect(service.getForUser('u1', 'missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('renames asset title in metadata', async () => {
    prisma.asset.findFirst.mockResolvedValue({
      id: 'a1',
      metadata: { prompt: 'hello' },
    });
    prisma.asset.update.mockResolvedValue({ id: 'a1' });

    await service.renameForUser('u1', 'a1', '我的标题');

    expect(prisma.asset.update).toHaveBeenCalledWith({
      where: { id: 'a1' },
      data: {
        metadata: { prompt: 'hello', title: '我的标题' },
      },
    });
  });

  it('soft deletes asset', async () => {
    prisma.asset.findFirst.mockResolvedValue({ id: 'a1' });
    prisma.asset.update.mockResolvedValue({ id: 'a1', deletedAt: new Date() });

    await service.softDeleteForUser('u1', 'a1');

    expect(prisma.asset.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'a1' },
        data: expect.objectContaining({ deletedAt: expect.any(Date) }),
      }),
    );
  });

  it('returns compose context with refreshed image urls', async () => {
    prisma.asset.findFirst.mockResolvedValue({
      id: 'a1',
      type: AssetType.video,
      taskId: 't1',
      metadata: { prompt: '小猫' },
    });
    prisma.generationTask.findFirst.mockResolvedValue({
      id: 't1',
      type: 'video_i2v_first',
      inputParams: {
        prompt: '小猫',
        image_urls: ['https://bucket.oss.com/temp/u1/ref.png?sig=1'],
        frames: 121,
      },
    });
    storage.getSignedUrl.mockResolvedValue('https://fresh/ref.png');

    await expect(service.getComposeContext('u1', 'a1')).resolves.toEqual({
      assetId: 'a1',
      assetType: AssetType.video,
      prompt: '小猫',
      imageUrls: ['https://fresh/ref.png'],
      generationType: 'video_i2v_first',
      frames: 121,
      aspectRatio: undefined,
      templateId: undefined,
      cameraStrength: undefined,
    });
  });

  it('lists trashed assets filtered by type', async () => {
    prisma.asset.findMany.mockResolvedValue([{ id: 'a1', deletedAt: new Date() }]);
    await service.listTrashForUser('u1', AssetType.image);
    expect(prisma.asset.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'u1', deletedAt: { not: null }, type: AssetType.image },
        orderBy: { deletedAt: 'desc' },
      }),
    );
  });

  it('restores trashed asset', async () => {
    prisma.asset.findFirst.mockResolvedValue({ id: 'a1', deletedAt: new Date() });
    prisma.asset.update.mockResolvedValue({ id: 'a1', deletedAt: null });

    await service.restoreForUser('u1', 'a1');

    expect(prisma.asset.update).toHaveBeenCalledWith({
      where: { id: 'a1' },
      data: { deletedAt: null },
    });
  });

  it('throws when restoring active asset', async () => {
    prisma.asset.findFirst.mockResolvedValue(null);
    await expect(service.restoreForUser('u1', 'a1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('permanently destroys trashed asset', async () => {
    prisma.asset.findFirst.mockResolvedValue({
      id: 'a1',
      ossKey: 'assets/u1/a1.png',
      deletedAt: new Date(),
    });
    storage.deleteObject.mockResolvedValue(undefined);
    prisma.asset.delete.mockResolvedValue({ id: 'a1' });

    await service.destroyForUser('u1', 'a1');

    expect(storage.deleteObject).toHaveBeenCalledWith('assets/u1/a1.png');
    expect(prisma.asset.delete).toHaveBeenCalledWith({ where: { id: 'a1' } });
  });

  it('throws when destroying active asset', async () => {
    prisma.asset.findFirst.mockResolvedValue(null);
    await expect(service.destroyForUser('u1', 'a1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
