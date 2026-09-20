import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditLogService {
    constructor(private prisma: PrismaService) {}

    async findAll() {
        return this.prisma.auditLog.findMany({
            include: {
                user: {
                    select: {
                        id: true,
                        nama: true,
                        email: true,
                        role: true,
                        unit_teknis: {
                            select: {
                                nama: true,
                            },
                        },
                    },
                },
                tiket: {
                    select: {
                        id: true,
                        no_tiket: true,
                        status: true,
                        layanan_id: true,
                        unit_teknis_id: true,
                    },
                },
            },
            orderBy: {
                timestamp: 'desc',
            },
        });
    }
}
