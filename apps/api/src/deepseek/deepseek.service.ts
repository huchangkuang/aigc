import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

@Injectable()
export class DeepSeekService {
  private readonly logger = new Logger(DeepSeekService.name);
  private readonly apiKey: string | undefined;
  private readonly baseUrl: string;

  constructor(private readonly config: ConfigService) {
    this.apiKey = config.get<string>('DEEPSEEK_API_KEY');
    this.baseUrl =
      config.get<string>('DEEPSEEK_BASE_URL') ?? 'https://api.deepseek.com';

    if (this.apiKey) {
      this.logger.log('DeepSeek API 已启用');
    } else {
      this.logger.warn('DEEPSEEK_API_KEY missing; script parsing disabled');
    }
  }

  isConfigured() {
    return Boolean(this.apiKey);
  }

  async chatJson(messages: ChatMessage[]): Promise<unknown> {
    if (!this.apiKey) {
      throw new Error('DeepSeek API is not configured');
    }

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages,
        response_format: { type: 'json_object' },
      }),
    });

    const text = await response.text();
    let payload: unknown = {};
    if (text) {
      try {
        payload = JSON.parse(text);
      } catch {
        throw new Error(`DeepSeek invalid JSON: ${text.slice(0, 200)}`);
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
          : `DeepSeek HTTP ${response.status}`;
      throw new Error(message);
    }

    const content = (payload as { choices?: Array<{ message?: { content?: string } }> })
      .choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('DeepSeek empty response');
    }

    try {
      return JSON.parse(content);
    } catch {
      throw new Error('DeepSeek content is not valid JSON');
    }
  }
}
