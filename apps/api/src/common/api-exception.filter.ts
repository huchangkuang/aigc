import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let code = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    if (exception instanceof HttpException) {
      code = exception.getStatus();
      message = this.extractMessage(exception.getResponse());
    }

    response.status(200).json({
      code,
      message,
      data: null,
    });
  }

  private extractMessage(response: string | object): string {
    if (typeof response === 'string') {
      return response;
    }

    if (typeof response === 'object' && response !== null) {
      const payload = response as { message?: string | string[] };
      if (Array.isArray(payload.message)) {
        return payload.message.join(', ');
      }
      if (typeof payload.message === 'string') {
        return payload.message;
      }
    }

    return 'Request failed';
  }
}
