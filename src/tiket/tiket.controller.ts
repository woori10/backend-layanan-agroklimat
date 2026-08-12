import {
    Body, Controller, Get, Post, Patch, Param, ParseIntPipe,
    UseGuards, Request, Query,
} from '@nestjs/common';
import { TiketService } from './tiket.service';
import { CreateTiketDto } from './dto/create-tiket.dto';
import { VerifikasiTiketDto } from './dto/verifikasi-tiket.dto';
import { SubmitUlangTiketDto } from './dto/submit-ulang-tiket.dto';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { RoleGuard } from '../auth/guard/role.guard';
import { Roles } from '../auth/decorators/role.decorators';
import { ProsesTiketDto } from './dto/proses-tiket.dto';

@UseGuards(JwtAuthGuard)
@Controller('tiket')
export class TiketController {
    constructor(private tiketService: TiketService) { }

    @Post()
    create(@Request() req, @Body() dto: CreateTiketDto) {
        return this.tiketService.create(req.user.userId, dto);
    }

    @Get()
    findAll(@Request() req) {
        return this.tiketService.findAllByUser(req.user.userId);
    }

    @UseGuards(RoleGuard)
    @Roles('admin_petugas_layanan')
    @Get('unit-teknis/me')
    findAllForUnitTeknis(@Request() req, @Query('status') status?: string) {
        return this.tiketService.findAllForUnitTeknis(req.user.userId, status);
    }

    @UseGuards(RoleGuard)
    @Roles('kepala_balai')
    @Get('kepala-balai')
    findAllForKepalaBalai(@Query('status') status?: string) {
        return this.tiketService.findAllForKepalaBalai(status);
    }

    @UseGuards(RoleGuard)
    @Roles('admin_petugas_layanan')
    @Get('admin_petugas_layanan')
    findAllForAdmin(@Query('status') status?: string) {
        return this.tiketService.findAllForAdmin(status);
    }

    @UseGuards(RoleGuard)
    @Roles('admin', 'kepala_balai')
    @Get('admin')
    findAllForAdminRole(
        @Query('status') status?: string,
        @Query('layanan_id') layananId?: string,
    ) {
        return this.tiketService.findAllForAdmin(
            status,
            layananId ? parseInt(layananId, 10) : undefined,
        );
    }

    @UseGuards(RoleGuard)
    @Roles('admin_petugas_layanan', 'kepala_balai')
    @Get('admin/:id')
    findOneForAdmin(@Param('id', ParseIntPipe) id: number) {
        return this.tiketService.findOneForAdmin(id);
    }

    @Get(':id')
    findOne(@Request() req, @Param('id') id: string) {
        return this.tiketService.findOneByUser(req.user.userId, id);
    }

    @UseGuards(RoleGuard)
    @Roles('admin_petugas_layanan')
    @Patch(':id/verifikasi')
    verifikasi(
        @Request() req,
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: VerifikasiTiketDto,
    ) {
        return this.tiketService.verifikasi(req.user.userId, id, dto);
    }

    @Patch(':id/submit-ulang')
    submitUlang(
        @Request() req,
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: SubmitUlangTiketDto,
    ) {
        return this.tiketService.submitUlang(req.user.userId, id, dto);
    }

    @UseGuards(RoleGuard)
    @Roles('admin_petugas_layanan')
    @Patch(':id/proses')
    mulaiProses(
        @Request() req,
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: ProsesTiketDto,
    ) {
        return this.tiketService.mulaiProses(req.user.userId, id, dto);
    }

    @UseGuards(RoleGuard)
    @Roles('admin_petugas_layanan')
    @Patch(':id/selesai')
    selesaiProses(@Request() req, @Param('id', ParseIntPipe) id: number) {
        return this.tiketService.selesaiProses(req.user.userId, id);
    }

    @UseGuards(RoleGuard)
    @Roles('admin')
    @Patch(':id/konfirmasi-pembayaran')
    konfirmasiPembayaran(@Request() req, @Param('id', ParseIntPipe) id: number) {
        return this.tiketService.konfirmasiPembayaran(req.user.userId, id);
    }

    @Patch(':id/setujui-kepala')
    @UseGuards(RoleGuard)
    @Roles('kepala_balai')
    async setujuiKepala(@Param('id', ParseIntPipe) id: number, @Request() req) {
        return this.tiketService.setujuiOlehKepalaBalai(id, req.user.userId);
    }

}