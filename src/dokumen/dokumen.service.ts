import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GoogleDriveUploadService } from '../common/services/google-drive-upload.service';

@Injectable()
export class DokumenService {
    constructor(
        private prisma: PrismaService,
        private googleDriveUpload: GoogleDriveUploadService,
    ) { }

    async uploadDokumen(
        userId: number,
        tiketId: number,
        file: Express.Multer.File,
        tipe: string,
        bankPengirim?: string,
        namaPengirim?: string,
        tanggalTransfer?: string,
        ntpn?: string,
    ) {
        if (!file) throw new BadRequestException('File tidak ditemukan');

        const allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/png'];
        if (!allowedMimeTypes.includes(file.mimetype)) {
            throw new BadRequestException('Tipe file harus PDF, JPG, atau PNG');
        }

        const tiket = await this.prisma.tiket.findUnique({ where: { id: tiketId } });
        if (!tiket) throw new NotFoundException('Tiket tidak ditemukan');
        if (tiket.user_id !== userId) throw new ForbiddenException('Bukan tiket milik Anda');

        const url = await this.googleDriveUpload.uploadFile(file);

        if (tipe === 'Bukti Pembayaran') {
            await this.prisma.tagihan.updateMany({
                where: { tiket_id: tiketId },
                data: {
                    bukti_bayar: url,
                    bank_pengirim: bankPengirim || null,
                    nama_pengirim: namaPengirim || null,
                    tanggal_transfer: tanggalTransfer ? new Date(tanggalTransfer) : null,
                    ntpn: ntpn || null,
                },
            });
        }

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

    async uploadLaporanHasil(
        staffUserId: number,
        tiketId: number,
        file: Express.Multer.File,
    ) {
        if (!file) throw new BadRequestException('File tidak ditemukan');

        const allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/png'];
        if (!allowedMimeTypes.includes(file.mimetype)) {
            throw new BadRequestException('Tipe file harus PDF, JPG, atau PNG');
        }

        const staff = await this.prisma.user.findUnique({ where: { id: staffUserId } });
        if (!staff) throw new NotFoundException('User tidak ditemukan');
        const tiket = await this.prisma.tiket.findUnique({ where: { id: tiketId } });
        if (!tiket) throw new NotFoundException('Tiket tidak ditemukan');
        if (tiket.unit_teknis_id !== staff.unit_teknis_id) {
            throw new ForbiddenException('Tiket ini bukan milik unit teknis Anda');
        }

        const url = await this.googleDriveUpload.uploadFile(file);

        return this.prisma.dokumen.create({
            data: {
                tiket_id: tiketId,
                nama_file: file.originalname,
                tipe: 'Laporan Hasil',
                url_storage: url,
            },
        });
    }

    async uploadSertifikat(
        staffUserId: number,
        tiketId: number,
        file: Express.Multer.File,
    ) {
        if (!file) throw new BadRequestException('File tidak ditemukan');

        const allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/png'];
        if (!allowedMimeTypes.includes(file.mimetype)) {
            throw new BadRequestException('Tipe file harus PDF, JPG, atau PNG');
        }

        const staff = await this.prisma.user.findUnique({ where: { id: staffUserId } });
        if (!staff) throw new NotFoundException('User tidak ditemukan');
        const tiket = await this.prisma.tiket.findUnique({ where: { id: tiketId } });
        if (!tiket) throw new NotFoundException('Tiket tidak ditemukan');
        if (tiket.unit_teknis_id !== staff.unit_teknis_id) {
            throw new ForbiddenException('Tiket ini bukan milik unit teknis Anda');
        }

        const url = await this.googleDriveUpload.uploadFile(file);

        return this.prisma.dokumen.create({
            data: {
                tiket_id: tiketId,
                nama_file: file.originalname,
                tipe: 'Sertifikat',
                url_storage: url,
            },
        });
    }

    async uploadSuratPenerimaan(
        staffUserId: number,
        tiketId: number,
        file: Express.Multer.File,
    ) {
        if (!file) throw new BadRequestException('File tidak ditemukan');

        const allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/png'];
        if (!allowedMimeTypes.includes(file.mimetype)) {
            throw new BadRequestException('Tipe file harus PDF, JPG, atau PNG');
        }

        const staff = await this.prisma.user.findUnique({ where: { id: staffUserId } });
        if (!staff) throw new NotFoundException('User tidak ditemukan');
        const tiket = await this.prisma.tiket.findUnique({ where: { id: tiketId } });
        if (!tiket) throw new NotFoundException('Tiket tidak ditemukan');
        if (tiket.unit_teknis_id !== staff.unit_teknis_id) {
            throw new ForbiddenException('Tiket ini bukan milik unit teknis Anda');
        }

        const url = await this.googleDriveUpload.uploadFile(file);

        return this.prisma.dokumen.create({
            data: {
                tiket_id: tiketId,
                nama_file: file.originalname,
                tipe: 'Surat Penerimaan',
                url_storage: url,
            },
        });
    }

    async uploadBeritaAcara(
        staffUserId: number,
        tiketId: number,
        file: Express.Multer.File,
    ) {
        if (!file) throw new BadRequestException('File tidak ditemukan');

        const allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/png'];
        if (!allowedMimeTypes.includes(file.mimetype)) {
            throw new BadRequestException('Tipe file harus PDF, JPG, atau PNG');
        }

        const staff = await this.prisma.user.findUnique({ where: { id: staffUserId } });
        if (!staff) throw new NotFoundException('User tidak ditemukan');
        const tiket = await this.prisma.tiket.findUnique({
            where: { id: tiketId },
            include: { layanan: true, unit_teknis: true },
        });
        if (!tiket) throw new NotFoundException('Tiket tidak ditemukan');
        if (tiket.unit_teknis_id !== staff.unit_teknis_id) {
            throw new ForbiddenException('Tiket ini bukan milik unit teknis Anda');
        }

        const url = await this.googleDriveUpload.uploadFile(file);

        const doc = await this.prisma.dokumen.create({
            data: {
                tiket_id: tiketId,
                nama_file: file.originalname,
                tipe: 'Berita Acara',
                url_storage: url,
            },
        });

        // Khusus peminjaman alat: saat pegawai upload berita acara, status otomatis berubah jadi "dipinjam"
        if (tiket.status === 'diproses') {
            await this.prisma.tiket.update({
                where: { id: tiketId },
                data: { status: 'dipinjam' },
            });

            await this.prisma.auditLog.create({
                data: {
                    user_id: staffUserId,
                    tiket_id: tiketId,
                    aksi: 'dipinjam',
                    detail_perubahan: 'Petugas mengunggah Berita Acara Serah Terima, status permohonan berubah menjadi dipinjam.',
                },
            });
        }

        return doc;
    }

    async deleteDokumen(
        userId: number,
        userRole: string,
        tiketId: number,
        dokumenId: number,
    ) {
        const dokumen = await this.prisma.dokumen.findUnique({
            where: { id: dokumenId },
            include: { tiket: true },
        });

        if (!dokumen || dokumen.tiket_id !== tiketId) {
            throw new NotFoundException('Dokumen tidak ditemukan');
        }

        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new NotFoundException('User tidak ditemukan');

        const isOwner = dokumen.tiket.user_id === userId;
        const isSuperAdmin = user.role === 'super_admin' || userRole === 'super_admin';
        const isAdmin = user.role === 'admin' || userRole === 'admin';
        const isPegawai = user.role === 'pegawai' || userRole === 'pegawai';
        const isSameUnit = isPegawai && (!dokumen.tiket.unit_teknis_id || dokumen.tiket.unit_teknis_id === user.unit_teknis_id);

        if (!isOwner && !isSuperAdmin && !isAdmin && !isSameUnit) {
            throw new ForbiddenException('Anda tidak memiliki akses untuk menghapus dokumen ini');
        }

        if (dokumen.tiket.status === 'selesai') {
            throw new BadRequestException('Dokumen tidak dapat dihapus karena penugasan layanan telah selesai');
        }

        if (dokumen.tipe === 'Bukti Pembayaran') {
            await this.prisma.tagihan.updateMany({
                where: { tiket_id: tiketId },
                data: { bukti_bayar: null },
            });
        }

        await this.prisma.dokumen.delete({
            where: { id: dokumenId },
        });

        return { message: 'Dokumen berhasil dihapus' };
    }
}