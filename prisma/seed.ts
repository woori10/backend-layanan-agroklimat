import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set in environment variables');
}

const dbUrl = new URL(process.env.DATABASE_URL);
const adapter = new PrismaMariaDb({
    host: dbUrl.hostname,
    port: dbUrl.port ? parseInt(dbUrl.port, 10) : 3306,
    user: dbUrl.username,
    password: decodeURIComponent(dbUrl.password),
    database: dbUrl.pathname.replace(/^\//, ''),
    connectionLimit: 1,
});

const prisma = new PrismaClient({ adapter });

async function main() {
    await seedLayanan();
    const existingSuperAdmin = await prisma.user.findUnique({
        where: { email: 'superadmin@agroklimat.go.id' },
    });

    if (!existingSuperAdmin) {
        const hashedPassword = await bcrypt.hash('GantiPasswordIni123!', 10);

        await prisma.user.create({
            data: {
                email: 'superadmin@agroklimat.go.id',
                password: hashedPassword,
                nama: 'Super Admin',
                no_hp: '000000000000',
                role: 'super_admin',
                must_change_password: false,
            },
        });

        console.log('Super admin berhasil dibuat');
    } else {
        console.log('Super admin sudah ada, dilewati');
    }
}

async function seedLayanan() {
    const layananList = [
        {
            nama_layanan: 'Rekomendasi Kalender Tanam',
            kategori: 'Lampiran I',
            biaya: { tipe: 'gratis' },
            sla_hari: 5,
            dasar_hukum: 'Menyusul',
            form_schema: { fields: [], dokumen_wajib: [] },
        },
        {
            nama_layanan: 'Rekomendasi & Penilaian Kesesuaian Agroklimat/Hidrologi (SNI)',
            kategori: 'Lampiran II',
            biaya: { tipe: 'gratis' },
            sla_hari: 5,
            dasar_hukum: 'Menyusul',
            form_schema: { fields: [], dokumen_wajib: [] },
        },
        {
            nama_layanan: 'Permohonan Data / Peminjaman Alat (Lab. Agrohidromet)',
            kategori: 'Lampiran III.1',
            biaya: { tipe: 'tetap', catatan: 'Tarif PNBP, nominal menyusul' },
            sla_hari: 5,
            dasar_hukum: 'Menyusul',
            form_schema: { fields: [], dokumen_wajib: [] },
        },
        {
            nama_layanan: 'Konsultasi Rekomendasi & Penilaian Kesesuaian',
            kategori: 'Lampiran III.2',
            biaya: { tipe: 'gratis' },
            sla_hari: 5,
            dasar_hukum: 'Menyusul',
            form_schema: { fields: [], dokumen_wajib: [] },
        },
        {
            nama_layanan: 'Bimbingan Teknis & Narasumber',
            kategori: 'Lampiran III.3',
            biaya: { tipe: 'gratis' },
            sla_hari: null,
            dasar_hukum: 'Menyusul',
            form_schema: { fields: [], dokumen_wajib: [] },
        },
        {
            nama_layanan: 'Magang Teknis / PKL',
            kategori: 'Lampiran III.4',
            biaya: { tipe: 'gratis' },
            sla_hari: null,
            dasar_hukum: 'Menyusul',
            form_schema: { fields: [], dokumen_wajib: [] },
        },
        {
            nama_layanan: 'Layanan Perpustakaan',
            kategori: 'Lampiran III.5',
            biaya: { tipe: 'gratis' },
            sla_hari: null,
            dasar_hukum: 'Menyusul',
            form_schema: { fields: [], dokumen_wajib: [] },
        },
        {
            nama_layanan: 'Agroedukasi / Kunjungan Edukasi',
            kategori: 'Lampiran IV.1',
            biaya: { tipe: 'gratis' },
            sla_hari: 5,
            dasar_hukum: 'Menyusul',
            form_schema: { fields: [], dokumen_wajib: [] },
        },
        {
            nama_layanan: 'Layanan Mess',
            kategori: 'Lampiran IV.2',
            biaya: { tipe: 'per_satuan', nominal: 100000, satuan: 'kamar/malam' },
            sla_hari: 1,
            dasar_hukum: 'Menyusul',
            form_schema: { fields: [], dokumen_wajib: [] },
        },
    ];

    for (const layanan of layananList) {
        const existing = await prisma.layanan.findFirst({
            where: { nama_layanan: layanan.nama_layanan },
        });

        if (!existing) {
            await prisma.layanan.create({ data: layanan });
            console.log(`Layanan "${layanan.nama_layanan}" berhasil dibuat`);
        } else {
            console.log(`Layanan "${layanan.nama_layanan}" sudah ada, dilewati`);
        }
    }
}

main()
    .catch((err) => {
        console.error(err);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });