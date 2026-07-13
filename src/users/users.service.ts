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

        if ((dto.role === 'admin_petugas_layanan' || dto.role === 'unit_teknis') && !dto.unit_teknis_id) {
            throw new BadRequestException('Unit teknis wajib diisi untuk role admin/pegawai');
        }

        if (dto.unit_teknis_id) {
            const unitTeknis = await this.prisma.unitTeknis.findUnique({
                where: { id: dto.unit_teknis_id },
            });
            if (!unitTeknis) throw new NotFoundException('Unit teknis tidak ditemukan');
        }

        const plainPassword = generatePasswordFromName(dto.nama);
        const hashedPassword = await bcrypt.hash(plainPassword, 10);

        const user = await this.prisma.user.create({
            data: {
                nama: dto.nama,
                nip: dto.nip,
                role: dto.role,
                password: hashedPassword,
                unit_teknis_id:
                    dto.role === 'admin_petugas_layanan' || dto.role === 'unit_teknis' ? dto.unit_teknis_id : null,
                must_change_password: true,
            },
        });

        // Password asli cuma ditampilkan sekali di sini, gak pernah disimpan plain di DB
        return {
            ...user,
            password: undefined,
            generated_password: plainPassword,
        };
    }

    findAll() {
        return this.prisma.user.findMany({
            select: {
                id: true,
                nama: true,
                nip: true,
                email: true,
                role: true,
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
                role: true,
                status_akun: true,
                unit_teknis: true,
                createdAt: true,
            },
        });
        if (!user) throw new NotFoundException('User tidak ditemukan');
        return user;
    }

    async update(id: number, dto: UpdateUserDto) {
        await this.findOne(id); // mastiin user ada, kalau gak ada bakal throw NotFound

        if (dto.unit_teknis_id) {
            const unitTeknis = await this.prisma.unitTeknis.findUnique({
                where: { id: dto.unit_teknis_id },
            });
            if (!unitTeknis) throw new NotFoundException('Unit teknis tidak ditemukan');
        }

        return this.prisma.user.update({
            where: { id },
            data: dto,
        });
    }

    async remove(id: number) {
        await this.findOne(id);
        return this.prisma.user.delete({ where: { id } });
    }
}