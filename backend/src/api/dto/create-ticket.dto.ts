import { IsString, IsNotEmpty, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTicketDto {
  @ApiProperty({ example: 'Tasker tới muộn 30 phút' })
  @IsString()
  @IsNotEmpty()
  @MinLength(5, { message: 'Tiêu đề tối thiểu 5 ký tự' })
  @MaxLength(255)
  subject: string;

  @ApiProperty({ example: 'Tasker đặt lịch 9:00 nhưng tới 9:35...' })
  @IsString()
  @IsNotEmpty()
  @MinLength(10, { message: 'Mô tả tối thiểu 10 ký tự' })
  @MaxLength(5000)
  description: string;
}
