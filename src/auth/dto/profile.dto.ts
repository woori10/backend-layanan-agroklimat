import { IsString, IsOptional } from 'class-validator';

export class UpdateProfileDto {
    @IsOptional()
    @IsString()
    nama?: string;

    @IsOptional()
    @IsString()
    email?: string;

    @IsOptional()
    @IsString()
    nip?: string;

    @IsOptional()
    @IsString()
    no_hp?: string;

    @IsOptional()
    @IsString()
    instansi?: string;

    @IsOptional()
    @IsString()
    alamat?: string;
}
