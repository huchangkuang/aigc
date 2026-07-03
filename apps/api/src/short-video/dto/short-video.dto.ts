import { IsOptional, IsString, MaxLength } from 'class-validator';

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
  @IsOptional()
  @IsString()
  model?: string;
}
