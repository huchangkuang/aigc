import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AssetService } from '../../asset/asset.service';
import { DeepSeekService } from '../../deepseek/deepseek.service';
import { GenerationTaskService } from '../../generation/generation-task.service';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../../storage/storage.service';
import { ShortVideoProjectService } from '../short-video-project.service';
import { ShortVideoTaskLinkerService } from '../short-video-task-linker.service';
import type { ParsedEntities, SegmentsData } from '../short-video.types';

describe('segment generate', () => {
  let service: ShortVideoProjectService;
  const prisma = {
    shortVideoProject: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    asset: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
  };
  const deepseek = { isConfigured: jest.fn(), chatJson: jest.fn() };
  const generation = { create: jest.fn().mockResolvedValue({ id: 'task-1' }) };
  const storage = { getSignedUrl: jest.fn().mockResolvedValue('https://signed/img.png') };
  const assetService = { createFromPersisted: jest.fn() };

  const entities: ParsedEntities = {
    characters: [
      {
        id: 'c1',
        kind: 'character',
        name: '陆远',
        description: 'desc',
        imagePrompt: 'prompt',
        assetId: 'asset-1',
      },
    ],
    scenes: [],
    props: [],
  };

  const segments: SegmentsData = {
    segments: [
      {
        id: 'seg1',
        order: 0,
        durationSec: 8,
        sceneDescription: 'scene',
        characterRefIds: ['c1'],
        propRefIds: [],
        seedancePrompt: 'parsed prompt',
      },
    ],
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
      segments,
    });
    prisma.shortVideoProject.update.mockResolvedValue({});
    prisma.asset.findFirst.mockImplementation(({ where }: { where: { id: string } }) => {
      if (where.id === 'asset-1') {
        return Promise.resolve({ id: 'asset-1', ossKey: 'k1', userId: 'u1' });
      }
      return Promise.resolve(null);
    });
  });

  it('uses request prompt and assetIds instead of auto entity refs', async () => {
    await service.generateSegmentVideo('u1', 'p1', 'seg1', {
      prompt: 'user prompt',
      assetIds: ['asset-1'],
      model: '2.0-fast',
      resolution: '1080p',
      duration: 10,
    });

    expect(generation.create).toHaveBeenCalledWith(
      'u1',
      expect.objectContaining({
        type: 'video_seedance_r2v',
        prompt: 'user prompt',
        model: '2.0-fast',
        resolution: '1080p',
        duration: 10,
        image_urls: ['https://signed/img.png'],
      }),
    );
    expect(prisma.asset.findFirst).toHaveBeenCalledTimes(1);
  });

  it('creates text-only task when assetIds omitted', async () => {
    await service.generateSegmentVideo('u1', 'p1', 'seg1', {
      prompt: 'text only',
    });

    expect(generation.create).toHaveBeenCalledWith(
      'u1',
      expect.objectContaining({
        prompt: 'text only',
        image_urls: undefined,
      }),
    );
  });

  it('rejects invalid assetId', async () => {
    await expect(
      service.generateSegmentVideo('u1', 'p1', 'seg1', {
        prompt: 'prompt',
        assetIds: ['asset-unknown'],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('does not auto-collect images from characterRefIds when assetIds empty', async () => {
    await service.generateSegmentVideo('u1', 'p1', 'seg1', {
      prompt: 'no refs',
      assetIds: [],
    });

    expect(generation.create).toHaveBeenCalledWith(
      'u1',
      expect.objectContaining({ image_urls: undefined }),
    );
    expect(prisma.asset.findFirst).not.toHaveBeenCalled();
  });
});
