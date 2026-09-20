import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFaqDto, UpdateFaqDto } from './dto/faq.dto';

@Injectable()
export class FaqService {
    constructor(private readonly prisma: PrismaService) {}

    // Public: Ambil hanya FAQ yang aktif, urutkan berdasarkan urutan asc lalu id asc
    async findPublic() {
        return this.prisma.faq.findMany({
            where: { is_active: true },
            orderBy: [
                { urutan: 'asc' },
                { id: 'asc' },
            ],
        });
    }

    // Admin: Ambil semua FAQ
    async findAll() {
        return this.prisma.faq.findMany({
            orderBy: [
                { urutan: 'asc' },
                { id: 'asc' },
            ],
        });
    }

    async findOne(id: number) {
        const faq = await this.prisma.faq.findUnique({
            where: { id },
        });
        if (!faq) {
            throw new NotFoundException(`FAQ dengan ID ${id} tidak ditemukan`);
        }
        return faq;
    }

    async create(dto: CreateFaqDto) {
        let urutan = dto.urutan;
        if (urutan === undefined || urutan === null) {
            const count = await this.prisma.faq.count();
            urutan = count + 1;
        }

        return this.prisma.faq.create({
            data: {
                pertanyaan: dto.pertanyaan,
                jawaban: dto.jawaban,
                urutan: Number(urutan),
                is_active: dto.is_active !== undefined ? dto.is_active : true,
            },
        });
    }

    async update(id: number, dto: UpdateFaqDto) {
        await this.findOne(id);

        return this.prisma.faq.update({
            where: { id },
            data: {
                ...(dto.pertanyaan !== undefined && { pertanyaan: dto.pertanyaan }),
                ...(dto.jawaban !== undefined && { jawaban: dto.jawaban }),
                ...(dto.urutan !== undefined && { urutan: Number(dto.urutan) }),
                ...(dto.is_active !== undefined && { is_active: dto.is_active }),
            },
        });
    }

    async remove(id: number) {
        await this.findOne(id);
        return this.prisma.faq.delete({
            where: { id },
        });
    }
}
