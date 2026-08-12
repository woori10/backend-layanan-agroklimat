import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryUploadService } from '../common/services/cloudinary-upload.service';

@Injectable()
export class PengaduanService {
    constructor(
        private prisma: PrismaService,
        private cloudinaryUpload: CloudinaryUploadService,
    ) {}

    async create(
        data: {
            nama_pelapor: string;
            no_hp: string;
            status_pelapor: string;
            layanan_id: number;
            tanggal_kejadian: string;
            waktu: string;
            detail_kejadian: string;
            dampak: string;
            harapan: string;
            bersedia_dihubungi: boolean;
        },
        file?: Express.Multer.File,
    ) {
        if (!data.nama_pelapor || !data.no_hp || !data.status_pelapor || !data.layanan_id || !data.tanggal_kejadian || !data.waktu || !data.detail_kejadian || !data.dampak || !data.harapan) {
            throw new BadRequestException('Data pengaduan tidak lengkap');
        }

        // Validate that the specified service exists
        const layanan = await this.prisma.layanan.findUnique({
            where: { id: data.layanan_id },
        });
        if (!layanan) {
            throw new BadRequestException('Layanan yang dilaporkan tidak valid');
        }

        let buktiUrl: string | null = null;
        if (file) {
            const allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/png'];
            if (!allowedMimeTypes.includes(file.mimetype)) {
                throw new BadRequestException('Tipe file bukti harus PDF, JPG, atau PNG');
            }
            if (file.size > 5 * 1024 * 1024) {
                throw new BadRequestException('Ukuran file bukti maksimal 5MB');
            }
            buktiUrl = await this.cloudinaryUpload.uploadFile(file, 'agroklimat/pengaduan');
        }

        return this.prisma.pengaduan.create({
            data: {
                nama_pelapor: data.nama_pelapor,
                no_hp: data.no_hp,
                status_pelapor: data.status_pelapor,
                layanan_id: data.layanan_id,
                tanggal_kejadian: new Date(data.tanggal_kejadian),
                waktu: data.waktu,
                detail_kejadian: data.detail_kejadian,
                dampak: data.dampak,
                harapan: data.harapan,
                bersedia_dihubungi: data.bersedia_dihubungi,
                bukti_pendukung: buktiUrl,
            },
        });
    }

    async findAll() {
        return this.prisma.pengaduan.findMany({
            include: {
                layanan: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    }
}
