import { Test, TestingModule } from '@nestjs/testing';
import { AssetService } from '../../asset/asset.service';
import { DeepSeekService } from '../../deepseek/deepseek.service';
import { GenerationTaskService } from '../../generation/generation-task.service';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../../storage/storage.service';
import { ShortVideoProjectService } from '../short-video-project.service';
import { ShortVideoTaskLinkerService } from '../short-video-task-linker.service';
import type { ParsedEntities } from '../short-video.types';

describe('adopted entity images', () => {
  let service: ShortVideoProjectService;
  const prisma = {
    shortVideoProject: {
      findFirst: jest.fn(),
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
        name: '陆远',
        description: 'desc',
        imagePrompt: 'prompt',
        assetId: 'asset-1',
      },
      {
        id: 'c2',
        kind: 'character',
        name: '无图',
        description: 'desc',
        imagePrompt: 'prompt',
      },
    ],
    scenes: [
      {
        id: 's1',
        kind: 'scene',
        name: '夜景',
        description: 'desc',
        imagePrompt: 'prompt',
        assetId: 'asset-2',
      },
    ],
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
    prisma.asset.findMany.mockResolvedValue([
      { id: 'asset-1', ossKey: 'k1' },
      { id: 'asset-2', ossKey: 'k2' },
    ]);
  });

  it('returns adopted entity images with previewUrl', async () => {
    const result = await service.listAdoptedEntityImages('u1', 'p1');

    expect(result.items).toHaveLength(2);
    expect(result.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          assetId: 'asset-1',
          entityId: 'c1',
          entityName: '陆远',
          entityKind: 'character',
          previewUrl: 'https://signed/url',
        }),
        expect.objectContaining({
          assetId: 'asset-2',
          entityId: 's1',
          entityName: '夜景',
          entityKind: 'scene',
        }),
      ]),
    );
  });

  it('returns empty when no entity has adopted assetId', async () => {
    prisma.shortVideoProject.findFirst.mockResolvedValue({
      id: 'p1',
      userId: 'u1',
      parsedEntities: {
        characters: [
          {
            id: 'c1',
            kind: 'character',
            name: '陆远',
            description: 'desc',
            imagePrompt: 'prompt',
          },
        ],
        scenes: [],
        props: [],
      },
    });

    const result = await service.listAdoptedEntityImages('u1', 'p1');
    expect(result.items).toEqual([]);
  });
});
