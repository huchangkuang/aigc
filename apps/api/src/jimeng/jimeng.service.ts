import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Service } from '@volcengine/openapi';
import type { JimengResultResponse, JimengSubmitResponse } from './jimeng.types';

@Injectable()
export class JimengService {
  private readonly logger = new Logger(JimengService.name);
  private readonly service: Service | null;

  constructor(private readonly config: ConfigService) {
    const accessKeyId = config.get<string>('VOLCENGINE_ACCESS_KEY_ID');
    const secretKey = config.get<string>('VOLCENGINE_SECRET_ACCESS_KEY');

    if (accessKeyId && secretKey) {
      this.service = new Service({
        host: 'visual.volcengineapi.com',
        serviceName: 'cv',
        region: 'cn-north-1',
        accessKeyId,
        secretKey,
      });
      this.logger.log('即梦 API 已启用');
    } else {
      this.service = null;
      this.logger.warn('Volcengine credentials missing; Jimeng API disabled');
    }
  }

  isConfigured() {
    return this.service !== null;
  }

  async submitTask(reqKey: string, body: Record<string, unknown>) {
    return this.call<JimengSubmitResponse>('CVSync2AsyncSubmitTask', reqKey, body);
  }

  async getResult(
    reqKey: string,
    taskId: string,
    options?: { returnUrl?: boolean },
  ) {
    const body: Record<string, unknown> = { req_key: reqKey, task_id: taskId };
    if (options?.returnUrl) {
      body.req_json = JSON.stringify({ return_url: true });
    }
    return this.call<JimengResultResponse>('CVSync2AsyncGetResult', reqKey, body, false);
  }

  private async call<T>(
    action: string,
    reqKey: string,
    body: Record<string, unknown>,
    includeReqKey = true,
  ): Promise<T> {
    if (!this.service) {
      throw new Error('Jimeng API is not configured');
    }

    const payload = includeReqKey ? { req_key: reqKey, ...body } : body;

    const response = await this.service.fetchOpenAPI({
      Action: action,
      Version: '2022-08-31',
      method: 'POST',
      data: payload,
      headers: { 'content-type': 'application/json; charset=utf-8' },
    });

    return response as T;
  }
}
