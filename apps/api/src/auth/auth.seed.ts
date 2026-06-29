import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';

export function parsePresetUsers(raw: string | undefined): Array<{ email: string; password: string }> {
  if (!raw?.trim()) {
    return [];
  }

  return raw.split(',').map((entry) => {
    const trimmed = entry.trim();
    const separator = trimmed.indexOf(':');
    if (separator <= 0) {
      throw new Error(`Invalid PRESET_USERS entry: ${trimmed}`);
    }
    return {
      email: trimmed.slice(0, separator).trim(),
      password: trimmed.slice(separator + 1).trim(),
    };
  });
}

@Injectable()
export class AuthSeedService implements OnModuleInit {
  private readonly logger = new Logger(AuthSeedService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async onModuleInit() {
    await this.seedPresetUsers();
  }

  async seedPresetUsers() {
    const presets = parsePresetUsers(this.config.get<string>('PRESET_USERS'));

    for (const preset of presets) {
      const passwordHash = await bcrypt.hash(preset.password, 10);
      await this.prisma.user.upsert({
        where: { email: preset.email },
        create: {
          email: preset.email,
          passwordHash,
        },
        update: {
          passwordHash,
        },
      });
      this.logger.log(`Preset user ready: ${preset.email}`);
    }
  }
}
