import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { AuthSeedService } from '../src/auth/auth.seed';
import { GenerationPollerService } from '../src/generation/generation-poller.service';
import { JimengService } from '../src/jimeng/jimeng.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { setupApp } from '../src/setup-app';

describe('Generation flow (e2e)', () => {
  let app: INestApplication<App>;

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

  beforeEach(async () => {
    jest.clearAllMocks();
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'u1',
      email: 'admin@example.com',
      passwordHash: '$2a$10$KIXx9YfG9mQZJm9YfG9mOu9YfG9mQZJm9YfG9mOu9YfG9mQZJm9YfG',
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
      .useValue({
        isConfigured: () => true,
        submitTask: jest.fn().mockResolvedValue({
          code: 10000,
          data: { task_id: 'jimeng-1' },
        }),
        getResult: jest.fn(),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    setupApp(app);
    await app.init();
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
});
