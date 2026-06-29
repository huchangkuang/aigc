import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { GenerationStatus } from '@prisma/client';
import { JimengService } from '../../jimeng/jimeng.service';
import { PrismaService } from '../../prisma/prisma.service';
import { GenerationTaskService } from '../generation-task.service';

describe('GenerationTaskService', () => {
  let service: GenerationTaskService;
  const prisma = {
    generationTask: {
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
  };
  const jimeng = {
    submitTask: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GenerationTaskService,
        { provide: PrismaService, useValue: prisma },
        { provide: JimengService, useValue: jimeng },
      ],
    }).compile();

    service = module.get(GenerationTaskService);
  });

  it('rejects recamera without template', async () => {
    await expect(
      service.create('u1', {
        type: 'video_i2v_recamera',
        prompt: 'test',
        image_urls: ['https://x.com/a.jpg'],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('creates task and submits to jimeng', async () => {
    prisma.generationTask.create.mockResolvedValue({
      id: 't1',
      userId: 'u1',
      type: 'video_t2v',
      reqKey: 'jimeng_t2v_v30',
    });
    jimeng.submitTask.mockResolvedValue({
      code: 10000,
      data: { task_id: 'jimeng-1' },
    });
    prisma.generationTask.update.mockResolvedValue({
      id: 't1',
      status: GenerationStatus.processing,
      jimengTaskId: 'jimeng-1',
    });

    await expect(
      service.create('u1', { type: 'video_t2v', prompt: 'hello' }),
    ).resolves.toMatchObject({
      jimengTaskId: 'jimeng-1',
    });
  });
});
