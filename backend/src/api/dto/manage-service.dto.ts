import { IsString, IsOptional, IsNumber, IsBoolean, MaxLength, Min, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ManageServiceDto {
  @ApiProperty({ example: 'Dọn dẹp nhà', required: false })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @ApiProperty({ example: 'Dịch vụ dọn dẹp theo giờ', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiProperty({ example: 100000, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  base_price?: number;

  @ApiProperty({ example: 'https://cdn.chioi.vn/icons/clean.png', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  icon_url?: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
