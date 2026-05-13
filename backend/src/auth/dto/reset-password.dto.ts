import { IsString, IsNotEmpty, Matches, MinLength, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({ example: '0901234567' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[0-9+\-\s]{8,20}$/, { message: 'Số điện thoại không hợp lệ' })
  phone: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @Length(4, 8, { message: 'OTP phải từ 4-8 ký tự' })
  otp: string;

  @ApiProperty({ example: 'newpassword123' })
  @IsString()
  @MinLength(6, { message: 'Mật khẩu mới tối thiểu 6 ký tự' })
  new_password: string;
}
