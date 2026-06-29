import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthService } from '../auth.service';

describe('AuthService', () => {
  let service: AuthService;
  const prisma = {
    user: {
      findUnique: jest.fn(),
    },
  };
  const jwtService = {
    signAsync: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  it('returns null for unknown user', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(service.validateUser('a@b.com', 'x')).resolves.toBeNull();
  });

  it('returns null for wrong password', async () => {
    const hash = await bcrypt.hash('correct', 10);
    prisma.user.findUnique.mockResolvedValue({
      id: '1',
      email: 'a@b.com',
      passwordHash: hash,
    });
    await expect(service.validateUser('a@b.com', 'wrong')).resolves.toBeNull();
  });

  it('issues token on successful login', async () => {
    const hash = await bcrypt.hash('secret', 10);
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1',
      email: 'a@b.com',
      passwordHash: hash,
    });
    jwtService.signAsync.mockResolvedValue('token-abc');

    await expect(service.login('a@b.com', 'secret')).resolves.toEqual({
      accessToken: 'token-abc',
      user: { id: 'u1', email: 'a@b.com' },
    });
  });

  it('throws on failed login', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(service.login('a@b.com', 'x')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
