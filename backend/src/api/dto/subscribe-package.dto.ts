import { IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SubscribePackageDto {
  @ApiProperty({ example: 1 })
  @IsInt({ message: 'package_id phải là số nguyên' })
  @Min(1)
  package_id: number;
}
