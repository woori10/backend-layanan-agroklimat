import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { KanalNotifikasi } from '../generated/prisma/enums';

@Injectable()
export class NotifikasiService {
    constructor(private prisma: PrismaService) {}

    async create(data: {
        userId: number;
        tiketId?: number;
        judul?: string;
        pesan: string;
        kanal?: KanalNotifikasi;
    }) {
        return this.prisma.notifikasi.create({
            data: {
                user_id: data.userId,
                tiket_id: data.tiketId,
                judul: data.judul,
                pesan: data.pesan,
                kanal: data.kanal || 'dashboard',
                status_kirim: true,
                dibaca: false,
            },
        });
    }

    async findAllByUser(userId: number) {
        return this.prisma.notifikasi.findMany({
            where: {
                user_id: userId,
                kanal: 'dashboard',
            },
            include: {
                tiket: {
                    select: {
                        id: true,
                        no_tiket: true,
                        status: true,
                        layanan: {
                            select: {
                                id: true,
                                nama_layanan: true,
                                slug: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                timestamp: 'desc',
            },
            take: 20,
        });
    }

    async markAsRead(id: number, userId: number) {
        return this.prisma.notifikasi.updateMany({
            where: {
                id,
                user_id: userId,
            },
            data: {
                dibaca: true,
            },
        });
    }

    async markAllAsRead(userId: number) {
        return this.prisma.notifikasi.updateMany({
            where: {
                user_id: userId,
                kanal: 'dashboard',
                dibaca: false,
            },
            data: {
                dibaca: true,
            },
        });
    }
}
