import { IsInt, IsObject } from 'class-validator';

export class CreateTiketDto {
    @IsInt()
    layanan_id: number;

    @IsObject()
    jawaban_form: Record<string, any>;
}