import { IsNumber, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class WithdrawDto {
  @ApiProperty({ example: 50000, description: 'Số tiền rút (VND)' })
  @IsNumber({}, { message: 'Số tiền phải là số' })
  @Min(50000, { message: 'Tối thiểu 50.000đ' })
  @Max(50_000_000, { message: 'Tối đa 50.000.000đ một lần' })
  amount: number;
}
