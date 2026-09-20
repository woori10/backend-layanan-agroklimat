import { IsEmail, IsString, IsInt, MinLength, IsOptional, Matches } from 'class-validator';

export class RegisterDto {
    @IsEmail()
    email: string;

    @IsString()
    @MinLength(6)
    password: string;

    @IsString()
    nama: string;

    @IsString()
    no_hp: string;

    @IsOptional()
    @IsInt()
    unit_teknis_id?: number;
}

export class LoginDto {
    @IsEmail()
    email: string;

    @IsString()
    password: string;
}

export class LoginPegawaiDto {
    @IsString()
    nip: string;

    @IsString()
    password: string;
}

export class ForgotPasswordDto {
    @IsEmail()
    email: string;
}

export class ResetPasswordDto {
    @IsString()
    token: string;

    @IsString()
    @MinLength(6)
    password: string;

    @IsString()
    @MinLength(6)
    confirmPassword: string;
}

export class VerifyCurrentPasswordDto {
    @IsString()
    password: string;
}

export class ChangePasswordDto {
    @IsString()
    @MinLength(6)
    newPassword: string;

    @IsString()
    @MinLength(6)
    confirmPassword: string;
}