import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { GenerationStatus } from '@prisma/client';
import { ArkVideoService } from '../../ark/ark-video.service';
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
  const ark = {
    isConfigured: jest.fn().mockReturnValue(true),
    createTask: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    ark.isConfigured.mockReturnValue(true);
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GenerationTaskService,
        { provide: PrismaService, useValue: prisma },
        { provide: JimengService, useValue: jimeng },
        { provide: ArkVideoService, useValue: ark },
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

  it('rejects invalid model for type', async () => {
    await expect(
      service.create('u1', {
        type: 'video_t2v',
        model: 'not-a-tier',
        prompt: 'hello',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('creates task and submits to jimeng with default model', async () => {
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

    expect(prisma.generationTask.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          reqKey: 'jimeng_t2v_v30',
          inputParams: expect.objectContaining({ model: '720' }),
        }),
      }),
    );
    expect(jimeng.submitTask).toHaveBeenCalledWith(
      'jimeng_t2v_v30',
      expect.objectContaining({ prompt: 'hello' }),
    );
    expect(jimeng.submitTask).toHaveBeenCalledWith(
      'jimeng_t2v_v30',
      expect.not.objectContaining({ model: expect.anything() }),
    );
    expect(ark.createTask).not.toHaveBeenCalled();
  });

  it('creates seedance task and submits to ark', async () => {
    prisma.generationTask.create.mockResolvedValue({
      id: 't2',
      reqKey: 'doubao-seedance-2-0-260128',
    });
    ark.createTask.mockResolvedValue({ id: 'cgt-1' });
    prisma.generationTask.update.mockResolvedValue({
      id: 't2',
      status: GenerationStatus.processing,
      jimengTaskId: 'cgt-1',
    });

    await service.create('u1', {
      type: 'video_seedance_r2v',
      model: '2.0',
      prompt: '果茶广告',
      image_urls: ['https://example.com/a.jpg'],
      video_urls: ['https://example.com/v.mp4'],
      audio_urls: ['https://example.com/a.mp3'],
      duration: 11,
      aspect_ratio: '16:9',
    });

    expect(ark.createTask).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'doubao-seedance-2-0-260128',
        duration: 11,
        ratio: '16:9',
        resolution: '720p',
        content: expect.arrayContaining([
          { type: 'text', text: '果茶广告' },
          expect.objectContaining({ role: 'reference_image' }),
          expect.objectContaining({ role: 'reference_video' }),
          expect.objectContaining({ role: 'reference_audio' }),
        ]),
      }),
    );
    expect(jimeng.submitTask).not.toHaveBeenCalled();
  });

  it.each([
    ['2.0-fast', 'doubao-seedance-2-0-fast-260128'],
    ['2.0-mini', 'doubao-seedance-2-0-mini-260615'],
  ] as const)(
    'creates seedance %s task with correct ark model',
    async (model, arkModel) => {
      prisma.generationTask.create.mockResolvedValue({ id: 't3', reqKey: arkModel });
      ark.createTask.mockResolvedValue({ id: 'cgt-2' });
      prisma.generationTask.update.mockResolvedValue({
        id: 't3',
        status: GenerationStatus.processing,
      });

      await service.create('u1', {
        type: 'video_seedance_r2v',
        model,
        prompt: '测试',
      });

      expect(ark.createTask).toHaveBeenCalledWith(
        expect.objectContaining({ model: arkModel }),
      );
    },
  );

  it('creates 1080P and pro tasks with correct reqKey', async () => {
    prisma.generationTask.create.mockResolvedValue({ id: 't1' });
    jimeng.submitTask.mockResolvedValue({
      code: 10000,
      data: { task_id: 'jimeng-1' },
    });
    prisma.generationTask.update.mockResolvedValue({
      id: 't1',
      status: GenerationStatus.processing,
    });

    await service.create('u1', {
      type: 'video_t2v',
      model: '1080',
      prompt: 'hello',
    });
    expect(jimeng.submitTask).toHaveBeenLastCalledWith(
      'jimeng_t2v_v30_1080p',
      expect.any(Object),
    );

    await service.create('u1', {
      type: 'video_t2v',
      model: 'pro',
      prompt: 'hello',
    });
    expect(jimeng.submitTask).toHaveBeenLastCalledWith(
      'jimeng_ti2v_v30_pro',
      expect.any(Object),
    );
  });

  it('passes seedance resolution to ark', async () => {
    prisma.generationTask.create.mockResolvedValue({
      id: 't4',
      reqKey: 'doubao-seedance-2-0-260128',
    });
    ark.createTask.mockResolvedValue({ id: 'cgt-4' });
    prisma.generationTask.update.mockResolvedValue({
      id: 't4',
      status: GenerationStatus.processing,
    });

    await service.create('u1', {
      type: 'video_seedance_r2v',
      model: '2.0',
      prompt: '4k test',
      resolution: '4k',
    });

    expect(ark.createTask).toHaveBeenCalledWith(
      expect.objectContaining({ resolution: '4k' }),
    );
  });

  it('rejects invalid seedance resolution for model', async () => {
    await expect(
      service.create('u1', {
        type: 'video_seedance_r2v',
        model: '2.0-fast',
        prompt: 'test',
        resolution: '1080p',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('creates seedance t2v with text-only ark payload', async () => {
    prisma.generationTask.create.mockResolvedValue({
      id: 't5',
      reqKey: 'doubao-seedance-2-0-mini-260615',
    });
    ark.createTask.mockResolvedValue({ id: 'cgt-5' });
    prisma.generationTask.update.mockResolvedValue({
      id: 't5',
      status: GenerationStatus.processing,
    });

    await service.create('u1', {
      type: 'video_seedance_t2v',
      model: '2.0-mini',
      prompt: '雏菊特写',
      duration: 5,
      resolution: '480p',
    });

    expect(ark.createTask).toHaveBeenCalledWith(
      expect.objectContaining({
        content: [{ type: 'text', text: '雏菊特写' }],
        resolution: '480p',
      }),
    );
  });

  it('creates seedance first-frame task with first_frame role', async () => {
    prisma.generationTask.create.mockResolvedValue({
      id: 't6',
      reqKey: 'doubao-seedance-2-0-260128',
    });
    ark.createTask.mockResolvedValue({ id: 'cgt-6' });
    prisma.generationTask.update.mockResolvedValue({
      id: 't6',
      status: GenerationStatus.processing,
    });

    await service.create('u1', {
      type: 'video_seedance_i2v_first',
      model: '2.0',
      prompt: '推镜头',
      image_urls: ['https://example.com/first.jpg'],
    });

    expect(ark.createTask).toHaveBeenCalledWith(
      expect.objectContaining({
        content: [
          { type: 'text', text: '推镜头' },
          {
            type: 'image_url',
            image_url: { url: 'https://example.com/first.jpg' },
            role: 'first_frame',
          },
        ],
      }),
    );
  });

  it('rejects seedance first-frame without exactly one image', async () => {
    await expect(
      service.create('u1', {
        type: 'video_seedance_i2v_first',
        model: '2.0',
        prompt: 'test',
        image_urls: [],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
