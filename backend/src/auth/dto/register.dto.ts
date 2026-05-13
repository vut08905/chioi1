import { IsString, IsNotEmpty, Matches, MinLength, MaxLength, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: '0901234567' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[0-9+\-\s]{8,20}$/, { message: 'Số điện thoại không hợp lệ' })
  phone: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(6, { message: 'Mật khẩu tối thiểu 6 ký tự' })
  @MaxLength(100)
  password: string;

  @ApiProperty({ example: 'Nguyen Van A' })
  @IsString()
  @IsNotEmpty({ message: 'Họ tên không được trống' })
  @MaxLength(100, { message: 'Họ tên tối đa 100 ký tự' })
  full_name: string;

  @ApiProperty({ example: 'CUSTOMER', enum: ['CUSTOMER', 'TASKER', 'ADMIN'] })
  @IsString()
  @IsIn(['CUSTOMER', 'TASKER', 'ADMIN'], { message: 'Role phải là CUSTOMER, TASKER hoặc ADMIN' })
  role: 'CUSTOMER' | 'TASKER' | 'ADMIN';
}
