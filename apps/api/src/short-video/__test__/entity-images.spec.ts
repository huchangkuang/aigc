import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AssetSource, AssetType } from '@prisma/client';
import { Test, TestingModule } from '@nestjs/testing';
import { AssetService } from '../../asset/asset.service';
import { DeepSeekService } from '../../deepseek/deepseek.service';
import { GenerationTaskService } from '../../generation/generation-task.service';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../../storage/storage.service';
import { ShortVideoProjectService } from '../short-video-project.service';
import { ShortVideoTaskLinkerService } from '../short-video-task-linker.service';
import type { ParsedEntities } from '../short-video.types';

describe('entity images', () => {
  let service: ShortVideoProjectService;
  const prisma = {
    shortVideoProject: {
      findMany: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findUnique: jest.fn(),
    },
    asset: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
  };
  const deepseek = { isConfigured: jest.fn(), chatJson: jest.fn() };
  const generation = { create: jest.fn() };
  const storage = { getSignedUrl: jest.fn().mockResolvedValue('https://signed/url') };
  const assetService = { createFromPersisted: jest.fn() };

  const entities: ParsedEntities = {
    characters: [
      {
        id: 'c1',
        kind: 'character',
        name: '角色',
        description: 'desc',
        imagePrompt: 'prompt',
        assetId: 'asset-adopted',
      },
    ],
    scenes: [],
    props: [],
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShortVideoProjectService,
        ShortVideoTaskLinkerService,
        { provide: PrismaService, useValue: prisma },
        { provide: DeepSeekService, useValue: deepseek },
        { provide: GenerationTaskService, useValue: generation },
        { provide: StorageService, useValue: storage },
        { provide: AssetService, useValue: assetService },
      ],
    }).compile();

    service = module.get(ShortVideoProjectService);
    prisma.shortVideoProject.findFirst.mockResolvedValue({
      id: 'p1',
      userId: 'u1',
      parsedEntities: entities,
    });
  });

  describe('listEntityImages', () => {
    it('returns images filtered by project and entity metadata with adopted flag', async () => {
      prisma.asset.findMany.mockResolvedValue([
        {
          id: 'asset-new',
          ossKey: 'k1',
          createdAt: new Date('2026-01-02'),
          metadata: { shortVideoProjectId: 'p1', shortVideoEntityId: 'c1' },
        },
        {
          id: 'asset-adopted',
          ossKey: 'k2',
          createdAt: new Date('2026-01-01'),
          metadata: { shortVideoProjectId: 'p1', shortVideoEntityId: 'c1' },
        },
        {
          id: 'asset-other',
          ossKey: 'k3',
          createdAt: new Date('2026-01-03'),
          metadata: { shortVideoProjectId: 'p1', shortVideoEntityId: 'c2' },
        },
      ]);

      const result = await service.listEntityImages('u1', 'p1', 'c1');

      expect(result.items).toHaveLength(2);
      expect(result.items[0].id).toBe('asset-new');
      expect(result.items[0].adopted).toBe(false);
      expect(result.items[1].id).toBe('asset-adopted');
      expect(result.items[1].adopted).toBe(true);
      expect(result.items[0].previewUrl).toBe('https://signed/url');
    });

    it('throws when entity not found', async () => {
      await expect(service.listEntityImages('u1', 'p1', 'missing')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('adoptEntityImage', () => {
    it('sets entity assetId when asset matches entity metadata', async () => {
      prisma.asset.findFirst.mockResolvedValue({
        id: 'asset-new',
        userId: 'u1',
        source: AssetSource.short_video,
        type: AssetType.image,
        metadata: { shortVideoProjectId: 'p1', shortVideoEntityId: 'c1' },
      });
      prisma.shortVideoProject.update.mockResolvedValue({});

      const result = await service.adoptEntityImage('u1', 'p1', 'c1', 'asset-new');

      expect(result.assetId).toBe('asset-new');
      expect(prisma.shortVideoProject.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'p1' },
          data: expect.objectContaining({
            parsedEntities: expect.objectContaining({
              characters: [expect.objectContaining({ assetId: 'asset-new' })],
            }),
          }),
        }),
      );
    });

    it('rejects asset that does not match entity metadata', async () => {
      prisma.asset.findFirst.mockResolvedValue({
        id: 'asset-wrong',
        userId: 'u1',
        source: AssetSource.short_video,
        type: AssetType.image,
        metadata: { shortVideoProjectId: 'p1', shortVideoEntityId: 'c2' },
      });

      await expect(
        service.adoptEntityImage('u1', 'p1', 'c1', 'asset-wrong'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('uploadEntityImage', () => {
    it('creates short_video asset without changing entity assetId', async () => {
      assetService.createFromPersisted.mockResolvedValue({
        id: 'upload-1',
        ossKey: 'temp/upload.png',
        createdAt: new Date('2026-01-04'),
        metadata: { uploaded: true },
      });

      const result = await service.uploadEntityImage(
        'u1',
        'p1',
        'c1',
        'temp/upload.png',
        'image/png',
      );

      expect(assetService.createFromPersisted).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'u1',
          type: AssetType.image,
          source: AssetSource.short_video,
          ossKey: 'temp/upload.png',
          mimeType: 'image/png',
          metadata: expect.objectContaining({
            shortVideoProjectId: 'p1',
            shortVideoEntityId: 'c1',
            uploaded: true,
          }),
        }),
      );
      expect(result.id).toBe('upload-1');
      expect(result.adopted).toBe(false);
      expect(prisma.shortVideoProject.update).not.toHaveBeenCalled();
    });
  });
});
