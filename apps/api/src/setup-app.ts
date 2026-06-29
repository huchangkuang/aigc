import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ApiExceptionFilter } from './common/api-exception.filter';
import { TransformInterceptor } from './common/transform.interceptor';

export function setupApp(app: INestApplication) {
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalFilters(new ApiExceptionFilter());
}
