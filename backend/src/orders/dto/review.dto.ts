import { IsInt, IsString, Min, Max, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReviewOrderDto {
  @ApiProperty({ example: 5, minimum: 1, maximum: 5 })
  @IsInt({ message: 'Rating phải là số nguyên 1-5' })
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({ example: 'Làm việc rất sạch sẽ và đúng giờ', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'Bình luận tối đa 1000 ký tự' })
  comment?: string;
}
