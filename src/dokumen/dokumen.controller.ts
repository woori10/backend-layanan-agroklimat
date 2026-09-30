import {
    Controller,
    Post,
    Get,
    Delete,
    Param,
    ParseIntPipe,
    UseGuards,
    UseInterceptors,
    UploadedFile,
    Body,
    Request,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DokumenService } from './dokumen.service';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { RoleGuard } from '../auth/guard/role.guard';
import { Roles } from '../auth/decorators/role.decorators';

@UseGuards(JwtAuthGuard)
@Controller('tiket/:tiketId/dokumen')
export class DokumenController {
    constructor(private dokumenService: DokumenService) { }

    @Post()
    @UseInterceptors(FileInterceptor('file'))
    upload(
        @Request() req,
        @Param('tiketId', ParseIntPipe) tiketId: number,
        @UploadedFile() file: Express.Multer.File,
        @Body('tipe') tipe: string,
        @Body('bank_pengirim') bankPengirim?: string,
        @Body('nama_pengirim') namaPengirim?: string,
        @Body('tanggal_transfer') tanggalTransfer?: string,
        @Body('ntpn') ntpn?: string,
    ) {
        return this.dokumenService.uploadDokumen(
            req.user.userId,
            tiketId,
            file,
            tipe,
            bankPengirim,
            namaPengirim,
            tanggalTransfer,
            ntpn,
        );
    }

    @Get()
    findAll(@Request() req, @Param('tiketId', ParseIntPipe) tiketId: number) {
        return this.dokumenService.findAllByTiket(req.user.userId, tiketId);
    }

    @UseGuards(RoleGuard)
    @Roles('admin_petugas_layanan')
    @Post('laporan-hasil')
    @UseInterceptors(FileInterceptor('file'))
    uploadLaporanHasil(
        @Request() req,
        @Param('tiketId', ParseIntPipe) tiketId: number,
        @UploadedFile() file: Express.Multer.File,
    ) {
        return this.dokumenService.uploadLaporanHasil(req.user.userId, tiketId, file);
    }

    @UseGuards(RoleGuard)
    @Roles('admin_petugas_layanan')
    @Post('sertifikat')
    @UseInterceptors(FileInterceptor('file'))
    uploadSertifikat(
        @Request() req,
        @Param('tiketId', ParseIntPipe) tiketId: number,
        @UploadedFile() file: Express.Multer.File,
    ) {
        return this.dokumenService.uploadSertifikat(req.user.userId, tiketId, file);
    }

    @UseGuards(RoleGuard)
    @Roles('admin_petugas_layanan')
    @Post('surat-penerimaan')
    @UseInterceptors(FileInterceptor('file'))
    uploadSuratPenerimaan(
        @Request() req,
        @Param('tiketId', ParseIntPipe) tiketId: number,
        @UploadedFile() file: Express.Multer.File,
    ) {
        return this.dokumenService.uploadSuratPenerimaan(req.user.userId, tiketId, file);
    }

    @UseGuards(RoleGuard)
    @Roles('admin_petugas_layanan')
    @Post('berita-acara')
    @UseInterceptors(FileInterceptor('file'))
    uploadBeritaAcara(
        @Request() req,
        @Param('tiketId', ParseIntPipe) tiketId: number,
        @UploadedFile() file: Express.Multer.File,
    ) {
        return this.dokumenService.uploadBeritaAcara(req.user.userId, tiketId, file);
    }

    @Delete(':dokumenId')
    deleteDokumen(
        @Request() req,
        @Param('tiketId', ParseIntPipe) tiketId: number,
        @Param('dokumenId', ParseIntPipe) dokumenId: number,
    ) {
        return this.dokumenService.deleteDokumen(req.user.userId, req.user.role, tiketId, dokumenId);
    }
}