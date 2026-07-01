import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcryptjs';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';
import { AuthSeedService } from '../../src/auth/auth.seed';
import { GenerationPollerService } from '../../src/generation/generation-poller.service';
import { JimengService } from '../../src/jimeng/jimeng.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { setupApp } from '../../src/setup-app';

describe('Generation flow (e2e)', () => {
  let app: INestApplication<App>;
  let token: string;
  const passwordHash = bcrypt.hashSync('password', 10);

  const prismaMock = {
    user: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
    generationTask: {
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    asset: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  };

  const jimengMock = {
    isConfigured: () => true,
    submitTask: jest.fn().mockResolvedValue({
      code: 10000,
      data: { task_id: 'jimeng-1' },
    }),
    getResult: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'u1',
      email: 'admin@example.com',
      passwordHash,
    });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .overrideProvider(AuthSeedService)
      .useValue({ onModuleInit: jest.fn() })
      .overrideProvider(GenerationPollerService)
      .useValue({ pollTasks: jest.fn() })
      .overrideProvider(JimengService)
      .useValue(jimengMock)
      .compile();

    app = moduleFixture.createNestApplication();
    setupApp(app);
    await app.init();

    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@example.com', password: 'password' })
      .expect(200);

    token = login.body.data.accessToken;
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET /health is public', async () => {
    await request(app.getHttpServer()).get('/health').expect(200).expect({
      code: 0,
      message: 'success',
      data: { status: 'ok' },
    });
  });

  it('GET /generation/models returns tiers for type', async () => {
    await request(app.getHttpServer())
      .get('/generation/models?type=video_t2v')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect({
        code: 0,
        message: 'success',
        data: [
          { id: '720', label: '720P' },
          { id: '1080', label: '1080P' },
          { id: 'pro', label: 'Pro' },
        ],
      });
  });

  it('POST /generation-tasks uses default 720 reqKey', async () => {
    prismaMock.generationTask.create.mockResolvedValue({
      id: 't1',
      type: 'video_t2v',
      reqKey: 'jimeng_t2v_v30',
    });
    prismaMock.generationTask.update.mockResolvedValue({
      id: 't1',
      status: 'processing',
      jimengTaskId: 'jimeng-1',
    });

    await request(app.getHttpServer())
      .post('/generation-tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'video_t2v', prompt: 'hello' })
      .expect(200);

    expect(prismaMock.generationTask.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ reqKey: 'jimeng_t2v_v30' }),
      }),
    );
    expect(jimengMock.submitTask).toHaveBeenCalledWith(
      'jimeng_t2v_v30',
      expect.objectContaining({ prompt: 'hello' }),
    );
  });

  it('POST /generation-tasks resolves 1080 and pro reqKey', async () => {
    prismaMock.generationTask.create.mockResolvedValue({ id: 't1' });
    prismaMock.generationTask.update.mockResolvedValue({
      id: 't1',
      status: 'processing',
    });

    await request(app.getHttpServer())
      .post('/generation-tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'video_t2v', model: '1080', prompt: 'hello' })
      .expect(200);

    expect(jimengMock.submitTask).toHaveBeenLastCalledWith(
      'jimeng_t2v_v30_1080p',
      expect.any(Object),
    );

    await request(app.getHttpServer())
      .post('/generation-tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'video_t2v', model: 'pro', prompt: 'hello' })
      .expect(200);

    expect(jimengMock.submitTask).toHaveBeenLastCalledWith(
      'jimeng_ti2v_v30_pro',
      expect.any(Object),
    );
  });
});
