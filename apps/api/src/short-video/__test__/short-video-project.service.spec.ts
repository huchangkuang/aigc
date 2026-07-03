import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DeepSeekService } from '../../deepseek/deepseek.service';
import { GenerationTaskService } from '../../generation/generation-task.service';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../../storage/storage.service';
import { ShortVideoProjectService } from '../short-video-project.service';
import { ShortVideoTaskLinkerService } from '../short-video-task-linker.service';

describe('ShortVideoProjectService', () => {
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
    },
  };
  const deepseek = {
    isConfigured: jest.fn(),
    chatJson: jest.fn(),
  };
  const generation = {
    create: jest.fn(),
  };
  const storage = {
    getSignedUrl: jest.fn(),
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
      ],
    }).compile();

    service = module.get(ShortVideoProjectService);
  });

  it('creates project', async () => {
    prisma.shortVideoProject.create.mockResolvedValue({ id: 'p1', title: '短剧' });
    const result = await service.create('u1', '短剧');
    expect(result.id).toBe('p1');
  });

  it('throws when parse entities with empty script', async () => {
    prisma.shortVideoProject.findFirst.mockResolvedValue({
      id: 'p1',
      userId: 'u1',
      rawScript: '  ',
    });
    deepseek.isConfigured.mockReturnValue(true);

    await expect(service.parseEntities('u1', 'p1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('throws when project not found', async () => {
    prisma.shortVideoProject.findFirst.mockResolvedValue(null);
    await expect(service.getForUser('u1', 'missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
