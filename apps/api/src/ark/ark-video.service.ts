import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  ArkCreateTaskBody,
  ArkCreateTaskResponse,
  ArkGetTaskResponse,
} from './ark.types';

@Injectable()
export class ArkVideoService {
  private readonly logger = new Logger(ArkVideoService.name);
  private readonly apiKey: string | undefined;
  private readonly baseUrl: string;

  constructor(private readonly config: ConfigService) {
    this.apiKey = config.get<string>('ARK_API_KEY');
    this.baseUrl =
      config.get<string>('ARK_BASE_URL') ??
      'https://ark.cn-beijing.volces.com/api/v3';

    if (this.apiKey) {
      this.logger.log('方舟 Seedance API 已启用');
    } else {
      this.logger.warn('ARK_API_KEY missing; Ark video API disabled');
    }
  }

  isConfigured() {
    return Boolean(this.apiKey);
  }

  async createTask(body: ArkCreateTaskBody): Promise<ArkCreateTaskResponse> {
    return this.request<ArkCreateTaskResponse>(
      'POST',
      '/contents/generations/tasks',
      body,
    );
  }

  async getTask(taskId: string): Promise<ArkGetTaskResponse> {
    return this.request<ArkGetTaskResponse>(
      'GET',
      `/contents/generations/tasks/${encodeURIComponent(taskId)}`,
    );
  }

  private async request<T>(
    method: 'GET' | 'POST',
    path: string,
    body?: unknown,
  ): Promise<T> {
    if (!this.apiKey) {
      throw new Error('Ark video API is not configured');
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    const text = await response.text();
    let payload: unknown = {};
    if (text) {
      try {
        payload = JSON.parse(text);
      } catch {
        throw new Error(`Ark API invalid JSON: ${text.slice(0, 200)}`);
      }
    }

    if (!response.ok) {
      const message =
        typeof payload === 'object' &&
        payload !== null &&
        'error' in payload &&
        typeof (payload as { error?: { message?: string } }).error?.message ===
          'string'
          ? (payload as { error: { message: string } }).error.message
          : `Ark API HTTP ${response.status}`;
      throw new Error(message);
    }

    return payload as T;
  }
}
