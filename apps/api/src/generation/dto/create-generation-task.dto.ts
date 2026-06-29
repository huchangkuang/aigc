import {
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { GenerationType } from '@prisma/client';

export class CreateGenerationTaskDto {
  @IsIn([
    'image',
    'video_t2v',
    'video_i2v_first',
    'video_i2v_first_tail',
    'video_i2v_recamera',
  ])
  type!: GenerationType;

  @IsString()
  @MaxLength(800)
  prompt!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  image_urls?: string[];

  @IsOptional()
  @IsInt()
  frames?: number;

  @IsOptional()
  @IsString()
  aspect_ratio?: string;

  @IsOptional()
  @IsInt()
  seed?: number;

  @ValidateIf((o: CreateGenerationTaskDto) => o.type === 'video_i2v_recamera')
  @IsString()
  template_id?: string;

  @ValidateIf((o: CreateGenerationTaskDto) => o.type === 'video_i2v_recamera')
  @IsIn(['weak', 'medium', 'strong'])
  camera_strength?: string;

  @IsOptional()
  force_single?: boolean;

  @IsOptional()
  @IsInt()
  width?: number;

  @IsOptional()
  @IsInt()
  height?: number;
}
