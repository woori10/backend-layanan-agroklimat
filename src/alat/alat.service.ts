import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

function escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

@Injectable()
export class AlatService {
    constructor(private prisma: PrismaService) {}

    private async calculateBorrowedMap(): Promise<Record<number, number>> {
        // Query active tickets for 'peminjaman-alat'
        const activeTickets = await this.prisma.tiket.findMany({
            where: {
                layanan: { slug: 'peminjaman-alat' },
                status: {
                    notIn: ['selesai', 'ditolak', 'dibatalkan'],
                },
            },
            select: {
                id: true,
                status: true,
                jawaban_form: true,
            },
        });

        const allAlat = await this.prisma.alat.findMany({
            select: { id: true, nama_alat: true },
        });

        const nameToIdMap: Record<string, number> = {};
        for (const a of allAlat) {
            nameToIdMap[a.nama_alat.trim().toLowerCase()] = a.id;
        }

        const borrowedMap: Record<number, number> = {};

        for (const t of activeTickets) {
            let jForm: any = t.jawaban_form;
            if (typeof jForm === 'string') {
                try {
                    jForm = JSON.parse(jForm);
                } catch {
                    jForm = {};
                }
            }
            if (!jForm) continue;

            let list: any[] = [];
            if (Array.isArray(jForm.selected_alat_list)) {
                list = jForm.selected_alat_list;
            } else if (typeof jForm.selected_alat_list === 'string') {
                try {
                    list = JSON.parse(jForm.selected_alat_list);
                } catch {
                    list = [];
                }
            }

            if (Array.isArray(list) && list.length > 0) {
                for (const item of list) {
                    const units = Number(item.units || item.jumlah || item.qty || 1);
                    let alatId: number | null = null;

                    if (item.alatId || item.id) {
                        const parsedId = Number(item.alatId || item.id);
                        if (!isNaN(parsedId) && parsedId > 0) {
                            alatId = parsedId;
                        }
                    }

                    if (!alatId && (item.name || item.nama_alat)) {
                        const searchName = String(item.name || item.nama_alat).trim().toLowerCase();
                        alatId = nameToIdMap[searchName] ?? null;
                    }

                    if (alatId) {
                        borrowedMap[alatId] = (borrowedMap[alatId] || 0) + (isNaN(units) ? 1 : units);
                    }
                }
            } else if (typeof jForm.jenis_alat === 'string') {
                // Fallback text parsing for legacy tickets
                const text = jForm.jenis_alat;
                for (const a of allAlat) {
                    if (text.toLowerCase().includes(a.nama_alat.toLowerCase())) {
                        const regex = new RegExp(
                            escapeRegex(a.nama_alat) + '.*?(\\d+)\\s*(?:unit|Unit)?',
                            'i'
                        );
                        const match = text.match(regex);
                        const units = match && match[1] ? parseInt(match[1], 10) : 1;
                        borrowedMap[a.id] = (borrowedMap[a.id] || 0) + (isNaN(units) ? 1 : units);
                    }
                }
            }
        }

        return borrowedMap;
    }

    async findAll() {
        const alats = await this.prisma.alat.findMany({
            orderBy: { id: 'asc' },
        });

        const borrowedMap = await this.calculateBorrowedMap();

        return alats.map((alat) => {
            const totalStok = alat.stok ?? 1;
            const dipinjam = borrowedMap[alat.id] || 0;
            const sisaStok = Math.max(0, totalStok - dipinjam);
            return {
                ...alat,
                stok: totalStok,
                dipinjam,
                sisa_stok: sisaStok,
            };
        });
    }

    async findOne(id: number) {
        const alat = await this.prisma.alat.findUnique({
            where: { id },
        });
        if (!alat) {
            throw new NotFoundException('Alat tidak ditemukan');
        }

        const borrowedMap = await this.calculateBorrowedMap();
        const totalStok = alat.stok ?? 1;
        const dipinjam = borrowedMap[alat.id] || 0;
        const sisaStok = Math.max(0, totalStok - dipinjam);

        return {
            ...alat,
            stok: totalStok,
            dipinjam,
            sisa_stok: sisaStok,
        };
    }

    async create(data: { nama_alat: string; harga_peminjaman: number; stok?: number; is_active?: boolean }) {
        return this.prisma.alat.create({
            data: {
                nama_alat: data.nama_alat,
                harga_peminjaman: data.harga_peminjaman,
                stok: data.stok ?? 1,
                is_active: data.is_active ?? true,
            },
        });
    }

    async update(id: number, data: { nama_alat?: string; harga_peminjaman?: number; stok?: number; is_active?: boolean }) {
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

