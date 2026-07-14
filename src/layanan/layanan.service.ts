import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LayananService {
    constructor(private prisma: PrismaService) { }

    findAll() {
        return this.prisma.layanan.findMany({
            orderBy: { id: 'asc' },
        });
    }

    async findOne(id: number) {
        const layanan = await this.prisma.layanan.findUnique({
            where: { id },
        });
        if (!layanan) throw new NotFoundException('Layanan tidak ditemukan');
        return layanan;
    }
}