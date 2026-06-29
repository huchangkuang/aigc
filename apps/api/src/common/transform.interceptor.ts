import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_SUCCESS_CODE, API_SUCCESS_MESSAGE } from './api-response.types';

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const response = context.switchToHttp().getResponse<{ status: (code: number) => void }>();
    response.status(200);

    return next.handle().pipe(
      map((data) => ({
        code: API_SUCCESS_CODE,
        message: API_SUCCESS_MESSAGE,
        data: data ?? null,
      })),
    );
  }
}
