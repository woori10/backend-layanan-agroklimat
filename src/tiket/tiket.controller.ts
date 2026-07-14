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
    @Get('admin_petugas_layanan')
    findAllForAdmin(@Query('status') status?: string) {
        return this.tiketService.findAllForAdmin(status);
    }

    @Get(':id')
    findOne(@Request() req, @Param('id', ParseIntPipe) id: number) {
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
}