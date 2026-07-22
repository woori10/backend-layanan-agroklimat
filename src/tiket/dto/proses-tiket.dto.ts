import { IsOptional, IsInt } from 'class-validator';

export class ProsesTiketDto {
    @IsOptional()
    @IsInt()
    jumlah_satuan?: number; // dipakai kalau biaya tipe "per_satuan", misal jumlah kamar x malam
}