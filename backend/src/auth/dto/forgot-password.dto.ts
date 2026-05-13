import { IsString, IsNotEmpty, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty({ example: '0901234567' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[0-9+\-\s]{8,20}$/, { message: 'Số điện thoại không hợp lệ' })
  phone: string;
}
