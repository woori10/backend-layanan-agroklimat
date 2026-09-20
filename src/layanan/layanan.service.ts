import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LayananService {
    constructor(private prisma: PrismaService) { }

    // Public: Ambil hanya layanan yang aktif untuk landing page
    findPublic() {
        return this.prisma.layanan.findMany({
            where: { is_active: true },
            orderBy: { id: 'asc' },
            include: { unit_teknis: true },
        });
    }

    // Admin: Ambil semua layanan (aktif dan nonaktif)
    findAll() {
        return this.prisma.layanan.findMany({
            orderBy: { id: 'asc' },
            include: { unit_teknis: true },
        });
    }

    async findOne(id: number) {
        const layanan = await this.prisma.layanan.findUnique({
            where: { id },
            include: { unit_teknis: true },
        });
        if (!layanan) throw new NotFoundException('Layanan tidak ditemukan');
        return layanan;
    }

    async findBySlug(slug: string) {
        const isNumeric = !isNaN(Number(slug));
        const layanan = isNumeric
            ? await this.prisma.layanan.findUnique({ where: { id: Number(slug) }, include: { unit_teknis: true } })
            : await this.prisma.layanan.findUnique({ where: { slug }, include: { unit_teknis: true } });
        if (!layanan) throw new NotFoundException('Layanan tidak ditemukan');
        return layanan;
    }

    async updateStatus(id: number, is_active: boolean) {
        await this.findOne(id);
        return this.prisma.layanan.update({
            where: { id },
            data: { is_active },
            include: { unit_teknis: true },
        });
    }
}