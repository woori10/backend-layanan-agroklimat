import { IsString, IsEnum, IsOptional, IsInt, ValidateIf, IsEmail } from 'class-validator';
import { Role } from '../../generated/prisma/client';

export class CreateUserDto {
    @IsString()
    nama: string;

    @IsString()
    nip: string;

    @IsOptional()
    @IsEmail({}, { message: 'Format email tidak valid' })
    email?: string;

    @IsOptional()
    @IsString()
    no_hp?: string;

    @IsEnum(Role)
    role: Role;

    @ValidateIf((o) => o.role === 'pegawai')
    @IsInt()
    unit_teknis_id?: number;
}