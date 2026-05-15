import { IsInt, IsString, IsNotEmpty, IsDateString, IsNumber, Min, Max, MinLength, MaxLength, IsOptional, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BookOrderDto {
  @ApiProperty({ example: 1 })
  @IsInt({ message: 'service_id phải là số nguyên' })
  @Min(1)
  service_id: number;

  @ApiProperty({ example: '2026-05-15T10:00:00Z' })
  @IsDateString({}, { message: 'scheduled_time phải là ISO date string' })
  scheduled_time: string;

  @ApiProperty({ example: '123 Test, Vinhomes Central Park' })
  @IsString()
  @IsNotEmpty()
  @MinLength(5, { message: 'Địa chỉ tối thiểu 5 ký tự' })
  @MaxLength(500)
  address: string;

  @ApiProperty({ example: 150000 })
  @IsNumber({}, { message: 'total_price phải là số' })
  @Min(10000, { message: 'Giá đơn tối thiểu 10.000đ' })
  @Max(100_000_000, { message: 'Giá đơn vượt giới hạn' })
  total_price: number;

  @ApiProperty({ example: 106.6297 })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @ApiProperty({ example: 10.8231 })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty({ example: 'Cho tôi mua thêm chai dầu ăn', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @ApiProperty({ example: 'WALLET', required: false, description: 'Phương thức thanh toán: CASH hoặc WALLET' })
  @IsOptional()
  @IsString()
  @IsIn(['CASH', 'WALLET'], { message: 'payment_method phải là CASH hoặc WALLET' })
  payment_method?: string;
}
