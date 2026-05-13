import { IsString, IsOptional, IsEmail, MaxLength, IsIn, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiProperty({ example: 'Nguyen Van A', required: false })
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'Họ tên không được trống' })
  @MaxLength(100, { message: 'Họ tên tối đa 100 ký tự' })
  full_name?: string;

  @ApiProperty({ example: 'male', enum: ['male', 'female', 'other', ''], required: false })
  @IsOptional()
  @IsString()
  @IsIn(['male', 'female', 'other', ''], { message: 'Giới tính không hợp lệ' })
  gender?: string;

  @ApiProperty({ example: 'a@b.com', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  email?: string;

  @ApiProperty({ example: 'VH Central Park', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @ApiProperty({ example: 'Tôi có 5 năm kinh nghiệm dọn nhà', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Mô tả bản thân tối đa 500 ký tự' })
  bio?: string;
}
