import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import {
  isGenerationType,
  listModelsForType,
} from './generation-capabilities';

@Controller('generation')
export class GenerationMetaController {
  @Get('models')
  listModels(@Query('type') type?: string) {
    if (!type || !isGenerationType(type)) {
      throw new BadRequestException('Invalid generation type');
    }
    return listModelsForType(type);
  }
}
