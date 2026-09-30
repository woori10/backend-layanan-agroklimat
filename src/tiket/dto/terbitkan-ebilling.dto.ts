import { IsNotEmpty, IsString } from 'class-validator';

export class TerbitkanEbillingDto {
    @IsNotEmpty({ message: 'Kode e-billing wajib diisi' })
    @IsString()
    kode_ebilling: string;
}
