import { AssetType } from '@prisma/client';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { ShortVideoTaskLinkerService } from '../short-video-task-linker.service';
import type { ParsedEntities } from '../short-video.types';

describe('ShortVideoTaskLinkerService', () => {
  let linker: ShortVideoTaskLinkerService;
  const prisma = {
    shortVideoProject: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShortVideoTaskLinkerService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    linker = module.get(ShortVideoTaskLinkerService);
  });

  it('does not update entity assetId when image task completes', async () => {
    const entities: ParsedEntities = {
      characters: [
        {
          id: 'c1',
          kind: 'character',
          name: '角色',
          description: 'desc',
          imagePrompt: 'prompt',
          assetId: 'adopted-asset',
          imageTaskId: 'task-1',
        },
      ],
      scenes: [],
      props: [],
    };

    prisma.shortVideoProject.findUnique.mockResolvedValue({
      id: 'p1',
      parsedEntities: entities,
    });

    await linker.onTaskCompleted(
      'task-1',
      { shortVideoProjectId: 'p1', shortVideoEntityId: 'c1' },
      'new-asset',
      AssetType.image,
    );

    expect(prisma.shortVideoProject.update).not.toHaveBeenCalled();
  });
});
