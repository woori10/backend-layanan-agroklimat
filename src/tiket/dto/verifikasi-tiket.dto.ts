import { IsEnum, IsOptional, IsString, IsInt, ValidateIf } from 'class-validator';

export enum AksiVerifikasi {
    SETUJUI = 'setujui',
    TOLAK = 'ditolak',
}

export class VerifikasiTiketDto {
    @IsEnum(AksiVerifikasi)
    aksi: AksiVerifikasi;

    @ValidateIf((o) => o.aksi === AksiVerifikasi.TOLAK)
    @IsString()
    catatan?: string;

    @ValidateIf((o) => o.aksi === AksiVerifikasi.SETUJUI)
    @IsInt()
    unit_teknis_id?: number;
}