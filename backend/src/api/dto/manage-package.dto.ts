import { IsString, IsOptional, IsNumber, IsBoolean, IsInt, MaxLength, Min, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ManagePackageDto {
  @ApiProperty({ example: 'Gói gia đình tháng', required: false })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @ApiProperty({ example: '4 lần dọn nhà / tháng', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiProperty({ example: 1500000, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiProperty({ example: 30, required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  duration_days?: number;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
