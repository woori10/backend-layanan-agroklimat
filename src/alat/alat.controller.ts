import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, ParseIntPipe } from '@nestjs/common';
import { AlatService } from './alat.service';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { RoleGuard } from '../auth/guard/role.guard';
import { Roles } from '../auth/decorators/role.decorators';
import { IsString, IsNumber, IsBoolean, IsOptional } from 'class-validator';

export class CreateAlatDto {
    @IsString()
    nama_alat: string;

    @IsNumber()
    harga_peminjaman: number;

    @IsNumber()
    @IsOptional()
    stok?: number;

    @IsBoolean()
    @IsOptional()
    is_active?: boolean;
}

export class UpdateAlatDto {
    @IsString()
    @IsOptional()
    nama_alat?: string;

    @IsNumber()
    @IsOptional()
    harga_peminjaman?: number;

    @IsNumber()
    @IsOptional()
    stok?: number;

    @IsBoolean()
    @IsOptional()
    is_active?: boolean;
}

@Controller('alat')
export class AlatController {
    constructor(private readonly alatService: AlatService) {}

    @Get()
    findAll() {
        return this.alatService.findAll();
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.alatService.findOne(id);
    }

    @UseGuards(JwtAuthGuard, RoleGuard)
    @Roles('super_admin', 'pegawai')
    @Post()
    create(@Body() dto: CreateAlatDto) {
        return this.alatService.create(dto);
    }

    @UseGuards(JwtAuthGuard, RoleGuard)
    @Roles('super_admin', 'pegawai')
    @Patch(':id')
    update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateAlatDto) {
        return this.alatService.update(id, dto);
    }

    @UseGuards(JwtAuthGuard, RoleGuard)
    @Roles('super_admin', 'pegawai')
    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.alatService.remove(id);
    }
}
