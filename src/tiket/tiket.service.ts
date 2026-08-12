import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTiketDto } from './dto/create-tiket.dto';
import { generateNomorTiket, hitungTanggalSla } from '../common/utils/tiket-helper';
import { validateJawabanForm } from '../common/utils/form-validator';
import { VerifikasiTiketDto, AksiVerifikasi } from './dto/verifikasi-tiket.dto';
import { SubmitUlangTiketDto } from './dto/submit-ulang-tiket.dto';
import { ProsesTiketDto } from './dto/proses-tiket.dto';

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
                status: 'menunggu_verifikasi',
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

    async findOneByUser(userId: number, identifier: string) {
        const isNumeric = !isNaN(Number(identifier));
        const tiket = await this.prisma.tiket.findUnique({
            where: isNumeric ? { id: Number(identifier) } : { no_tiket: identifier },
            include: { layanan: true, unit_teknis: true, dokumen: true, tagihan: true, auditLog: true },
        });
        if (!tiket) throw new NotFoundException('Tiket tidak ditemukan');
        if (tiket.user_id !== userId) throw new ForbiddenException('Bukan tiket milik Anda');
        return tiket;
    }

    findAllForAdmin(status?: string, layananId?: number) {
        return this.prisma.tiket.findMany({
            where: {
                ...(status && { status: status as any }),
                ...(layananId && { layanan_id: layananId }),
            },
            include: { layanan: true, user: true, unit_teknis: true, tagihan: true },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOneForAdmin(id: number) {
        const tiket = await this.prisma.tiket.findUnique({
            where: { id },
            include: { layanan: true, user: true, unit_teknis: true, dokumen: true, tagihan: true },
        });
        if (!tiket) throw new NotFoundException('Tiket tidak ditemukan');
        return tiket;
    }

    async verifikasi(adminUserId: number, tiketId: number, dto: VerifikasiTiketDto) {
        const tiket = await this.prisma.tiket.findUnique({
            where: { id: tiketId },
            include: { layanan: true },
        });
        if (!tiket) throw new NotFoundException('Tiket tidak ditemukan');
        if (tiket.status !== 'menunggu_verifikasi') {
            throw new BadRequestException('Tiket ini bukan dalam status menunggu verifikasi');
        }

        if (dto.aksi === AksiVerifikasi.REVISI) {
            const updated = await this.prisma.tiket.update({
                where: { id: tiketId },
                data: { status: 'perlu_revisi' },
            });

            await this.prisma.auditLog.create({
                data: {
                    user_id: adminUserId,
                    tiket_id: tiketId,
                    aksi: 'perlu_revisi',
                    detail_perubahan: dto.catatan,
                },
            });

            return updated;
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

        let targetStatus: any = 'diproses';
        let detailMsg = `Didisposisikan ke unit teknis: ${unitTeknis.nama}`;

        if ([17, 20, 21].includes(tiket.layanan_id)) {
            targetStatus = 'menunggu_persetujuan_kepala_balai';
            detailMsg = `Disetujui admin, menunggu persetujuan dari Kepala Balai sebelum disposisi ke unit teknis: ${unitTeknis.nama}`;
        }

        if (tiket.layanan_id === 19) {
            targetStatus = 'menunggu_pembayaran';
            const jawabanForm: any = tiket.jawaban_form || {};
            const jumlah = jawabanForm.total_estimasi ? parseInt(jawabanForm.total_estimasi, 10) : 150000;

            // Create tagihan
            await this.prisma.tagihan.create({
                data: {
                    tiket_id: tiketId,
                    jumlah: jumlah,
                    status_bayar: 'menunggu',
                },
            });
            detailMsg = `Disetujui, tagihan dibuat sebesar Rp${jumlah.toLocaleString('id-ID')}, didisposisikan ke unit teknis: ${unitTeknis.nama}`;
        }

        const updated = await this.prisma.tiket.update({
            where: { id: tiketId },
            data: { status: targetStatus, unit_teknis_id: dto.unit_teknis_id },
        });

        await this.prisma.auditLog.create({
            data: {
                user_id: adminUserId,
                tiket_id: tiketId,
                aksi: targetStatus,
                detail_perubahan: detailMsg,
            },
        });

        return updated;
    }

    async submitUlang(userId: number, tiketId: number, dto: SubmitUlangTiketDto) {
        const tiket = await this.prisma.tiket.findUnique({ where: { id: tiketId } });
        if (!tiket) throw new NotFoundException('Tiket tidak ditemukan');
        if (tiket.user_id !== userId) throw new ForbiddenException('Bukan tiket milik Anda');
        if (tiket.status !== 'perlu_revisi') {
            throw new BadRequestException('Tiket ini tidak dalam status perlu revisi');
        }

        const updated = await this.prisma.tiket.update({
            where: { id: tiketId },
            data: { status: 'menunggu_verifikasi', jawaban_form: dto.jawaban_form },
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

    async mulaiProses(userId: number, tiketId: number, dto: ProsesTiketDto) {
        const staff = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!staff) throw new NotFoundException('User tidak ditemukan');
        const tiket = await this.prisma.tiket.findUnique({
            where: { id: tiketId },
            include: { layanan: true },
        });
        if (!tiket) throw new NotFoundException('Tiket tidak ditemukan');
        if (tiket.status !== 'diproses') {
            throw new BadRequestException('Tiket tidak dalam status diproses');
        }
        if (tiket.unit_teknis_id !== staff.unit_teknis_id) {
            throw new ForbiddenException('Tiket ini bukan milik unit teknis Anda');
        }

        const biaya: any = tiket.layanan.biaya;

        if (biaya.tipe === 'gratis') {
            await this.prisma.auditLog.create({
                data: {
                    user_id: userId,
                    tiket_id: tiketId,
                    aksi: 'proses_dimulai',
                    detail_perubahan: 'Layanan gratis, langsung dikerjakan',
                },
            });
            return tiket;
        }

        let jumlah: number;
        if (biaya.tipe === 'tetap') {
            if (!biaya.nominal) {
                throw new BadRequestException('Nominal biaya belum diatur untuk layanan ini, hubungi super admin');
            }
            jumlah = biaya.nominal;
        } else if (biaya.tipe === 'per_satuan') {
            if (!dto.jumlah_satuan) {
                throw new BadRequestException('jumlah_satuan wajib diisi untuk layanan ini (misal jumlah kamar x malam)');
            }
            jumlah = biaya.nominal * dto.jumlah_satuan;
        } else {
            throw new BadRequestException('Tipe biaya layanan tidak dikenali');
        }

        const tagihan = await this.prisma.tagihan.create({
            data: { tiket_id: tiketId, jumlah, status_bayar: 'menunggu' },
        });

        const updated = await this.prisma.tiket.update({
            where: { id: tiketId },
            data: { status: 'menunggu_pembayaran' },
        });

        await this.prisma.auditLog.create({
            data: {
                user_id: userId,
                tiket_id: tiketId,
                aksi: 'menunggu_pembayaran',
                detail_perubahan: `Tagihan dibuat sebesar Rp${jumlah}`,
            },
        });

        return { tiket: updated, tagihan };
    }

    async selesaiProses(userId: number, tiketId: number) {
        const staff = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!staff) throw new NotFoundException('User tidak ditemukan');
        const tiket = await this.prisma.tiket.findUnique({ where: { id: tiketId } });
        if (!tiket) throw new NotFoundException('Tiket tidak ditemukan');
        if (tiket.unit_teknis_id !== staff.unit_teknis_id) {
            throw new ForbiddenException('Tiket ini bukan milik unit teknis Anda');
        }
        if (tiket.status !== 'diproses') {
            throw new BadRequestException('Tiket belum siap diselesaikan (pastikan status "diproses" dan sudah lunas jika berbayar)');
        }

        const updated = await this.prisma.tiket.update({
            where: { id: tiketId },
            data: { status: 'selesai_diproses' },
        });

        await this.prisma.auditLog.create({
            data: {
                user_id: userId,
                tiket_id: tiketId,
                aksi: 'selesai_diproses',
                detail_perubahan: 'Unit teknis menyelesaikan pengerjaan',
            },
        });

        return updated;
    }

    async findAllForUnitTeknis(userId: number, status?: string) {
        const staff = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { unit_teknis_id: true }
        });
        if (!staff || !staff.unit_teknis_id) {
            throw new BadRequestException('User ini tidak termasuk dalam unit teknis manapun');
        }

        return this.prisma.tiket.findMany({
            where: {
                unit_teknis_id: staff.unit_teknis_id,
                ...(status && { status: status as any }),
            },
            include: { layanan: true, user: true, unit_teknis: true, dokumen: true },
            orderBy: { createdAt: 'desc' },
        });
    }

    async konfirmasiPembayaran(userId: number, tiketId: number) {
        const ticket = await this.prisma.tiket.findUnique({
            where: { id: tiketId },
            include: { tagihan: true }
        });
        if (!ticket) throw new NotFoundException('Tiket tidak ditemukan');
        if (!ticket.tagihan) throw new BadRequestException('Tiket ini tidak memiliki tagihan');

        // Update tagihan status to lunas, and set tanggal_lunas to now
        await this.prisma.tagihan.update({
            where: { tiket_id: tiketId },
            data: {
                status_bayar: 'lunas',
                tanggal_lunas: new Date()
            }
        });

        // Update ticket status to diproses so the unit teknis can start working on it
        const updated = await this.prisma.tiket.update({
            where: { id: tiketId },
            data: { status: 'diproses' }
        });

        await this.prisma.auditLog.create({
            data: {
                user_id: userId,
                tiket_id: tiketId,
                aksi: 'diproses',
                detail_perubahan: 'Pembayaran dikonfirmasi lunas oleh Admin, status permohonan berubah menjadi diproses.',
            },
        });

        return updated;
    }

    async setujuiOlehKepalaBalai(id: number, kepalaBalaiId: number) {
        const tiket = await this.prisma.tiket.findUnique({
            where: { id },
            include: { layanan: true, unit_teknis: true },
        });
        if (!tiket) throw new NotFoundException('Tiket tidak ditemukan');
        if (tiket.status !== 'menunggu_persetujuan_kepala_balai') {
            throw new BadRequestException('Tiket ini tidak sedang menunggu persetujuan Kepala Balai');
        }

        const updated = await this.prisma.tiket.update({
            where: { id },
            data: {
                status: 'diproses',
            },
        });

        await this.prisma.auditLog.create({
            data: {
                user_id: kepalaBalaiId,
                tiket_id: tiket.id,
                aksi: 'diproses',
                detail_perubahan: `Disetujui oleh Kepala Balai, didisposisikan ke unit teknis: ${tiket.unit_teknis?.nama || 'Unit Teknis tidak ditemukan'}`,
            },
        });

        return updated;
    }

    async findAllForKepalaBalai(status?: string) {
        return this.prisma.tiket.findMany({
            where: {
                layanan_id: { in: [17, 20, 21] },
                status: status ? (status as any) : {
                    in: [
                        'menunggu_persetujuan_kepala_balai',
                        'diproses',
                        'selesai_diproses',
                        'menunggu_konfirmasi',
                        'selesai'
                    ]
                }
            },
            include: { layanan: true, user: true, unit_teknis: true, tagihan: true },
            orderBy: { createdAt: 'desc' },
        });
    }

}

