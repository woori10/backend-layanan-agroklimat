import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AlatService {
    constructor(private prisma: PrismaService) {}

    async findAll() {
        return this.prisma.alat.findMany({
            orderBy: { id: 'asc' },
        });
    }

    async findOne(id: number) {
        const alat = await this.prisma.alat.findUnique({
            where: { id },
        });
        if (!alat) {
            throw new NotFoundException('Alat tidak ditemukan');
        }
        return alat;
    }

    async create(data: { nama_alat: string; harga_peminjaman: number; is_active?: boolean }) {
        return this.prisma.alat.create({
            data: {
                nama_alat: data.nama_alat,
                harga_peminjaman: data.harga_peminjaman,
                is_active: data.is_active ?? true,
            },
        });
    }

    async update(id: number, data: { nama_alat?: string; harga_peminjaman?: number; is_active?: boolean }) {
        // Ensure the alat exists
        await this.findOne(id);

        return this.prisma.alat.update({
            where: { id },
            data,
        });
    }

    async remove(id: number) {
        // Ensure the alat exists
        await this.findOne(id);

        return this.prisma.alat.delete({
            where: { id },
        });
    }
}
