import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AssetService } from '../../asset/asset.service';
import { DeepSeekService } from '../../deepseek/deepseek.service';
import { GenerationTaskService } from '../../generation/generation-task.service';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../../storage/storage.service';
import { ShortVideoProjectService } from '../short-video-project.service';
import { ShortVideoTaskLinkerService } from '../short-video-task-linker.service';
import type { ParsedEntities, SegmentsData } from '../short-video.types';

describe('segment prompt', () => {
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
  const generation = { create: jest.fn() };
  const storage = { getSignedUrl: jest.fn() };
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
        seedancePrompt: 'old prompt',
      },
    ],
  };

  const promptDoc = {
    type: 'doc',
    content: [{ type: 'paragraph', content: [{ type: 'text', text: 'edited' }] }],
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
  });

  it('persists seedancePrompt, referenceAssetIds, and seedancePromptDoc', async () => {
    await service.updateSegmentPrompt('u1', 'p1', 'seg1', {
      seedancePrompt: 'edited prompt',
      referenceAssetIds: ['asset-1'],
      seedancePromptDoc: promptDoc,
    });

    expect(prisma.shortVideoProject.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'p1' },
        data: expect.objectContaining({
          segments: expect.objectContaining({
            segments: [
              expect.objectContaining({
                id: 'seg1',
                seedancePrompt: 'edited prompt',
                referenceAssetIds: ['asset-1'],
                seedancePromptDoc: promptDoc,
              }),
            ],
          }),
        }),
      }),
    );
  });

  it('rejects assetId that is not an adopted entity asset', async () => {
    await expect(
      service.updateSegmentPrompt('u1', 'p1', 'seg1', {
        seedancePrompt: 'prompt',
        referenceAssetIds: ['asset-unknown'],
        seedancePromptDoc: promptDoc,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('throws when segment not found', async () => {
    await expect(
      service.updateSegmentPrompt('u1', 'p1', 'missing', {
        seedancePrompt: 'prompt',
        referenceAssetIds: [],
        seedancePromptDoc: promptDoc,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
