import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({ example: 'old123' })
  @IsString()
  @MinLength(6, { message: 'Mật khẩu hiện tại tối thiểu 6 ký tự' })
  current_password: string;

  @ApiProperty({ example: 'new123' })
  @IsString()
  @MinLength(6, { message: 'Mật khẩu mới tối thiểu 6 ký tự' })
  new_password: string;
}
