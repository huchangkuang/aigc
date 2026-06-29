import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { setupApp } from '../setup-app';

describe('AuthController', () => {
  let app: INestApplication<App>;
  const authService = {
    login: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: JwtService, useValue: { signAsync: jest.fn() } },
      ],
    }).compile();

    app = module.createNestApplication();
    setupApp(app);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('POST /auth/login returns wrapped token payload', async () => {
    authService.login.mockResolvedValue({
      accessToken: 'jwt',
      user: { id: '1', email: 'a@b.com' },
    });

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'a@b.com', password: 'secret' })
      .expect(200)
      .expect({
        code: 0,
        message: 'success',
        data: {
          accessToken: 'jwt',
          user: { id: '1', email: 'a@b.com' },
        },
      });
  });
});
