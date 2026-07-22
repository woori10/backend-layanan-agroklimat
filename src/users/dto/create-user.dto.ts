import { IsString, IsEnum, IsOptional, IsInt, ValidateIf } from 'class-validator';
import { Role } from '../../generated/prisma/client';

export class CreateUserDto {
    @IsString()
    nama: string;

    @IsString()
    nip: string;

    @IsEnum(Role)
    role: Role;

    @ValidateIf((o) => o.role === 'pegawai')
    @IsInt()
    unit_teknis_id?: number;
}