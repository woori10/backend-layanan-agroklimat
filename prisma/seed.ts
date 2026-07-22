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
    await seedUnitTeknis();
    await seedLayanan();

    const existingSuperAdmin = await prisma.user.findUnique({
        where: { email: 'superadmin@agroklimat.go.id' },
    });

    if (!existingSuperAdmin) {
        const hashedPassword = await bcrypt.hash('SuperAdmin123', 10);

        await prisma.user.create({
            data: {
                email: 'superadmin@agroklimat.go.id',
                nip: '199603082005031008',
                password: hashedPassword,
                nama: 'Super Admin',
                no_hp: '08123456789',
                role: 'super_admin',
            },
        });

        console.log('Super admin berhasil dibuat');
    } else {
        await prisma.user.update({
            where: { email: 'superadmin@agroklimat.go.id' },
            data: {
                nip: '199603082005031008',
            },
        });
        console.log('Super admin sudah ada, NIP diperbarui');
    }
}

async function seedUnitTeknis() {
    const unitTeknisList = [
        'Tim Teknis Agroklimat / Hidrologi',
        'Koordinator Laboratorium',
        'Tim Kerja Layanan dan Pendayagunaan Hasil',
        'Tim Siap Tanam',
        'Petugas Mess',
    ];

    for (const nama of unitTeknisList) {
        const existing = await prisma.unitTeknis.findFirst({ where: { nama } });

        if (!existing) {
            await prisma.unitTeknis.create({ data: { nama } });
            console.log(`Unit Teknis "${nama}" berhasil dibuat`);
        } else {
            console.log(`Unit Teknis "${nama}" sudah ada, dilewati`);
        }
    }
}

async function seedLayanan() {
    const layananList = [
        {
            nama_layanan: 'Rekomendasi Kalender Tanam',
            biaya: { tipe: 'gratis' },
            sla_hari: 5,
            form_schema: { fields: [], dokumen_wajib: [] },
        },
        {
            nama_layanan: 'Rekomendasi & Penilaian Kesesuaian Agroklimat/Hidrologi (SNI)',
            biaya: { tipe: 'gratis' },
            sla_hari: 5,
            form_schema: { fields: [], dokumen_wajib: [] },
        },
        {
            nama_layanan: 'Permohonan Data / Peminjaman Alat (Lab. Agrohidromet)',
            biaya: { tipe: 'tetap', catatan: 'Tarif PNBP, nominal menyusul' },
            sla_hari: 5,
            form_schema: { fields: [], dokumen_wajib: [] },
        },
        {
            nama_layanan: 'Konsultasi Rekomendasi & Penilaian Kesesuaian',
            biaya: { tipe: 'gratis' },
            sla_hari: 5,
            form_schema: { fields: [], dokumen_wajib: [] },
        },
        {
            nama_layanan: 'Bimbingan Teknis & Narasumber',
            biaya: { tipe: 'gratis' },
            sla_hari: null,
            form_schema: { fields: [], dokumen_wajib: [] },
        },
        {
            nama_layanan: 'Magang Teknis / PKL',
            biaya: { tipe: 'gratis' },
            sla_hari: null,
            form_schema: { fields: [], dokumen_wajib: [] },
        },
        {
            nama_layanan: 'Layanan Perpustakaan',
            biaya: { tipe: 'gratis' },
            sla_hari: null,
            form_schema: { fields: [], dokumen_wajib: [] },
        },
        {
            nama_layanan: 'Agroedukasi / Kunjungan Edukasi',
            biaya: { tipe: 'gratis' },
            sla_hari: 5,
            form_schema: { fields: [], dokumen_wajib: [] },
        },
        {
            nama_layanan: 'Layanan Mess',
            biaya: { tipe: 'per_satuan', nominal: 100000, satuan: 'kamar/malam' },
            sla_hari: 1,
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