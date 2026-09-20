import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { generatePasswordFromName } from '../common/utils/password-generator';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

    async create(dto: CreateUserDto) {
        const existingNip = await this.prisma.user.findUnique({
            where: { nip: dto.nip },
        });
        if (existingNip) throw new ConflictException('NIP sudah terdaftar');

        if ((dto.role === 'pegawai') && !dto.unit_teknis_id) {
            throw new BadRequestException('Unit teknis wajib diisi untuk role pegawai');
        }

        if (dto.unit_teknis_id) {
            const unitTeknis = await this.prisma.unitTeknis.findUnique({
                where: { id: dto.unit_teknis_id },
            });
            if (!unitTeknis) throw new NotFoundException('Unit teknis tidak ditemukan');
        }

        const cleanEmail = dto.email?.trim() ? dto.email.trim() : null;
        const cleanNoHp = dto.no_hp?.trim() ? dto.no_hp.trim() : null;

        if (cleanEmail) {
            const conflictEmail = await this.prisma.user.findUnique({
                where: { email: cleanEmail },
            });
            if (conflictEmail) throw new ConflictException('Email sudah digunakan oleh user lain');
        }

        const plainPassword = dto.nip;
        const hashedPassword = await bcrypt.hash(plainPassword, 10);

        const user = await this.prisma.user.create({
            data: {
                nama: dto.nama,
                nip: dto.nip,
                email: cleanEmail,
                no_hp: cleanNoHp,
                role: dto.role,
                password: hashedPassword,
                unit_teknis_id:
                    dto.role === 'pegawai' ? dto.unit_teknis_id : null,
            },
        });

        // Password asli cuma ditampilkan sekali di sini, gak pernah disimpan plain di DB
        return {
            ...user,
            password: undefined,
            generated_password: plainPassword,
        };
    }

    getUnitTeknis() {
        return this.prisma.unitTeknis.findMany({
            select: {
                id: true,
                nama: true,
            },
            orderBy: {
                id: 'asc',
            },
        });
    }

    findAll() {
        return this.prisma.user.findMany({
            select: {
                id: true,
                nama: true,
                nip: true,
                email: true,
                no_hp: true,
                role: true,
                instansi: true,
                alamat: true,
                status_akun: true,
                unit_teknis: true,
                createdAt: true,
            },
        });
    }

    async findOne(id: number) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                nama: true,
                nip: true,
                email: true,
                no_hp: true,
                role: true,
                status_akun: true,
                unit_teknis_id: true,
                unit_teknis: true,
                instansi: true,
                alamat: true,
                createdAt: true,
            },
        });
        if (!user) throw new NotFoundException('User tidak ditemukan');
        return user;
    }

    async update(id: number, dto: UpdateUserDto) {
        const existing = await this.findOne(id);

        if (dto.nip && dto.nip !== existing.nip) {
            const conflictNip = await this.prisma.user.findUnique({
                where: { nip: dto.nip },
            });
            if (conflictNip && conflictNip.id !== id) {
                throw new ConflictException('NIP sudah digunakan oleh user lain');
            }
        }

        const cleanEmail = dto.email !== undefined ? (dto.email?.trim() ? dto.email.trim() : null) : undefined;
        const cleanNoHp = dto.no_hp !== undefined ? (dto.no_hp?.trim() ? dto.no_hp.trim() : null) : undefined;

        if (cleanEmail && cleanEmail !== existing.email) {
            const conflictEmail = await this.prisma.user.findUnique({
                where: { email: cleanEmail },
            });
            if (conflictEmail && conflictEmail.id !== id) {
                throw new ConflictException('Email sudah digunakan oleh user lain');
            }
        }

        if (dto.unit_teknis_id) {
            const unitTeknis = await this.prisma.unitTeknis.findUnique({
                where: { id: dto.unit_teknis_id },
            });
            if (!unitTeknis) throw new NotFoundException('Unit teknis tidak ditemukan');
        }

        // Jika role diubah menjadi selain pegawai, unit_teknis_id otomatis null
        const targetRole = dto.role || existing.role;
        let finalUnitTeknisId = dto.unit_teknis_id !== undefined ? dto.unit_teknis_id : existing.unit_teknis_id;
        if (targetRole !== 'pegawai') {
            finalUnitTeknisId = null;
        }

        return this.prisma.user.update({
            where: { id },
            data: {
                ...dto,
                ...(cleanEmail !== undefined ? { email: cleanEmail } : {}),
                ...(cleanNoHp !== undefined ? { no_hp: cleanNoHp } : {}),
                unit_teknis_id: finalUnitTeknisId,
            },
        });
    }


    async remove(id: number) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        tikets: true,
                        auditLogs: true,
                        notifikasis: true,
                    },
                },
            },
        });

        if (!user) throw new NotFoundException('User tidak ditemukan');

        // Jika user memiliki riwayat tiket, jangan hard delete demi integritas data layanan & audit
        if (user._count.tikets > 0) {
            throw new BadRequestException(
                `User "${user.nama}" tidak dapat dihapus permanen karena memiliki riwayat ${user._count.tikets} tiket pengajuan layanan. Silakan nonaktifkan akun melalui menu Edit jika tidak ingin user ini aktif.`,
            );
        }

        // Jika tidak ada tiket tetapi ada notifikasi atau audit log, bersihkan relasinya dulu
        if (user._count.notifikasis > 0) {
            await this.prisma.notifikasi.deleteMany({
                where: { user_id: id },
            });
        }

        if (user._count.auditLogs > 0) {
            await this.prisma.auditLog.updateMany({
                where: { user_id: id },
                data: { user_id: null },
            });
        }

        return this.prisma.user.delete({ where: { id } });
    }

    async updateStatus(id: number, status_akun: string) {
        const user = await this.prisma.user.findUnique({
            where: { id },
        });

        if (!user) {
            throw new NotFoundException('User tidak ditemukan');
        }

        const normalizedStatus = status_akun.toLowerCase();

        if (normalizedStatus !== 'active' && normalizedStatus !== 'inactive') {
            throw new BadRequestException('Status akun tidak valid');
        }

        return this.prisma.user.update({
            where: { id },
            data: {
                status_akun: normalizedStatus,
            },
            select: {
                id: true,
                nama: true,
                nip: true,
                email: true,
                no_hp: true,
                role: true,
                status_akun: true,
                unit_teknis: true,
                createdAt: true,
            },
        });
    }
}
