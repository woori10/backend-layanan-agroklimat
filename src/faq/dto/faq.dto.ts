import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsNumber } from 'class-validator';

export class CreateFaqDto {
    @IsString()
    @IsNotEmpty({ message: 'Pertanyaan tidak boleh kosong' })
    pertanyaan: string;

    @IsString()
    @IsNotEmpty({ message: 'Jawaban tidak boleh kosong' })
    jawaban: string;

    @IsOptional()
    @IsNumber()
    urutan?: number;

    @IsOptional()
    @IsBoolean()
    is_active?: boolean;
}

export class UpdateFaqDto {
    @IsOptional()
    @IsString()
    pertanyaan?: string;

    @IsOptional()
    @IsString()
    jawaban?: string;

    @IsOptional()
    @IsNumber()
    urutan?: number;

    @IsOptional()
    @IsBoolean()
    is_active?: boolean;
}
