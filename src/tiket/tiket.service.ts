import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTiketDto } from './dto/create-tiket.dto';
import { generateNomorTiket, hitungTanggalSla } from '../common/utils/tiket-helper';
import { validateJawabanForm } from '../common/utils/form-validator';
import { VerifikasiTiketDto, AksiVerifikasi } from './dto/verifikasi-tiket.dto';
import { SubmitUlangTiketDto } from './dto/submit-ulang-tiket.dto';
import { ProsesTiketDto } from './dto/proses-tiket.dto';
import { TerbitkanEbillingDto } from './dto/terbitkan-ebilling.dto';
import { MailService } from '../mail/mail.service';
import { NotifikasiService } from '../notifikasi/notifikasi.service';

@Injectable()
export class TiketService {
    private readonly logger = new Logger(TiketService.name);

    constructor(
        private prisma: PrismaService,
        private mailService: MailService,
        private notifikasiService: NotifikasiService,
    ) { }

    async create(userId: number, dto: CreateTiketDto, clientUrl?: string) {
        const layanan = await this.prisma.layanan.findUnique({
            where: { id: dto.layanan_id },
        });
        if (!layanan) throw new NotFoundException('Layanan tidak ditemukan');

        validateJawabanForm(layanan.form_schema, dto.jawaban_form);

        const tahunIni = new Date().getFullYear();
        let urutan = (await this.prisma.tiket.count({
            where: {
                user_id: userId,
                createdAt: {
                    gte: new Date(`${tahunIni}-01-01`),
                    lt: new Date(`${tahunIni + 1}-01-01`),
                },
            },
        })) + 1;

        let noTiket = generateNomorTiket(userId, urutan, layanan.slug || layanan.nama_layanan);
        // Pastikan nomor tiket benar-benar unik dan tidak bentrok dengan tiket yang sudah ada
        while (await this.prisma.tiket.findUnique({ where: { no_tiket: noTiket } })) {
            urutan++;
            noTiket = generateNomorTiket(userId, urutan, layanan.slug || layanan.nama_layanan);
        }

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
                detail_perubahan: `Tiket diajukan untuk layanan ${layanan.nama_layanan}`,
            },
        });

        // Simpan notifikasi dashboard untuk pemohon
        this.notifikasiService.create({
            userId,
            tiketId: tiket.id,
            judul: 'Layanan Berhasil Di Ajukan',
            pesan: `Permohonan layanan ${layanan.nama_layanan} (${tiket.no_tiket}) berhasil diajukan dan sedang menunggu verifikasi.`,
        }).catch((err) => this.logger.warn(`Gagal buat notifikasi pemohon tiket ${tiket.no_tiket}: ${err.message}`));

        // Kirim email konfirmasi ke user pemohon (fire-and-forget)
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { email: true, nama: true },
        });
        if (user?.email) {
            this.mailService
                .sendTiketSubmittedEmail(
                    user.email,
                    user.nama,
                    tiket.no_tiket,
                    layanan.nama_layanan,
                    tiket.createdAt,
                    tiket.tanggal_sla,
                    clientUrl,
                )
                .catch((err) =>
                    this.logger.warn(`Gagal kirim email konfirmasi tiket ${tiket.no_tiket}: ${err.message}`),
                );
        }

        // Kirim notifikasi email ke semua Admin aktif bahwa ada tiket baru masuk
        this.notifyAdminsNewTiket(layanan.slug, tiket.no_tiket, user?.nama || 'Pengguna', layanan.nama_layanan, tiket.createdAt, clientUrl, tiket.id)
            .catch((err) => this.logger.warn(`Gagal notifikasi admin tiket ${tiket.no_tiket}: ${err.message}`));


        return tiket;
    }


    findAllByUser(userId: number) {
        return this.prisma.tiket.findMany({
            where: { user_id: userId },
            include: { layanan: true, unit_teknis: true, auditLog: true },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOneByUser(userId: number, identifier: string) {
        const isNumeric = !isNaN(Number(identifier));
        const tiket = await this.prisma.tiket.findUnique({
            where: isNumeric ? { id: Number(identifier) } : { no_tiket: identifier },
            include: { layanan: { include: { unit_teknis: true } }, unit_teknis: true, dokumen: true, tagihan: true, auditLog: true },
        });
        if (!tiket) throw new NotFoundException('Tiket tidak ditemukan');
        if (tiket.user_id !== userId) throw new ForbiddenException('Bukan tiket milik Anda');

        // Sembunyikan Laporan Hasil dan Sertifikat dari pemohon publik jika layanan belum selesai
        if (tiket.status !== 'selesai' && tiket.dokumen) {
            tiket.dokumen = tiket.dokumen.filter((d) => {
                const tipe = (d.tipe || '').toLowerCase();
                return tipe !== 'laporan hasil' && tipe !== 'laporan_hasil' && !tipe.includes('sertifikat');
            });
        }

        // Auto-heal jika tiket peminjaman-alat sudah menunggu_pembayaran namun belum ada record tagihan
        if (tiket.status === 'menunggu_pembayaran' && !tiket.tagihan && tiket.layanan?.slug === 'peminjaman-alat') {
            const jForm: any = tiket.jawaban_form || {};
            const nominal = Number(jForm.total_estimasi) || 0;
            const newTagihan = await this.prisma.tagihan.create({
                data: {
                    tiket_id: tiket.id,
                    jumlah: nominal,
                    status_bayar: 'menunggu',
                },
            });
            tiket.tagihan = newTagihan;
        }

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

    async findAllTagihan() {
        return this.prisma.tagihan.findMany({
            include: {
                tiket: {
                    include: {
                        user: true,
                        layanan: true,
                        unit_teknis: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOneForAdmin(identifier: string) {
        const isNumeric = !isNaN(Number(identifier));
        const tiket = await this.prisma.tiket.findUnique({
            where: isNumeric ? { id: Number(identifier) } : { no_tiket: identifier },
            include: { layanan: { include: { unit_teknis: true } }, user: true, unit_teknis: true, dokumen: true, tagihan: true },
        });
        if (!tiket) throw new NotFoundException('Tiket tidak ditemukan');
        return tiket;
    }

    async verifikasi(adminUserId: number, tiketId: number, dto: VerifikasiTiketDto, clientUrl?: string) {
        const tiket = await this.prisma.tiket.findUnique({
            where: { id: tiketId },
            include: { layanan: { include: { unit_teknis: true } } },
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

            // Kirim notifikasi email perlu revisi
            const userRevisi = await this.prisma.user.findUnique({
                where: { id: tiket.user_id },
                select: { email: true, nama: true },
            });

            this.notifikasiService.create({
                userId: tiket.user_id,
                tiketId: tiket.id,
                judul: 'Permohonan Memerlukan Revisi',
                pesan: `Permohonan ${tiket.layanan.nama_layanan} (${tiket.no_tiket}) memerlukan revisi: ${dto.catatan_revisi || dto.catatan || 'Silakan cek catatan admin.'}`,
            }).catch((err) => this.logger.warn(`Gagal buat notifikasi revisi tiket ${tiket.no_tiket}: ${err.message}`));

            if (userRevisi?.email) {
                this.mailService
                    .sendTiketPerluRevisiEmail(userRevisi.email, userRevisi.nama, tiket.no_tiket, tiket.layanan.nama_layanan, dto.catatan_revisi ?? null, clientUrl)
                    .catch((err) => this.logger.warn(`Gagal kirim email revisi tiket ${tiket.no_tiket}: ${err.message}`));
            }

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

            // Kirim notifikasi email ditolak
            const userTolak = await this.prisma.user.findUnique({
                where: { id: tiket.user_id },
                select: { email: true, nama: true },
            });

            this.notifikasiService.create({
                userId: tiket.user_id,
                tiketId: tiket.id,
                judul: 'Permohonan Ditolak',
                pesan: `Permohonan ${tiket.layanan.nama_layanan} (${tiket.no_tiket}) telah ditolak: ${dto.catatan || 'Tidak memenuhi syarat.'}`,
            }).catch((err) => this.logger.warn(`Gagal buat notifikasi tolak tiket ${tiket.no_tiket}: ${err.message}`));

            if (userTolak?.email) {
                this.mailService
                    .sendTiketDitolakEmail(userTolak.email, userTolak.nama, tiket.no_tiket, tiket.layanan.nama_layanan, dto.catatan ?? null, clientUrl)
                    .catch((err) => this.logger.warn(`Gagal kirim email ditolak tiket ${tiket.no_tiket}: ${err.message}`));
            }

            return updated;
        }

        // aksi === setujui
        const unitTeknis = await this.prisma.unitTeknis.findUnique({
            where: { id: dto.unit_teknis_id },
        });
        if (!unitTeknis) throw new NotFoundException('Unit teknis tidak ditemukan');

        const isPeminjamanAlat = tiket.layanan?.slug === 'peminjaman-alat';

        if (isPeminjamanAlat) {
            // Khusus peminjaman alat: diverifikasi status berubah menjadi menunggu_ebilling
            // Tagihan disiapkan, namun belum diterbitkan ke user hingga admin memasukkan kode e-billing di menu tagihan.
            const updated = await this.prisma.tiket.update({
                where: { id: tiketId },
                data: {
                    status: 'menunggu_ebilling',
                    unit_teknis_id: dto.unit_teknis_id,
                },
            });

            // Pastikan tagihan tercatat jika ada estimasi biaya pada form
            const jForm: any = tiket.jawaban_form || {};
            const nominal = Number(jForm.total_estimasi) || 0;
            if (nominal > 0) {
                const existingTagihan = await this.prisma.tagihan.findUnique({ where: { tiket_id: tiketId } });
                if (!existingTagihan) {
                    await this.prisma.tagihan.create({
                        data: {
                            tiket_id: tiketId,
                            jumlah: nominal,
                            status_bayar: 'menunggu',
                        },
                    });
                }
            }

            await this.prisma.auditLog.create({
                data: {
                    user_id: adminUserId,
                    tiket_id: tiketId,
                    aksi: 'menunggu_ebilling',
                    detail_perubahan: `Disetujui Admin, status berubah menjadi Menunggu Kode E-Billing (Unit Teknis: ${unitTeknis.nama})`,
                },
            });

            const userSetuju = await this.prisma.user.findUnique({
                where: { id: tiket.user_id },
                select: { email: true, nama: true },
            });

            this.notifikasiService.create({
                userId: tiket.user_id,
                tiketId: tiket.id,
                judul: 'Permohonan Diverifikasi Admin',
                pesan: `Permohonan ${tiket.layanan.nama_layanan} (${tiket.no_tiket}) telah diverifikasi. Tagihan pembayaran e-billing sedang dipersiapkan oleh admin.`,
            }).catch(() => {});

            if (userSetuju?.email) {
                this.mailService
                    .sendTiketDisetujuiEmail(userSetuju.email, userSetuju.nama, tiket.no_tiket, tiket.layanan.nama_layanan, 'menunggu_ebilling', clientUrl)
                    .catch((err) => this.logger.warn(`Gagal kirim email disetujui tiket ${tiket.no_tiket}: ${err.message}`));
            }

            return updated;
        }

        // Semua pengajuan layanan lainnya setelah verifikasi admin didisposisikan ke Kepala Balai terlebih dahulu
        const targetStatus: any = 'menunggu_persetujuan_kepala_balai';
        const detailMsg = `Disetujui Admin, menunggu persetujuan Kepala Balai (Unit Teknis: ${unitTeknis.nama})`;

        const updated = await this.prisma.tiket.update({
            where: { id: tiketId },
            data: {
                status: targetStatus,
                unit_teknis_id: dto.unit_teknis_id,
            },
        });

        await this.prisma.auditLog.create({
            data: {
                user_id: adminUserId,
                tiket_id: tiketId,
                aksi: targetStatus,
                detail_perubahan: detailMsg,
            },
        });

        // Kirim notifikasi email disetujui ke pemohon
        const userSetuju = await this.prisma.user.findUnique({
            where: { id: tiket.user_id },
            select: { email: true, nama: true },
        });

        this.notifikasiService.create({
            userId: tiket.user_id,
            tiketId: tiket.id,
            judul: 'Pengajuan Diverifikasi Petugas',
            pesan: `Permohonan ${tiket.layanan.nama_layanan} (${tiket.no_tiket}) telah diverifikasi dan sedang menunggu persetujuan Kepala Balai.`,
        }).catch(() => {});

        if (userSetuju?.email) {
            this.mailService
                .sendTiketDisetujuiEmail(userSetuju.email, userSetuju.nama, tiket.no_tiket, tiket.layanan.nama_layanan, targetStatus, clientUrl)
                .catch((err) => this.logger.warn(`Gagal kirim email disetujui tiket ${tiket.no_tiket}: ${err.message}`));
        }

        // Notifikasi ke Kepala Balai untuk persetujuan disposisi
        this.notifyKepalaBalaiPersetujuan(tiket.layanan.slug, tiket.no_tiket, userSetuju?.nama || 'Pengguna', tiket.layanan.nama_layanan, unitTeknis.nama, clientUrl, tiket.id)
            .catch((err) => this.logger.warn(`Gagal notifikasi kepala balai tiket ${tiket.no_tiket}: ${err.message}`));

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

        // Notifikasi ke admin bahwa tiket telah disubmit ulang
        const admins = await this.prisma.user.findMany({
            where: { role: { in: ['admin', 'super_admin'] }, status_akun: 'active' },
            select: { id: true },
        });
        for (const adm of admins) {
            this.notifikasiService.create({
                userId: adm.id,
                tiketId: tiket.id,
                judul: 'Revisi Permohonan Diajukan Ulang',
                pesan: `Pemohon telah mengirimkan revisi untuk tiket #${tiket.no_tiket}. Silakan periksa kembali.`,
            }).catch(() => {});
        }

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

        // Notifikasi ke pemohon bahwa tagihan telah diterbitkan
        this.notifikasiService.create({
            userId: tiket.user_id,
            tiketId: tiket.id,
            judul: 'Tagihan Pembayaran Diterbitkan',
            pesan: `Tagihan permohonan ${tiket.layanan.nama_layanan} (${tiket.no_tiket}) sebesar Rp ${jumlah.toLocaleString('id-ID')} telah dibuat. Silakan lakukan pembayaran.`,
        }).catch(() => {});

        return { tiket: updated, tagihan };
    }

    async terimaMagang(userId: number, tiketId: number, clientUrl?: string) {
        const staff = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!staff) throw new NotFoundException('User tidak ditemukan');
        const tiket = await this.prisma.tiket.findUnique({
            where: { id: tiketId },
            include: { layanan: true, unit_teknis: true, dokumen: true },
        });
        if (!tiket) throw new NotFoundException('Tiket tidak ditemukan');
        if (tiket.unit_teknis_id !== staff.unit_teknis_id) {
            throw new ForbiddenException('Tiket ini bukan milik unit teknis Anda');
        }
        if (tiket.status !== 'diproses') {
            throw new BadRequestException('Tiket magang harus dalam status "diproses" untuk dapat diterima');
        }

        const hasSuratPenerimaan = tiket.dokumen?.some(
            (d) => d.tipe === 'Surat Penerimaan' || d.tipe?.toLowerCase().includes('surat_penerimaan')
        );
        if (!hasSuratPenerimaan) {
            throw new BadRequestException('Harap unggah Surat Penerimaan terlebih dahulu sebelum menerima permohonan magang');
        }

        const updated = await this.prisma.tiket.update({
            where: { id: tiketId },
            data: { status: 'diterima' as any },
        });

        await this.prisma.auditLog.create({
            data: {
                user_id: userId,
                tiket_id: tiketId,
                aksi: 'diterima',
                detail_perubahan: `${tiket.unit_teknis?.nama || 'Petugas'} menyetujui permohonan magang dan menerbitkan Surat Penerimaan`,
            },
        });

        // Kirim notifikasi email diterima ke pemilik tiket
        const userTiket = await this.prisma.user.findUnique({
            where: { id: tiket.user_id },
            select: { email: true, nama: true },
        });

        this.notifikasiService.create({
            userId: tiket.user_id,
            tiketId: tiket.id,
            judul: 'Permohonan Magang Diterima',
            pesan: `Permohonan magang (${tiket.no_tiket}) telah diterima dan Surat Penerimaan telah diterbitkan.`,
        }).catch(() => {});

        if (userTiket?.email) {
            this.mailService
                .sendTiketDiterimaEmail(userTiket.email, userTiket.nama, tiket.no_tiket, tiket.layanan.nama_layanan, clientUrl)
                .catch((err) => this.logger.warn(`Gagal kirim email diterima tiket ${tiket.no_tiket}: ${err.message}`));
        }

        return updated;
    }

    async tandaiDipinjam(userId: number, tiketId: number, clientUrl?: string) {
        const staff = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!staff) throw new NotFoundException('User tidak ditemukan');
        const tiket = await this.prisma.tiket.findUnique({
            where: { id: tiketId },
            include: { layanan: true, unit_teknis: true, dokumen: true },
        });
        if (!tiket) throw new NotFoundException('Tiket tidak ditemukan');
        if (tiket.unit_teknis_id !== staff.unit_teknis_id) {
            throw new ForbiddenException('Tiket ini bukan milik unit teknis Anda');
        }
        if (tiket.status !== 'diproses') {
            throw new BadRequestException('Tiket peminjaman alat harus dalam status "diproses" untuk dapat diubah menjadi "dipinjam"');
        }

        const hasBeritaAcara = tiket.dokumen?.some(
            (d) => d.tipe === 'Berita Acara' || d.tipe?.toLowerCase().includes('berita_acara') || d.tipe?.toLowerCase().includes('berita acara')
        );
        if (!hasBeritaAcara) {
            throw new BadRequestException('Harap unggah Berita Acara Serah Terima Alat terlebih dahulu sebelum mengubah status menjadi dipinjam');
        }

        const updated = await this.prisma.tiket.update({
            where: { id: tiketId },
            data: { status: 'dipinjam' },
        });

        await this.prisma.auditLog.create({
            data: {
                user_id: userId,
                tiket_id: tiketId,
                aksi: 'dipinjam',
                detail_perubahan: `${tiket.unit_teknis?.nama || 'Petugas'} menyerahkan alat dan mengubah status permohonan menjadi dipinjam.`,
            },
        });

        return updated;
    }

    async selesaiProses(userId: number, tiketId: number, clientUrl?: string) {
        const staff = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!staff) throw new NotFoundException('User tidak ditemukan');
        const tiket = await this.prisma.tiket.findUnique({
            where: { id: tiketId },
            include: { layanan: true, unit_teknis: true },
        });
        if (!tiket) throw new NotFoundException('Tiket tidak ditemukan');
        if (tiket.unit_teknis_id !== staff.unit_teknis_id) {
            throw new ForbiddenException('Tiket ini bukan milik unit teknis Anda');
        }

        const isMagang =
            tiket.layanan?.slug === 'magang-pkl' ||
            tiket.layanan?.nama_layanan?.toLowerCase().includes('magang') ||
            tiket.layanan?.nama_layanan?.toLowerCase().includes('pkl');

        const isPeminjamanAlat =
            tiket.layanan?.slug === 'peminjaman-alat' ||
            tiket.layanan?.nama_layanan?.toLowerCase().includes('peminjaman alat');

        if (isMagang) {
            if (tiket.status !== 'diterima') {
                throw new BadRequestException('Tiket magang harus berstatus "diterima" terlebih dahulu sebelum dapat diselesaikan');
            }
        } else if (isPeminjamanAlat) {
            if (tiket.status !== 'dipinjam') {
                throw new BadRequestException('Tiket peminjaman alat harus berstatus "dipinjam" terlebih dahulu sebelum dapat diselesaikan (pastikan Berita Acara telah diunggah dan alat telah diserahterimakan)');
            }
        } else {
            if (tiket.status !== 'diproses') {
                throw new BadRequestException('Tiket belum siap diselesaikan (pastikan status "diproses" dan sudah lunas jika berbayar)');
            }
        }

        const updated = await this.prisma.tiket.update({
            where: { id: tiketId },
            data: { status: 'selesai' },
        });

        const detailMsg = isPeminjamanAlat
            ? `${tiket.unit_teknis?.nama || 'Petugas'} menyelesaikan peminjaman alat. Seluruh alat telah dikembalikan.`
            : `${tiket.unit_teknis?.nama || ''} menyelesaikan pengerjaan tiket layanan ${tiket.layanan.nama_layanan}`;

        await this.prisma.auditLog.create({
            data: {
                user_id: userId,
                tiket_id: tiketId,
                aksi: 'selesai',
                detail_perubahan: detailMsg,
            },
        });

        // Kirim notifikasi email selesai ke pemilik tiket
        const userTiket = await this.prisma.user.findUnique({
            where: { id: tiket.user_id },
            select: { email: true, nama: true },
        });

        this.notifikasiService.create({
            userId: tiket.user_id,
            tiketId: tiket.id,
            judul: 'Layanan Selesai Diproses',
            pesan: `Permohonan layanan ${tiket.layanan.nama_layanan} (${tiket.no_tiket}) telah selesai. Silakan cek dokumen hasil layanan Anda.`,
        }).catch(() => {});

        if (userTiket?.email) {
            this.mailService
                .sendTiketSelesaiEmail(userTiket.email, userTiket.nama, tiket.no_tiket, tiket.layanan.nama_layanan, clientUrl)
                .catch((err) => this.logger.warn(`Gagal kirim email selesai tiket ${tiket.no_tiket}: ${err.message}`));
        }

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

    async terbitkanEbilling(
        adminUserId: number,
        tiketId: number,
        dto: TerbitkanEbillingDto,
        clientUrl?: string,
    ) {
        const tiket = await this.prisma.tiket.findUnique({
            where: { id: tiketId },
            include: { layanan: true, user: true, unit_teknis: true, tagihan: true },
        });
        if (!tiket) throw new NotFoundException('Tiket tidak ditemukan');

        const kodeEbilling = dto.kode_ebilling?.trim();
        if (!kodeEbilling) {
            throw new BadRequestException('Kode e-billing wajib diisi');
        }

        // Boleh menerbitkan jika status menunggu_ebilling atau menunggu_pembayaran (misal koreksi kode)
        if (tiket.status !== 'menunggu_ebilling' && tiket.status !== 'menunggu_pembayaran') {
            throw new BadRequestException('Tiket tidak dalam status yang dapat menerbitkan e-billing');
        }

        let tagihan = tiket.tagihan;
        if (tagihan) {
            tagihan = await this.prisma.tagihan.update({
                where: { id: tagihan.id },
                data: { kode_ebilling: kodeEbilling },
            });
        } else {
            const jForm: any = tiket.jawaban_form || {};
            const nominal = Number(jForm.total_estimasi) || 0;
            tagihan = await this.prisma.tagihan.create({
                data: {
                    tiket_id: tiketId,
                    jumlah: nominal,
                    status_bayar: 'menunggu',
                    kode_ebilling: kodeEbilling,
                },
            });
        }

        const updated = await this.prisma.tiket.update({
            where: { id: tiketId },
            data: { status: 'menunggu_pembayaran' },
        });

        await this.prisma.auditLog.create({
            data: {
                user_id: adminUserId,
                tiket_id: tiketId,
                aksi: 'menunggu_pembayaran',
                detail_perubahan: `Admin menerbitkan tagihan dengan Kode E-Billing: ${kodeEbilling}`,
            },
        });

        // Notifikasi ke pemohon bahwa tagihan telah diterbitkan
        this.notifikasiService.create({
            userId: tiket.user_id,
            tiketId: tiket.id,
            judul: 'Tagihan Pembayaran Diterbitkan',
            pesan: `Tagihan permohonan ${tiket.layanan.nama_layanan} (${tiket.no_tiket}) sebesar Rp ${tagihan.jumlah.toLocaleString('id-ID')} telah diterbitkan dengan Kode E-Billing ${kodeEbilling}. Silakan lakukan pembayaran.`,
        }).catch(() => {});

        // Kirim email notifikasi ke pemohon
        if (tiket.user?.email) {
            this.mailService
                .sendTiketDisetujuiEmail(
                    tiket.user.email,
                    tiket.user.nama,
                    tiket.no_tiket,
                    tiket.layanan.nama_layanan,
                    'menunggu_pembayaran',
                    clientUrl,
                )
                .catch((err) => this.logger.warn(`Gagal kirim email tagihan ${tiket.no_tiket}: ${err.message}`));
        }

        return { tiket: updated, tagihan };
    }

    async konfirmasiPembayaran(userId: number, tiketId: number) {
        const ticket = await this.prisma.tiket.findUnique({
            where: { id: tiketId },
            include: { tagihan: true, layanan: true, unit_teknis: true, user: true }
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

        // Notifikasi ke pemohon bahwa pembayaran lunas
        this.notifikasiService.create({
            userId: ticket.user_id,
            tiketId: ticket.id,
            judul: 'Pembayaran Telah Terverifikasi',
            pesan: `Pembayaran tiket #${ticket.no_tiket} telah dikonfirmasi lunas. Permohonan Anda saat ini sedang dikerjakan oleh unit teknis.`,
        }).catch(() => {});

        // Notifikasi ke pegawai unit teknis bahwa tiket sudah lunas dan siap diproses
        if (ticket.unit_teknis_id && ticket.unit_teknis) {
            this.notifyPegawaiDisposisi(
                ticket.unit_teknis_id,
                ticket.layanan.slug,
                ticket.no_tiket,
                ticket.user?.nama || 'Pengguna',
                ticket.layanan.nama_layanan,
                ticket.unit_teknis.nama,
                undefined,
                ticket.id,
            ).catch((err) => this.logger.warn(`Gagal notifikasi pegawai setelah pembayaran tiket ${ticket.no_tiket}: ${err.message}`));
        }

        return updated;
    }

    async setujuiOlehKepalaBalai(id: number, kepalaBalaiId: number, clientUrl?: string) {
        const tiket = await this.prisma.tiket.findUnique({
            where: { id },
            include: { layanan: true, unit_teknis: true, user: true },
        });
        if (!tiket) throw new NotFoundException('Tiket tidak ditemukan');
        if (tiket.status !== 'menunggu_persetujuan_kepala_balai') {
            throw new BadRequestException('Tiket ini tidak sedang menunggu persetujuan Kepala Balai');
        }

        const isPeminjamanAlat = tiket.layanan.slug === 'peminjaman-alat';

        if (isPeminjamanAlat) {
            // Khusus peminjaman alat: setelah disposisi Kepala Balai, langsung diproses ke petugas unit teknis
            const jForm: any = tiket.jawaban_form || {};
            const nominal = Number(jForm.total_estimasi) || 0;
            if (nominal > 0) {
                const existingTagihan = await this.prisma.tagihan.findUnique({ where: { tiket_id: id } });
                if (!existingTagihan) {
                    await this.prisma.tagihan.create({
                        data: {
                            tiket_id: id,
                            jumlah: nominal,
                            status_bayar: 'menunggu',
                        },
                    });
                }
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
                    detail_perubahan: `Disetujui oleh Kepala Balai, didisposisikan ke ${tiket.unit_teknis?.nama || 'Unit Teknis Terkait'} untuk penyiapan alat`,
                },
            });

            if (tiket.user?.email) {
                this.mailService
                    .sendTiketDisetujuiEmail(tiket.user.email, tiket.user.nama, tiket.no_tiket, tiket.layanan.nama_layanan, 'diproses', clientUrl)
                    .catch((err) => this.logger.warn(`Gagal kirim email disetujui kepala balai ke pemohon ${tiket.no_tiket}: ${err.message}`));
            }

            if (tiket.unit_teknis_id && tiket.unit_teknis) {
                this.notifyPegawaiDisposisi(
                    tiket.unit_teknis_id,
                    tiket.layanan.slug,
                    tiket.no_tiket,
                    tiket.user?.nama || 'Pengguna',
                    tiket.layanan.nama_layanan,
                    tiket.unit_teknis.nama,
                    clientUrl,
                    tiket.id,
                ).catch((err) => this.logger.warn(`Gagal notifikasi pegawai setelah persetujuan kepala balai tiket ${tiket.no_tiket}: ${err.message}`));
            }

            return updated;
        }

        // Untuk semua layanan lainnya: langsung didisposisikan ke pegawai unit teknis (status: diproses)
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
                detail_perubahan: `Disetujui oleh Kepala Balai, didisposisikan ke ${tiket.unit_teknis?.nama || 'Unit Teknis tidak ditemukan'}`,
            },
        });

        // Notifikasi ke pemohon bahwa permohonan disetujui Kepala Balai & sedang diproses
        this.notifikasiService.create({
            userId: tiket.user_id,
            tiketId: tiket.id,
            judul: 'Pengajuan Disetujui oleh Kepala Balai',
            pesan: `Permohonan ${tiket.layanan.nama_layanan} (${tiket.no_tiket}) telah disetujui oleh Kepala Balai dan sedang diproses oleh ${tiket.unit_teknis?.nama || 'Unit Teknis'}.`,
        }).catch(() => {});

        if (tiket.user?.email) {
            this.mailService
                .sendTiketDisetujuiEmail(tiket.user.email, tiket.user.nama, tiket.no_tiket, tiket.layanan.nama_layanan, 'diproses', clientUrl)
                .catch((err) => this.logger.warn(`Gagal kirim email disetujui kepala balai ke pemohon ${tiket.no_tiket}: ${err.message}`));
        }

        // Notifikasi ke pegawai unit teknis setelah disetujui Kepala Balai
        if (tiket.unit_teknis_id && tiket.unit_teknis) {
            this.notifyPegawaiDisposisi(
                tiket.unit_teknis_id,
                tiket.layanan.slug,
                tiket.no_tiket,
                tiket.user?.nama || 'Pengguna',
                tiket.layanan.nama_layanan,
                tiket.unit_teknis.nama,
                clientUrl,
                tiket.id,
            ).catch((err) => this.logger.warn(`Gagal notifikasi pegawai setelah persetujuan kepala balai tiket ${tiket.no_tiket}: ${err.message}`));
        }

        return updated;
    }

    async findAllForKepalaBalai(status?: string) {
        return this.prisma.tiket.findMany({
            where: {
                status: status ? (status as any) : {
                    in: [
                        'menunggu_persetujuan_kepala_balai',
                        'menunggu_pembayaran',
                        'diproses',
                        'menunggu_konfirmasi',
                        'selesai'
                    ]
                }
            },
            include: { layanan: { include: { unit_teknis: true } }, user: true, unit_teknis: true, tagihan: true },
            orderBy: { createdAt: 'desc' },
        });
    }

    // ─── Internal Helper Methods for Email Notifications ─────────────────────

    private async notifyAdminsNewTiket(
        layananSlug: string,
        noTiket: string,
        namaPemohon: string,
        namaLayanan: string,
        tanggalSubmit: Date,
        clientUrl?: string,
        tiketId?: number,
    ) {
        const admins = await this.prisma.user.findMany({
            where: { role: { in: ['admin', 'super_admin'] }, status_akun: 'active' },
            select: { id: true, email: true, nama: true },
        });

        for (const admin of admins) {
            this.notifikasiService.create({
                userId: admin.id,
                tiketId,
                judul: 'Tiket Baru Menunggu Verifikasi',
                pesan: `Permohonan baru ${namaLayanan} (${noTiket}) dari ${namaPemohon} menunggu verifikasi Anda.`,
            }).catch(() => {});

            if (admin.email) {
                this.mailService
                    .sendAdminNotifTiketBaruEmail(admin.email, admin.nama, layananSlug, noTiket, namaPemohon, namaLayanan, tanggalSubmit, clientUrl)
                    .catch((err) => this.logger.warn(`Gagal kirim notif ke admin ${admin.email}: ${err.message}`));
            }
        }
    }


    private async notifyKepalaBalaiPersetujuan(
        layananSlug: string,
        noTiket: string,
        namaPemohon: string,
        namaLayanan: string,
        unitTeknisNama: string,
        clientUrl?: string,
        tiketId?: number,
    ) {
        const kepalaBalais = await this.prisma.user.findMany({
            where: {
                role: 'kepala_balai',
                status_akun: 'active',
            },
            select: { id: true, email: true, nama: true },
        });

        for (const kb of kepalaBalais) {
            this.notifikasiService.create({
                userId: kb.id,
                tiketId,
                judul: 'Persetujuan Disposisi Layanan',
                pesan: `Tiket #${noTiket} (${namaLayanan}) menunggu persetujuan disposisi Kepala Balai.`,
            }).catch(() => {});

            if (kb.email) {
                this.mailService
                    .sendKepalaBalaiNotifPersetujuanEmail(kb.email, kb.nama, layananSlug, noTiket, namaPemohon, namaLayanan, unitTeknisNama, clientUrl)
                    .catch((err) => this.logger.warn(`Gagal kirim notif ke kepala balai ${kb.email}: ${err.message}`));
            }
        }
    }

    private async notifyPegawaiDisposisi(
        unitTeknisId: number,
        slug: string,
        noTiket: string,
        namaPemohon: string,
        namaLayanan: string,
        unitTeknisNama: string,
        clientUrl?: string,
        tiketId?: number,
    ) {
        const pegawais = await this.prisma.user.findMany({
            where: {
                role: 'pegawai',
                unit_teknis_id: unitTeknisId,
                status_akun: 'active',
            },
            select: { id: true, email: true, nama: true },
        });

        for (const staff of pegawais) {
            this.notifikasiService.create({
                userId: staff.id,
                tiketId,
                judul: 'Penugasan Layanan Baru',
                pesan: `Anda telah ditugaskan untuk mengerjakan tiket #${noTiket} (${namaLayanan}).`,
            }).catch(() => {});

            if (staff.email) {
                this.mailService
                    .sendPegawaiNotifDisposisiEmail(staff.email, staff.nama, noTiket, slug, namaPemohon, namaLayanan, unitTeknisNama, clientUrl)
                    .catch((err) => this.logger.warn(`Gagal kirim notif ke pegawai ${staff.email}: ${err.message}`));
            }
        }
    }
}

