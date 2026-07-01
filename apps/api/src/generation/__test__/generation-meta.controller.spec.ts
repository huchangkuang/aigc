import { BadRequestException } from '@nestjs/common';
import { GenerationMetaController } from '../generation-meta.controller';

describe('GenerationMetaController', () => {
  const controller = new GenerationMetaController();

  it('lists models for video_t2v', () => {
    expect(controller.listModels('video_t2v')).toEqual([
      { id: '720', label: '720P' },
      { id: '1080', label: '1080P' },
      { id: 'pro', label: 'Pro' },
    ]);
  });

  it('rejects invalid type', () => {
    expect(() => controller.listModels('invalid')).toThrow(BadRequestException);
  });
});
