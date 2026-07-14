import { IsObject } from 'class-validator';

export class SubmitUlangTiketDto {
    @IsObject()
    jawaban_form: Record<string, any>;
}