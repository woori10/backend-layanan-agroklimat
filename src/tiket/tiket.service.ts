import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTiketDto } from './dto/create-tiket.dto';
import { generateNomorTiket, hitungTanggalSla } from '../common/utils/tiket-helper';
import { validateJawabanForm } from '../common/utils/form-validator';
import { VerifikasiTiketDto, AksiVerifikasi } from './dto/verifikasi-tiket.dto';
import { SubmitUlangTiketDto } from './dto/submit-ulang-tiket.dto';

@Injectable()
export class TiketService {
    constructor(private prisma: PrismaService) { }

    async create(userId: number, dto: CreateTiketDto) {
        const layanan = await this.prisma.layanan.findUnique({
            where: { id: dto.layanan_id },
        });
        if (!layanan) throw new NotFoundException('Layanan tidak ditemukan');

        validateJawabanForm(layanan.form_schema, dto.jawaban_form);

        const tahunIni = new Date().getFullYear();
        const jumlahTiketTahunIni = await this.prisma.tiket.count({
            where: {
                createdAt: {
                    gte: new Date(`${tahunIni}-01-01`),
                    lt: new Date(`${tahunIni + 1}-01-01`),
                },
            },
        });

        const noTiket = generateNomorTiket(jumlahTiketTahunIni + 1);
        const tanggalSla = layanan.sla_hari
            ? hitungTanggalSla(new Date(), layanan.sla_hari)
            : null;

        const tiket = await this.prisma.tiket.create({
            data: {
                no_tiket: noTiket,
                user_id: userId,
                layanan_id: dto.layanan_id,
                status: 'menunggu_konfirmasi',
                jawaban_form: dto.jawaban_form,
                tanggal_sla: tanggalSla,
            },
            include: { layanan: true },
        });

        await this.prisma.auditLog.create({
            data: {
                user_id: userId,
                tiket_id: tiket.id,
                aksi: 'tiket_dibuat',
                detail_perubahan: `Tiket ${noTiket} diajukan untuk layanan ${layanan.nama_layanan}`,
            },
        });

        return tiket;
    }

    findAllByUser(userId: number) {
        return this.prisma.tiket.findMany({
            where: { user_id: userId },
            include: { layanan: true, unit_teknis: true },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOneByUser(userId: number, id: number) {
        const tiket = await this.prisma.tiket.findUnique({
            where: { id },
            include: { layanan: true, unit_teknis: true, dokumen: true, tagihan: true },
        });
        if (!tiket) throw new NotFoundException('Tiket tidak ditemukan');
        if (tiket.user_id !== userId) throw new ForbiddenException('Bukan tiket milik Anda');
        return tiket;
    }

    findAllForAdmin(status?: string) {
        return this.prisma.tiket.findMany({
            where: status ? { status: status as any } : undefined,
            include: { layanan: true, user: true, unit_teknis: true },
            orderBy: { createdAt: 'desc' },
        });
    }

    async verifikasi(adminUserId: number, tiketId: number, dto: VerifikasiTiketDto) {
        const tiket = await this.prisma.tiket.findUnique({ where: { id: tiketId } });
        if (!tiket) throw new NotFoundException('Tiket tidak ditemukan');
        if (tiket.status !== 'menunggu_konfirmasi') {
            throw new BadRequestException('Tiket ini bukan dalam status menunggu verifikasi');
        }

        if (dto.aksi === AksiVerifikasi.TOLAK) {
            const updated = await this.prisma.tiket.update({
                where: { id: tiketId },
                data: { status: 'ditolak' },
            });

            await this.prisma.auditLog.create({
                data: {
                    user_id: adminUserId,
                    tiket_id: tiketId,
                    aksi: 'ditolak',
                    detail_perubahan: dto.catatan,
                },
            });

            return updated;
        }

        // aksi === setujui
        const unitTeknis = await this.prisma.unitTeknis.findUnique({
            where: { id: dto.unit_teknis_id },
        });
        if (!unitTeknis) throw new NotFoundException('Unit teknis tidak ditemukan');

        const updated = await this.prisma.tiket.update({
            where: { id: tiketId },
            data: { status: 'diproses', unit_teknis_id: dto.unit_teknis_id },
        });

        await this.prisma.auditLog.create({
            data: {
                user_id: adminUserId,
                tiket_id: tiketId,
                aksi: 'diproses',
                detail_perubahan: `Didisposisikan ke unit teknis: ${unitTeknis.nama}`,
            },
        });

        return updated;
    }

    async submitUlang(userId: number, tiketId: number, dto: SubmitUlangTiketDto) {
        const tiket = await this.prisma.tiket.findUnique({ where: { id: tiketId } });
        if (!tiket) throw new NotFoundException('Tiket tidak ditemukan');
        if (tiket.user_id !== userId) throw new ForbiddenException('Bukan tiket milik Anda');
        if (tiket.status !== 'perlu_direvisi') {
            throw new BadRequestException('Tiket ini tidak dalam status perlu revisi');
        }

        const updated = await this.prisma.tiket.update({
            where: { id: tiketId },
            data: { status: 'menunggu_konfirmasi', jawaban_form: dto.jawaban_form },
        });

        await this.prisma.auditLog.create({
            data: {
                user_id: userId,
                tiket_id: tiketId,
                aksi: 'menunggu_verifikasi',
                detail_perubahan: 'Pengguna submit ulang setelah revisi',
            },
        });

        return updated;
    }
}