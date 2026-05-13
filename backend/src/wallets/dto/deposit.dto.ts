import { IsNumber, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DepositDto {
  @ApiProperty({ example: 100000, description: 'Số tiền nạp (VND)' })
  @IsNumber({}, { message: 'Số tiền phải là số' })
  @Min(10000, { message: 'Tối thiểu 10.000đ' })
  @Max(100_000_000, { message: 'Tối đa 100.000.000đ một lần' })
  amount: number;
}
