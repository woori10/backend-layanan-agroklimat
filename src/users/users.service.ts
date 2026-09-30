import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { generatePasswordFromRole, generateUsernameFromName } from '../common/utils/password-generator';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

    async create(dto: CreateUserDto) {
        const cleanUsername = dto.username?.trim()
            ? dto.username.trim().toLowerCase()
            : generateUsernameFromName(dto.nama || '');

        if (!cleanUsername) {
            throw new BadRequestException('Username wajib diisi');
        }

        const existingUsername = await this.prisma.user.findUnique({
            where: { username: cleanUsername },
        });
        if (existingUsername) {
            throw new ConflictException(`Username "${cleanUsername}" sudah digunakan`);
        }

        if (dto.nip?.trim()) {
            const existingNip = await this.prisma.user.findUnique({
                where: { nip: dto.nip.trim() },
            });
            if (existingNip) throw new ConflictException('NIP sudah terdaftar');
        }

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

        const plainPassword = generatePasswordFromRole(dto.role);
        const hashedPassword = await bcrypt.hash(plainPassword, 10);
        const finalNama = dto.nama?.trim() || cleanUsername;

        const user = await this.prisma.user.create({
            data: {
                nama: finalNama,
                username: cleanUsername,
                nip: dto.nip?.trim() ? dto.nip.trim() : null,
                email: cleanEmail,
                no_hp: cleanNoHp,
                role: dto.role,
                password: hashedPassword,
                initial_password: plainPassword,
                unit_teknis_id:
                    dto.role === 'pegawai' ? dto.unit_teknis_id : null,
            },
            include: {
                unit_teknis: true,
            },
        });

        return {
            ...user,
            password: undefined,
            generated_password: plainPassword,
        };
    }

    async getCredential(id: number) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            include: { unit_teknis: true },
        });
        if (!user) throw new NotFoundException('User tidak ditemukan');

        let initialPassword = user.initial_password;
        if (!initialPassword) {
            initialPassword = generatePasswordFromRole(user.role);
            const hashedPassword = await bcrypt.hash(initialPassword, 10);
            await this.prisma.user.update({
                where: { id },
                data: { initial_password: initialPassword, password: hashedPassword },
            });
        }

        return {
            id: user.id,
            nama: user.nama,
            username: user.username || user.nama,
            role: user.role,
            unit_teknis: user.unit_teknis ? user.unit_teknis.nama : null,
            password: initialPassword,
        };
    }

    async generateCredential(id: number) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            include: { unit_teknis: true },
        });
        if (!user) throw new NotFoundException('User tidak ditemukan');

        const plainPassword = generatePasswordFromRole(user.role);
        const hashedPassword = await bcrypt.hash(plainPassword, 10);

        const updated = await this.prisma.user.update({
            where: { id },
            data: {
                password: hashedPassword,
                initial_password: plainPassword,
            },
            include: { unit_teknis: true },
        });

        return {
            id: updated.id,
            nama: updated.nama,
            username: updated.username || updated.nama,
            role: updated.role,
            unit_teknis: updated.unit_teknis ? updated.unit_teknis.nama : null,
            password: plainPassword,
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
                username: true,
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
            orderBy: {
                id: 'desc',
            },
        });
    }

    async findOne(id: number) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                nama: true,
                username: true,
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

        let cleanUsername: string | null | undefined = undefined;
        if (dto.username !== undefined) {
            cleanUsername = dto.username?.trim() ? dto.username.trim().toLowerCase() : null;
            if (cleanUsername && cleanUsername !== existing.username) {
                const conflictUsername = await this.prisma.user.findUnique({
                    where: { username: cleanUsername },
                });
                if (conflictUsername && conflictUsername.id !== id) {
                    throw new ConflictException(`Username "${cleanUsername}" sudah digunakan oleh user lain`);
                }
            }
        }

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

        const finalNama = dto.nama !== undefined
            ? (dto.nama.trim() || cleanUsername || existing.nama)
            : (cleanUsername && existing.nama === existing.username ? cleanUsername : undefined);

        return this.prisma.user.update({
            where: { id },
            data: {
                ...dto,
                ...(finalNama !== undefined ? { nama: finalNama } : {}),
                ...(cleanUsername !== undefined ? { username: cleanUsername } : {}),
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
                username: true,
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
