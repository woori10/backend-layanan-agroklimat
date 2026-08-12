import {
    Controller,
    Post,
    Get,
    UseInterceptors,
    UploadedFile,
    Body,
    UseGuards,
    BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PengaduanService } from './pengaduan.service';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { RoleGuard } from '../auth/guard/role.guard';
import { Roles } from '../auth/decorators/role.decorators';

@Controller('pengaduan')
export class PengaduanController {
    constructor(private readonly pengaduanService: PengaduanService) {}

    @Post()
    @UseInterceptors(FileInterceptor('file'))
    async create(
        @UploadedFile() file: Express.Multer.File,
        @Body() body: any,
    ) {
        if (!body.layanan_id) {
            throw new BadRequestException('Layanan yang dilaporkan wajib dipilih');
        }

        const parsedLayananId = parseInt(body.layanan_id, 10);
        if (isNaN(parsedLayananId)) {
            throw new BadRequestException('ID Layanan tidak valid');
        }

        // Parse numerical fields and boolean fields correctly from multipart form body
        const data = {
            nama_pelapor: body.nama_pelapor,
            no_hp: body.no_hp,
            status_pelapor: body.status_pelapor,
            layanan_id: parsedLayananId,
            tanggal_kejadian: body.tanggal_kejadian,
            waktu: body.waktu,
            detail_kejadian: body.detail_kejadian,
            dampak: body.dampak,
            harapan: body.harapan,
            bersedia_dihubungi: body.bersedia_dihubungi === 'true' || body.bersedia_dihubungi === true,
        };

        return this.pengaduanService.create(data, file);
    }

    @UseGuards(JwtAuthGuard, RoleGuard)
    @Roles('super_admin', 'admin', 'pegawai')
    @Get()
    async findAll() {
        return this.pengaduanService.findAll();
    }
}
