import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { IsOptional, IsEnum, IsString, IsEmail } from 'class-validator';
import { StatusAkun } from '../../generated/prisma/client';

export class UpdateUserDto extends PartialType(CreateUserDto) {
    @IsOptional()
    @IsEmail()
    email?: string;

    @IsOptional()
    @IsString()
    no_hp?: string;

    @IsOptional()
    @IsString()
    instansi?: string;

    @IsOptional()
    @IsString()
    alamat?: string;

    @IsOptional()
    @IsEnum(StatusAkun)
    status_akun?: StatusAkun;
}