import {
  IsArray,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateShortVideoProjectDto {
  @IsString()
  @MaxLength(200)
  title!: string;
}

export class UpdateShortVideoProjectDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  rawScript?: string;
}

export class GenerateEntityImageDto {
  @IsOptional()
  @IsString()
  prompt?: string;
}

export class GenerateSegmentVideoDto {
  @IsString()
  @MaxLength(800)
  prompt!: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsString()
  resolution?: string;

  @IsOptional()
  @IsInt()
  duration?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  assetIds?: string[];
}

export class UpdateSegmentPromptDto {
  @IsString()
  @MaxLength(800)
  seedancePrompt!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  referenceAssetIds?: string[];

  @IsObject()
  seedancePromptDoc!: Record<string, unknown>;
}

export class AdoptEntityImageDto {
  @IsString()
  assetId!: string;
}

export class UploadEntityImageDto {
  @IsString()
  ossKey!: string;

  @IsString()
  mimeType!: string;
}
