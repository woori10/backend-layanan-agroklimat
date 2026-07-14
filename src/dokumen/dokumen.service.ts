import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryUploadService } from '../common/services/cloudinary-upload.service';

@Injectable()
export class DokumenService {
    constructor(
        private prisma: PrismaService,
        private cloudinaryUpload: CloudinaryUploadService,
    ) { }

    async uploadDokumen(
        userId: number,
        tiketId: number,
        file: Express.Multer.File,
        tipe: string,
    ) {
        if (!file) throw new BadRequestException('File tidak ditemukan');

        const allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/png'];
        if (!allowedMimeTypes.includes(file.mimetype)) {
            throw new BadRequestException('Tipe file harus PDF, JPG, atau PNG');
        }

        const tiket = await this.prisma.tiket.findUnique({ where: { id: tiketId } });
        if (!tiket) throw new NotFoundException('Tiket tidak ditemukan');
        if (tiket.user_id !== userId) throw new ForbiddenException('Bukan tiket milik Anda');

        const url = await this.cloudinaryUpload.uploadFile(file, 'agroklimat/dokumen');

        return this.prisma.dokumen.create({
            data: {
                tiket_id: tiketId,
                nama_file: file.originalname,
                tipe,
                url_storage: url,
            },
        });
    }

    async findAllByTiket(userId: number, tiketId: number) {
        const tiket = await this.prisma.tiket.findUnique({ where: { id: tiketId } });
        if (!tiket) throw new NotFoundException('Tiket tidak ditemukan');
        if (tiket.user_id !== userId) throw new ForbiddenException('Bukan tiket milik Anda');

        return this.prisma.dokumen.findMany({ where: { tiket_id: tiketId } });
    }
}