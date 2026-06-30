import { IsString, MaxLength, MinLength } from 'class-validator';

export class RenameAssetDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  title!: string;
}
